/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#050505',
        neonBlue: '#00f3ff',
        neonPink: '#ff00ff',
        neonGreen: '#00ff9d',
        neonPurple: '#bf00ff',
        neonRed: '#ff3333',
        neonYellow: '#f3ff00'
      }
    }
  },
  plugins: []
};
