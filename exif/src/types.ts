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

export type FileJson = Partial<{
  file: FS.FilePath;
  digitizedAt: ISODateString;
  createdAt: ISODateString;
  modifiedAt: ISODateString;
  hasTimezone: boolean;
  tzOffset: string;
  duration: number;
  camera: Schema.Camera;
  gps: Gps.Location;
  id: Schema.FileId;
}>;
