import type { DateTime } from '@epdoc/datetime';
import type * as FS from '@epdoc/fs/fs';
import { _, type Integer } from '@epdoc/type';
import type { ISODateString, Metadata } from './meta-types.ts';
import * as Meta from './meta/mod.ts';
import * as Normalize from './normalize.ts';

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
type DefValue<D> = D extends InfoDef<infer T, unknown> ? T : never;

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
 * EXIF-derived content dates. Unlike the filesystem-level `fileDef` dates,
 * these reflect when the content was captured/digitized/modified per the
 * embedded metadata (e.g. a photo taken in 1925 and scanned in 2024).
 *
 * Each falls back across the tag hierarchies in {@link Meta.Resolver}.
 */
const exifOriginal = (_fs: FS.File, meta: Metadata): DateTime | undefined => Meta.Resolver.from(meta).originatedAt;
const exifDigitized = (_fs: FS.File, meta: Metadata): DateTime | undefined => Meta.Resolver.from(meta).digitizedAt;
const exifModified = (_fs: FS.File, meta: Metadata): DateTime | undefined => Meta.Resolver.from(meta).modifiedAt;
const exifCreated = (_fs: FS.File, meta: Metadata): DateTime | undefined => Meta.Resolver.from(meta).createdAt;

// ============================================================================
// Section consts — single source of truth for each info category
// ============================================================================

export interface FileDef extends InfoSection {
  path: InfoDef<FS.FilePath>;
  filename: InfoDef<string>;
  ext: InfoDef<string>;
  createdAt: InfoDef<DateTime, ISODateString>;
  modifiedAt: InfoDef<DateTime, ISODateString>;
  size: InfoDef<Integer>;
  type: InfoDef<string>;
  mimeType: InfoDef<string>;
}

/**
 * Filesystem-level information from {@link @epdoc/fs!FS.File} stats (not EXIF).
 * Returns `undefined` when the file's stats have not been read yet.
 */
export const fileDef: FileDef = {
  path: { value: (fs: FS.File): FS.FilePath => fs.path },
  filename: { value: (fs: FS.File): string => fs.filename },
  ext: { value: (fs: FS.File): string => fs.ext },
  createdAt: {
    value: (fs: FS.File): DateTime | undefined => fs.hasInfo() ? fs.info.createdAt ?? undefined : undefined,
    json: (fs: FS.File): JsonValue | undefined => fs.hasInfo() ? fs.info.createdAt?.toISOString() : undefined,
  },
  modifiedAt: {
    value: (fs: FS.File): DateTime | undefined => fs.hasInfo() ? fs.info.modifiedAt ?? undefined : undefined,
    json: (fs: FS.File): JsonValue | undefined => fs.hasInfo() ? fs.info.modifiedAt?.toISOString() : undefined,
  },
  size: { value: (fs: FS.File): number | undefined => fs.hasInfo() ? fs.info.size : undefined },
  type: { value: (_fs: FS.File, m: Metadata): string | undefined => Meta.Resolver.from(m).type },
  mimeType: { value: readTag('MIMEType') },
};

/** @see {@link fileDef} */
export type File = InfoResult<typeof fileDef>;

export interface ImageDef extends InfoSection {
  width: InfoDef<number>;
  height: InfoDef<number>;
  originatedAt: InfoDef<DateTime>;
  digitizedAt: InfoDef<DateTime>;
  modifiedAt: InfoDef<DateTime>;
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
  originatedAt: { value: exifOriginal },
  digitizedAt: { value: exifDigitized },
  modifiedAt: { value: exifModified },
  fileSize: { value: readTag('FileSize') },
  encoding: { value: readTag('EncodingProcess') },
  // mimeType: { value: readTag('MIMEType') },
  colorSpace: { value: readTag('ColorSpace') },
  fNumber: {
    value: (_fs: FS.File, m: Metadata): number | undefined =>
      Meta.Parse.fNumber(m.FNumber) ?? Meta.Parse.fNumber(m.Aperture),
  },
  exposureTime: { value: (_fs: FS.File, m: Metadata): number | undefined => Meta.Parse.exposureTime(m.ExposureTime) },
  iso: { value: readTag('ISO'), title: 'ISO' },
  focalLength: { value: (_fs: FS.File, m: Metadata): number | undefined => Meta.Parse.focalLength(m.FocalLength) },
  focalLength35mm: {
    value: (_fs: FS.File, m: Metadata): number | undefined => Meta.Parse.focalLength(m.FocalLengthIn35mmFormat),
  },
  subjectDistance: {
    value: (_fs: FS.File, m: Metadata): number | undefined => Meta.Parse.subjectDistance(m.SubjectDistance),
  },
  megapixels: { value: readTag('Megapixels') },
};

