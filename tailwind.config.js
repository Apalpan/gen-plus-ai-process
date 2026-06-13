/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Foreground token (theme-aware) — overrides Tailwind `white`.
        // Use `oncolor` for text that sits on a colored fill in both themes.
        white: 'rgb(var(--fg) / <alpha-value>)',
        oncolor: '#ffffff',
        // GEN+ navy / blue scale (theme-aware surfaces)
        ink: {
          900: 'rgb(var(--ink-900) / <alpha-value>)', // app background
          850: 'rgb(var(--ink-850) / <alpha-value>)', // surface
          800: 'rgb(var(--ink-800) / <alpha-value>)', // overlays
          700: 'rgb(var(--ink-700) / <alpha-value>)', // surface raised
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
          300: 'rgb(var(--brand-300) / <alpha-value>)', // blue sky (theme-aware text)
          200: 'rgb(var(--brand-200) / <alpha-value>)', // blue pale (theme-aware text)
          100: 'rgb(var(--brand-100) / <alpha-value>)', // blue ice (theme-aware text)
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
        'dash-flow': {
          to: { 'stroke-dashoffset': '-20' },
        },
        'node-pulse': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.18)' },
        },
      },
      animation: {
        'pulse-line': 'pulse-line 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 360ms cubic-bezier(.4,0,.2,1) both',
        'dash-flow': 'dash-flow 0.9s linear infinite',
        'node-pulse': 'node-pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
