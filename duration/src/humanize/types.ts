/**
 * Options for the humanize function
 */
export interface Options {
  /** Locale for internationalization (defaults to 'en') */
  locale?: string;
  /** Whether to add suffix like "ago" or "in" for past/future context */
  withSuffix?: boolean;
}
