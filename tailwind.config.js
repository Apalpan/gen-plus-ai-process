/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // GEN+ navy / blue scale
        ink: {
          900: '#040F20', // fondo oscuro principal
          850: '#06142A', // surface
          800: '#071A36', // overlays
          700: '#0A244C', // surface raised / navy
        },
        navy: {
          900: '#0E2A6B', // deep navy
          800: '#12388C', // blue dark
          700: '#1748B5', // blue medium
        },
        brand: {
          600: '#1E5CE8', // blue bright
          500: '#2165FF', // blue primary
          400: '#4D84FF', // blue light
          300: '#6A98FF', // blue sky
          200: '#BACFFF', // blue pale
          100: '#E9F0FF', // blue ice
        },
        // semantic accents for node types
        accent: {
          amber: '#F5A623',
          violet: '#8B5CF6',
          cyan: '#22D3EE',
          green: '#34D399',
          red: '#F87171',
          orange: '#FB923C',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        btn: '10px',
        'btn-lg': '12px',
        card: '16px',
        'card-lg': '24px',
        panel: '24px',
      },
      boxShadow: {
        elevated: '0 20px 50px rgba(0,0,0,0.35)',
        focus: '0 0 0 3px rgba(77,132,255,0.45)',
        glow: '0 0 0 1px rgba(77,132,255,0.30), 0 12px 32px rgba(33,101,255,0.20)',
      },
      backgroundImage: {
        'gen-hero': 'linear-gradient(135deg, #07111F 0%, #10317C 55%, #1D5BE3 100%)',
        'gen-spectrum':
          'linear-gradient(165deg, #0E2A6B 0%, #12388C 20%, #1748B5 40%, #1E5CE8 60%, #2165FF 80%, #4D84FF 100%)',
        'grid-dots':
          'radial-gradient(rgba(106,152,255,0.10) 1px, transparent 1px)',
      },
      transitionTimingFunction: {
        panel: 'cubic-bezier(.4,0,.2,1)',
      },
      keyframes: {
        'pulse-line': {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-line': 'pulse-line 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 360ms cubic-bezier(.4,0,.2,1) both',
      },
    },
  },
  plugins: [],
};
