import type { DateTime } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import { _, type Integer } from '@epdoc/type';
import type { ISODateString, Metadata } from './metadata.ts';
import * as Normalize from './normalize.ts';
import * as Parse from './parse.ts';
// import { FileInfo } from './types.ts';

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
export interface InfoDef<T = unknown, F = T> {
  value: (fs: FS.File, meta: Metadata) => T | undefined;
  json?: (fs: FS.File, meta: Metadata) => JsonValue | undefined;
  format?: (fs: FS.File, meta: Metadata) => F | undefined;
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
// Section consts — single source of truth for each info category
// ============================================================================

export interface FileDef extends InfoSection {
  path: InfoDef<FS.FilePath>;
  filename: InfoDef<string>;
  ext: InfoDef<string>;
  createdAt: InfoDef<DateTime, ISODateString>;
  modifiedAt: InfoDef<DateTime, ISODateString>;
  size: InfoDef<number, string>;
  type: InfoDef<string>;
  mimeType: InfoDef<string>;
}

/**
 * Filesystem-level information from {@link @epdoc/fs!FS.File} stats (not EXIF).
 */
export const fileDef: FileDef = {
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

/** @see {@link fileDef} */
export type File = InfoResult<typeof fileDef>;

export interface ImageDef extends InfoSection {
  width: InfoDef<number>;
  height: InfoDef<number>;
  fileSize: InfoDef<string | number>;
  encoding: InfoDef<string>;
  // mimeType: InfoDef<string>;
  colorSpace: InfoDef<string>;
  fNumber: InfoDef<number>;
  exposureTime: InfoDef<number>;
  iso: InfoDef<number>;
  focalLength: InfoDef<number>;
  focalLength35mm: InfoDef<number>;
  subjectDistance: InfoDef<number>;
  megapixels: InfoDef<string | number>;
}

export const imageDef: ImageDef = {
  width: { value: (_fs: FS.File, m: Metadata): number | undefined => asInt(m.ExifImageWidth) || asInt(m.ImageWidth) },
  height: {
    value: (_fs: FS.File, m: Metadata): number | undefined => asInt(m.ExifImageHeight) || asInt(m.ImageHeight),
  },
  fileSize: { value: readTag('FileSize') },
  encoding: { value: readTag('EncodingProcess') },
  // mimeType: { value: readTag('MIMEType') },
  colorSpace: { value: readTag('ColorSpace') },
  fNumber: {
    value: (_fs: FS.File, m: Metadata): number | undefined => Parse.fNumber(m.FNumber) ?? Parse.fNumber(m.Aperture),
  },
  exposureTime: { value: (_fs: FS.File, m: Metadata): number | undefined => Parse.exposureTime(m.ExposureTime) },
  iso: { value: readTag('ISO'), title: 'ISO' },
  focalLength: { value: (_fs: FS.File, m: Metadata): number | undefined => Parse.focalLength(m.FocalLength) },
  focalLength35mm: {
    value: (_fs: FS.File, m: Metadata): number | undefined => Parse.focalLength(m.FocalLengthIn35mmFormat),
  },
  subjectDistance: {
    value: (_fs: FS.File, m: Metadata): number | undefined => Parse.subjectDistance(m.SubjectDistance),
  },
  megapixels: { value: readTag('Megapixels') },
};

export type Image = InfoResult<typeof imageDef>;

export interface VideoResDef extends InfoSection {
  tag: InfoDef<string>;
  isCropped: InfoDef<boolean>;
  width: InfoDef<Integer>;
  height: InfoDef<Integer>;
}

export interface VideoOtherDef extends InfoSection {
  duration: InfoDef<number>;
  fileSize: InfoDef<string | number>;
  codec: InfoDef<string>;
  framerate: InfoDef<number>;
  bitDepth: InfoDef<number>;
  colorRepresentation: InfoDef<string>;
  pixelAspectRatio: InfoDef<string>;
  rotation: InfoDef<number>;
  avgBitrate: InfoDef<number>;
  maxBitrate: InfoDef<number>;
  megapixels: InfoDef<string | number>;
}

export interface VideoDef extends InfoSection, VideoResDef, VideoOtherDef {
  // sourceWidth: InfoDef<number>;
  // sourceHeight: InfoDef<number>;
  // duration: InfoDef<number>;
  // fileSize: InfoDef<string | number>;
  // codec: InfoDef<string>;
  // framerate: InfoDef<number>;
  // bitDepth: InfoDef<number>;
  // colorRepresentation: InfoDef<string>;
  // pixelAspectRatio: InfoDef<string>;
  // rotation: InfoDef<number>;
  // avgBitrate: InfoDef<number>;
  // maxBitrate: InfoDef<number>;
  // megapixels: InfoDef<string | number>;
}

/** Dummy entry. We use Normalize.videoResolution instead, when obtaining these properties */
export const videoResDef: VideoResDef = {
  width: {
    value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.ImageWidth) || asInt(m.SourceImageWidth),
  },
  height: {
    value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.ImageHeight) || asInt(m.SourceImageHeight),
  },
  tag: { value: (_fs: FS.File, _m: Metadata): string | undefined => undefined },
  isCropped: { value: (_fs: FS.File, _m: Metadata): boolean | undefined => undefined },
};

