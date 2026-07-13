# Plan: Kinetic Statement hero layout

New CMS hero layout `kinetic`, added alongside centered/left/split/scroll-expand.
Goals: modern/premium, better mobile, stronger conversion, more motion.

## Changes
1. **registry.meta.ts** — add layout option `{ value: 'kinetic', label: 'Kinetic', shape: 'hero-kinetic' }`;
   add `'kinetic'` to `showFor.equals` for `bgType`, `bgSource`, `image_url`, `ctas`;
   add content field `marqueeText` (localized text, kinetic-only) — looping keyword strip.
2. **LayoutField.tsx** — add `hero-kinetic` SVG shape.
3. **HeroBlock.tsx** — `HeroContent.marqueeText?: LocaleMap`; `const kinetic`; extract `bgLayer`;
   kinetic branch returns navy Section (min-h-[85vh]) + bgLayer + `<KineticHero>`.
4. **KineticHero.tsx** (new, client) — staggered framer-motion entrance (eyebrow → huge Bebas
   headline → subcopy → dominant magenta CTA) + full-bleed looping keyword marquee
   (reuses `animate-marquee-left`, aria-hidden). `useReducedMotion` → static.

## Notes
- No migration/seed: kinetic unused by existing blocks; `marqueeText` optional (empty → strip hidden).
- `bgLayer` extraction is behavior-identical for existing layouts.
