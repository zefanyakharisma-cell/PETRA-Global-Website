# Cross-cutting design/style options for CMS blocks

Add four universal design controls. Two hit every block via `<Section>`; two are
card-surface controls wired into the 5 card-rendering blocks.

## Controls
1. **Surface backgrounds** — extend `background`: `navy-gradient`, `paper-warm`, `mesh`, `dots`.
2. **Section edges** — new `edge`: `none` | `angle` | `curve` | `fade`.
3. **Card style** — new `cardStyle`: `elevated`(default) | `flat` | `outlined` | `glass`.
4. **Corner radius** — new `radius`: `sharp` | `soft`(default) | `round` → `--card-r` CSS var.

## Files
- `src/lib/types.ts` — extend `BlockBackground`; add `edge`/`cardStyle`/`radius` to `BlockBaseConfig`.
- `src/components/ui/Section.tsx` — BG map + EDGE map + `--card-r` var; export `isDarkBg()` and `cardSurface()`.
- `src/app/globals.css` — `.bg-mesh`, `.bg-dots`.
- `src/components/blocks/registry.meta.ts` — expand UNIVERSAL background opts + add `edge`; add `SURFACE` fragment (cardStyle+radius) to card_grid, feature_list, downloads, events, news_feed.
- **navy-gradient sweep** — 26 blocks currently detect dark via `background === 'navy'`.
  Centralize into `isDarkBg()` so the dark gradient counts as dark. Scripted replace + import inject.
- Wire `cardSurface()` + `rounded-[var(--card-r,1rem)]` into the 5 card blocks.

## Safety
- All new options opt-in; defaults reproduce current look (`soft` radius = 1rem = rounded-2xl; `elevated` = historic card).
- Verify with `next build` / typecheck at the end.