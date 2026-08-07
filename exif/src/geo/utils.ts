import type { LocationGranularityType } from './enums.ts';
import type { AddressComponents } from './types.ts';

function pickFirst(obj: Record<string, string | undefined>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (val) return val;
  }
  return undefined;
}

export function extractAddress(raw: Record<string, string | undefined>): AddressComponents {
  return {
    houseNumber: raw.house_number,
    road: raw.road ?? raw.pedestrian ?? raw.street,
    neighbourhood: raw.neighbourhood,
    suburb: raw.suburb,
    city: pickFirst(raw, 'city', 'town', 'village', 'municipality'),
    town: raw.town,
    village: raw.village,
    state: raw.state,
    country: raw.country ?? '',
    countryCode: (raw.country_code ?? '').toUpperCase(),
  };
}

/**
 * Convert address components into EXIF location tags at the given granularity
 * level. Returns a tag→value map suitable for {@link import('../file.ts').File.applyTags}.
 *
 * @param addr - Structured address from a reverse-geocode lookup.
 * @param granularity - How much detail to include.
 *   `'country'` → Country + CountryCode only.
 *   `'state'`   → adds State.
 *   `'city'`    → adds City.
 *   `'sublocation'` / `'exact'` → adds neighbourhood/road/house-number.
 * @returns EXIF tag names mapped to their values.
 */
export function buildLocationTags(
  addr: AddressComponents,
  granularity: LocationGranularityType,
): Record<string, string> {
  const tags: Record<string, string> = {};

  tags['Country'] = addr.country;
  tags['CountryCode'] = addr.countryCode;

  if (granularity === 'country') return tags;

  if (addr.state) tags['State'] = addr.state;

  if (granularity === 'state') return tags;

  const city = addr.city ?? addr.town ?? addr.village;
  if (city) tags['City'] = city;

  if (granularity === 'city') return tags;

  const parts: string[] = [];
  if (granularity === 'exact' && addr.houseNumber) {
    parts.push(addr.houseNumber);
  }
  if (addr.road) parts.push(addr.road);
  const area = addr.neighbourhood ?? addr.suburb;
  if (area) parts.push(area);

  if (parts.length > 0) {
    tags['Sub-location'] = parts.join(', ');
  }

  return tags;
}