export const videoOtherDef: VideoOtherDef = {
  // width: {
  //   value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.ImageWidth) || asInt(m.SourceImageWidth),
  // },
  // height: {
  //   value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.ImageHeight) || asInt(m.SourceImageHeight),
  // },
  // exifWidth: { value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.ExifImageWidth) },
  // exifHeight: { value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.ExifImageHeight) },
  // sourceWidth: { value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.SourceImageWidth) },
  // sourceHeight: { value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.SourceImageHeight) },
  duration: { value: (_fs: FS.File, m: Metadata): number | undefined => Parse.duration(m.Duration) },
  fileSize: { value: readTag('FileSize') },
  // tag: { value: (_fs: FS.File, m: Metadata): string | undefined => Normalize.videoResolution(m) },
  // isCropped: { value: (_fs: FS.File, m: Metadata): boolean | undefined => Normalize.videoCropped(m) },
  codec: { value: (_fs: FS.File, m: Metadata): string | undefined => Normalize.videoCodec(m) },
  framerate: { value: readTag('VideoFrameRate') },
  bitDepth: { value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.BitDepth) },
  colorRepresentation: { value: readTag('ColorRepresentation') },
  pixelAspectRatio: { value: readTag('PixelAspectRatio') },
  rotation: { value: readTag('Rotation') },
  avgBitrate: { value: (_fs: FS.File, m: Metadata): number | undefined => Parse.bitrate(m.AvgBitrate) },
  maxBitrate: { value: (_fs: FS.File, m: Metadata): number | undefined => Parse.bitrate(m.MaxBitrate) },
  megapixels: { value: readTag('Megapixels') },
};

export type VideoRes = InfoResult<typeof videoResDef>;
export type VideoOther = InfoResult<typeof videoOtherDef>;
export type Video = VideoRes | VideoOther;

export interface AudioDef extends InfoSection {
  format: InfoDef<string>;
  channels: InfoDef<number>;
  sampleRate: InfoDef<number>;
  bitsPerSample: InfoDef<number>;
  codec: InfoDef<string>;
  language: InfoDef<string>;
}

export const audioDef: AudioDef = {
  format: { value: readTag('AudioFormat') },
  channels: { value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.AudioChannels) },
  sampleRate: { value: readTag('AudioSampleRate') },
  bitsPerSample: { value: (_fs: FS.File, m: Metadata): number | undefined => asInt(m.AudioBitsPerSample) },
  codec: { value: (_fs: FS.File, m: Metadata): string | undefined => Normalize.audioCodec(m) },
  language: { value: readTag('MediaLanguageCode') },
};

const asInt = (val: unknown): Integer | undefined => _.isDefined(val) ? _.asInt(val) : undefined;
const _asFloat = (val: unknown): Integer | undefined => _.isDefined(val) ? _.asFloat(val) : undefined;

export type Audio = InfoResult<typeof audioDef>;

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

export const cameraDef: CameraDef = {
  name: { value: (_fs: FS.File, m: Metadata): string | undefined => Normalize.cameraName(m), title: 'Camera' },
  make: { value: readTag('Make') },
  model: { value: readTag('Model') },
  lensMake: { value: readTag('LensMake') },
  lensModel: { value: readTag('LensModel') },
  serialNumber: { value: readTag('SerialNumber') },
  makerNotes: { value: readTag('MakerNote') },
  focalLength35mm: {
    value: (_fs: FS.File, m: Metadata): number | undefined => Parse.focalLength(m.FocalLengthIn35mmFormat),
  },
};

export type Camera = InfoResult<typeof cameraDef>;

export interface AppDef extends InfoSection {
  application: InfoDef<string>;
}

export const appDef: AppDef = {
  application: {
    value: (_fs: FS.File, m: Metadata): string | undefined => Normalize.application(m.Software || m.CreatorTool),
    title: 'Application',
  },
};

export type App = InfoResult<typeof appDef>;

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
// export const ExifInfo: {
//   file: File;
//   image: Image;
//   video: Video;
//   audio: Audio;
//   camera: Camera;
//   app: App;
//   keys(section: InfoSection): string[];
//   labels(section: InfoSection): string[];
//   list(section: InfoSection, fs: FS.File, meta: Metadata, mode?: 'value' | 'json'): InfoRow[];
// } = {
//   file: fileDef,
//   image: imageDef,
//   video: Video,
//   audio: Audio,
//   camera: cameraDef,
//   app: App,

//   /** Return the declaration-order keys of a section. */
//   keys(section: InfoSection): string[] {
//     return Object.keys(section);
//   },

//   /** Return display labels for each key in a section (def.title ?? titleCase(key)). */
//   labels(section: InfoSection): string[] {
//     return this.keys(section).map((k) => section[k].title ?? titleCase(k));
//   },

//   /**
//    * Produce an array of { key, label, value, display } rows for rendering
//    * (straight text or tables — per the task).
//    *
//    * @param mode - `'value'` (default) or `'json'` to use serialized values.
//    */
//   list(section: InfoSection, fs: FS.File, meta: Metadata, mode: 'value' | 'json' = 'value'): InfoRow[] {
//     return this.keys(section).map((key: string): InfoRow => {
//       const def = section[key];
//       const value = mode === 'json' && def.json ? def.json(fs, meta) : def.value(fs, meta);
//       const label = def.title ?? titleCase(key);
//       const display = value !== undefined ? (def.asTitle ? def.asTitle(value as never) : String(value)) : '';
//       return { key, label, value, display };
//     });
//   },
// } as const;
