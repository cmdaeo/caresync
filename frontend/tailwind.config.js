/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          900: '#020617',
          800: '#0f172a',
          500: '#3b82f6',
          grid: 'rgba(30, 41, 59, 0.1)',
        },
        medical: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#0ea5e9',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
