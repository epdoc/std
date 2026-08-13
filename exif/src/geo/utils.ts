import type { MetaTagDict } from '../types.ts';
import type { LocationGranularityType } from './enums.ts';
import type { AddressDef } from './types.ts';

/** Helper to pick the first non-empty string key from a raw object */
function pickFirst(raw: Record<string, string | undefined>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (raw[key]?.trim()) return raw[key]?.trim();
  }
  return undefined;
}

/**
 * Normalizes raw reverse-geocode address attributes into structured AddressComponents. Used to
 * process API return values.
 */
export function apiResponse2addressDef(raw: Record<string, string | undefined>): AddressDef {
  return {
    houseNumber: raw.house_number ?? raw.house_name ?? raw.building,
    road: pickFirst(raw, 'road', 'pedestrian', 'street', 'footway', 'path', 'square'),
    neighbourhood: pickFirst(raw, 'neighbourhood', 'quarter', 'residential'),
    suburb: pickFirst(raw, 'suburb', 'city_district', 'district'),
    city: pickFirst(raw, 'city', 'town', 'village', 'municipality', 'hamlet'),
    town: raw.town,
    village: raw.village,
    hamlet: raw.hamlet,
    county: raw.county,
    state: pickFirst(raw, 'state', 'province', 'state_district', 'region'),
    postcode: raw.postcode,
    country: raw.country ?? '',
    countryCode: (raw.country_code ?? '').toUpperCase(),
  };
}

/**
 * Maps structured address components to standard ExifTool metadata tags.
 *
 * Populates legacy IPTC IIM and standard XMP/MWG fields simultaneously to
 * maximize compatibility across photo management clients.
 */
export function addressDef2exifTags(
  addr: AddressDef,
  granularity: LocationGranularityType,
): MetaTagDict {
  const tags: MetaTagDict = {};

  if (!addr.country) return tags;

  // Country Level
  tags['Country'] = addr.country;
  tags['Country-PrimaryLocationName'] = addr.country;
  tags['CountryCode'] = addr.countryCode;
  tags['Country-PrimaryLocationCode'] = addr.countryCode;

  if (granularity === 'country') return tags;

  // State / Region Level
  const state = addr.state ?? addr.county;
  if (state) {
    tags['State'] = state;
    tags['Province-State'] = state;
  }

  if (granularity === 'state') return tags;

  // City Level
  const city = addr.city ?? addr.town ?? addr.village ?? addr.hamlet;
  if (city) {
    tags['City'] = city;
  }

  if (granularity === 'city') return tags;

  // Sub-location / Exact Street Details
  const parts: string[] = [];

  if (granularity === 'exact' && addr.houseNumber) {
    parts.push(addr.houseNumber);
  }
  if (addr.road) {
    parts.push(addr.road);
  }

  const neighborhoodArea = addr.neighbourhood ?? addr.suburb;
  if (neighborhoodArea) {
    parts.push(neighborhoodArea);
  }

  if (parts.length > 0) {
    const subLocationStr = parts.join(', ');
    tags['Sub-location'] = subLocationStr; // IPTC IIM
    tags['Location'] = subLocationStr; // XMP-iptcCore / MWG
  }

  return tags;
}
