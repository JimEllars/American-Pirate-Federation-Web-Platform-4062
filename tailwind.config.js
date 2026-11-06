/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apf: {
          black: '#07080B',
          gray: '#11141B',
          purple: '#9400D3',
          purpleLight: '#C084FC',
          white: '#F4F6FA',
          emerald: '#10B981',
          signal: '#00FF66'
        },
        surface: {
          950: '#07080B',
          900: '#0B0D12',
          800: '#11141B',
          700: '#1A1F29'
        },
        ink: {
          DEFAULT: '#E7EAF0',
          muted: '#9AA4B2',
          dim: '#6B7480'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        terminal: ['"VT323"', 'ui-monospace', 'monospace'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        // Retained for compatibility with existing markup; new code should use `terminal`.
        vt323: ['"VT323"', 'monospace']
      },
      borderRadius: {
        '4xl': '2rem'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.35), 0 12px 32px -18px rgba(0,0,0,0.9)',
        lift: '0 2px 4px rgba(0,0,0,0.35), 0 24px 48px -24px rgba(0,0,0,0.95)',
        'accent': '0 0 0 1px rgba(148,0,211,0.35), 0 10px 40px -16px rgba(148,0,211,0.5)'
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
        'hero-glow':
          'radial-gradient(60% 60% at 20% 0%, rgba(148,0,211,0.22) 0%, transparent 70%), radial-gradient(45% 45% at 90% 20%, rgba(16,185,129,0.10) 0%, transparent 70%)'
      },
      maxWidth: {
        prose: '68ch'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
