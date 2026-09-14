/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/renderer/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#4c1d95",
          600: "#3b1874",
          700: "#2e1358",
          800: "#1f0d3c",
          900: "#150826",
        },
      },
    },
  },
  plugins: [],
};
