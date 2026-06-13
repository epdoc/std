// --- Type definitions for SemVer string patterns ---
// This is compatible/complements with jsr:@std/semver

/**
 * A valid semantic version core in the format `major.minor.patch`.
 * @example "1.2.3", "0.0.1"
 */
export type SemVerCore = `${number}.${number}.${number}`;

/**
 * Valid prerelease tags.
 */
export type PrereleaseTag = 'alpha' | 'beta' | 'rc';

/**
 * A prerelease suffix in the format `-tag` or `-tag.number`.
 * @example "-alpha", "-beta.2", "-rc.1"
 */
export type SemVerPre = `-${PrereleaseTag}${'' | `.${number}`}`;

/**
 * A build metadata suffix in the format `+metadata`.
 * @example "+build.123", "+sha.abc123"
 */
export type SemVerBuild = `+${string}`;

/**
 * A complete semantic version string following the SemVer 2.0.0 specification.
 * This type represents valid SemVer strings with proper template literal patterns.
 *
 * @example "1.2.3", "1.2.3-alpha", "1.2.3-alpha.1+build.123"
 *
 * Note: This is a branded type alias. Use `isValidSemVerString()` to check if a
 * string conforms to this type at runtime.
 */
export type SemVerString = `${SemVerCore}${'' | SemVerPre}${'' | SemVerBuild}`;

/**
 * Version range prefix operators supported by Deno and npm.
 */
export type SemVerRangePrefix = '^' | '~' | '>=' | '>' | '<=' | '<' | '=';

/**
 * A version constraint that can be either a range or an exact version.
 * @example "^1.2.3", ">=1.0.0", "~2.0.0", "1.2.3"
 */
export type SemVerRange =
  | `${SemVerRangePrefix}${SemVerString}`
  | SemVerString;
