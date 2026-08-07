import type { GeocodeResult, NominatimResponse } from './types.ts';
import { extractAddress } from './utils.ts';

/**
 * Client for the OpenStreetMap Nominatim reverse-geocode API.
 *
 * Converts GPS coordinates into structured address components that can
 * then be written as EXIF location tags via {@link buildLocationTags}.
 */
export class NominatimApi {
  #baseUrl: string;
  #userAgent: string;
  #dryRun: boolean;

  constructor(opts?: { baseUrl?: string; userAgent?: string; dryRun?: boolean }) {
    this.#baseUrl = opts?.baseUrl ?? 'https://nominatim.openstreetmap.org';
    this.#userAgent = opts?.userAgent ?? 'fstools/0.1.0';
    this.#dryRun = opts?.dryRun ?? false;
  }

  /**
   * Reverse-geocode a GPS coordinate pair.
   *
   * In dry-run mode returns a synthetic result without making a network call.
   *
   * @throws Error if the Nominatim API returns an error or the request fails.
   */
  async reverse(lat: number, lon: number): Promise<GeocodeResult> {
    if (this.#dryRun) {
      return {
        displayName: `[DRYRUN] ${lat},${lon}`,
        lat: String(lat),
        lon: String(lon),
        address: {
          country: '[DRYRUN]',
          countryCode: 'XX',
        },
      };
    }

    const url = `${this.#baseUrl}/reverse?lat=${lat}&lon=${lon}&format=json`;
    const headers = new Headers({ 'User-Agent': this.#userAgent });
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as NominatimResponse;

    if (!data || data.error) {
      throw new Error(data?.error ?? 'Nominatim returned no data');
    }

    return {
      displayName: data.display_name ?? '',
      lat: data.lat ?? '',
      lon: data.lon ?? '',
      address: extractAddress(data.address ?? {}),
    };
  }
}
