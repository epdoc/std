import type * as FS from '@epdoc/fs/fs';
import type { Integer } from '@epdoc/type';

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

export type ImageInfo = {
  width?: number;
  height?: number;
  fileSize?: string | number;
  mimeType?: string;
  colorSpace?: string;
  fNumber?: number;
  exposureTime?: number;
  iso?: number;
  focalLength?: number;
  focalLength35mm?: number;
  subjectDistance?: number;
};

export type VideoInfo = {
  width?: number;
  height?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  duration?: number;
  codec?: string;
  codecName?: string;
  framerate?: number;
  bitDepth?: number;
  colorRepresentation?: string;
  pixelAspectRatio?: string;
  rotation?: number;
  avgBitrate?: number;
  maxBitrate?: number;
};

export type AudioInfo = {
  format?: string;
  channels?: number;
  sampleRate?: number;
  bitsPerSample?: number;
  language?: string;
};

export type Camera = {
  name?: string;
  make?: string;
  model?: string;
  lensModel?: string;
  lensMake?: string;
  focalLength35mm?: number;
  serialNumber?: string;
  makerNotes?: string;
};

export type FileId = {
  documentId?: string;
  instanceId?: string;
};

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
