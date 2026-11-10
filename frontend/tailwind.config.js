/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Precise Enterprise Palette requested by user:
        navy: {
          950: '#050914', // Main background
          900: '#0A1222', // Secondary background
          850: '#101827', // Card background
          800: '#151F31', // Elevated card
          border: '#273449', // Border
        },
        brand: {
          blue: '#2563EB',      // Primary blue
          electric: '#38BDF8',  // Electric blue
          cyan: '#7DD3FC',      // Cyan accent
          silver: '#CBD5E1',    // Silver
          muted: '#94A3B8',     // Secondary text
          gold: '#F5B544',      // Original logo golden highlight
        },
        // Legacy compatibility
        charcoal: {
          850: '#101827',
          900: '#0A1222',
          950: '#050914',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Cinzel', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 35px -5px rgba(37, 99, 235, 0.35)',
        'glow-electric': '0 0 35px -5px rgba(56, 189, 248, 0.4)',
        'glow-gold': '0 0 35px -5px rgba(245, 181, 68, 0.45)',
        'glow-cyan': '0 0 30px -5px rgba(125, 211, 252, 0.35)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px #273449',
        'card-elevated': '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px #273449, 0 0 20px -5px rgba(56, 189, 248, 0.15)',
      }
    },
  },
  plugins: [],
}
