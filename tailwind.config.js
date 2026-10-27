/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0F172A",
          "primary-hover": "#020617",
          "primary-light": "#F1F5F9",
          deep: "#030712",
          "deep-hover": "#000000",
          cyan: "#0284C7",
          "cyan-vibrant": "#0284C7",
          "cyan-dark": "#0369A1",
          "cyan-light": "#F0F9FF",
        },
        surface: {
          bg: "#F8F9FB",
          card: "#FFFFFF",
          subtle: "#F3F4F6",
          border: "#E5E7EB",
          "border-subtle": "#F0F2F5",
        },
        text: {
          primary: "#17171A",
          secondary: "#6B7280",
          muted: "#9CA3AF",
          inverted: "#FFFFFF",
        },
        status: {
          success: "#10B981",
          "success-bg": "#ECFDF5",
          warning: "#F59E0B",
          "warning-bg": "#FFFBEB",
          danger: "#EF4444",
          "danger-bg": "#FEF2F2",
          info: "#3B82F6",
          "info-bg": "#EFF6FF",
          purple: "#6366F1",
          "purple-bg": "#EEF2FF",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["Montserrat", "Inter", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        input: "10px",
        button: "10px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        elevated: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        dropdown: "0 10px 30px 0 rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "brand-glow": "0 0 20px 0 rgba(15, 23, 42, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "slide-down": "slideDown 0.25s ease-out",
        "slide-right": "slideRight 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
