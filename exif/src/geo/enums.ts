export const LocationGranularity = {
  country: 'country',
  state: 'state',
  city: 'city',
  sublocation: 'sublocation',
  exact: 'exact',
} as const;

export type LocationGranularityType = typeof LocationGranularity[keyof typeof LocationGranularity];

export const LocationGranularityEnum: LocationGranularityType[] = Object.values(LocationGranularity);

export function isLocationGranularity(value: unknown): value is LocationGranularityType {
  return LocationGranularityEnum.includes(value as LocationGranularityType);
}
