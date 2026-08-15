/** The raw Nominatim `/reverse` JSON response shape. */
export type NominatimResponse = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string | undefined>;
  error?: string;
};

/**
 * Fields returned by Nominatin API
 */
interface NominatimAddress {
  country?: string;
  country_code?: string;
  state?: string;
  state_district?: string;
  province?: string;
  region?: string;
  county?: string;
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  road?: string;
  house_number?: string;
  house_name?: string;
  pedestrian?: string;
  footway?: string;
  cycleway?: string;
  path?: string;
  square?: string;
  highway?: string;
  [key: string]: string | undefined;
}

/**
 * Normalized address extracted from reverse-geocoding (e.g., Nominatim/OSM).
 *
 * The fields mirror the location fields Adobe Bridge displays: city, state,
 * country, country code, and sublocation. Richer Nominatim data is folded in:
 * - `city` combines the settlement (village/town/hamlet + city/municipality)
 *   with the county, e.g. `"Ojochal, Puerto Cortes, Osa"`.
 * - `sublocation` combines the neighbourhood/suburb with the street address
 *   (at exact granularity), e.g. `"57 Calle del Jaguar, Barrio Lajas"`.
 */
export type AddressDef = {
  /** The raw Nominatim `display_name`; display only, never written to EXIF. */
  displayName?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  /** Settlement (village/town/city) and county, comma-joined. */
  city?: string;
  /** Neighbourhood/suburb, plus street address at exact granularity. */
  sublocation?: string;
};

/** An {@link AddressDef} that is guaranteed to carry a `displayName`. */
export type AddressDisplayDef = { displayName: string } & AddressDef;

/**
 * Combined map of ExifTool-compatible location tags covering EXIF, IPTC IIM, and XMP.
 */
export type ExifToolLocationTags = {
  // GPS Coordinates
  GPSLatitude?: number;
  GPSLatitudeRef?: 'N' | 'S';
  GPSLongitude?: number;
  GPSLongitudeRef?: 'E' | 'W';
  GPSAltitude?: number;
  GPSAltitudeRef?: number; // 0 = Above Sea Level, 1 = Below

  // MWG / IPTC / Photoshop Standard Tags
  Country?: string;
  CountryCode?: string;
  'Country-PrimaryLocationName'?: string;
  'Country-PrimaryLocationCode'?: string;
  State?: string;
  'Province-State'?: string;
  City?: string;
  Location?: string;
  'Sub-location'?: string;

  // XMP IPTC Core / Extension explicitly qualified tags (optional targets)
  'XMP-photoshop:Country'?: string;
  'XMP-iptcCore:CountryCode'?: string;
  'XMP-photoshop:State'?: string;
  'XMP-photoshop:City'?: string;
  'XMP-iptcCore:Location'?: string;
};
