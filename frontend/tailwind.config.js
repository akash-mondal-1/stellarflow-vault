/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#adc2ff',
          400: '#809eff',
          500: '#4d6eff',
          600: '#2644e6',
          700: '#1a30ab',
          800: '#152480',
          900: '#121e61',
        }
      }
    },
  },
  plugins: [],
}
