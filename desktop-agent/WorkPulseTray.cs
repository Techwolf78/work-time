using System;
using System.IO;
using System.Text;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Windows.Forms;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace WorkPulse {
    public class Program {
        [STAThread]
        public static void Main(string[] args) {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new WorkPulseTrayContext(args));
        }
    }

    public class WorkPulseTrayContext : ApplicationContext {
        private NotifyIcon trayIcon;
        private ContextMenuStrip contextMenu;
        private ToolStripMenuItem statusMenuItem;
        private ToolStripMenuItem userMenuItem;
        private ToolStripMenuItem appMenuItem;
        private Timer telemetryTimer;

        // Telemetry state
        private string configPath;
        private string userEmail = "";
        private string userName = "";
        private string userDept = "Operations";
        private string currentApp = "System";
        private string currentWindowTitle = "";
        private string currentState = "ACTIVE";
        private DateTime intervalStartTime = DateTime.UtcNow;
        private int totalActiveSeconds = 0;
        private int totalIdleSeconds = 0;
        private int totalLockedSeconds = 0;
        private DateTime lastFlushTime = DateTime.UtcNow;

        private static readonly HttpClient httpClient = new HttpClient();
        private const string FIREBASE_PROJECT = "authencation-39485";
        private const string FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT + "/databases/(default)/documents/";

        public WorkPulseTrayContext(string[] args) {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string pulseDir = Path.Combine(appData, "WorkPulse");
            if (!Directory.Exists(pulseDir)) {
                Directory.CreateDirectory(pulseDir);
            }
            configPath = Path.Combine(pulseDir, "agent_config.json");

            LoadConfiguration();

            if (string.IsNullOrEmpty(userEmail) || Array.IndexOf(args, "--reset") >= 0) {
                ShowSetupDialog();
            }

            InitializeTray();
            StartTelemetry();
        }

        private void LoadConfiguration() {
            if (File.Exists(configPath)) {
                try {
                    string json = File.ReadAllText(configPath);
                    userEmail = ExtractJsonString(json, "email");
                    userName = ExtractJsonString(json, "name");
                    userDept = ExtractJsonString(json, "department");
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

        private void ShowSetupDialog() {
            using (Form form = new Form()) {
                form.Text = "GA-Work-Time • Workstation Setup";
                form.Width = 440;
                form.Height = 270;
                form.FormBorderStyle = FormBorderStyle.FixedDialog;
                form.StartPosition = FormStartPosition.CenterScreen;
                form.MaximizeBox = false;
                form.MinimizeBox = false;
                form.BackColor = Color.FromArgb(249, 250, 251);

                Label titleLabel = new Label() {
                    Text = "WorkPulse Desktop Agent",
                    Font = new Font("Segoe UI", 12, FontStyle.Bold),
                    ForeColor = Color.FromArgb(17, 24, 39),
                    Location = new Point(24, 18),
                    AutoSize = true
                };

                Label descLabel = new Label() {
                    Text = "Enter your corporate CRM email once to link this computer (" + Environment.MachineName + "). It will run silently in the taskbar by your clock.",
                    Font = new Font("Segoe UI", 9, FontStyle.Regular),
                    ForeColor = Color.FromArgb(75, 85, 99),
                    Location = new Point(24, 48),
                    Width = 380,
                    Height = 40
                };

                Label emailLabel = new Label() {
                    Text = "Corporate CRM Email Address:",
                    Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                    ForeColor = Color.FromArgb(55, 65, 81),
                    Location = new Point(24, 98),
                    AutoSize = true
                };

                TextBox emailBox = new TextBox() {
                    Font = new Font("Segoe UI", 10),
                    Location = new Point(24, 120),
                    Width = 376,
                    Text = userEmail
                };

                Button pairBtn = new Button() {
                    Text = "Pair Workstation & Start",
                    Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                    BackColor = Color.FromArgb(79, 70, 229),
                    ForeColor = Color.White,
                    FlatStyle = FlatStyle.Flat,
                    Location = new Point(24, 165),
                    Width = 376,
                    Height = 36,
                    Cursor = Cursors.Hand
                };
                pairBtn.FlatAppearance.BorderSize = 0;

                pairBtn.Click += (s, e) => {
                    string email = emailBox.Text.Trim();
                    if (string.IsNullOrEmpty(email) || !email.Contains("@")) {
                        MessageBox.Show(form, "Please enter a valid corporate email address.", "Validation", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                    userEmail = email.ToLower();
                    userName = userEmail.Split('@')[0];
                    SaveConfiguration();
                    form.DialogResult = DialogResult.OK;
                    form.Close();
                };

                form.Controls.Add(titleLabel);
                form.Controls.Add(descLabel);
                form.Controls.Add(emailLabel);
                form.Controls.Add(emailBox);
                form.Controls.Add(pairBtn);

                if (form.ShowDialog() != DialogResult.OK && string.IsNullOrEmpty(userEmail)) {
                    Environment.Exit(0);
                }
            }
        }

        private void InitializeTray() {
            contextMenu = new ContextMenuStrip();
            contextMenu.Font = new Font("Segoe UI", 9);

            ToolStripMenuItem titleItem = new ToolStripMenuItem("WorkPulse Telemetry Agent") {
                Enabled = false,
                Font = new Font("Segoe UI", 9, FontStyle.Bold)
            };
            userMenuItem = new ToolStripMenuItem("User: " + (string.IsNullOrEmpty(userName) ? userEmail : userName)) { Enabled = false };
            statusMenuItem = new ToolStripMenuItem("Status: Active Focus") { Enabled = false };
            appMenuItem = new ToolStripMenuItem("Active App: Detecting...") { Enabled = false };

            ToolStripMenuItem openWebItem = new ToolStripMenuItem("Open Web Dashboard", null, (s, e) => {
                Process.Start("http://localhost:5173/dashboard");
            });

            ToolStripMenuItem reconfigItem = new ToolStripMenuItem("Re-configure Workstation...", null, (s, e) => {
                ShowSetupDialog();
                userMenuItem.Text = "User: " + (string.IsNullOrEmpty(userName) ? userEmail : userName);
            });

            ToolStripMenuItem exitItem = new ToolStripMenuItem("Exit Agent", null, (s, e) => {
                trayIcon.Visible = false;
                Application.Exit();
            });

            contextMenu.Items.Add(titleItem);
            contextMenu.Items.Add(userMenuItem);
            contextMenu.Items.Add(statusMenuItem);
            contextMenu.Items.Add(appMenuItem);
            contextMenu.Items.Add(new ToolStripSeparator());
            contextMenu.Items.Add(openWebItem);
            contextMenu.Items.Add(reconfigItem);
            contextMenu.Items.Add(new ToolStripSeparator());
            contextMenu.Items.Add(exitItem);

            // Create a clean 16x16 icon in memory (emerald circle with white pulse center)
            Bitmap bmp = new Bitmap(16, 16);
            using (Graphics g = Graphics.FromImage(bmp)) {
                g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                g.FillEllipse(new SolidBrush(Color.FromArgb(16, 185, 129)), 1, 1, 14, 14);
                g.FillEllipse(new SolidBrush(Color.White), 5, 5, 6, 6);
            }
            Icon icon = Icon.FromHandle(bmp.GetHicon());

            trayIcon = new NotifyIcon() {
                Icon = icon,
                ContextMenuStrip = contextMenu,
                Text = "WorkPulse • Active Focus",
                Visible = true
            };

            trayIcon.DoubleClick += (s, e) => {
                Process.Start("http://localhost:5173/dashboard");
            };

            trayIcon.ShowBalloonTip(3000, "WorkPulse Connected", "Workstation linked to " + userEmail + ". Telemetry active in system tray.", ToolTipIcon.Info);
        }

        private void StartTelemetry() {
            telemetryTimer = new Timer();
            telemetryTimer.Interval = 5000; // 5 seconds
            telemetryTimer.Tick += async (s, e) => {
                await SampleTelemetry();
            };
            telemetryTimer.Start();
        }

        private async Task SampleTelemetry() {
            try {
                // 1. Get foreground window handle
                IntPtr hwnd = GetForegroundWindow();
                StringBuilder sb = new StringBuilder(512);
                GetWindowText(hwnd, sb, 512);
                string title = sb.ToString().Trim();

                // 2. Get process
                uint pid = 0;
                GetWindowThreadProcessId(hwnd, out pid);
                string procName = "System";
                if (pid > 0) {
                    try {
                        Process p = Process.GetProcessById((int)pid);
                        procName = p.ProcessName + ".exe";
                    } catch { }
                }

                // 3. Get Idle time
                uint idleMs = GetIdleTime();
                double idleSec = Math.Round(idleMs / 1000.0, 1);

                // 4. State
                string state = "ACTIVE";
                if (idleSec >= 300) state = "IDLE";
                if (procName.ToLower().Contains("lockapp") || procName.ToLower().Contains("logonui")) {
                    state = "LOCKED";
                    title = "Workstation Locked";
                }

                // Update totals
                if (state == "ACTIVE") totalActiveSeconds += 5;
                else if (state == "IDLE") totalIdleSeconds += 5;
                else if (state == "LOCKED") totalLockedSeconds += 5;

                currentApp = procName;
                currentWindowTitle = title;
                currentState = state;

                // Update tray menu
                statusMenuItem.Text = "Status: " + state + " (" + idleSec + "s idle)";
                appMenuItem.Text = "Active: " + (procName.Length > 20 ? procName.Substring(0, 20) : procName);
                trayIcon.Text = "WorkPulse • " + state + " • " + procName;

                // 5. Send heartbeat to Firestore REST
                await SyncHeartbeat(idleSec);

                // 6. Flush interval if changed or after 30s
                if ((DateTime.UtcNow - lastFlushTime).TotalSeconds >= 30) {
                    await FlushInterval();
                    lastFlushTime = DateTime.UtcNow;
                }
            } catch { }
        }

        private async Task SyncHeartbeat(double idleSec) {
            try {
                string deviceId = Environment.MachineName;
                string url = FIRESTORE_BASE + "timetrack_devices/" + deviceId;

                int total = totalActiveSeconds + totalIdleSeconds + totalLockedSeconds;
                int ratio = total > 0 ? (int)Math.Round(((double)totalActiveSeconds / total) * 100) : 100;

                string json = "{\"fields\":{" +
                    "\"deviceId\":{\"stringValue\":\"" + EscapeJson(deviceId) + "\"}," +
                    "\"hostname\":{\"stringValue\":\"" + EscapeJson(Environment.MachineName) + "\"}," +
                    "\"employeeId\":{\"stringValue\":\"" + EscapeJson(userEmail) + "\"}," +
                    "\"employeeEmail\":{\"stringValue\":\"" + EscapeJson(userEmail) + "\"}," +
                    "\"employeeName\":{\"stringValue\":\"" + EscapeJson(userName) + "\"}," +
                    "\"department\":{\"stringValue\":\"" + EscapeJson(userDept) + "\"}," +
                    "\"os\":{\"stringValue\":\"Windows 10/11 x64\"}," +
                    "\"agentVersion\":{\"stringValue\":\"v1.2.0\"}," +
                    "\"status\":{\"stringValue\":\"" + currentState.ToLower() + "\"}," +
                    "\"currentApp\":{\"stringValue\":\"" + EscapeJson(currentApp) + "\"}," +
                    "\"windowTitle\":{\"stringValue\":\"" + EscapeJson(currentWindowTitle) + "\"}," +
                    "\"online\":{\"booleanValue\":true}," +
                    "\"idleSeconds\":{\"doubleValue\":" + idleSec + "}," +
                    "\"todayTrackedSeconds\":{\"integerValue\":\"" + total + "\"}," +
                    "\"todayActiveSeconds\":{\"integerValue\":\"" + totalActiveSeconds + "\"}," +
                    "\"todayIdleSeconds\":{\"integerValue\":\"" + totalIdleSeconds + "\"}," +
                    "\"focusRatio\":{\"stringValue\":\"" + ratio + "%\"}," +
                    "\"lastHeartbeat\":{\"stringValue\":\"" + DateTime.UtcNow.ToString("o") + "\"}" +
                    "}}";

                StringContent content = new StringContent(json, Encoding.UTF8, "application/json");
                HttpRequestMessage req = new HttpRequestMessage(new HttpMethod("PATCH"), url) { Content = content };
                await httpClient.SendAsync(req);
            } catch { }
        }

        private async Task FlushInterval() {
            try {
                string logId = "log_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                string url = FIRESTORE_BASE + "timetrack_activity_logs/" + logId;
                string dateStr = DateTime.UtcNow.ToString("yyyy-MM-dd");

                string json = "{\"fields\":{" +
                    "\"intervalId\":{\"stringValue\":\"" + logId + "\"}," +
                    "\"employeeEmail\":{\"stringValue\":\"" + EscapeJson(userEmail) + "\"}," +
                    "\"employeeName\":{\"stringValue\":\"" + EscapeJson(userName) + "\"}," +
                    "\"deviceId\":{\"stringValue\":\"" + EscapeJson(Environment.MachineName) + "\"}," +
                    "\"date\":{\"stringValue\":\"" + dateStr + "\"}," +
                    "\"startTime\":{\"stringValue\":\"" + intervalStartTime.ToString("o") + "\"}," +
                    "\"endTime\":{\"stringValue\":\"" + DateTime.UtcNow.ToString("o") + "\"}," +
                    "\"durationSeconds\":{\"integerValue\":\"30\"}," +
                    "\"durationDisplay\":{\"stringValue\":\"30s\"}," +
                    "\"state\":{\"stringValue\":\"" + currentState.ToLower() + "\"}," +
                    "\"executable\":{\"stringValue\":\"" + EscapeJson(currentApp) + "\"}," +
                    "\"windowTitle\":{\"stringValue\":\"" + EscapeJson(currentWindowTitle) + "\"}," +
                    "\"category\":{\"stringValue\":\"work\"}," +
                    "\"createdAt\":{\"stringValue\":\"" + DateTime.UtcNow.ToString("o") + "\"}" +
                    "}}";

                StringContent content = new StringContent(json, Encoding.UTF8, "application/json");
                HttpRequestMessage req = new HttpRequestMessage(new HttpMethod("PATCH"), url) { Content = content };
                await httpClient.SendAsync(req);

                intervalStartTime = DateTime.UtcNow;
            } catch { }
        }

        // Helpers
        private string ExtractJsonString(string json, string key) {
            string pattern = "\"" + key + "\":";
            int idx = json.IndexOf(pattern);
            if (idx < 0) return "";
            int start = json.IndexOf("\"", idx + pattern.Length);
            if (start < 0) return "";
            int end = json.IndexOf("\"", start + 1);
            if (end < 0) return "";
            return json.Substring(start + 1, end - start - 1);
        }

        private string EscapeJson(string s) {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", " ");
        }

        // P/Invoke
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [StructLayout(LayoutKind.Sequential)]
        public struct LASTINPUTINFO {
            public uint cbSize;
            public uint dwTime;
        }

        [DllImport("user32.dll")]
        public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

        public static uint GetIdleTime() {
            LASTINPUTINFO lii = new LASTINPUTINFO();
            lii.cbSize = (uint)Marshal.SizeOf(lii);
            if (GetLastInputInfo(ref lii)) {
                return ((uint)Environment.TickCount - lii.dwTime);
            }
            return 0;
        }
    }
}
