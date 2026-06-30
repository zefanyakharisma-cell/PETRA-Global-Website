/**
 * Canonical key used to match a partner record to its logo file.
 *
 * The international-partner seed strips a trailing country suffix from each
 * institution name (e.g. "Anhui University, China" -> "Anhui University"),
 * while the logo filenames keep it. To match the two we normalise BOTH sides
 * identically: strip the same country suffix, drop parentheticals/punctuation,
 * lowercase, and collapse whitespace. Keep this in sync with the suffix logic
 * in supabase/seed-international-partners.ts.
 */

// Country names / aliases that may appear as the trailing comma-segment of a
// name. Mirrors the seed's COUNTRY_ALIASES, plus a few seen only in filenames.
const COUNTRY_ALIASES = new Set([
  'australia', 'thailand', 'malaysia', 'poland', 'netherlands', 'china', 'japan',
  'india', 'korea', 'philippines', 'phillipines', 'philippine', 'cambodia',
  'hong kong', 'hongkong', 'taiwan', 'bangladesh', 'usa', 'singapore',
  'switzerland', 'germany', 'mongolia', 'new zealand', 'latvia', 'lithuania',
  'france', 'romania', 'united arab emirates', 'uae', 'timor-leste',
  'timor leste', 'uk', 'canada', 'macau', 'indonesia', 'seoul',
  // filename-only spellings
  'irlandia', 'ireland', 'hungary', 'portugal', 'south korea',
]);

function normSeg(seg: string): string {
  let s = seg.trim().toLowerCase();
  s = s.replace(/\([^)]*\)/g, '').trim();
  s = s.replace(/^(the|rep\.?\s+of|republic\s+of|p\.?\s*r\.?\s*o?f?\.?|p\.?\s*r\.?)\s+/, '').trim();
  s = s.replace(/[.\s]+$/, '').trim();
  return s;
}

function stripCountrySuffix(name: string): string {
  // Repeat so "..., Seoul, Korea" collapses the same as "..., Seoul" does.
  let prev: string;
  do {
    prev = name;
    const i = name.lastIndexOf(',');
    if (i < 0) break;
    const n = normSeg(name.slice(i + 1));
    if (n && COUNTRY_ALIASES.has(n)) name = name.slice(0, i).replace(/[\s,]+$/, '').trim();
  } while (name !== prev);
  return name;
}

/** Produce the comparison key for a partner name or a logo filename. */
export function normalizePartnerName(raw: string): string {
  let s = raw.replace(/\.(png|jpe?g|svg)$/i, '').trim(); // drop extension if any
  s = stripCountrySuffix(s);
  s = s.toLowerCase();
  s = s.replace(/\([^)]*\)/g, ' '); // drop parentheticals
  s = s.replace(/\blogo\b/g, ' '); // some files end in "... logo"
  s = s.replace(/[^a-z0-9]+/g, ' '); // punctuation/diacritics -> space
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
