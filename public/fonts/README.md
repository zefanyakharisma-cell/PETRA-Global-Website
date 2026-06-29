# Self-hosted brand fonts

Drop the **provided** licensed font files here. The `@font-face` rules in
`src/app/globals.css` reference these exact filenames. Until they are present the
site falls back to system fonts (still legible, but off-brand) — add them before
shipping.

| Role | Family | Files |
| --- | --- | --- |
| Display (headers, stat numbers, door titles) | Bebas Neue | `Bebas-Regular.otf`, `BebasNeue_Bold.otf` (`BebasKai.otf` softer alt) |
| Label / condensed | DIN Condensed Bold | `DINCondensed-Bold.ttf` |
| Body / UI | Inter | `Inter-Light.ttf` (300), `Inter-Regular.ttf` (400), `Inter-Bold.ttf` (600) |
| Editorial quotes only | Baskerville | `baskerville_bold.ttf` |

Converting to `.woff2` (recommended for the web) is optional; the `@font-face`
rules list both the original format and an optional `.woff2` so either works.
Never fall back to Arial/system fonts for display or headers in production.
