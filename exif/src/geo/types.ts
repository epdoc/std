export type NominatimResponse = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string | undefined>;
  error?: string;
};

export type AddressComponents = {
  houseNumber?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country: string;
  countryCode: string;
};

export type GeocodeResult = {
  displayName: string;
  lat: string;
  lon: string;
  address: AddressComponents;
};
