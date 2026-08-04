export { Reader } from './reader.ts';
export { File } from './file.ts';
export * as Date from './date.ts';
export * as Gps from './gps.ts';
export {
  parseBitrate,
  parseDuration,
  parseExposureTime,
  parseFileSize,
  parseFNumber,
  parseFocalLength,
  parseJson,
  parseSubjectDistance,
} from './utils.ts';
export type {
  AudioInfo,
  Camera,
  FileId,
  GpsCoordinate,
  GpsLatitudeRef,
  GpsLongitudeRef,
  ImageInfo,
  Metadata,
  VideoInfo,
} from './exif-schema.ts';
export type { FileObject, IDryRun } from './types.ts';
