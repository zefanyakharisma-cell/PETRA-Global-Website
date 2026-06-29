import type { Config } from 'tailwindcss';

/**
 * Brand tokens are exposed both here (for `bg-navy`, `text-magenta`, etc.) and
 * as CSS variables in globals.css. Navy is load-bearing (~80% of surfaces);
 * accents are one-per-section punctuation. Amber and cyan require dark text.
 */
const config: Config = {
  content: [
    './src/**/*.{ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#133256',
          2: '#245484',
        },
        magenta: '#ec008c', // STUDY door accent
        amber: '#ffbc00', // GO ABROAD door accent (dark text on it)
        cyan: '#54feeb', // accent (dark text on it)
        blue: '#3880d0', // PARTNER door accent (pairs with navy)
        paper: '#f0f0f0', // light neutral surface
        ink: '#111111', // near-black text/neutral
      },
      fontFamily: {
        // Bound to next/font/local CSS variables (see src/lib/fonts.ts).
        display: ['var(--font-display)', 'sans-serif'], // Bebas Neue
        condensed: ['var(--font-condensed)', 'sans-serif'], // DIN Condensed
        body: ['var(--font-body)', 'system-ui', 'sans-serif'], // Inter
        editorial: ['var(--font-editorial)', 'Georgia', 'serif'], // Baskerville
      },
      maxWidth: {
        reading: '68ch',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
