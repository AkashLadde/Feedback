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
          cyan: '#06B6D4',
          cyanDark: '#0891B2',
          cyanDeep: '#0E7490',
          cyanLight: '#ECFEFF',
          cyanBorder: '#A5F3FC',
          orange: '#F97316',
          orangeDark: '#EA580C',
          orangeLight: '#FFF7ED',
          orangeBorder: '#FED7AA',
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
        'subtle': '0 1px 3px 0 rgba(6, 182, 212, 0.06), 0 1px 2px -1px rgba(6, 182, 212, 0.04)',
        'cyan': '0 4px 14px 0 rgba(6, 182, 212, 0.20)',
        'orange': '0 4px 14px 0 rgba(249, 115, 22, 0.20)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -2px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 12px 24px -4px rgba(6, 182, 212, 0.12), 0 4px 8px -2px rgba(249, 115, 22, 0.08)',
      }
    },
  },
  plugins: [],
}
