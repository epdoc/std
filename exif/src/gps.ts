export type DecimalLocation = {
  lat?: number;
  lng?: number;
  alt?: number;
};

export interface ExifOptions {
  /** Number of decimal places for seconds in DMS output. Default is 2. */
  secondPrecision?: number;
}

export type DMSLat = { dms: string; ref: 'N' | 'S' };
export type DMSLng = { dms: string; ref: 'E' | 'W' };
export type DMS = DMSLat | DMSLng;

const DMS_RE = /^\s*(\d+(?:\.\d+)?)(?:[^\d.]+(\d+(?:\.\d+)?))?(?:[^\d.]+(\d+(?:\.\d+)?))?\s*([NSEW])?\s*$/i;

export function dms2decimal(raw: string | number | undefined, ref: string | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;

  // 1. Handle numeric types directly
  if (typeof raw === 'number') {
    if (isNaN(raw)) return undefined;
    const isNegative = ref?.toUpperCase() === 'S' || ref?.toUpperCase() === 'W';
    // Use Math.abs to avoid double-negative issues if raw is already negative
    return (isNegative ? -1 : 1) * Math.abs(raw);
  }

  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // 2. Handle numeric strings directly (e.g., "9.9281" or "-9.9281")
  const numVal = Number(trimmed);
  if (!isNaN(numVal)) {
    const isNegative = ref?.toUpperCase() === 'S' || ref?.toUpperCase() === 'W';
    return (isNegative ? -1 : 1) * Math.abs(numVal);
  }

  // 3. Parse DMS strings
  const m = DMS_RE.exec(trimmed);
  if (!m) return undefined;

  const deg = parseFloat(m[1] || '0');
  const min = parseFloat(m[2] || '0');
  const sec = parseFloat(m[3] || '0');
  const embeddedDir = m[4]?.toUpperCase();

  let dec = deg + min / 60 + sec / 3600;

  // Determine direction from ref OR embedded direction in raw string (never both)
  const dir = ref?.toUpperCase() || embeddedDir;
  if (dir === 'S' || dir === 'W') {
    dec = -Math.abs(dec);
  } else {
    dec = Math.abs(dec);
  }

  return dec;
}

/** Helper to format DMS strings for ExifTool writing */
export function decimalToDms(
  decimal: number,
  type: 'lat' | 'lng',
  precision: number,
): DMS {
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
  const result: DMS = {
    dms: `${degrees} deg ${minutes}' ${formattedSeconds}"`,
    ref: isLat ? (decimal < 0 ? 'S' : 'N') : (decimal < 0 ? 'W' : 'E'),
  };

  return result;
}
