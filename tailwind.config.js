/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1E3A8A',
        dokkaebi: '#DC2626',
        gold: '#C9A33A',
        onyx: '#0F0F10'
      }
    }
  },
  plugins: []
}
