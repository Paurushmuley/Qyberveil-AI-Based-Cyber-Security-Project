/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#06090e',
          900: '#0b0f19',
          850: '#111726',
          800: '#161f33',
          700: '#1f2d4a',
          600: '#2b3d63',
          border: '#1f293d',
          accent: '#0284c7',
          neonCyan: '#06b6d4',
          neonGreen: '#10b981',
          neonAmber: '#f59e0b',
          neonRed: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
