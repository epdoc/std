// --- SemVer components ---
export type SemVerCore = `${number}.${number}.${number}`;
export type PrereleaseTag = 'alpha' | 'beta' | 'rc';
export type SemVerPre = `-${PrereleaseTag}${'' | `.${number}`}`;
export type SemVerBuild = `+${string}`;
// Exact semantic version
export type SemVer = `${SemVerCore}${'' | SemVerPre}${'' | SemVerBuild}`;
// Version range prefixes supported by Deno
export type SemVerRangePrefix = '^' | '~' | '>=' | '>' | '<=' | '<' | '=';
// A version constraint (range or exact)
export type SemVerRange =
  | `${SemVerRangePrefix}${SemVer}`
  | SemVer;
