import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './client/index.html',
    './client/src/**/*.{ts,tsx}',
    './shared/**/*.{ts,tsx}',
  ],
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
          inverse: '#0B1F14',
        },
        text: {
          primary: '#102217',
          secondary: '#3E5446',
          tertiary: '#6B8172',
          inverse: '#ECF7F0',
        },
        border: {
          soft: '#D3E2D8',
          strong: '#8EAB99',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Pretendard', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px rgba(16, 34, 23, 0.08)',
        focus: '0 0 0 4px rgba(20, 142, 69, 0.2)',
      },
      borderRadius: {
        lg: '0.875rem',
        xl: '1.125rem',
        '2xl': '1.5rem',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};
export default config;
