import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF2FF",
          100: "#DDE3FF",
          200: "#BCC8FF",
          300: "#8FA3FF",
          400: "#5E7EFF",
          500: "#2B4EFF",    // primary
          600: "#1E3FD6",    // primary hover
          700: "#1831A8",
          800: "#12257F",
          900: "#0C1955",
        },
        surface: {
          bg: "#F5F6FA",
          card: "#FFFFFF",
          border: "#E4E7EF",
          borderStrong: "#D3D8E4",
          muted: "#FAFBFD",
        },
        ink: {
          DEFAULT: "#1C2333",
          sub: "#66708A",
          mute: "#8F99AE",
        },
        success: { DEFAULT: "#0E9F6E", soft: "#E6F6F0" },
        warning: { DEFAULT: "#C27803", soft: "#FDF3E0" },
        danger:  { DEFAULT: "#D92D20", soft: "#FDECEB" },
        info:    { DEFAULT: "#1A56DB", soft: "#E8F0FE" },
      },
      boxShadow: {
        soft:  "0 1px 2px rgba(28,35,51,.06)",
        card:  "0 4px 16px rgba(28,35,51,.08)",
        modal: "0 12px 40px rgba(28,35,51,.14)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      fontFamily: {
        sans: ["-apple-system", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"],
        mono: ["ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(18px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        toast:   { "0%": { opacity: "0", transform: "translate(-50%,16px)" }, "100%": { opacity: "1", transform: "translate(-50%,0)" } },
      },
      animation: {
        fadeIn:  "fadeIn 180ms ease-out",
        slideUp: "slideUp 220ms cubic-bezier(.2,.6,.2,1)",
        toast:   "toast 300ms cubic-bezier(.2,.6,.2,1)",
      },
    },
  },
  plugins: [],
};
export default config;
