/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gx: {
          50: "#ecfdf3",
          100: "#d1fae1",
          500: "#00a86b",
          600: "#008a59",
          900: "#053b2c"
        }
      },
      boxShadow: {
        soft: "0 16px 45px rgba(5, 59, 44, 0.10)"
      }
    }
  },
  plugins: []
};

