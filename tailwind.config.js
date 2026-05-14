/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FAFAF8",
          100: "#F5F5F3",
          200: "#EEEEEA",
          300: "#E4E3DD",
        },
        slate: {
          ink: "#0B1220",
        },
        rain: {
          50: "#F1F5FB",
          100: "#DCE7F4",
          200: "#B7CCE6",
          300: "#7FA4CC",
          400: "#4A7BB0",
          500: "#2C5C95",
          600: "#1E4577",
          700: "#15325A",
          800: "#0F2444",
          900: "#0A1A33",
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', "serif"],
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.08)",
        lift: "0 2px 4px rgba(15, 23, 42, 0.06), 0 24px 60px -20px rgba(15, 23, 42, 0.14)",
      },
    },
  },
  plugins: [],
};
