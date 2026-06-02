import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      /* Typography Sizes */
      fontSize: {
        'display-lg': ['48px', '72px'],
        'display-md': ['40px', '60px'],
        'display-sm': ['32px', '48px'],
        'h1': ['28px', '42px'],
        'h2': ['24px', '36px'],
        'h3': ['20px', '30px'],
        'h4': ['18px', '27px'],
        'h5': ['16px', '24px'],
        'body-lg': ['16px', '24px'],
        'body-md': ['14px', '21px'],
        'body-sm': ['13px', '19.5px'],
        'caption-md': ['12px', '18px'],
        'caption-sm': ['11px', '16.5px'],
      },

      /* Spacing Scale (8px base) */
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        12: '48px',
      },

      /* Colors */
      colors: {
        indigo: {
          50: '#F5F3FF',
          100: '#EEF2FF',
          600: '#6366F1',
          700: '#4F46E5',
          800: '#4338CA',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },

      /* Border Radius */
      borderRadius: {
        'btn': '12px',
        'card': '16px',
        'input': '8px',
        'avatar': '9999px',
        'modal': '16px',
      },

      /* Box Shadows / Elevations */
      boxShadow: {
        'elevation-1': '0 2px 4px rgba(0, 0, 0, 0.04)',
        'elevation-2': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'elevation-3': '0 12px 32px rgba(0, 0, 0, 0.12)',
        'elevation-4': '0 24px 80px rgba(0, 0, 0, 0.16)',
        'elevation-5': '0 24px 80px rgba(0, 0, 0, 0.24)',
        'elevation-6': '0 20px 60px rgba(0, 0, 0, 0.20)',
      },

      /* Max Width */
      maxWidth: {
        'container': '1200px',
        'container-lg': '1500px',
      },
    },
  },
  plugins: [],
} satisfies Config
