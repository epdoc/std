import { assert } from '@std/assert/assert';
import type { MetaTagDict } from '../types.ts';
import { LevelOrder, type LevelType } from './enums.ts';
import type { AddressDef, NominatimResponse } from './types.ts';

const ERR_NOT_CALLED = 'Must call address lookup before accessing response data';

export class AddressLookup {
  #baseUrl: string;
  #response?: NominatimResponse;
  #address?: AddressDef;
  #tags?: MetaTagDict;
  #displayName?: string;
  #userAgent: string;

  /**
   * Create an object with which to do address lookups using gps coordinates.
   *
   * @param userAgent Required (eg. 'fstool/v1.3.3')
   * @param opts.baseUrl The URL of the service. Defaults to https://nominatim.openstreetmap.org.
   */
  constructor(userAgent: string, opts?: { baseUrl?: string }) {
    this.#userAgent = userAgent;
    this.#baseUrl = opts?.baseUrl ?? 'https://nominatim.openstreetmap.org';
  }

  /**
   * Lookup address information, given latitude and longitude.
   *
   * @param lat The latitude as a number
   * @param lng The longitude as a number
   */
  async lookup(lat: number, lng: number): Promise<void> {
    const url = `${this.#baseUrl}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const headers = new Headers({ 'User-Agent': this.#userAgent });
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as NominatimResponse;

    this.parseNominatimResponse(data);
  }

  /**
   * Parses the raw API response, creating the {@link address} and {@link tags}
   * properties. This is automatically called by {@link lookup}, but is
   * separated out for unit testing purposes.
   */
  parseNominatimResponse(data: NominatimResponse) {
    if (!data || data.error) {
      throw new Error(data?.error ?? 'Nominatim returned no data');
    }

    this.#response = data;

    if (data.display_name) this.#displayName = data.display_name;
    this.getTags();
  }

  /**
   * The raw API response;
   */
  get response(): NominatimResponse {
    assert(this.#response, ERR_NOT_CALLED);
    return this.#response;
  }

  /**
   * All possible EXIF tags, parsed from the raw API response.
   */
  get tags(): MetaTagDict {
    assert(this.#tags, ERR_NOT_CALLED);
    return this.#tags;
  }

  /**
   * All fields that we have parsed from the raw API response.
   */
  get address(): AddressDef {
    assert(this.#address, ERR_NOT_CALLED);
    return this.#address;
  }

  /**
   * The raw, combined display name returned by the API
   */
  get displayName(): string {
    assert(this.#displayName, ERR_NOT_CALLED);
    return this.#displayName;
  }

  /**
   * When level is defined, parses the raw API response, filters based on the level, and returns the
   * EXIF tags that we will write to file EXIF.
   *
   * When level is not defined, parses all fields of the raw API response and sets both the address
   * and tags properties of this class instance.
   *
   * @param level
   * @returns
   */
  getTags(level?: LevelType): MetaTagDict {
    const filter = level ? LevelOrder[level] : 0;
    const addr = this.response.address || {};
    const tags: MetaTagDict = {};
    const address: AddressDef = {};

    // Helper to pick first non-empty value in priority order
    const getFirstMatch = (keys: string[]): string | undefined => {
      for (const key of keys) {
        const val = addr[key];
        if (val && val.trim().length > 0) {
          return val.trim();
        }
      }
      return undefined;
    };

    // 1. Country & Country Code
    if (addr.country && addr.country.trim().length > 0) {
      tags['MWG:Country'] = addr.country.trim();
      address.country = addr.country.trim();
    }
    if (addr.country_code && addr.country_code.trim().length > 0) {
      tags['MWG:CountryCode'] = addr.country_code.trim().toUpperCase();
      address.countryCode = addr.country_code.trim().toUpperCase();
    }

    if (filter > LevelOrder.state) return tags;

    // 2. State / Region / Province
    const state = getFirstMatch(['state', 'province', 'state_district', 'region']);
    if (state) {
      tags['MWG:State'] = state;
      address.state = state;
    }

    if (filter > LevelOrder.county) return tags;

    // 2. County
    const county = getFirstMatch(['county', 'region']);
    if (county) {
      tags['MWG:County'] = county;
      address.county = county;
    }

    if (filter > LevelOrder.city) return tags;

    // 3. City / Town / Village
    const city = getFirstMatch(['hamlet', 'village', 'town', 'city', 'municipality']);
    if (city) {
      tags['MWG:City'] = city;
      address.city = city;
    }

    if (filter > LevelOrder.location) return tags;

    // 4. Location / Sublocation / District
    const location = getFirstMatch([
      'suburb',
      'neighbourhood',
      'quarter',
      'city_district',
      'district',
      'residential',
      'historic',
      'amenity',
    ]);
    if (location) {
      tags['MWG:Location'] = location;
      address.location = location;
    }

    // 5. Postal Code
    if (addr.postcode && addr.postcode.trim().length > 0) {
      tags['XMP-iptcCore:PostalCode'] = addr.postcode.trim();
      address.postalCode = addr.postcode.trim();
    }

    if (filter > LevelOrder.exact) return tags;

    // 6. Street Address
    const houseNumber = getFirstMatch(['house_number', 'house_name', 'building']);
    const road = getFirstMatch([
      'road',
      'street',
      'pedestrian',
      'footway',
      'cycleway',
      'path',
      'square',
      'highway',
    ]);

    if (road) {
      const streetAddress = houseNumber ? `${houseNumber} ${road}` : road;
      tags['XMP-iptcCore:StreetAddress'] = streetAddress;
      address.streetAddress = streetAddress;
    }

    if (!level) {
      this.#tags = tags;
      this.#address = address;
    }
    return tags;
  }
}
