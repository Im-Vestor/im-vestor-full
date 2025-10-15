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
        // Light mode colors
        light: {
          background: {
            DEFAULT: 'hsl(var(--background))',
            card: 'hsl(var(--background-card))',
            gradient: {
              from: 'var(--background-gradient-from)',
              to: 'var(--background-gradient-to)',
            },
          },
          text: {
            primary: 'hsl(var(--text-primary))',
            secondary: 'hsl(var(--text-secondary))',
            muted: 'hsl(var(--text-muted))',
          },
          border: {
            DEFAULT: 'hsl(var(--border))',
            muted: 'hsl(var(--border-muted))',
          },
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))',
            border: 'hsl(var(--card-border))',
          },
          input: {
            DEFAULT: 'hsl(var(--input))',
            border: 'hsl(var(--input-border))',
            focus: 'hsl(var(--input-focus))',
          },
          button: {
            primary: 'hsl(var(--button-primary))',
            'primary-foreground': 'hsl(var(--button-primary-foreground))',
            secondary: 'hsl(var(--button-secondary))',
            'secondary-foreground': 'hsl(var(--button-secondary-foreground))',
            outline: 'hsl(var(--button-outline))',
            'outline-foreground': 'hsl(var(--button-outline-foreground))',
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))',
          },
          success: {
            DEFAULT: 'hsl(var(--success))',
            foreground: 'hsl(var(--success-foreground))',
          },
          warning: {
            DEFAULT: 'hsl(var(--warning))',
            foreground: 'hsl(var(--warning-foreground))',
          },
          info: {
            DEFAULT: 'hsl(var(--info))',
            foreground: 'hsl(var(--info-foreground))',
          },
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
