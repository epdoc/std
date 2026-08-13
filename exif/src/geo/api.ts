import type { AddressDef } from './mod.ts';
import type { NominatimResponse } from './types.ts';
import { apiResponse2addressDef } from './utils.ts';

export class NominatimApi {
  #baseUrl: string;
  #userAgent: string;
  #dryRun: boolean;

  constructor(opts?: { baseUrl?: string; userAgent?: string; dryRun?: boolean }) {
    this.#baseUrl = opts?.baseUrl ?? 'https://nominatim.openstreetmap.org';
    this.#userAgent = opts?.userAgent ?? 'fstools/0.1.0';
    this.#dryRun = opts?.dryRun ?? false;
  }

  async reverse(lat: number, lng: number): Promise<AddressDef> {
    if (this.#dryRun) {
      return {
        country: '[DRYRUN]',
        countryCode: 'XX',
      };
    }

    const url = `${this.#baseUrl}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const headers = new Headers({ 'User-Agent': this.#userAgent });
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as NominatimResponse;

    if (!data || data.error) {
      throw new Error(data?.error ?? 'Nominatim returned no data');
    }

    const result = apiResponse2addressDef(data.address ?? {});
    if (data.display_name) result.displayName = data.display_name;
    return result;
  }
}
