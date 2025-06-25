import { type Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./src/**/*.tsx'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', ...fontFamily.sans],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        primary: {
          DEFAULT: 'linear-gradient(to right, #EDD689, #D3B662)',
          from: '#EDD689',
          to: '#D3B662',
          solid: '#EDD689',
          hover: '#EDD689/90',
          foreground: '#000000',
        },
        card: 'rgb(29 26 44 / 0.5)',
        gradient: {
          from: '#20212B',
          to: '#252935',
        },
        background: {
          DEFAULT: '#030014',
          card: 'rgb(29 26 44 / 0.5)',
          gradient: {
            from: '#20212B',
            to: '#252935',
          },
        },
        ui: {
          border: {
            DEFAULT: 'white/10',
          },
          text: {
            DEFAULT: 'white',
            muted: 'white/70',
          },
        },
        destructive: {
          DEFAULT: '#EF4444',
          hover: '#EF4444/90',
          foreground: 'white',
        },
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(to right, #EDD689, #D3B662)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