export type Image = InfoResult<typeof imageDef>;

export interface VideoOtherDef extends InfoSection {
  originatedAt: InfoDef<DateTime>;
  digitizedAt: InfoDef<DateTime>;
  modifiedAt: InfoDef<DateTime>;
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

export type VideoOther = InfoResult<typeof videoOtherDef>;
export type Video = Normalize.VideoRes & VideoOther;

export const videoOtherDef: VideoOtherDef = {
  originatedAt: { value: exifOriginal },
  digitizedAt: { value: exifDigitized },
  modifiedAt: { value: exifModified },
  duration: { value: (_fs: FS.File, m: Metadata): number | undefined => Meta.Parse.duration(m.Duration) },
  fileSize: { value: readTag('FileSize') },
  codec: { value: (_fs: FS.File, m: Metadata): string | undefined => Normalize.videoCodec(m) },
  framerate: { value: readTag('VideoFrameRate') },
  bitDepth: { value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.BitDepth) },
  colorRepresentation: { value: readTag('ColorRepresentation') },
  pixelAspectRatio: { value: readTag('PixelAspectRatio') },
  rotation: { value: readTag('Rotation') },
  avgBitrate: { value: (_fs: FS.File, m: Metadata): number | undefined => Meta.Parse.bitrate(m.AvgBitrate) },
  maxBitrate: { value: (_fs: FS.File, m: Metadata): number | undefined => Meta.Parse.bitrate(m.MaxBitrate) },
  megapixels: { value: readTag('Megapixels') },
};

export interface AudioDef extends InfoSection {
  originatedAt: InfoDef<DateTime>;
  digitizedAt: InfoDef<DateTime>;
  modifiedAt: InfoDef<DateTime>;
  format: InfoDef<string>;
  channels: InfoDef<number>;
  sampleRate: InfoDef<number>;
  bitsPerSample: InfoDef<number>;
  codec: InfoDef<string>;
  language: InfoDef<string>;
  duration: InfoDef<number>;
}

export const audioDef: AudioDef = {
  originatedAt: { value: exifOriginal },
  digitizedAt: { value: exifDigitized },
  modifiedAt: { value: exifModified },
  format: { value: readTag('AudioFormat') },
  channels: { value: (_fs: FS.File, m: Metadata): Integer | undefined => asInt(m.AudioChannels) },
  sampleRate: { value: readTag('AudioSampleRate') },
  bitsPerSample: { value: (_fs: FS.File, m: Metadata): number | undefined => asInt(m.AudioBitsPerSample) },
  codec: { value: (_fs: FS.File, m: Metadata): string | undefined => Normalize.audioCodec(m) },
  language: { value: readTag('MediaLanguageCode') },
  duration: {
    value: (_fs: FS.File, m: Metadata): number | undefined => {
      return Meta.Parse.duration(m.Duration) ??
        Meta.Parse.duration(m.AudioDuration) ??
        Meta.Parse.duration(m.MediaDuration) ??
        Meta.Parse.duration(m.TrackDuration) ?? undefined;
    },
  },
};

const asInt = (val: unknown): Integer | undefined => _.isDefined(val) ? _.asInt(val) : undefined;

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
  make: { value: (_fs: FS.File, m: Metadata): string | undefined => m.Make ?? m.ComAndroidManufacturer },
  model: { value: (_fs: FS.File, m: Metadata): string | undefined => m.Model ?? m.ComAndroidModel },
  lensMake: { value: readTag('LensMake') },
  lensModel: { value: readTag('LensModel') },
  serialNumber: { value: readTag('SerialNumber') },
  makerNotes: { value: readTag('MakerNote') },
  focalLength35mm: {
    value: (_fs: FS.File, m: Metadata): number | undefined => Meta.Parse.focalLength(m.FocalLengthIn35mmFormat),
  },
};

