/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ob: {
          canvas: 'var(--ob-canvas)',
          sidebar: 'var(--ob-sidebar)',
          s1: 'var(--ob-s1)',
          s2: 'var(--ob-s2)',
          raised: 'var(--ob-raised)',
          text: 'var(--ob-text)',
          'text-2': 'var(--ob-text-2)',
          muted: 'var(--ob-muted)',
          dim: 'var(--ob-dim)',
          line: 'var(--ob-line)',
          'line-strong': 'var(--ob-line-strong)',
          grid: 'var(--ob-grid)',
          gold: 'var(--ob-gold)',
          'gold-bright': 'var(--ob-gold-bright)',
          'gold-muted': 'var(--ob-gold-muted)',
          'gold-wash': 'var(--ob-gold-wash)',
          'on-gold': 'var(--ob-on-gold)',
          'cell-miss': 'var(--ob-cell-miss)',
          'cell-future': 'var(--ob-cell-future)',
          track: 'var(--ob-track)',
          danger: 'var(--ob-danger)',
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
