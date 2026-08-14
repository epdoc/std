import type { Geo } from '@epdoc/exif';
import type * as Schema from './collections.ts';
import type * as Gps from './gps.ts';
import type { Metadata } from './meta-types.ts';

/**
 * Options shared by the {@link Reader} and {@link File} classes.
 */
export interface IDryRun {
  dryRun?: boolean;
}

export interface IDigest {
  /** Compute and include a digest in the top-level file object. */
  digest?: string | boolean;
}

export type Seconds = number;
export type Digest = string;

/**
 * Options when retrieving metadata from exiftools
 */
export type FileGetMetadataOptions = IDigest & {
  /** On subsequent calls will use a cache version, unless set to true. */
  force?: boolean;
};

/**
 * Options to File.info() method.
 */
export type FileInfoOptions = {
  /** Include a top-level metadata object with the raw exiftool metadata */
  metadata?: boolean;
  /** Compute and include a digest in the top-level file object. */
  digest?: boolean;
  /** Compute and include the address, given GPS coordinates */
  address?: boolean;
};

/**
 * Represents one key/value change to the Metadata
 */
export type MetaModHistory = MetaMod & {
  /** The previous value of the field */
  previousValue: MetadataValue;
  /** Did we make the change to the metadata? */
  // modified: boolean;
};
export type MetaMod = {
  /** The EXIF field name */
  tag: WriteTag;
  /** The new value of the field */
  value: MetadataValue;
};
export type MetaTagDict = Partial<Record<WriteTag, MetadataValue>>;
export type MetadataKey = keyof Metadata;
export type MetadataValue = string | number | undefined;

/**
 * Tags accepted by the write pipeline (setTag / applyTags / PendingMetaMod).
 * Either a plain read tag (`MetadataKey`) or a group-prefixed exiftool write
 * spec such as `XMP-dc:Date` that targets a specific metadata group.
 * Group-prefixed specs never appear in `-j` read output, so they are kept
 * out of the `Metadata` read model.
 */
export type WriteTag = MetadataKey | `XMP-${string}:${string}` | `MWG:${string}`;

/**
 * JSON representation of a File's extracted metadata, nested by section.
 * Raw exiftool metadata is excluded by default; opt in with
 * `toJSON({ includeMetadata: true })`.
 */
export type FileJson = {
  file: Schema.File;
  image?: Schema.Image;
  video?: Schema.Video;
  audio?: Schema.Audio;
  doc?: Schema.Doc;
  camera?: Schema.Camera;
  app?: Schema.App;
  createdAt?: string;
  digitizedAt?: string;
  modifiedAt?: string;
  hasTimezone?: boolean;
  tzOffset?: string;
  gps?: Gps.Location;
  id?: Schema.FileId;
  metadata?: Metadata;
};

/** Options for {@link File.toJSON}. */
export interface ToJSONOptions {
  includeMetadata?: boolean;
}

export type FileInfo = {
  id?: { documentId?: string; instanceId?: string };
  file: Schema.File & { digest?: string };
  camera?: Schema.Camera;
  app?: Schema.App;
  gps?: Gps.Location;
  address?: Geo.AddressHuman;
  lookup?: Geo.AddressHuman;
  image?: Schema.Image;
  video?: Schema.Video;
  audio?: Schema.Audio;
  pdf?: Schema.Pdf;
  doc?: Schema.Doc;
  metadata?: Metadata;
};
export type FileInfoKey = keyof FileInfo;
export const FileInfoEnum = [
  'id',
  'file',
  'camera',
  'app',
  'gps',
  'image',
  'video',
  'audio',
  'pdf',
  'doc',
  'metadata',
] as const;
