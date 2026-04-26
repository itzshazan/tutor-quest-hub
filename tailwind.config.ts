import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        kalam: ["Kalam", "cursive"],
        patrick: ["Patrick Hand", "cursive"],
      },
      fontSize: {
        "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        "body-lg": ["1.125rem", { lineHeight: "1.7" }],
        "body": ["1rem", { lineHeight: "1.7" }],
        "body-sm": ["0.875rem", { lineHeight: "1.6" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
        "34": "8.5rem",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // ── Hand-Drawn Design System Tokens ──────────────────────────────
        hd: {
          paper:  "#fdfbf7",
          ink:    "#2d2d2d",
          muted:  "#e5e0d8",
          accent: "#ff4d4d",
          blue:   "#2d5da1",
          postit: "#fff9c4",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "xl": "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        elevated: "var(--shadow-elevated)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        // Hard offset hand-drawn shadows (no blur)
        "hd-sm":    "3px 3px 0px 0px #2d2d2d",
        "hd-md":    "4px 4px 0px 0px #2d2d2d",
        "hd-lg":    "6px 6px 0px 0px #2d2d2d",
        "hd-xl":    "8px 8px 0px 0px #2d2d2d",
        "hd-hover": "2px 2px 0px 0px #2d2d2d",
        "hd-red":   "4px 4px 0px 0px #ff4d4d",
        "hd-blue":  "4px 4px 0px 0px #2d5da1",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0px) rotate(-2deg)" },
          "50%":      { transform: "translateY(-12px) rotate(2deg)" },
        },
        "jiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%":      { transform: "rotate(-2deg)" },
          "75%":      { transform: "rotate(2deg)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%":      { transform: "rotate(1deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "pop-in": {
          "0%":   { transform: "scale(0) rotate(-8deg)", opacity: "0" },
          "70%":  { transform: "scale(1.15) rotate(4deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "stamp": {
          "0%":   { transform: "scale(1.5) rotate(-6deg)", opacity: "0" },
          "60%":  { transform: "scale(0.9) rotate(2deg)", opacity: "1" },
          "80%":  { transform: "scale(1.05) rotate(-1deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "15%":      { transform: "translateX(-4px) rotate(-1deg)" },
          "30%":      { transform: "translateX(4px) rotate(1deg)" },
          "45%":      { transform: "translateX(-3px) rotate(-0.5deg)" },
          "60%":      { transform: "translateX(3px) rotate(0.5deg)" },
          "75%":      { transform: "translateX(-2px)" },
          "90%":      { transform: "translateX(2px)" },
        },
        "marquee": {
          "0%":   { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        "pencil-draw": {
          from: { strokeDashoffset: "300" },
          to:   { strokeDashoffset: "0" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "bounce-gentle":   "bounce-gentle 3s ease-in-out infinite",
        "jiggle":          "jiggle 0.3s ease-in-out",
        "wiggle":          "wiggle 2s ease-in-out infinite",
        "float":           "float 4s ease-in-out infinite",
        "pop-in":          "pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "stamp":           "stamp 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "shake":           "shake 0.5s ease-in-out",
        "marquee":         "marquee 22s linear infinite",
        "gradient-shift":  "gradient-shift 4s ease infinite",
        "pencil-draw":     "pencil-draw 0.9s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
