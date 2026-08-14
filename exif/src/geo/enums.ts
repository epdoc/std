/**
 * Location detail levels for {@link Geo.AddressLookup.getTags}.
 *
 * Each level includes the tags of every coarser level:
 * `country` → `state` → `county` → `city` → `location` → `exact`.
 */
export const Level = {
  country: 'country',
  state: 'state',
  county: 'county',
  city: 'city',
  location: 'location',
  exact: 'exact',
} as const;

/** A valid location detail level. */
export type LevelType = typeof Level[keyof typeof Level];

/** All location detail levels, in order from coarsest to finest. */
export const LevelEnum: LevelType[] = Object.values(Level);

/** Type guard for {@link LevelType}. */
export function isLevel(value: unknown): value is LevelType {
  return LevelEnum.includes(value as LevelType);
}

/**
 * Numeric rank for each level used to filter which tags are written.
 *
 * Higher values are coarser; `getTags` stops writing once the level's rank
 * threshold is exceeded.
 */
export const LevelOrder = {
  country: 9,
  state: 8,
  municipality: 6,
  county: 5,
  city: 2,
  location: 1,
  exact: 0,
};
