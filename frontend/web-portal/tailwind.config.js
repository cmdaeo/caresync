/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // EXACT PALETTE FROM YOUR REFERENCE
        'blue-bell': '#4AA4E1',       // Main lighter blue
        'fresh-sky': '#54B4F0',       // Bright cyan-blue
        'baltic-blue': '#285D91',     // Dark blue (Primary text/brand)
        'baltic-blue-2': '#245985',   // Even darker blue
        'blue-bell-2': '#4795D1',     // Mid-tone blue
        'baltic-blue-3': '#29619A',   // Deep blue
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
