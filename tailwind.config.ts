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
        magenta: '#ec008c', // STUDY door accent / FHIK faculty
        amber: '#ffbc00', // GO ABROAD door accent (dark text on it)
        cyan: '#54feeb', // accent (dark text on it)
        blue: '#3880d0', // PARTNER door accent (pairs with navy)

        // Faculty (FAKULTAS) accents. Red/orange take white text; green/yellow
        // take dark (ink) text. Kept alongside the brand accents above.
        red: '#ed1c24', // SIPIL & ARS faculty
        orange: '#f58220', // FTI faculty
        green: '#6cb33f', // SBM faculty (dark text on it)
        yellow: '#fff200', // PGSD faculty (dark text on it)

        paper: '#f0f0f0', // light neutral surface
        ink: '#111111', // near-black text/neutral

        // shadcn-style semantic tokens — consumed by dropped-in ui/ components
        // (e.g. mapcn-map-arc). Additive; brand tokens above remain canonical.
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        border: 'var(--border)',
        ring: 'var(--ring)',
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
        // Marquee scrolls one full copy width; the track holds two copies so
        // the loop is seamless (-50% lands the second copy where the first was).
        'marquee-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'marquee-right': {
          from: { transform: 'translateX(-50%)' },
          to: { transform: 'translateX(0)' },
        },
        // Gentle vertical nudge for the hero scroll cue.
        'scroll-cue': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.7' },
          '50%': { transform: 'translateY(6px)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'marquee-left': 'marquee-left var(--marquee-duration, 40s) linear infinite',
        'marquee-right': 'marquee-right var(--marquee-duration, 40s) linear infinite',
        'scroll-cue': 'scroll-cue 1.8s ease-in-out infinite',
      },
      boxShadow: {
        // Soft, diffuse elevation used by cards/doors on hover — warmer and
        // less harsh than Tailwind's default xl for the navy palette.
        lift: '0 18px 40px -12px rgba(19, 50, 86, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
