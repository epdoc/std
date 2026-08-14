import { _ } from '@epdoc/type';

/**
 * Decimal GPS coordinates.
 *
 * `lat`/`lng` are required and signed (negative = south/west). The remaining
 * fields are optional location-name components; only the numeric coordinates
 * are written by {@link File.setGPS}.
 */
export type Location = {
  lat: number;
  lng: number;
  alt?: number;
  houseNumber?: number;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  countryCode?: string;
};

export interface Options {
  /** Number of decimal places for seconds in DMS output. Default is 2. */
  secondPrecision?: number;
}

/** The exiftool DMS string and hemisphere ref for a latitude. */
export type DmsLat = { dms: string; ref: 'N' | 'S' };
/** The exiftool DMS string and hemisphere ref for a longitude. */
export type DmsLng = { dms: string; ref: 'E' | 'W' };
/** Union of the latitude and longitude DMS records. */
export type Dms = DmsLat | DmsLng;

const DMS_RE =
  /^\s*(\d+(?:\.\d+)?)\s*(?:°|deg(?:rees)?)?\s*,?\s*(\d+(?:\.\d+)?)?\s*(?:'|′|min)?\s*,?\s*(\d+(?:\.\d+)?)?\s*(?:"|″)?\s*([NSEW])?\s*$/i;

const REF_RE = /^(N|S|E|W)(?:ORTH|OUTH|AST|EST)?$/;

/** Normalize a hemisphere ref (e.g. "South", "WEST", "n") to a single letter. */
function normalizeRef(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  return ref.trim().toUpperCase().match(REF_RE)?.[1];
}

/**
 * Parse a GPS coordinate value into signed decimal degrees.
 *
 * Accepts a number, a numeric string (e.g. `"-33.8688"`), or an exiftool DMS
 * string (e.g. `"51 deg 30' 26.00\" N"`). The hemisphere is taken from the
 * `ref` argument (or embedded direction) and applied as the sign: `S`/`W`
 * yield negative values.
 *
 * @param raw The coordinate value from exiftool (`GPSLatitude`, etc.).
 * @param ref The hemisphere reference (`GPSLatitudeRef`, etc.); `N`/`S`/`E`/`W`
 *   or a spelled-out variant such as `"South"`.
 * @returns Signed decimal degrees, or `undefined` when the value is missing or
 *   unparseable.
 */
export function parse(raw: string | number | undefined, ref: string | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number' && isNaN(raw)) return undefined;

  const dir = normalizeRef(ref);
  const isNegative = dir === 'S' || dir === 'W';

  // 1. Handle numeric types directly
  if (_.isNumber(raw)) {
    if (isNaN(raw)) return undefined;
    // Use Math.abs to avoid double-negative issues if raw is already negative
    return (isNegative ? -1 : 1) * Math.abs(raw);
  }

  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // 2. Handle numeric strings directly (e.g., "9.9281" or "-9.9281")
  const numVal = Number(trimmed);
  if (!isNaN(numVal)) {
    return (isNegative ? -1 : 1) * Math.abs(numVal);
  }

  // 3. Parse DMS strings
  const m = DMS_RE.exec(trimmed);
  if (!m) return undefined;

  const deg = parseFloat(m[1] || '0');
  const min = parseFloat(m[2] || '0');
  const sec = parseFloat(m[3] || '0');
  const embeddedDir = normalizeRef(m[4]);

  let dec = deg + min / 60 + sec / 3600;

  // Determine direction from ref OR embedded direction in raw string (never both)
  const sign = dir ?? embeddedDir;
  dec = sign === 'S' || sign === 'W' ? -Math.abs(dec) : Math.abs(dec);

  return dec;
}

/**
 * Convert a signed decimal coordinate into the DMS record exiftool expects.
 *
 * The hemisphere ref (`N`/`S` for latitude, `E`/`W` for longitude) is derived
 * from the sign of the input. Seconds are rounded to the given precision with
 * roll-over handling (e.g. `59.999"` → `60"` → `0"`, minutes incremented).
 *
 * @param decimal Signed decimal degrees.
 * @param type Whether the coordinate is a latitude or longitude.
 * @param precision Decimal places for the seconds field.
 * @returns The `{ dms, ref }` record to write to `GPS*`/`GPS*Ref`.
 */
export function toDms(
  decimal: number,
  type: 'lat' | 'lng',
  precision: number,
): Dms {
  const isLat = type === 'lat';
  const absVal = Math.abs(decimal);

  const degrees = Math.floor(absVal);
  const minuteFrac = (absVal - degrees) * 60;
  let minutes = Math.floor(minuteFrac);
  let seconds = (minuteFrac - minutes) * 60;

  // Handle rounding roll-over (e.g., 59.999" -> 60")
  const scale = Math.pow(10, precision);
  seconds = Math.round(seconds * scale) / scale;

  if (seconds >= 60) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes = 0;
  }

  const formattedSeconds = seconds.toFixed(precision);
  const result: Dms = {
    dms: `${degrees} deg ${minutes}' ${formattedSeconds}"`,
    ref: isLat ? (decimal < 0 ? 'S' : 'N') : (decimal < 0 ? 'W' : 'E'),
  };

  return result;
}
