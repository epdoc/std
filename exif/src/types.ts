import type * as Schema from './collections.ts';
import type * as Gps from './gps.ts';
import type { Metadata } from './meta-types.ts';

/**
 * Options shared by the {@link Reader} and {@link File} classes.
 */
export interface IDryRun {
  dryRun?: boolean;
}

export type Seconds = number;

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
  file: Schema.File;
  camera?: Schema.Camera;
  app?: Schema.App;
  gps?: Gps.Location;
  image?: Schema.Image;
  video?: Schema.Video;
  audio?: Schema.Audio;
  pdf?: Schema.Pdf;
  doc?: Schema.Doc;
  metadata?: Metadata;
};
export type FileInfoKey = keyof FileInfo;
