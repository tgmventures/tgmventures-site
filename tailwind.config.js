/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        'tgm-black': '#000000',
        'tgm-white': '#ffffff',
        'tgm-gray-light': '#888888',
        'tgm-gray-dark': '#666666',
      },
    },
  },
  plugins: [],
}
