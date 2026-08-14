export const LocationGranularity = {
  country: 'country',
  state: 'state',
  county: 'county',
  city: 'city',
  location: 'location',
  exact: 'exact',
} as const;

export type LocationGranularityType = typeof LocationGranularity[keyof typeof LocationGranularity];

export const LocationGranularityEnum: LocationGranularityType[] = Object.values(LocationGranularity);

export function isLocationGranularity(value: unknown): value is LocationGranularityType {
  return LocationGranularityEnum.includes(value as LocationGranularityType);
}

export const LevelFilter = {
  country: 9,
  state: 8,
  municipality: 6,
  county: 5,
  city: 2,
  location: 1,
  exact: 0,
};
