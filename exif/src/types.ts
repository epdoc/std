import type { Geo } from '@epdoc/exif';
import type * as Schema from './collections.ts';
import type * as Gps from './gps.ts';
import type { Metadata } from './meta-types.ts';

/**
 * Options shared by {@link File} and {@link readFiles}.
 */
export interface IDryRun {
  /** When true, exiftool write operations ({@link File.write}, {@link File.repair})
   *  compute their changesets without invoking the binary. */
  dryRun?: boolean;
}

export interface IDigest {
  /**
   * Compute and include a digest of the file content. A string names the
   * digest algorithm (see {@link @epdoc/fs!FS.DigestAlgorithm}); `true` uses
   * the default (`sha1`). The digest appears as `file.digest` in the info
   * output.
   */
  digest?: string | boolean;
}

export type Seconds = number;
export type Digest = string;

/**
 * Options when retrieving metadata from exiftool.
 */
export type FileGetMetadataOptions = IDigest & {
  /** When true, re-read metadata with a new exiftool call instead of using the cache. */
  force?: boolean;
};

export interface IUserAgent {
  userAgent?: string;
}

export interface FileOptions extends IDryRun, IUserAgent {}

export interface ReadFilesOptions extends IDigest, IDryRun, IUserAgent {}

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
 * A single tag/value pair queued for writing.
 *
 * Used as the element type of the {@link File.pending} map and the
 * {@link MetaTagDict} changesets produced by the write-prepare methods.
 */
export type MetaMod = {
  /** The EXIF tag name to write (either a plain read tag or a group-prefixed spec). */
  tag: WriteTag;
  /** The new value. `''` or `undefined` deletes the tag. */
  value: MetadataValue;
};

/**
 * A queued tag write plus the value previously read from the file.
 *
 * Returned by {@link File.write} and {@link File.repair} to report what was
 * queued. `previousValue` is best-effort: it is read from the cached metadata
 * before the write, and for group-prefixed write tags it maps to the
 * priority-winning flat tag in the read model, which may not be the exact
 * group being written.
 *
 * This type is a *reporting* record, not a change-detection mechanism. Because
 * {@link File} skips queuing a tag whose value already matches the read model,
 * every returned entry represents a genuine pending change; callers should use
 * the `dirty` flag or the returned length to decide whether a write is needed.
 */
export type MetaModHistory = MetaMod & {
  /** The value of the field as read from the file, `undefined` when absent. */
  previousValue: MetadataValue;
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
export type WriteTag = MetadataKey | `XMP-${string}:${string}` | `MWG:${string}` | `IPTC:${string}`;

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
  address?: Geo.AddressDef;
  lookup?: Geo.AddressDef;
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
