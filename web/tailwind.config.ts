import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans Variable"',
          '"Plus Jakarta Sans"',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      colors: {
        maroon: {
          950: '#2A0A0F',
          900: '#4A1219',
          800: '#5E1620',
          700: '#7A1F2B',
          500: '#9E2F3C',
          300: '#C98A92',
          100: '#F2DCDC',
        },
        gold: {
          100: '#F6EBC8',
          300: '#E6C76A',
          400: '#D9B54A',
          500: '#C9A227',
          700: '#735510',
        },
        cream: {
          50: '#FFFBF3',
          100: '#F7EFE0',
          200: '#EDE0C8',
          300: '#E0CDA9',
        },
        ink: {
          900: '#2B1A1C',
          600: '#6B5457',
          400: '#8C7A7D',
        },
        success: {
          600: '#1E7F4F',
          50: '#E6F4EC',
        },
        whatsapp: {
          50: '#E6F4EC',
          600: '#16A34A',
          700: '#15803D',
        },
        danger: {
          600: '#B42318',
          50: '#FDECEA',
        },
        warning: {
          600: '#8A6100',
          50: '#FBF1DA',
        },
        primary: '#7A1F2B',
        accent: '#D9B54A',
        surface: '#FFFFFF',
        border: '#EDE0C8',
        text: '#2B1A1C',
        muted: '#6B5457',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '12px',
        full: '999px',
      },
      boxShadow: {
        card: 'none',
        lift: 'none',
        block: 'none',
        gold: 'none',
        btn: 'none',
        glow: 'none',
        raised: '0 16px 40px -12px rgba(42,10,15,.28), 0 4px 12px -4px rgba(42,10,15,.14)',
      },
      spacing: {
        '4.5': '18px',
        '15': '60px',
        '18': '72px',
        '22': '88px',
        '30': '120px',
        '68': '272px',
      },
      maxWidth: {
        container: '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
