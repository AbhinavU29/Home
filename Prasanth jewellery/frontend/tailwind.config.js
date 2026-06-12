/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#F4E8C1',
          DEFAULT: '#D4AF37', // Gold
          dark: '#AA8020',
          hover: '#C29B27',
        },
        charcoal: {
          light: '#2D2D2D',
          DEFAULT: '#1A1A1A',
          dark: '#0F0F0F',
        },
        cream: {
          light: '#FAF8F5',
          DEFAULT: '#F5ECE1',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
