import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080b12",
        panel: "#101620",
        line: "#1b2636",
        muted: "#7d8ca5",
        cyan: {
          ...colors.cyan,
          DEFAULT: "#35d5d0"
        },
        violet: {
          ...colors.violet,
          DEFAULT: "#8b7bff"
        },
        amber: {
          ...colors.amber,
          DEFAULT: "#f4bd70"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(53,213,208,.1)"
      }
    }
  },
  plugins: []
};

export default config;
