import type { Config } from 'tailwindcss';

export default {
  content: ['./client/index.html', './client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e8ecff',
          500: '#4f6df5',
          700: '#2f49cc'
        },
        neutral: {
          50: '#f9fafb',
          900: '#111827'
        }
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem'
      },
      boxShadow: {
        card: '0 8px 24px rgba(17, 24, 39, 0.08)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
