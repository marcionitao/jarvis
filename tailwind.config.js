/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#dc4c3e',
        },
        secondary: {
          DEFAULT: '#D88E2E',
        },
        background: {
          DEFAULT: '#fff',
          alt: '#f5f5f5',
        },
        foreground: {
          DEFAULT: '#635E5E',
        },
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#a6a6a6',
        },
        border: {
          DEFAULT: '#d9d9d9',
        },
        destructive: {
          DEFAULT: '#dc4c3e',
        },
        success: {
          DEFAULT: '#2f9d23',
        },
        warning: {
          DEFAULT: '#D88E2E',
        },
        'date-today': '#2f9d23',
        'date-tomorrow': '#9d6023',
        'date-weekend': '#233d9d',
        'date-other': '#54239d',
        'project-1': '#0079bf',
        'project-2': '#d29034',
        'project-3': '#519839',
        'project-4': '#b04632',
        'project-5': '#89609e',
        'project-6': '#cd5a91',
        'project-7': '#4bbf6b',
        'project-8': '#00aecc',
        'project-9': '#838c91',
      },
    },
  },
  plugins: [],
};
