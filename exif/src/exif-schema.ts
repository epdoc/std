import type { DateTime } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import type { Integer } from '@epdoc/type';
import { _ } from '@epdoc/type';
import { APP_NORMALIZE_RULES, CAMERA_MODEL_MAP } from './consts.ts';
import {
  parseBitrate,
  parseDuration,
  parseExposureTime,
  parseFileSize,
  parseFNumber,
  parseFocalLength,
  parseSubjectDistance,
  toNumber,
} from './utils.ts';

/** EXIF date/time as emitted by exiftool (default format), e.g. "2026:07:31 18:00:00". */
export type ExifDateTime = string;

/**
 * A GPS coordinate as emitted by exiftool.
 * Default (`-j` without `-n`): a DMS string with the reference embedded,
 * e.g. `"51 deg 30' 26.00" N"`. With `-n`: a decimal number of degrees.
 */
export type GpsCoordinate = number | string;

/**
 * Latitude/longitude reference hemisphere. exiftool emits the long form by
 * default (`"North"`) and the short form with `-n` (`"N"`).
 */
export type GpsLatitudeRef = 'North' | 'South' | 'N' | 'S';
export type GpsLongitudeRef = 'East' | 'West' | 'E' | 'W';

export type ISODateString = string; // e.g. "2024-01-01T12:00:00Z"

// ============================================================================
// SSoT infrastructure — InfoDef, factories, collect, derived types
// ============================================================================

/** A JSON-safe value (no Date, no undefined, etc.). */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * A single property definition in a section const.
 *
 * `value` is the primary extractor; `json` is the JSON-serializable variant
 * (e.g. DateTime → ISO string). `title` overrides the auto-generated display
 * label; `asTitle` formats the value for display (defaults to `String(v)`).
 */
export interface InfoDef<T = unknown> {
  value: (fs: FS.File, meta: Metadata) => T | undefined;
  json?: (fs: FS.File, meta: Metadata) => JsonValue | undefined;
  title?: string;
  asTitle?: (value: unknown) => string;
}

/** A section is a name→InfoDef record. */
export type InfoSection = Record<string, InfoDef>;

/** Extract the value type from an InfoDef. */
type DefValue<D> = D extends InfoDef<infer T> ? T : never;

/** The result object type for a section: all keys optional (undefined dropped). */
export type InfoResult<S extends InfoSection> = { [K in keyof S]?: DefValue<S[K]> };

/**
 * Factory: read a raw EXIF tag value from the metadata object.
 * Covers the task's "1b: simpler case — just take a named property from metadata"
 * and "1c: take focalLength and get metadata.FocalLength".
 */
export function readTag<K extends keyof Metadata>(tag: K): (fs: FS.File, meta: Metadata) => Metadata[K] | undefined {
  return (_fs, m) => m[tag];
}

/**
 * Enumerate a section's defs and collect property values into a result object.
 * Keys are visited in declaration order. Properties whose value is `undefined`
 * are omitted (per task 1e). In `json` mode, each def's `json` extractor is
 * used when present; otherwise `value` is used as a fallback.
 */
export function collect<S extends InfoSection>(
  section: S,
  fs: FS.File,
  meta: Metadata,
  mode: 'value' | 'json' = 'value',
): InfoResult<S> {
  const result: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(section)) {
    const fn = mode === 'json' ? (def.json ?? (def.value as (fs: FS.File, meta: Metadata) => unknown)) : def.value;
    const v: unknown = fn(fs, meta);
    if (_.isDefined(v)) result[key] = v;
  }
  return result as InfoResult<S>;
}

/**
 * Display label for a key. Defaults to a title-cased version of the camelCase
 * key (e.g. `createdAt` → `Created At`). Override via the `title` field on
 * the InfoDef.
 */
