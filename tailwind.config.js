/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        sidebar: 'rgb(var(--color-sidebar-rgb) / <alpha-value>)',
        border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
        text: 'rgb(var(--color-text-rgb) / <alpha-value>)',
        muted: 'rgb(var(--color-muted-rgb) / <alpha-value>)',
        brand: 'rgb(var(--color-brand-rgb) / <alpha-value>)',
        accent: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        danger: 'rgb(var(--color-danger-rgb) / <alpha-value>)',
        info: 'rgb(var(--color-info-rgb) / <alpha-value>)',
        'auth-panel': 'rgb(var(--color-auth-panel-rgb) / <alpha-value>)',
        'auth-input': 'rgb(var(--color-auth-input-rgb) / <alpha-value>)',
        'auth-button': 'rgb(var(--color-auth-button-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
      },
      spacing: {
        1.5: '6px',
      },
    },
  },
  plugins: [],
}
