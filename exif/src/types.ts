import type * as Schema from './collections.ts';
import type * as Gps from './gps.ts';
import type { Metadata } from './metadata.ts';

/**
 * Options shared by the {@link Reader} and {@link File} classes.
 */
export interface IDryRun {
  dryRun?: boolean;
}

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
  file: Schema.File;
  camera?: Schema.Camera;
  app?: Schema.App;
  gps?: Gps.Location;
  image?: Schema.Image;
  video?: Schema.Video;
  audio?: Schema.Audio;
  metadata?: Metadata;
};
export type FileInfoKey = keyof FileInfo;
