import type * as FS from '@epdoc/fs/fs';
import type * as Schema from './exif-schema.ts';
import type * as Gps from './gps.ts';

/**
 * Options shared by the {@link Reader} and {@link File} classes.
 */
export interface IDryRun {
  dryRun?: boolean;
}

export type ISODateString = string; // e.g. "2024-01-01T12:00:00Z"

/**
 * Filesystem-level information about the media file, populated from
 * {@link @epdoc/fs!FS.File} stats rather than EXIF metadata.
 */
export type FileObject = {
  path: FS.FilePath;
  filename: string;
  createdAt?: ISODateString;
  modifiedAt?: ISODateString;
  size: number;
  type: string;
  mimeType?: string;
};

export type FileJson = Partial<{
  file: FileObject;
  imageInfo: Schema.ImageInfo;
  video: Schema.VideoInfo;
  audio: Schema.AudioInfo;
  digitizedAt: ISODateString;
  createdAt: ISODateString;
  modifiedAt: ISODateString;
  hasTimezone: boolean;
  tzOffset: string;
  duration: number;
  application: string;
  camera: Schema.Camera;
  gps: Gps.Location;
  id: Schema.FileId;
}>;
