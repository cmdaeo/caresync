/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F766E', // Teal-700
        secondary: '#0E7490', // Cyan-700
        accent: '#F0FDFA', // Teal-50
        danger: '#EF4444', // Red-500
      },
    },
  },
  plugins: [],
}
