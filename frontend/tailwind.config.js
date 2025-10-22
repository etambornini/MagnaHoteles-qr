/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          background: "#18181b", // zinc-900
          accent: "#dc2626", // red-600
        },
      },
    },
  },
  plugins: [],
};
