/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Enable 'class' strategy for dark mode
  darkMode: "class", 
  
  content: [
    // 2. Ensure all relevant paths are covered
    "./src/**/*.{js,ts,jsx,tsx}",
          ],
  theme: {
    extend: {
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        bounce: 'bounce 0.8s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
