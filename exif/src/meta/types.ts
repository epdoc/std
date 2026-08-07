/** Parsed components of an exiftool date/time value. */
export interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond?: number;
  /** e.g. "+02:00" (omitted when the value carries no timezone). */
  tzOffset?: string;
}
