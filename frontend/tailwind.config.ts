/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0B192C',
          dark: '#1E3E62',
          light: '#F5F7FA',
          accent: '#FF6500',
          emerald: '#10B981',
          saffron: '#FF9933',
          purple: '#8B5CF6',
          card: '#0f2744',
          border: '#1f436b'
        }
      }
    },
  },
  plugins: [],
}
