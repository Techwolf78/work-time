using System;
using System.IO;
using System.Text;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Reflection;

[assembly: AssemblyTitle("GA WORK-TIME Desktop Agent")]
[assembly: AssemblyDescription("GA WORK-TIME Enterprise Workforce Activity Telemetry Agent")]
[assembly: AssemblyCompany("Gryphon Academy Pvt. Ltd.")]
[assembly: AssemblyProduct("GA WORK-TIME")]
[assembly: AssemblyCopyright("Copyright © 2026 Gryphon Academy Pvt. Ltd.")]
[assembly: AssemblyVersion("1.2.0.0")]
[assembly: AssemblyFileVersion("1.2.0.0")]

namespace GaWorkTime {
    public class Program {
        [STAThread]
        public static void Main(string[] args) {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new GaWorkTimeMainWindow(args));
        }
    }

    public class GaWorkTimeMainWindow : Form {
        // App Version & Config
        public const string CURRENT_VERSION = "1.2.0";
        private const string FIREBASE_PROJECT = "authencation-39485";
        private const string FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT + "/databases/(default)/documents/";
        private string updateCheckUrl = "http://localhost:5173/version.json";

        // Win32 API Imports for Dragging & Activity Probing
        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
        [DllImport("user32.dll")]
        public static extern bool ReleaseCapture();
        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int HT_CAPTION = 0x2;

        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll")]
        private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

        [StructLayout(LayoutKind.Sequential)]
        private struct LASTINPUTINFO {
            public uint cbSize;
            public uint dwTime;
        }

        // UI Controls
        private Panel headerPanel;
        private Panel updatePanel;
        private Label updateLabel;
        private Button updateButton;
        private Label timerLabel;
        private Label statusBadgeLabel;
        private Label activeAppLabel;
        private Label activeTitleLabel;
        private Label appDurationLabel;
        private Label focusScoreLabel;
        private Button pauseButton;
        private Button dashboardButton;
        private NotifyIcon trayIcon;
        private ContextMenuStrip trayMenu;

        // Timers
        private Timer secondTimer;
        private Timer telemetryTimer;
        private Timer updateCheckTimer;

        // Telemetry state
        private string pulseDir;
        private string configPath;
        private string userEmail = "";
        private string userName = "";
        private string userDept = "Operations";
        private string currentApp = "System";
        private string currentWindowTitle = "";
        private string currentState = "ACTIVE";
        private bool isPaused = false;
        private DateTime appStartTime = DateTime.UtcNow;
        private DateTime intervalStartTime = DateTime.UtcNow;
        private int totalActiveSeconds = 0;
        private int totalIdleSeconds = 0;
        private DateTime lastFlushTime = DateTime.UtcNow;
        private static readonly HttpClient httpClient = new HttpClient();
        private string pendingUpdateUrl = "";

        public GaWorkTimeMainWindow(string[] args) {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            pulseDir = Path.Combine(appData, "GA-Work-Time");
            if (!Directory.Exists(pulseDir)) {
                Directory.CreateDirectory(pulseDir);
            }
            configPath = Path.Combine(pulseDir, "agent_config.json");

            // Backward compatibility check with legacy folder
            if (!File.Exists(configPath)) {
                string legacyPath = Path.Combine(appData, "WorkPulse", "agent_config.json");
                if (File.Exists(legacyPath)) {
                    try { File.Copy(legacyPath, configPath, true); } catch { }
                }
            }

            LoadConfiguration();

            InitializeComponent();
            InitializeTray();

            if (string.IsNullOrEmpty(userEmail) || Array.IndexOf(args, "--reset") >= 0) {
                ShowSetupDialog();
            }

            StartTimers();
            CheckForUpdatesAsync();
        }

        private void InitializeComponent() {
            this.Text = "GA WORK-TIME";
            this.Size = new Size(460, 640);
            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(248, 249, 251);
            this.Icon = CreatePulseIcon();

            // 1. Sleek Dark Header Panel (Draggable)
            headerPanel = new Panel() {
                Dock = DockStyle.Top,
                Height = 60,
                BackColor = Color.FromArgb(15, 23, 42)
            };
            headerPanel.MouseDown += (s, e) => {
                if (e.Button == MouseButtons.Left) {
                    ReleaseCapture();
                    SendMessage(Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                }
            };

            // Header Title & Logo
            Label logoLabel = new Label() {
                Text = "GA WORK-TIME",
                Font = new Font("Segoe UI", 11, FontStyle.Bold),
                ForeColor = Color.White,
                Location = new Point(18, 18),
                AutoSize = true
            };
            logoLabel.MouseDown += (s, e) => {
                if (e.Button == MouseButtons.Left) {
                    ReleaseCapture();
                    SendMessage(Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                }
            };

            Label subtitleLabel = new Label() {
                Text = "Client v" + CURRENT_VERSION,
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(140, 20),
                AutoSize = true
            };

            // Window Close button (Minimizes to tray)
            Button closeBtn = new Button() {
                Text = "✕",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                ForeColor = Color.FromArgb(148, 163, 184),
                BackColor = Color.Transparent,
                FlatStyle = FlatStyle.Flat,
                Size = new Size(32, 32),
                Location = new Point(415, 14),
                Cursor = Cursors.Hand
            };
            closeBtn.FlatAppearance.BorderSize = 0;
            closeBtn.MouseEnter += (s, e) => { closeBtn.ForeColor = Color.White; closeBtn.BackColor = Color.FromArgb(239, 68, 68); };
            closeBtn.MouseLeave += (s, e) => { closeBtn.ForeColor = Color.FromArgb(148, 163, 184); closeBtn.BackColor = Color.Transparent; };
            closeBtn.Click += (s, e) => {
                this.Hide();
                trayIcon.ShowBalloonTip(2000, "GA WORK-TIME Running in Background", "Tracking continues silently in your system tray.", ToolTipIcon.Info);
            };

            // Window Minimize button
            Button minBtn = new Button() {
                Text = "—",
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                ForeColor = Color.FromArgb(148, 163, 184),
                BackColor = Color.Transparent,
                FlatStyle = FlatStyle.Flat,
                Size = new Size(32, 32),
                Location = new Point(380, 14),
                Cursor = Cursors.Hand
            };
            minBtn.FlatAppearance.BorderSize = 0;
            minBtn.MouseEnter += (s, e) => { minBtn.ForeColor = Color.White; minBtn.BackColor = Color.FromArgb(30, 41, 59); };
            minBtn.MouseLeave += (s, e) => { minBtn.ForeColor = Color.FromArgb(148, 163, 184); minBtn.BackColor = Color.Transparent; };
            minBtn.Click += (s, e) => { this.WindowState = FormWindowState.Minimized; };

            headerPanel.Controls.Add(logoLabel);
            headerPanel.Controls.Add(subtitleLabel);
            headerPanel.Controls.Add(minBtn);
            headerPanel.Controls.Add(closeBtn);

            // 2. Auto-Update Notification Banner (Hidden by default)
            updatePanel = new Panel() {
                Dock = DockStyle.Top,
                Height = 44,
                BackColor = Color.FromArgb(238, 242, 255),
                Visible = false
            };
            updateLabel = new Label() {
                Text = "⚡ New GA WORK-TIME update available!",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(49, 46, 129),
                Location = new Point(16, 13),
                AutoSize = true
            };
            updateButton = new Button() {
                Text = "Update Now",
                Font = new Font("Segoe UI", 8f, FontStyle.Bold),
                ForeColor = Color.White,
                BackColor = Color.FromArgb(79, 70, 229),
                FlatStyle = FlatStyle.Flat,
                Size = new Size(95, 26),
                Location = new Point(345, 9),
                Cursor = Cursors.Hand
            };
            updateButton.FlatAppearance.BorderSize = 0;
            updateButton.Click += async (s, e) => { await TriggerAutoUpdate(); };
            updatePanel.Controls.Add(updateLabel);
            updatePanel.Controls.Add(updateButton);

            // 3. Main Content Container
            Panel contentPanel = new Panel() {
                Dock = DockStyle.Fill,
                Padding = new Padding(18, 14, 18, 14),
                AutoScroll = true
            };

            // Today's Work Time Card
            Panel timerCard = CreateCardPanel(18, 14, 408, 140);
            
            Label timerTitle = new Label() {
                Text = "TODAY'S WORK TIME",
                Font = new Font("Segoe UI", 8f, FontStyle.Bold),
                ForeColor = Color.FromArgb(100, 116, 139),
                Location = new Point(16, 14),
                AutoSize = true
            };

            statusBadgeLabel = new Label() {
                Text = "● ACTIVE",
                Font = new Font("Segoe UI", 8f, FontStyle.Bold),
                ForeColor = Color.FromArgb(16, 185, 129),
                BackColor = Color.FromArgb(236, 253, 245),
                Location = new Point(310, 12),
                Size = new Size(82, 22),
                TextAlign = ContentAlignment.MiddleCenter
            };

            timerLabel = new Label() {
                Text = "00h 00m 00s",
                Font = new Font("Segoe UI", 26, FontStyle.Bold),
                ForeColor = Color.FromArgb(15, 23, 42),
                Location = new Point(14, 40),
                AutoSize = true
            };

            focusScoreLabel = new Label() {
                Text = "Focus Ratio: 100% • Active: 0m • Idle: 0m",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(100, 116, 139),
                Location = new Point(16, 100),
                AutoSize = true
            };

            timerCard.Controls.Add(timerTitle);
            timerCard.Controls.Add(statusBadgeLabel);
            timerCard.Controls.Add(timerLabel);
            timerCard.Controls.Add(focusScoreLabel);

            // Current Activity Card
            Panel activityCard = CreateCardPanel(18, 168, 408, 130);

            Label actTitle = new Label() {
                Text = "CURRENT ACTIVITY",
                Font = new Font("Segoe UI", 8f, FontStyle.Bold),
                ForeColor = Color.FromArgb(100, 116, 139),
                Location = new Point(16, 14),
                AutoSize = true
            };

            appDurationLabel = new Label() {
                Text = "Active for: 0s",
                Font = new Font("Segoe UI", 8f, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(300, 14),
                AutoSize = true
            };

            activeAppLabel = new Label() {
                Text = "System",
                Font = new Font("Segoe UI", 14, FontStyle.Bold),
                ForeColor = Color.FromArgb(15, 23, 42),
                Location = new Point(16, 40),
                AutoSize = true
            };

            activeTitleLabel = new Label() {
                Text = "Monitoring foreground application...",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(71, 85, 105),
                Location = new Point(16, 75),
                Width = 376,
                Height = 40
            };

            activityCard.Controls.Add(actTitle);
            activityCard.Controls.Add(appDurationLabel);
            activityCard.Controls.Add(activeAppLabel);
            activityCard.Controls.Add(activeTitleLabel);

            // Employee Controls (Pause / Break Button)
            pauseButton = new Button() {
                Text = "⏸  Take a Break / Pause Tracking",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                BackColor = Color.FromArgb(241, 245, 249),
                FlatStyle = FlatStyle.Flat,
                Size = new Size(408, 42),
                Location = new Point(18, 312),
                Cursor = Cursors.Hand
            };
            pauseButton.FlatAppearance.BorderColor = Color.FromArgb(226, 232, 240);
            pauseButton.Click += (s, e) => { TogglePause(); };

            // User Info & Status Card
            Panel userCard = CreateCardPanel(18, 368, 408, 110);
            
            Label userTitle = new Label() {
                Text = "WORKSTATION PROFILE",
                Font = new Font("Segoe UI", 8f, FontStyle.Bold),
                ForeColor = Color.FromArgb(100, 116, 139),
                Location = new Point(16, 12),
                AutoSize = true
            };

            Label userDetails = new Label() {
                Text = (string.IsNullOrEmpty(userName) ? "Employee" : userName) + " (" + userEmail + ")\n" +
                       "Computer: " + Environment.MachineName + " • " + Environment.OSVersion.VersionString + "\n" +
                       "Company: Gryphon Academy Pvt. Ltd.",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(51, 65, 85),
                Location = new Point(16, 36),
                Width = 376,
                Height = 60
            };

            userCard.Controls.Add(userTitle);
            userCard.Controls.Add(userDetails);

            // Open Dashboard Button
            dashboardButton = new Button() {
                Text = "Open Central Web Dashboard ↗",
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                ForeColor = Color.White,
                BackColor = Color.FromArgb(15, 23, 42),
                FlatStyle = FlatStyle.Flat,
                Size = new Size(408, 42),
                Location = new Point(18, 492),
                Cursor = Cursors.Hand
            };
            dashboardButton.FlatAppearance.BorderSize = 0;
            dashboardButton.Click += (s, e) => {
                Process.Start("http://localhost:5173/dashboard");
            };

            contentPanel.Controls.Add(timerCard);
            contentPanel.Controls.Add(activityCard);
            contentPanel.Controls.Add(pauseButton);
            contentPanel.Controls.Add(userCard);
            contentPanel.Controls.Add(dashboardButton);

            this.Controls.Add(contentPanel);
            this.Controls.Add(updatePanel);
            this.Controls.Add(headerPanel);
        }

        private Panel CreateCardPanel(int x, int y, int w, int h) {
            Panel panel = new Panel() {
                Location = new Point(x, y),
                Size = new Size(w, h),
                BackColor = Color.White
            };
            panel.Paint += (s, e) => {
                using (Pen pen = new Pen(Color.FromArgb(226, 232, 240), 1)) {
                    e.Graphics.DrawRectangle(pen, 0, 0, panel.Width - 1, panel.Height - 1);
                }
            };
            return panel;
        }

        private void TogglePause() {
            isPaused = !isPaused;
            if (isPaused) {
                currentState = "PAUSED";
                pauseButton.Text = "▶  Resume Work Tracking";
                pauseButton.BackColor = Color.FromArgb(236, 253, 245);
                pauseButton.ForeColor = Color.FromArgb(5, 150, 105);
                statusBadgeLabel.Text = "⏸ PAUSED";
                statusBadgeLabel.ForeColor = Color.FromArgb(217, 119, 6);
                statusBadgeLabel.BackColor = Color.FromArgb(254, 243, 199);
            } else {
                currentState = "ACTIVE";
                pauseButton.Text = "⏸  Take a Break / Pause Tracking";
                pauseButton.BackColor = Color.FromArgb(241, 245, 249);
                pauseButton.ForeColor = Color.FromArgb(30, 41, 59);
                statusBadgeLabel.Text = "● ACTIVE";
                statusBadgeLabel.ForeColor = Color.FromArgb(16, 185, 129);
                statusBadgeLabel.BackColor = Color.FromArgb(236, 253, 245);
            }
        }

        private void StartTimers() {
            // 1. Live second timer (updates UI clocks smoothly every 1000ms)
            secondTimer = new Timer();
            secondTimer.Interval = 1000;
            secondTimer.Tick += (s, e) => {
                if (!isPaused && currentState == "ACTIVE") {
                    totalActiveSeconds++;
                }

                int h = totalActiveSeconds / 3600;
                int m = (totalActiveSeconds % 3600) / 60;
                int sec = totalActiveSeconds % 60;
                timerLabel.Text = string.Format("{0:D2}h {1:D2}m {2:D2}s", h, m, sec);

                TimeSpan appDuration = DateTime.UtcNow - appStartTime;
                appDurationLabel.Text = "Active for: " + (int)appDuration.TotalMinutes + "m";

                int totalObserved = totalActiveSeconds + totalIdleSeconds;
                int focusRatio = totalObserved > 0 ? (int)((totalActiveSeconds * 100.0) / totalObserved) : 100;
                focusScoreLabel.Text = string.Format("Focus Ratio: {0}% • Active: {1}m • Idle: {2}m",
                    focusRatio, totalActiveSeconds / 60, totalIdleSeconds / 60);
            };
            secondTimer.Start();

            // 2. Telemetry probe timer (runs every 5 seconds)
            telemetryTimer = new Timer();
            telemetryTimer.Interval = 5000;
            telemetryTimer.Tick += async (s, e) => {
                await SampleAndSyncTelemetry();
            };
            telemetryTimer.Start();

            // 3. Periodic Auto-Update checker (every 30 minutes)
            updateCheckTimer = new Timer();
            updateCheckTimer.Interval = 30 * 60 * 1000;
            updateCheckTimer.Tick += (s, e) => {
                CheckForUpdatesAsync();
            };
            updateCheckTimer.Start();
        }

        private async Task SampleAndSyncTelemetry() {
            if (isPaused) {
                currentState = "PAUSED";
                return;
            }

            // 1. Idle detection via GetLastInputInfo
            LASTINPUTINFO lii = new LASTINPUTINFO();
            lii.cbSize = (uint)Marshal.SizeOf(typeof(LASTINPUTINFO));
            uint idleTicks = 0;
            if (GetLastInputInfo(ref lii)) {
                uint currentTicks = (uint)Environment.TickCount;
                idleTicks = currentTicks - lii.dwTime;
            }

            double idleSeconds = idleTicks / 1000.0;
            bool isIdle = idleSeconds >= 300.0; // 5 min idle threshold
            string newState = isIdle ? "IDLE" : "ACTIVE";

            // 2. Foreground Window detection
            IntPtr fgHwnd = GetForegroundWindow();
            string detectedApp = "System";
            string detectedTitle = "";

            if (fgHwnd != IntPtr.Zero) {
                StringBuilder sb = new StringBuilder(512);
                GetWindowText(fgHwnd, sb, sb.Capacity);
                detectedTitle = sb.ToString();

                uint pid;
                GetWindowThreadProcessId(fgHwnd, out pid);
                try {
                    Process proc = Process.GetProcessById((int)pid);
                    detectedApp = proc.ProcessName;
                } catch { }
            }

            // Update UI state
            if (detectedApp != currentApp) {
                currentApp = detectedApp;
                appStartTime = DateTime.UtcNow;
                activeAppLabel.Text = currentApp;
            }
            activeTitleLabel.Text = string.IsNullOrEmpty(detectedTitle) ? "Idle / Desktop" : detectedTitle;

            currentState = newState;
            if (isIdle) {
                totalIdleSeconds += 5;
                statusBadgeLabel.Text = "● IDLE";
                statusBadgeLabel.ForeColor = Color.FromArgb(217, 119, 6);
                statusBadgeLabel.BackColor = Color.FromArgb(254, 243, 199);
            } else {
                statusBadgeLabel.Text = "● ACTIVE";
                statusBadgeLabel.ForeColor = Color.FromArgb(16, 185, 129);
                statusBadgeLabel.BackColor = Color.FromArgb(236, 253, 245);
            }

            // 3. Flush heartbeat and activity logs to Firestore every 15 seconds
            TimeSpan timeSinceFlush = DateTime.UtcNow - lastFlushTime;
            if (timeSinceFlush.TotalSeconds >= 15) {
                lastFlushTime = DateTime.UtcNow;
                await SendDeviceHeartbeatAsync();
                await LogActivityIntervalAsync();
            }
        }

        private async Task SendDeviceHeartbeatAsync() {
            try {
                string deviceId = Environment.MachineName;
                string url = FIRESTORE_BASE + "timetrack_devices/" + deviceId;

                string json = "{\n  \"fields\": {\n" +
                    "    \"deviceId\": {\"stringValue\": \"" + EscapeJson(deviceId) + "\"},\n" +
                    "    \"hostname\": {\"stringValue\": \"" + EscapeJson(Environment.MachineName) + "\"},\n" +
                    "    \"employeeEmail\": {\"stringValue\": \"" + EscapeJson(userEmail) + "\"},\n" +
                    "    \"employeeName\": {\"stringValue\": \"" + EscapeJson(userName) + "\"},\n" +
                    "    \"department\": {\"stringValue\": \"" + EscapeJson(userDept) + "\"},\n" +
                    "    \"status\": {\"stringValue\": \"" + EscapeJson(currentState.ToLower()) + "\"},\n" +
                    "    \"currentApp\": {\"stringValue\": \"" + EscapeJson(currentApp) + "\"},\n" +
                    "    \"online\": {\"booleanValue\": true},\n" +
                    "    \"todayTrackedSeconds\": {\"integerValue\": \"" + totalActiveSeconds + "\"},\n" +
                    "    \"agentVersion\": {\"stringValue\": \"" + CURRENT_VERSION + "\"},\n" +
                    "    \"os\": {\"stringValue\": \"Windows 10/11\"},\n" +
                    "    \"lastHeartbeat\": {\"timestampValue\": \"" + DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") + "\"}\n" +
                    "  }\n}";

                HttpRequestMessage request = new HttpRequestMessage(new HttpMethod("PATCH"), url);
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");
                await httpClient.SendAsync(request);
            } catch { }
        }

        private async Task LogActivityIntervalAsync() {
            try {
                string logId = "log_" + DateTime.UtcNow.Ticks;
                string url = FIRESTORE_BASE + "timetrack_activity_logs/" + logId;

                string json = "{\n  \"fields\": {\n" +
                    "    \"id\": {\"stringValue\": \"" + logId + "\"},\n" +
                    "    \"employeeEmail\": {\"stringValue\": \"" + EscapeJson(userEmail) + "\"},\n" +
                    "    \"employeeName\": {\"stringValue\": \"" + EscapeJson(userName) + "\"},\n" +
                    "    \"department\": {\"stringValue\": \"" + EscapeJson(userDept) + "\"},\n" +
                    "    \"deviceId\": {\"stringValue\": \"" + EscapeJson(Environment.MachineName) + "\"},\n" +
                    "    \"application\": {\"stringValue\": \"" + EscapeJson(currentApp) + "\"},\n" +
                    "    \"windowTitle\": {\"stringValue\": \"" + EscapeJson(currentWindowTitle) + "\"},\n" +
                    "    \"state\": {\"stringValue\": \"" + EscapeJson(currentState) + "\"},\n" +
                    "    \"durationSeconds\": {\"integerValue\": \"15\"},\n" +
                    "    \"date\": {\"stringValue\": \"" + DateTime.UtcNow.ToString("yyyy-MM-dd") + "\"},\n" +
                    "    \"startTime\": {\"timestampValue\": \"" + DateTime.UtcNow.AddSeconds(-15).ToString("yyyy-MM-ddTHH:mm:ss.fffZ") + "\"},\n" +
                    "    \"endTime\": {\"timestampValue\": \"" + DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") + "\"}\n" +
                    "  }\n}";

                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, FIRESTORE_BASE + "timetrack_activity_logs?documentId=" + logId);
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");
                await httpClient.SendAsync(request);
            } catch { }
        }

        // ==========================================
        // AUTO-UPDATER ENGINE
        // ==========================================
        public async void CheckForUpdatesAsync() {
            try {
                HttpResponseMessage resp = await httpClient.GetAsync(updateCheckUrl);
                if (resp.IsSuccessStatusCode) {
                    string json = await resp.Content.ReadAsStringAsync();
                    string remoteVer = ExtractJsonString(json, "version");
                    string downloadUrl = ExtractJsonString(json, "downloadUrl");

                    if (!string.IsNullOrEmpty(remoteVer) && CompareVersions(remoteVer, CURRENT_VERSION) > 0) {
                        pendingUpdateUrl = downloadUrl;
                        updateLabel.Text = "⚡ New GA WORK-TIME v" + remoteVer + " is available!";
                        updatePanel.Visible = true;
                    }
                }
            } catch { }
        }

        private async Task TriggerAutoUpdate() {
            updateButton.Text = "Updating...";
            updateButton.Enabled = false;

            try {
                string newExePath = Path.Combine(pulseDir, "GA-Work-Time_new.exe");

                // Download latest .exe
                string downloadUrl = pendingUpdateUrl;
                if (!downloadUrl.StartsWith("http")) {
                    string baseUrl = updateCheckUrl;
                    int slashIdx = baseUrl.IndexOf('/', 8);
                    if (slashIdx != -1) {
                        baseUrl = baseUrl.Substring(0, slashIdx);
                    }
                    downloadUrl = baseUrl + (downloadUrl.StartsWith("/") ? "" : "/") + downloadUrl;
                }

                byte[] exeBytes = await httpClient.GetByteArrayAsync(downloadUrl);
                File.WriteAllBytes(newExePath, exeBytes);

                // Build self-update batch script
                string currentExePath = Application.ExecutablePath;
                string batPath = Path.Combine(pulseDir, "update.bat");
                string batContent = "@echo off\r\n" +
                                    "timeout /t 1 /nobreak >nul\r\n" +
                                    "copy /y \"" + newExePath + "\" \"" + currentExePath + "\" >nul\r\n" +
                                    "del /f /q \"" + newExePath + "\" >nul\r\n" +
                                    "start \"\" \"" + currentExePath + "\"\r\n" +
                                    "del \"%~f0\"\r\n";
                File.WriteAllText(batPath, batContent);

                // Launch batch script and exit current process
                ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c \"" + batPath + "\"") {
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                Process.Start(psi);
                Application.Exit();
            } catch (Exception ex) {
                MessageBox.Show("Auto-update failed: " + ex.Message, "Update Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                updateButton.Text = "Update Now";
                updateButton.Enabled = true;
            }
        }

        private int CompareVersions(string v1, string v2) {
            try {
                Version ver1 = new Version(v1.TrimStart('v'));
                Version ver2 = new Version(v2.TrimStart('v'));
                return ver1.CompareTo(ver2);
            } catch {
                return string.Compare(v1, v2);
            }
        }

        private void InitializeTray() {
            trayMenu = new ContextMenuStrip();
            trayMenu.Font = new Font("Segoe UI", 9);

            ToolStripMenuItem titleItem = new ToolStripMenuItem("GA WORK-TIME • Active Focus") { Enabled = false, Font = new Font("Segoe UI", 9, FontStyle.Bold) };
            ToolStripMenuItem openWindowItem = new ToolStripMenuItem("Open GA WORK-TIME Window", null, (s, e) => {
                this.Show();
                this.WindowState = FormWindowState.Normal;
                this.BringToFront();
            });
            ToolStripMenuItem checkUpdateItem = new ToolStripMenuItem("Check for Updates...", null, (s, e) => {
                CheckForUpdatesAsync();
                MessageBox.Show("GA WORK-TIME is checking for the latest version...", "Auto-Updater", MessageBoxButtons.OK, MessageBoxIcon.Information);
            });
            ToolStripMenuItem reconfigItem = new ToolStripMenuItem("Re-pair Account...", null, (s, e) => {
                ShowSetupDialog();
            });
            ToolStripMenuItem exitItem = new ToolStripMenuItem("Exit GA WORK-TIME", null, (s, e) => {
                trayIcon.Visible = false;
                Application.Exit();
            });

            trayMenu.Items.Add(titleItem);
            trayMenu.Items.Add(new ToolStripSeparator());
            trayMenu.Items.Add(openWindowItem);
            trayMenu.Items.Add(checkUpdateItem);
            trayMenu.Items.Add(reconfigItem);
            trayMenu.Items.Add(new ToolStripSeparator());
            trayMenu.Items.Add(exitItem);

            trayIcon = new NotifyIcon() {
                Icon = CreatePulseIcon(),
                ContextMenuStrip = trayMenu,
                Text = "GA WORK-TIME • v" + CURRENT_VERSION,
                Visible = true
            };
            trayIcon.DoubleClick += (s, e) => {
                this.Show();
                this.WindowState = FormWindowState.Normal;
                this.BringToFront();
            };
        }

        private Icon CreatePulseIcon() {
            Bitmap bmp = new Bitmap(16, 16);
            using (Graphics g = Graphics.FromImage(bmp)) {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.FillEllipse(new SolidBrush(Color.FromArgb(16, 185, 129)), 1, 1, 14, 14);
                g.FillEllipse(new SolidBrush(Color.White), 5, 5, 6, 6);
            }
            return Icon.FromHandle(bmp.GetHicon());
        }

        private void ShowSetupDialog() {
            using (Form form = new Form()) {
                form.Text = "GA WORK-TIME • Workstation Setup";
                form.Size = new Size(420, 260);
                form.FormBorderStyle = FormBorderStyle.FixedDialog;
                form.StartPosition = FormStartPosition.CenterScreen;
                form.MaximizeBox = false;
                form.MinimizeBox = false;
                form.BackColor = Color.White;

                Label title = new Label() {
                    Text = "Link Workstation",
                    Font = new Font("Segoe UI", 12, FontStyle.Bold),
                    ForeColor = Color.FromArgb(15, 23, 42),
                    Location = new Point(24, 20),
                    AutoSize = true
                };

                Label desc = new Label() {
                    Text = "Enter your work email once to link this computer (" + Environment.MachineName + ").",
                    Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                    ForeColor = Color.FromArgb(100, 116, 139),
                    Location = new Point(24, 48),
                    Width = 356,
                    Height = 35
                };

                Label emailLbl = new Label() {
                    Text = "Corporate Email Address:",
                    Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                    ForeColor = Color.FromArgb(51, 65, 85),
                    Location = new Point(24, 90),
                    AutoSize = true
                };

                TextBox emailBox = new TextBox() {
                    Text = userEmail,
                    Font = new Font("Segoe UI", 10),
                    Location = new Point(24, 112),
                    Width = 356
                };

                Button pairBtn = new Button() {
                    Text = "Pair Workstation & Start",
                    Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                    ForeColor = Color.White,
                    BackColor = Color.FromArgb(15, 23, 42),
                    FlatStyle = FlatStyle.Flat,
                    Size = new Size(356, 38),
                    Location = new Point(24, 155),
                    Cursor = Cursors.Hand
                };
                pairBtn.FlatAppearance.BorderSize = 0;
                pairBtn.Click += (s, e) => {
                    string email = emailBox.Text.Trim();
                    if (string.IsNullOrEmpty(email) || !email.Contains("@")) {
                        MessageBox.Show(form, "Please enter a valid work email address.", "Validation", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                    userEmail = email.ToLower();
                    userName = userEmail.Split('@')[0];
                    SaveConfiguration();
                    form.DialogResult = DialogResult.OK;
                    form.Close();
                };

                form.Controls.Add(title);
                form.Controls.Add(desc);
                form.Controls.Add(emailLbl);
                form.Controls.Add(emailBox);
                form.Controls.Add(pairBtn);

                if (form.ShowDialog() != DialogResult.OK && string.IsNullOrEmpty(userEmail)) {
                    Environment.Exit(0);
                }
            }
        }

        private void LoadConfiguration() {
            if (File.Exists(configPath)) {
                try {
                    string json = File.ReadAllText(configPath);
                    userEmail = ExtractJsonString(json, "email");
                    userName = ExtractJsonString(json, "name");
                    userDept = ExtractJsonString(json, "department");
                    string customUrl = ExtractJsonString(json, "updateUrl");
                    if (!string.IsNullOrEmpty(customUrl)) {
                        updateCheckUrl = customUrl;
                    }
                } catch { }
            }
            if (string.IsNullOrEmpty(userName) && !string.IsNullOrEmpty(userEmail)) {
                userName = userEmail.Split('@')[0];
            }
        }

        private void SaveConfiguration() {
            try {
                string json = "{\n  \"email\": \"" + EscapeJson(userEmail) + "\",\n  \"name\": \"" + EscapeJson(userName) + "\",\n  \"department\": \"" + EscapeJson(userDept) + "\",\n  \"deviceId\": \"" + EscapeJson(Environment.MachineName) + "\"\n}";
                File.WriteAllText(configPath, json);
            } catch { }
        }

        private static string ExtractJsonString(string json, string key) {
            string pattern = "\"" + key + "\":";
            int idx = json.IndexOf(pattern);
            if (idx == -1) return "";
            int valStart = json.IndexOf('"', idx + pattern.Length);
            if (valStart == -1) return "";
            int valEnd = json.IndexOf('"', valStart + 1);
            if (valEnd == -1) return "";
            return json.Substring(valStart + 1, valEnd - valStart - 1);
        }

        private static string EscapeJson(string s) {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", "");
        }
    }
}
