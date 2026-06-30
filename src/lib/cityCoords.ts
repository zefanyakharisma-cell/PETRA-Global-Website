/**
 * Approximate geographic coordinates for the Indonesian cities/regions that
 * appear as `city` on petra_io.domestic_partners. Used to plot domestic
 * partners on the partner map (the table stores City, not lat/lng).
 *
 * Province-level values (e.g. "NTT", "Maluku", "Papua") resolve to the
 * provincial capital / a representative point. Keys are matched case- and
 * whitespace-insensitively; a couple of compound source values ("Sumba Barat,
 * NTT", "Gombong, Kebumen") are included verbatim.
 */
export type LatLng = { lat: number; lng: number };

const COORDS: Record<string, LatLng> = {
  surabaya: { lat: -7.2575, lng: 112.7521 },
  jakarta: { lat: -6.2088, lng: 106.8456 },
  sidoarjo: { lat: -7.4478, lng: 112.7183 },
  bandung: { lat: -6.9175, lng: 107.6191 },
  semarang: { lat: -6.9667, lng: 110.4167 },
  malang: { lat: -7.9839, lng: 112.6214 },
  yogyakarta: { lat: -7.7956, lng: 110.3695 },
  tangerang: { lat: -6.1781, lng: 106.63 },
  surakarta: { lat: -7.5755, lng: 110.8243 },
  ntt: { lat: -10.1772, lng: 123.607 },
  medan: { lat: 3.5952, lng: 98.6722 },
  bali: { lat: -8.6705, lng: 115.2126 },
  salatiga: { lat: -7.3305, lng: 110.5084 },
  makassar: { lat: -5.1477, lng: 119.4327 },
  'jawa timur': { lat: -7.2575, lng: 112.7521 },
  kediri: { lat: -7.848, lng: 112.0178 },
  bogor: { lat: -6.595, lng: 106.8166 },
  jombang: { lat: -7.546, lng: 112.233 },
  maluku: { lat: -3.6954, lng: 128.1814 },
  cilacap: { lat: -7.7268, lng: 109.0098 },
  purwokerto: { lat: -7.4218, lng: 109.2346 },
  gresik: { lat: -7.1561, lng: 112.6516 },
  jember: { lat: -8.1727, lng: 113.7 },
  denpasar: { lat: -8.6705, lng: 115.2126 },
  padang: { lat: -0.9471, lng: 100.4172 },
  kudus: { lat: -6.8048, lng: 110.8405 },
  tegal: { lat: -6.8694, lng: 109.1402 },
  banyumas: { lat: -7.5128, lng: 109.2945 },
  pekalongan: { lat: -6.8898, lng: 109.6753 },
  magelang: { lat: -7.4706, lng: 110.2178 },
  mojokerto: { lat: -7.4722, lng: 112.4338 },
  batam: { lat: 1.1301, lng: 104.0529 },
  pasuruan: { lat: -7.6453, lng: 112.9075 },
  karanganyar: { lat: -7.5966, lng: 110.9509 },
  samarinda: { lat: -0.5022, lng: 117.1536 },
  sumatera: { lat: -0.7893, lng: 100.65 },
  kupang: { lat: -10.1772, lng: 123.607 },
  ambon: { lat: -3.6954, lng: 128.1814 },
  sumedang: { lat: -6.84, lng: 107.921 },
  melawi: { lat: -0.3382, lng: 111.7 },
  toba: { lat: 2.3334, lng: 99.0681 },
  'sumba barat, ntt': { lat: -9.645, lng: 119.409 },
  papua: { lat: -2.5337, lng: 140.7181 },
  temanggung: { lat: -7.3167, lng: 110.175 },
  jepara: { lat: -6.5833, lng: 110.6667 },
  brebes: { lat: -6.8722, lng: 109.0414 },
  'gombong, kebumen': { lat: -7.6086, lng: 109.514 },
  wonosobo: { lat: -7.3597, lng: 109.9 },
  klaten: { lat: -7.7059, lng: 110.6065 },
  minahasa: { lat: 1.25, lng: 124.84 },
  ntb: { lat: -8.5833, lng: 116.1167 },
  'pematang siantar': { lat: 2.9595, lng: 99.0687 },
  situbondo: { lat: -7.7064, lng: 114.0094 },
  bireuen: { lat: 5.2031, lng: 96.7009 },
  badung: { lat: -8.58, lng: 115.177 },
  lombok: { lat: -8.5833, lng: 116.1167 },
  lamongan: { lat: -7.1167, lng: 112.4167 },
  cimahi: { lat: -6.8722, lng: 107.5424 },
  makale: { lat: -3.1006, lng: 119.851 },
  'palangka raya': { lat: -2.21, lng: 113.92 },
  sorong: { lat: -0.8762, lng: 131.2558 },
  poso: { lat: -1.3959, lng: 120.7524 },
  banjarmasin: { lat: -3.3194, lng: 114.5908 },
  palopo: { lat: -2.9925, lng: 120.1969 },
  banten: { lat: -6.12, lng: 106.1503 },
  jayapura: { lat: -2.5337, lng: 140.7181 },
  bukittinggi: { lat: -0.3055, lng: 100.3692 },
  palembang: { lat: -2.9761, lng: 104.7754 },
  aceh: { lat: 5.5483, lng: 95.3238 },
  pontianak: { lat: -0.0263, lng: 109.3425 },
  manado: { lat: 1.4748, lng: 124.8421 },
};

/** Resolve a city/region string to coordinates, or null if unknown. */
export function cityToCoords(city: string | null | undefined): LatLng | null {
  if (!city) return null;
  return COORDS[city.trim().toLowerCase()] ?? null;
}
