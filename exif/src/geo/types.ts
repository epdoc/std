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

/** Normalized address extracted from reverse-geocoding (e.g., Nominatim/OSM) */

export type AddressDef = {
  displayName?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  county?: string;
  city?: string;
  location?: string;
  postalCode?: string;
  streetAddress?: string;
};

export type AddressDisplayDef = { displayName: string } & AddressDef;

// export type GeocodeResult = {
//   displayName: string;
//   lat: string;
//   lon: string;
//   address: AddressComponents;
// };

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
