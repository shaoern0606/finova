/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gx: {
          50: "#f5f3ff",
          100: "#ede9fe",
          400: "#a78bfa",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          900: "#24103f"
        }
      },
      boxShadow: {
        soft: "0 18px 55px rgba(76, 29, 149, 0.14)"
      }
    }
  },
  plugins: []
};

