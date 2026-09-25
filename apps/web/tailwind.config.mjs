/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eefbfe',
          100: '#d3f4fd',
          200: '#afeafb',
          300: '#7adcf7',
          400: '#3ec7f1',
          500: '#17aee0', // AsanYaz cyan/bright blue
          600: '#0d8bc0',
          700: '#0c6f9b',
          800: '#105e81',
          900: '#124e6c',
          950: '#0c3248',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