export function titleCase(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// ============================================================================
// Normalization helpers (moved from file.ts so defs can use them)
// ============================================================================

export function normalizeCameraName(meta: Metadata): string | undefined {
  const make = meta.Make;
  const model = meta.Model?.toUpperCase();
  if (make && model && CAMERA_MODEL_MAP[make]?.[model]) {
    return `${make} ${CAMERA_MODEL_MAP[make][model]}`;
  }
}

export function normalizeApplication(software: string | undefined): string | undefined {
  if (!software) return undefined;
  for (const rule of APP_NORMALIZE_RULES) {
    if (rule.pattern.test(software)) {
      return rule.label;
    }
  }
  return software;
}

// ============================================================================
// Metadata — raw exiftool JSON for one file (unchanged interface)
// ============================================================================

/**
 * The JSON object exiftool emits for one file with `-j`.
 * Fields are the raw EXIF tag names as produced by exiftool.
 */
export interface Metadata {
  SourceFile: FS.FilePath;
  ExifToolVersion: number;
  FileName: string;
  Directory: string;
  MIMEType: string;

  ImageWidth?: Integer;
  ImageHeight?: Integer;
  ExifImageWidth?: Integer;
  ExifImageHeight?: Integer;
  /** e.g. "320x240" */
  ImageSize?: string;
  Megapixels?: number;

  FileType: string;
  FileTypeExtension: string;
  Format?: string;
  EncodingProcess?: string;
  ColorSpace?: string;
  BitsPerSample?: Integer;
  ColorComponents?: Integer;

  Make?: string;
  Model?: string;
  LensMake?: string;
  LensModel?: string;
  FocalLengthIn35mmFormat?: string;
  Software?: string;
  CreatorTool?: string;
  SerialNumber?: string;

  /**
   * Video duration. Default format is a string with units, e.g. `"2.00 s"`,
   * or `"H:MM:SS"`; with `-n` it is a plain number of seconds.
   * See {@link parseExifDuration}.
   */
  Duration?: string | number;

  FileSize?: string | number;
  FNumber?: number;
  Aperture?: string | number;
  ExposureTime?: string | number;
  ISO?: number;
  FocalLength?: string | number;
  SubjectDistance?: string | number;

  DateTimeOriginal?: ExifDateTime;
  CreateDate?: ExifDateTime;
  DateCreated?: ExifDateTime;
  ModifyDate?: ExifDateTime;
  FileModifyDate?: ExifDateTime;
  FileAccessDate?: ExifDateTime;
  FileInodeChangeDate?: ExifDateTime;

  SubSecDateTimeOriginal?: string;
  SubSecCreateDate?: string;
  SubSecModifyDate?: string;

  SubSecTimeOriginal?: string | Integer;
  SubSecTimeDigitized?: string | Integer;
  SubSecTime?: string | Integer;

  OffsetTime?: string;
  OffsetTimeOriginal?: string;
  OffsetTimeDigitized?: string;

  MakerNote?: string;
  HdrPlusMakernote?: string;

  DocumentID?: string;
  InstanceID?: string;

  VideoFrameRate?: number;
  CompressorID?: string;
  CompressorName?: string;
  BitDepth?: Integer;
  ColorRepresentation?: string;
  PixelAspectRatio?: string;
  MatrixStructure?: string;
  Rotation?: number;
  AvgBitrate?: string | number;
  MaxBitrate?: number;
  AverageBitrate?: number;
  SourceImageWidth?: Integer;
  SourceImageHeight?: Integer;
  GraphicsMode?: string;
  OpColor?: string;

  AudioFormat?: string;
  AudioChannels?: Integer;
  AudioBitsPerSample?: Integer;
  AudioSampleRate?: number;
  MediaLanguageCode?: string;
  TrackVolume?: string;
  Balance?: number;
  PreferredVolume?: string;
  HandlerDescription?: string;

  GPSLatitude?: GpsCoordinate;
  GPSLongitude?: GpsCoordinate;
  /** Altitude in meters; string form includes units, e.g. "12.5 m". */
  GPSAltitude?: number | string;
  GPSLatitudeRef?: GpsLatitudeRef;
  GPSLongitudeRef?: GpsLongitudeRef;
  /** 0 = above sea level, 1 = below. */
  GPSAltitudeRef?: Integer;
}

// ============================================================================
// Section consts — single source of truth for each info category
// ============================================================================

export interface FileDef extends InfoSection {
  path: InfoDef<FS.FilePath>;
  filename: InfoDef<string>;
  ext: InfoDef<string>;
  createdAt: InfoDef<DateTime>;
  modifiedAt: InfoDef<DateTime>;
  size: InfoDef<number>;
  type: InfoDef<string>;
  mimeType: InfoDef<string>;
}

/**
 * Filesystem-level information from {@link @epdoc/fs!FS.File} stats (not EXIF).
 */
export const File: FileDef = {
  path: { value: (fs: FS.File): FS.FilePath => fs.path },
  filename: { value: (fs: FS.File): string => fs.filename },
  ext: { value: (fs: FS.File): string => fs.ext },
  createdAt: {
    value: (fs: FS.File): DateTime | undefined => fs.info.createdAt ?? undefined,
    json: (fs: FS.File): JsonValue | undefined => fs.info.createdAt?.toISOString(),
  },
  modifiedAt: {
    value: (fs: FS.File): DateTime | undefined => fs.info.modifiedAt ?? undefined,
    json: (fs: FS.File): JsonValue | undefined => fs.info.modifiedAt?.toISOString(),
  },
  size: { value: (fs: FS.File): number => fs.info.size },
  type: { value: (_fs: FS.File, m: Metadata): string => m.MIMEType?.split('/')[0] ?? 'unknown' },
  mimeType: { value: readTag('MIMEType') },
};

/** @see {@link File} */
export type File = InfoResult<typeof File>;

export interface ImageDef extends InfoSection {
  width: InfoDef<number>;
  height: InfoDef<number>;
  fileSize: InfoDef<number>;
  mimeType: InfoDef<string>;
  colorSpace: InfoDef<string>;
  fNumber: InfoDef<number>;
  exposureTime: InfoDef<number>;
  iso: InfoDef<number>;
  focalLength: InfoDef<number>;
  focalLength35mm: InfoDef<number>;
  subjectDistance: InfoDef<number>;
}

export const Image: ImageDef = {
  width: { value: (_fs: FS.File, m: Metadata): number | undefined => toNumber(m.ExifImageWidth) },
  height: { value: (_fs: FS.File, m: Metadata): number | undefined => toNumber(m.ExifImageHeight) },
  fileSize: { value: (_fs: FS.File, m: Metadata): number | undefined => parseFileSize(m.FileSize) },
  mimeType: { value: readTag('MIMEType') },
  colorSpace: { value: readTag('ColorSpace') },
  fNumber: {
    value: (_fs: FS.File, m: Metadata): number | undefined => parseFNumber(m.FNumber) ?? parseFNumber(m.Aperture),
  },
  exposureTime: { value: (_fs: FS.File, m: Metadata): number | undefined => parseExposureTime(m.ExposureTime) },
  iso: { value: readTag('ISO'), title: 'ISO' },
  focalLength: { value: (_fs: FS.File, m: Metadata): number | undefined => parseFocalLength(m.FocalLength) },
  focalLength35mm: {
    value: (_fs: FS.File, m: Metadata): number | undefined => parseFocalLength(m.FocalLengthIn35mmFormat),
  },
  subjectDistance: {
    value: (_fs: FS.File, m: Metadata): number | undefined => parseSubjectDistance(m.SubjectDistance),
  },
};

export type Image = InfoResult<typeof Image>;

export interface VideoDef extends InfoSection {
  width: InfoDef<number>;
  height: InfoDef<number>;
  sourceWidth: InfoDef<number>;
  sourceHeight: InfoDef<number>;
  duration: InfoDef<number>;
  codec: InfoDef<string>;
  codecName: InfoDef<string>;
  framerate: InfoDef<number>;
  bitDepth: InfoDef<number>;
  colorRepresentation: InfoDef<string>;
  pixelAspectRatio: InfoDef<string>;
  rotation: InfoDef<number>;
  avgBitrate: InfoDef<number>;
  maxBitrate: InfoDef<number>;
}

export const Video: VideoDef = {
  width: { value: (_fs: FS.File, m: Metadata): number | undefined => toNumber(m.ImageWidth) },
  height: { value: (_fs: FS.File, m: Metadata): number | undefined => toNumber(m.ImageHeight) },
  sourceWidth: { value: (_fs: FS.File, m: Metadata): number | undefined => toNumber(m.SourceImageWidth) },
  sourceHeight: { value: (_fs: FS.File, m: Metadata): number | undefined => toNumber(m.SourceImageHeight) },
  duration: { value: (_fs: FS.File, m: Metadata): number | undefined => parseDuration(m.Duration) },
  codec: { value: readTag('CompressorID') },
  codecName: { value: readTag('CompressorName') },
  framerate: { value: readTag('VideoFrameRate') },
  bitDepth: { value: (_fs: FS.File, m: Metadata): number | undefined => toNumber(m.BitDepth) },
  colorRepresentation: { value: readTag('ColorRepresentation') },
  pixelAspectRatio: { value: readTag('PixelAspectRatio') },
  rotation: { value: readTag('Rotation') },
  avgBitrate: { value: (_fs: FS.File, m: Metadata): number | undefined => parseBitrate(m.AvgBitrate) },
  maxBitrate: { value: (_fs: FS.File, m: Metadata): number | undefined => parseBitrate(m.MaxBitrate) },
};

export type Video = InfoResult<typeof Video>;

export interface AudioDef extends InfoSection {
  format: InfoDef<string>;
  channels: InfoDef<number>;
  sampleRate: InfoDef<number>;
  bitsPerSample: InfoDef<number>;
  language: InfoDef<string>;
}

export const Audio: AudioDef = {
  format: { value: readTag('AudioFormat') },
  channels: { value: (_fs: FS.File, m: Metadata): number | undefined => toNumber(m.AudioChannels) },
  sampleRate: { value: readTag('AudioSampleRate') },
  bitsPerSample: { value: (_fs: FS.File, m: Metadata): number | undefined => toNumber(m.AudioBitsPerSample) },
  language: { value: readTag('MediaLanguageCode') },
};

export type Audio = InfoResult<typeof Audio>;

export interface CameraDef extends InfoSection {
  name: InfoDef<string>;
  make: InfoDef<string>;
  model: InfoDef<string>;
  lensMake: InfoDef<string>;
  lensModel: InfoDef<string>;
  serialNumber: InfoDef<string>;
  makerNotes: InfoDef<string>;
  focalLength35mm: InfoDef<number>;
}

export const Camera: CameraDef = {
  name: { value: (_fs: FS.File, m: Metadata): string | undefined => normalizeCameraName(m), title: 'Camera' },
  make: { value: readTag('Make') },
  model: { value: readTag('Model') },
  lensMake: { value: readTag('LensMake') },
  lensModel: { value: readTag('LensModel') },
  serialNumber: { value: readTag('SerialNumber') },
  makerNotes: { value: readTag('MakerNote') },
  focalLength35mm: {
    value: (_fs: FS.File, m: Metadata): number | undefined => parseFocalLength(m.FocalLengthIn35mmFormat),
  },
};

export type Camera = InfoResult<typeof Camera>;

export interface AppDef extends InfoSection {
  application: InfoDef<string>;
}

export const App: AppDef = {
  application: {
    value: (_fs: FS.File, m: Metadata): string | undefined => normalizeApplication(m.Software || m.CreatorTool),
    title: 'Application',
  },
};

export type App = InfoResult<typeof App>;

export type FileId = {
  documentId?: string;
  instanceId?: string;
};

// ============================================================================
// ExifInfo — grouping of all section consts + formatting helpers
// ============================================================================

/**
 * A single row produced by {@link ExifInfo.list}, suitable for table rendering.
 */
export interface InfoRow {
  key: string;
  label: string;
  value: unknown;
  display: string;
}

/**
 * Grouping of all section consts plus enumeration/formatting utilities.
 *
 * ```ts
 * const rows = ExifInfo.list(ExifInfo.camera, fsFile, metadata);
 * // rows: [{ key: 'name', label: 'Camera', value: '...', display: '...' }, ...]
 * ```
 */
export const ExifInfo: {
  file: typeof File;
  image: typeof Image;
  video: typeof Video;
  audio: typeof Audio;
  camera: typeof Camera;
  app: typeof App;
  keys(section: InfoSection): string[];
  labels(section: InfoSection): string[];
  list(section: InfoSection, fs: FS.File, meta: Metadata, mode?: 'value' | 'json'): InfoRow[];
} = {
  file: File,
  image: Image,
  video: Video,
  audio: Audio,
  camera: Camera,
  app: App,

  /** Return the declaration-order keys of a section. */
  keys(section: InfoSection): string[] {
    return Object.keys(section);
  },

  /** Return display labels for each key in a section (def.title ?? titleCase(key)). */
  labels(section: InfoSection): string[] {
    return this.keys(section).map((k) => section[k].title ?? titleCase(k));
  },

  /**
   * Produce an array of { key, label, value, display } rows for rendering
   * (straight text or tables — per the task).
   *
   * @param mode - `'value'` (default) or `'json'` to use serialized values.
   */
  list(section: InfoSection, fs: FS.File, meta: Metadata, mode: 'value' | 'json' = 'value'): InfoRow[] {
    return this.keys(section).map((key: string): InfoRow => {
      const def = section[key];
      const value = mode === 'json' && def.json ? def.json(fs, meta) : def.value(fs, meta);
      const label = def.title ?? titleCase(key);
      const display = value !== undefined ? (def.asTitle ? def.asTitle(value as never) : String(value)) : '';
      return { key, label, value, display };
    });
  },
} as const;
