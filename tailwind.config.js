/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apf: {
          black: '#0A0A0A',
          gray: '#141414',
          purple: '#9400FF',
          purpleLight: '#d4adff',
          white: '#FAFAFA'
        }
      },
      fontFamily: {
        cinzel: ['"Cinzel"', 'serif'],
        vt323: ['"VT323"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"VT323"', 'monospace'], // Defaulting mono to VT323 for system feel
      },
      backgroundImage: {
        'digital-sea': 'linear-gradient(to right, rgba(148, 0, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 0, 255, 0.1) 1px, transparent 1px)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}