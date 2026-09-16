import formsPlugin from '@tailwindcss/forms';
import containerQueriesPlugin from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#60A5FA',
        cta: '#F97316',
        'background-light': '#F8FAFC',
        'background-dark': '#0F172A',
        'surface-light': '#ffffff',
        'surface-dark': '#1E293B',
        'coffee-brown': '#6F4E37',
        cream: '#FDFBF7',
        mint: '#A8D8B9',
        strawberry: '#F7C5CC',
        vanilla: '#FDF5E6',
      },
      fontFamily: {
        display: ['Varela Round', 'sans-serif'],
        body: ['Nunito Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 8px 32px rgba(0, 0, 0, 0.15)',
      },
      transitionTimingFunction: {
        fluid: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [formsPlugin, containerQueriesPlugin],
};
