/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#0891b2',
          cyanDark: '#0e7490',
          cyanDeep: '#155e75',
          cyanLight: '#ecfeff',
          cyanBorder: '#a5f3fc',
          orange: '#ea580c',
          orangeDark: '#c2410c',
          orangeDeep: '#9a3412',
          orangeLight: '#fff7ed',
          orangeBorder: '#fed7aa',
          pink: '#be185d',
          pinkDark: '#9d174d',
          pinkDeep: '#831843',
          pinkVibrant: '#db2777',
          pinkLight: '#fdf2f8',
          pinkBorder: '#fbcfe8',
          roseDark: '#9f1239',
          roseLight: '#fff1f2',
          white: '#FFFFFF',
          canvas: '#F8FAFC',
          card: '#FFFFFF',
          textMain: '#0F172A',
          textMuted: '#64748B',
          border: '#E2E8F0',
          green: '#10B981',
          greenLight: '#ECFDF5',
          red: '#EF4444',
          redLight: '#FEF2F2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'cyan': '0 4px 14px 0 rgba(8, 145, 178, 0.25)',
        'pink': '0 4px 14px 0 rgba(190, 24, 93, 0.25)',
        'pink-lg': '0 10px 25px -3px rgba(190, 24, 93, 0.25), 0 4px 6px -2px rgba(190, 24, 93, 0.10)',
        'orange': '0 4px 14px 0 rgba(234, 88, 12, 0.25)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -2px rgba(8, 145, 178, 0.04)',
        'card-hover': '0 12px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(8, 145, 178, 0.08)',
      }
    },
  },
  plugins: [],
}
