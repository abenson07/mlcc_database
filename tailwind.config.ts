import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4e8",
          100: "#dde4d0",
          200: "#c9d3b8",
          300: "#b5c2a0",
          400: "#a1b188",
          500: "#8da070",
          600: "#6b8e23",
          700: "#556b2f",
          800: "#3d4f21",
          900: "#253313"
        },
        cream: {
          50: "#fefdfb",
          100: "#faf9f5",
          200: "#f5f5e6",
          300: "#f0f0d8",
          400: "#ebebca",
          500: "#e6e6bc"
        },
        neutral: {
          50: "#f5f5e6",
          100: "#e8e8d8",
          200: "#d1d1c0",
          300: "#b8b8a6",
          400: "#9f9f8c",
          500: "#6b8e23",
          600: "#556b2f",
          700: "#3d4f21",
          800: "#2d3a18",
          900: "#1d250f"
        }
      }
    }
  },
  plugins: []
};

export default config;

