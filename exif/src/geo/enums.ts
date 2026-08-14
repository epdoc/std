export const Level = {
  country: 'country',
  state: 'state',
  county: 'county',
  city: 'city',
  location: 'location',
  exact: 'exact',
} as const;

export type LevelType = typeof Level[keyof typeof Level];

export const LevelEnum: LevelType[] = Object.values(Level);

export function isLevel(value: unknown): value is LevelType {
  return LevelEnum.includes(value as LevelType);
}

export const LevelOrder = {
  country: 9,
  state: 8,
  municipality: 6,
  county: 5,
  city: 2,
  location: 1,
  exact: 0,
};
