/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#7C3AED',
        tertiary: '#06B6D4',
        neutral: '#F8FAFC',
        surface: '#FFFFFF',
        'primary-border': '#DBEAFE',
        danger: '#B91C1C',
        alert: '#B91C1C',
        text: {
          primary: '#1E293B',
          secondary: '#64748B',
        },
      },
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular'],
        'sans-medium': ['PlusJakartaSans_500Medium'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
        'sans-bold': ['PlusJakartaSans_700Bold'],
      },
      letterSpacing: {
        tight: '-0.025em',
        widest: '0.08em',
      },
      borderRadius: {
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
