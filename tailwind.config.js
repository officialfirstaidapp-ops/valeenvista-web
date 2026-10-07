/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',  // ✅ Enable class-based dark mode
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors from your design
        'soft-green': '#10b981',
        'warm-orange': '#f59e0b',
        'pastel-green': '#d1fae5',
        'pastel-orange': '#fed7aa',
        'pastel-yellow': '#fef3c7',
        'dark-text': '#1f2937',
        'light-text': '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};