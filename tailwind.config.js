/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        border: 'var(--border-color)',
      },
      backgroundColor: {
        'background-50': 'var(--background-50)',
        'background-10': 'var(--background-10)',
        'foreground-5': 'var(--hover-bg)',
        'foreground-10': 'var(--hover-bg-dark)',
        'blue-20': 'rgba(59, 130, 246, 0.2)',
        'black-80': 'rgba(0, 0, 0, 0.8)',
      }
    },
    borderWidth: {
      DEFAULT: '1px',
    },
    borderOpacity: {
      DEFAULT: '0.8',
    },
  },
  plugins: [],
}