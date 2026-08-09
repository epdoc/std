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

/**
 * The detected originator of a media file.
 *
 * - `'camera'` — captured by a physical camera (Make/Model tags present; see
 *   the `camera` section of `info()` for device details).
 * - `'tiktok'` — downloaded from TikTok (metadata was stripped/replaced).
 * - `'whatsapp'` — shared via WhatsApp (metadata was stripped).
 * - `undefined` — origin could not be determined.
 */
export type FileSource = 'camera' | 'tiktok' | 'whatsapp' | undefined;
