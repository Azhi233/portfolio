/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-white': '#FFFFFF',
        'sterile-blue': '#F0F7FF',
        'slate-gray': '#64748B',
      },
    },
  },
  plugins: [],
}