export type Camera = InfoResult<typeof cameraDef>;

export interface AppDef extends InfoSection {
  /** The last known software that processed/edited the file (eg. Adobe Camera Raw, Lightroom, Snapseed, Google, FFmpeg). */
  editor: InfoDef<string>;
  /** The original source/origin of the file content: 'camera', 'tiktok', 'whatsapp', or undefined. */
  producer: InfoDef<string>;
}

export const appDef: AppDef = {
  editor: {
    value: (_fs: FS.File, m: Metadata): string | undefined => Normalize.editor(m),
    title: 'Editor',
  },
  producer: {
    value: (_fs: FS.File, m: Metadata): string | undefined => Meta.Resolver.from(m).producer,
    title: 'Producer',
  },
};

export type App = InfoResult<typeof appDef>;

/**
 * Document-level information (PDF, Word, Excel, presentations, text, etc.).
 *
 * Unlike `appDef` (the software that created the file), these fields describe
 * the document itself. `pageCount` handles both the PDF `PageCount` tag and
 * the Office `Pages` tag; `producer` is the PDF producer (when present).
 */
export interface PdfDef extends InfoSection {
  title: InfoDef<string>;
  author: InfoDef<string>;
  subject: InfoDef<string>;
  keywords: InfoDef<string | string[]>;
  createdAt: InfoDef<DateTime>;
  modifiedAt: InfoDef<DateTime>;
  pageCount: InfoDef<number>;
  producer: InfoDef<string>;
  description: InfoDef<string>;
  creator: InfoDef<string>;
  documentId: InfoDef<string>;
  instanceId: InfoDef<string>;
}

export const pdfDef: PdfDef = {
  title: { value: readTag('Title') },
  author: { value: readTag('Author') },
  subject: { value: readTag('Subject') },
  keywords: { value: readTag('Keywords') },
  createdAt: { value: exifCreated },
  modifiedAt: { value: exifModified },
  pageCount: { value: (_fs: FS.File, m: Metadata): number | undefined => asInt(m.PageCount) ?? asInt(m.Pages) },
  producer: { value: readTag('Producer') },
  description: { value: readTag('Description') },
  creator: { value: readTag('Creator') },
  documentId: { value: readTag('DocumentID') },
  instanceId: { value: readTag('InstanceID') },
};

export type Pdf = InfoResult<typeof pdfDef>;

/**
 * Document-level information (PDF, Word, Excel, presentations, text, etc.).
 *
 * Unlike `appDef` (the software that created the file), these fields describe
 * the document itself. `pageCount` handles both the PDF `PageCount` tag and
 * the Office `Pages` tag; `producer` is the PDF producer (when present).
 */
export interface DocDef extends InfoSection {
  title: InfoDef<string>;
  author: InfoDef<string>;
  subject: InfoDef<string>;
  keywords: InfoDef<string | string[]>;
  originatedAt: InfoDef<DateTime>;
  digitizedAt: InfoDef<DateTime>;
  modifiedAt: InfoDef<DateTime>;
  pageCount: InfoDef<number>;
  producer: InfoDef<string>;
}

export const docDef: DocDef = {
  title: { value: readTag('Title') },
  author: { value: readTag('Author') },
  subject: { value: readTag('Subject') },
  keywords: { value: readTag('Keywords') },
  originatedAt: { value: exifOriginal },
  digitizedAt: { value: exifDigitized },
  modifiedAt: { value: exifModified },
  pageCount: { value: (_fs: FS.File, m: Metadata): number | undefined => asInt(m.PageCount) ?? asInt(m.Pages) },
  producer: { value: readTag('Producer') },
};

export type Doc = InfoResult<typeof docDef>;

export type FileId = {
  documentId?: string;
  instanceId?: string;
};
