import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./client/index.html', './client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFFBF4',
          100: '#D8F5E4',
          200: '#B2EBCB',
          300: '#81DDA9',
          400: '#4FCA84',
          500: '#148E45',
          600: '#117A3C',
          700: '#0D612F',
          800: '#094B24',
          900: '#053117',
        },
        accent: {
          mint: '#3BCB8A',
          sky: '#3EA6FF',
          amber: '#FFB547',
          coral: '#FF7A59',
        },
        surface: {
          base: '#F4F8F5',
          elevated: '#FFFFFF',
          muted: '#E6EFE9',