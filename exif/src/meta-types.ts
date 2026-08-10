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

export type ISODateString = string; // e.g. "2024-01-01T12:00:00Z"

// ============================================================================
// Domain-specific metadata interfaces
// ============================================================================

/**
 * Core EXIF and filesystem metadata tags.
 * Covers file info, image properties, camera/capture settings, dates,
 * GPS coordinates, thumbnails, and maker notes.
 */
export interface ExifMetadata {
  // --- Basic file info ---
  SourceFile: FS.FilePath;
  ExifToolVersion: number;
  FileName: string;
  /** Directory path (string) or structured container info for JPEG with gain map */
  Directory: string | { Item: Record<string, string> }[];
  MIMEType: string;
  FilePermissions?: string; // File access permissions, e.g. "rw-r--r--"
  /** exiftool notice about data that was skipped, e.g. "[minor] The ExtractEmbedded option may find more tags in the movie data". */
  Warning?: string;

  // --- Image dimensions ---
  ImageWidth?: Integer;
  ImageHeight?: Integer;
  ExifImageWidth?: Integer;
  ExifImageHeight?: Integer;
  /** e.g. "3072x4080" */
  ImageSize?: string;
  Megapixels?: number;

  // --- File type and encoding ---
  FileType: string;
  FileTypeExtension: string;
  EncodingProcess?: string;
  ColorSpace?: string;
  BitsPerSample?: Integer;
  ColorComponents?: Integer;
  /** Byte ordering: "Little-endian (Intel, II)" or "Big-endian (Motorola, MM)" */
  ExifByteOrder?: string;

  // --- JPEG/DCT encoding ---
  DCTEncodeVersion?: number; // DCT encoder version
  APP14Flags0?: string; // JPEG APP14 flags (first set)
  APP14Flags1?: string; // JPEG APP14 flags (second set)
  ColorTransform?: string; // JPEG color transform, e.g. "YCbCr"
  YCbCrSubSampling?: string; // Chroma subsampling, e.g. "YCbCr4:4:4 (1 1)"

  // --- Resolution ---
  XResolution?: number; // Horizontal resolution
  YResolution?: number; // Vertical resolution
  ResolutionUnit?: string; // Resolution unit, e.g. "inches", "cm"

  // --- Camera / lens ---
  Make?: string;
  Model?: string;
  LensMake?: string;
  LensModel?: string;
  FocalLengthIn35mmFormat?: string;
  Software?: string;
  SerialNumber?: string;

  // --- Author / copyright ---
  /** Person who created the image (EXIF tag 0x013B). */
  Artist?: string;
  /** Copyright holder (EXIF tag 0x8298). */
  Copyright?: string;
  /** Camera owner name (EXIF tag 0x9C9F). */
  OwnerName?: string;

  // --- Duration ---
  /**
   * Video duration. Default format is a string with units, e.g. `"2.00 s"`,
   * or `"H:MM:SS"`; with `-n` it is a plain number of seconds.
   */
  Duration?: string | number;
  AudioDuration?: string | number;
  MediaDuration?: string | number;
  TrackDuration?: string | number;

  // --- File size & capture settings ---
  FileSize?: string | number; // e.g. "5.8 MB"
  FNumber?: number;
  Aperture?: string | number;
  ExposureTime?: string | number;
  ISO?: number;
  FocalLength?: string | number;
  SubjectDistance?: string | number;
  ExposureProgram?: string; // e.g. "Program AE", "Aperture-priority AE"
  ExifVersion?: string; // EXIF spec version, e.g. "0232"
  ShutterSpeedValue?: string; // e.g. "1/400"
  ApertureValue?: number; // Lens aperture value
  BrightnessValue?: number; // Brightness value in APEX
  ExposureCompensation?: number; // Exposure compensation in EV
  MaxApertureValue?: number; // Maximum lens aperture
  MeteringMode?: string; // e.g. "Center-weighted average", "Multi-segment"
  Flash?: string; // e.g. "Off, Did not fire", "Fired, Auto"
  SensingMethod?: string; // e.g. "One-chip color area"
  SceneType?: string; // e.g. "Directly photographed"
  CustomRendered?: string; // e.g. "Normal process", "Custom"
  ExposureMode?: string; // e.g. "Auto", "Manual"
  WhiteBalance?: string; // e.g. "Auto", "Manual"
  DigitalZoomRatio?: number; // 0 = not used
  SceneCaptureType?: string; // e.g. "Standard", "Landscape", "Portrait"
  Contrast?: string; // e.g. "Normal", "Hard", "Soft"
  Saturation?: string; // e.g. "Normal", "High", "Low"
  Sharpness?: string; // e.g. "Normal", "Hard", "Soft"
  SubjectDistanceRange?: string; // e.g. "Macro", "Close", "Distant"

  // --- EXIF dates ---
  DateTimeOriginal?: ExifDateTime;
  CreateDate?: ExifDateTime;
  DateCreated?: ExifDateTime;
  ModifyDate?: ExifDateTime;
  FileModifyDate?: ExifDateTime;
  FileAccessDate?: ExifDateTime;
  FileInodeChangeDate?: ExifDateTime;

  // --- Sub-second timestamps (exiftool composite) ---
  SubSecDateTimeOriginal?: string;
  SubSecCreateDate?: string;
  SubSecModifyDate?: string;

  // --- Sub-second fractional components (raw EXIF) ---
  SubSecTimeOriginal?: string | Integer;
  SubSecTimeDigitized?: string | Integer;
  SubSecTime?: string | Integer;

  // --- Timezone offsets ---
  OffsetTime?: string; // e.g. "-06:00", "+02:00"
  OffsetTimeOriginal?: string;
  OffsetTimeDigitized?: string;

  // --- Maker notes ---
  MakerNote?: string;
  HdrPlusMakernote?: string;

  // --- Thumbnail ---
  Compression?: string; // Thumbnail compression, e.g. "JPEG (old-style)"
  ThumbnailOffset?: number; // Byte offset of thumbnail data
  ThumbnailLength?: number; // Byte length of thumbnail data
  ThumbnailImage?: string; // Thumbnail image (binary)
  PhotoshopThumbnail?: string; // Photoshop thumbnail (binary)

  // --- GPS ---
  GPSLatitude?: GpsCoordinate;
  GPSLongitude?: GpsCoordinate;
  /** Full GPS position as a single DMS string, e.g. `"9 deg 8' 44.52" N, 83 deg 43' 41.52" W"` (QuickTime Keys composite, equivalent to `GPSPosition`). */
  GPSCoordinates?: string;
  /** Altitude in meters; string form includes units, e.g. "192 m Above Sea Level". */
  GPSAltitude?: number | string;
  GPSLatitudeRef?: GpsLatitudeRef;
  GPSLongitudeRef?: GpsLongitudeRef;
  /** 0 = above sea level, 1 = below. */
  GPSAltitudeRef?: Integer;
  GPSVersionID?: string; // e.g. "2.2.0.0"
  GPSTimeStamp?: string; // UTC time stamp, e.g. "17:25:24"
  GPSImgDirectionRef?: string; // e.g. "Magnetic North", "True North"
  GPSImgDirection?: number; // Direction in degrees
  GPSDateStamp?: string; // Format "YYYY:MM:DD"
}

/**
 * IPTC-IIM metadata tags (the older binary IPTC format, not XMP-based IPTC).
 */
export interface IptcMetadata {
  CurrentIPTCDigest?: string; // IPTC content digest (auto-generated)
  IPTCDigest?: string; // IPTC digest (auto-generated)
  CodedCharacterSet?: string; // Character set, e.g. "UTF8"
  ApplicationRecordVersion?: number; // Application record version
  TimeCreated?: string; // e.g. "11:25:24-06:00"
  DigitalCreationDate?: string; // e.g. "2026:05:29"
  DigitalCreationTime?: string; // e.g. "11:25:24-06:00"

  // --- Author / credit ---
  /** Author/byline (IPTC By-line). */
  'By-line'?: string;
  /** Job title of the byline (IPTC By-lineTitle). */
  'By-lineTitle'?: string;
  /** Credit to the provider (IPTC Credit). */
  Credit?: string;
  /** Original source/owner (IPTC Source). */
  Source?: string;
  /** Contact information (IPTC Contact). */
  Contact?: string;
  /** Person who wrote the caption (IPTC Writer-Editor). */
  'Writer-Editor'?: string;
  /** Copyright notice (IPTC CopyrightNotice). */
  CopyrightNotice?: string;

  // --- Location ---
  /** City (IPTC City). */
  City?: string;
  /** Neighborhood/sublocation (IPTC Sub-location). */
  'Sub-location'?: string;
  /** State or province (IPTC Province-State). */
  'Province-State'?: string;
  /** Country name (IPTC Country-PrimaryLocationName). */
  'Country-PrimaryLocationName'?: string;
  /** ISO 3166-1 country code (IPTC Country-PrimaryLocationCode). */
  'Country-PrimaryLocationCode'?: string;

  DisplayedUnitsX?: string; // Displayed horizontal unit, e.g. "inches"
  DisplayedUnitsY?: string; // Displayed vertical unit, e.g. "inches"
}

/**
 * ICC color profile information embedded in the image.
 */
export interface IccProfileMetadata {
  ProfileCMMType?: string; // CMM type, e.g. "Adobe Systems Inc."
  ProfileVersion?: string; // Profile version, e.g. "2.1.0"
  ProfileClass?: string; // e.g. "Display Device Profile"
  ColorSpaceData?: string; // Color space data, e.g. "RGB "
  ProfileConnectionSpace?: string; // Connection space, e.g. "XYZ "
  ProfileDateTime?: string; // Profile creation date/time
  ProfileFileSignature?: string; // Should be "acsp"
  PrimaryPlatform?: string; // e.g. "Apple Computer Inc."
  CMMFlags?: string; // e.g. "Not Embedded, Independent"
  DeviceManufacturer?: string; // Device manufacturer name
  DeviceModel?: string; // Device model name
  DeviceAttributes?: string; // e.g. "Reflective, Glossy, Positive, Color"
  RenderingIntent?: string; // e.g. "Perceptual"
  ConnectionSpaceIlluminant?: string; // Connection space illuminant values
  ProfileCreator?: string; // e.g. "Adobe Systems Inc."
  ProfileID?: number | string; // Profile identifier
  ProfileCopyright?: string; // Copyright notice
  ProfileDescription?: string; // e.g. "Adobe RGB (1998)"
  MediaWhitePoint?: string; // Media white point chromaticity
  MediaBlackPoint?: string; // Media black point chromaticity
  RedTRC?: string; // Red tone reproduction curve (binary)
  GreenTRC?: string; // Green tone reproduction curve (binary)
  BlueTRC?: string; // Blue tone reproduction curve (binary)
  RedMatrixColumn?: string; // Red matrix column values
  GreenMatrixColumn?: string; // Green matrix column values
  BlueMatrixColumn?: string; // Blue matrix column values
}

/**
 * XMP (Extensible Metadata Platform) tags.
 * These are typically written by Adobe products and other XMP-aware tools.
 */
export interface XmpMetadata {
  // --- Document identifiers ---
  DocumentID?: string; // XMP document ID
  OriginalDocumentID?: string; // Original document ID (before derivations)
  InstanceID?: string; // XMP instance ID
  HasExtendedXMP?: string; // Present when XMP exceeds 64 KB and is split across chunks
  DerivedFrom?: Record<string, unknown>; // XMP DerivedFrom reference
  /** XMP edit history entries */
  History?: Record<string, unknown>[];

  // --- Tool and metadata info ---
  XMPToolkit?: string; // XMP toolkit identifier
  CreatorTool?: string; // Application that created the content
  GFileMetadata?: string; // Google-specific file metadata
  MetadataDate?: string; // Date/time XMP metadata was last modified
  Format?: string; // MIME type from XMP, e.g. "image/jpeg"

  // --- XMP lens and focus ---
  Lens?: string; // Lens description, e.g. "Pixel 7 back camera 6.81mm f/1.85"
  ApproximateFocusDistance?: number; // Focus distance in meters

  // --- Author / rights ---
  /** Human-readable copyright/usage statement (`xmp:Rights`). */
  Rights?: string;
  /** Caption author (`photoshop:CaptionWriter`). */
  CaptionWriter?: string;
  /** Creator's work email (`xmp:CreatorWorkEmail`). */
  CreatorWorkEmail?: string;
  /** Creator's work URL (`xmp:CreatorWorkURL`). */
  CreatorWorkURL?: string;

  // --- Date / location ---
  /**
   * Date from XMP (`dc:Date`), often a partial date such as `"1975"` or
   * `"1975-06"` that EXIF tags cannot represent. Read back from `XMP-dc:Date`.
   */
  Date?: string;

  // --- Location (photoshop / iptcCore) ---
  /** Free-form location (`XMP-iptcCore:Location`). */
  Location?: string;
  /** City (`photoshop:City`). */
  City?: string;
  /** State or province (`photoshop:State`). */
  State?: string;
  /** Country name (`photoshop:Country`). */
  Country?: string;
  /** ISO 3166-1 alpha-2 country code (`XMP-iptcCore:CountryCode`). */
  CountryCode?: string;
  /** Creator's city (`XMP-iptc:CreatorCity`). */
  CreatorCity?: string;
  /** Creator's country (`XMP-iptc:CreatorCountry`). */
  CreatorCountry?: string;
  /** Creator's region (`XMP-iptc:CreatorRegion`). */
  CreatorRegion?: string;
}

/**
 * Adobe Camera Raw / Lightroom develop settings (XMP `crs:` namespace).
 * These describe non-destructive raw processing adjustments. Present in any
 * image edited with Adobe Camera Raw, Lightroom, or Photoshop.
 */
export interface AdobeDevelopSettings {
  // --- Source and version ---
  RawFileName?: string; // Original raw file name
  Version?: string; // ACR/LR version, e.g. "18.4.1"
  ProcessVersion?: number; // Process version (PV), e.g. 15.4

  // --- Basic panel ---
  IncrementalTemperature?: number; // White balance temperature increment
  IncrementalTint?: number; // White balance tint increment
  Exposure2012?: number; // Exposure in EV
  Contrast2012?: string | number; // Contrast adjustment
  Highlights2012?: number; // Highlights recovery
  Shadows2012?: string | number; // Shadows lift
  Whites2012?: string | number; // Whites level
  Blacks2012?: number; // Blacks level
  Texture?: string | number; // Texture enhancement
  Clarity2012?: string | number; // Midtone contrast
  Dehaze?: string | number; // Haze removal
  Vibrance?: string | number; // Non-linear saturation

  // --- Parametric tone curve ---
  ParametricShadows?: number;
  ParametricDarks?: number;
  ParametricLights?: number;
  ParametricHighlights?: number;
  ParametricShadowSplit?: number; // Split point: shadows→darks
  ParametricMidtoneSplit?: number; // Split point: darks→lights
  ParametricHighlightSplit?: number; // Split point: lights→highlights

  // --- Detail ---
  LuminanceSmoothing?: number; // Luminance noise reduction
  ColorNoiseReduction?: number; // Color noise reduction

  // --- HSL / Color (Hue, Saturation, Luminance per color) ---
  HueAdjustmentRed?: number;
  HueAdjustmentOrange?: number;
  HueAdjustmentYellow?: number;
  HueAdjustmentGreen?: number;
  HueAdjustmentAqua?: number;
  HueAdjustmentBlue?: number;
  HueAdjustmentPurple?: number;
  HueAdjustmentMagenta?: number;
  SaturationAdjustmentRed?: number;
  SaturationAdjustmentOrange?: number;
  SaturationAdjustmentYellow?: number;
  SaturationAdjustmentGreen?: number;
  SaturationAdjustmentAqua?: number;
  SaturationAdjustmentBlue?: number;
  SaturationAdjustmentPurple?: number;
  SaturationAdjustmentMagenta?: number;
  LuminanceAdjustmentRed?: number;
  LuminanceAdjustmentOrange?: number;
  LuminanceAdjustmentYellow?: number;
  LuminanceAdjustmentGreen?: number;
  LuminanceAdjustmentAqua?: number;
  LuminanceAdjustmentBlue?: number;
  LuminanceAdjustmentPurple?: number;
  LuminanceAdjustmentMagenta?: number;

  // --- Split toning ---
  SplitToningShadowHue?: number;
  SplitToningShadowSaturation?: number;
  SplitToningHighlightHue?: number;
  SplitToningHighlightSaturation?: number;
  SplitToningBalance?: number;

  // --- Color grading ---
  ColorGradeMidtoneHue?: number;
  ColorGradeMidtoneSat?: number;
  ColorGradeShadowLum?: number;
  ColorGradeMidtoneLum?: number;
  ColorGradeHighlightLum?: number;
  ColorGradeBlending?: number;
  ColorGradeGlobalHue?: number;
  ColorGradeGlobalSat?: number;
  ColorGradeGlobalLum?: number;

  // --- Lens corrections ---
  AutoLateralCA?: number; // Auto chromatic aberration removal
  LensProfileEnable?: number; // Lens profile correction enabled
  LensManualDistortionAmount?: number; // Manual distortion correction
  VignetteAmount?: number; // Lens vignetting correction
  DefringePurpleAmount?: number; // Purple defringe amount
  DefringePurpleHueLo?: number; // Purple defringe low hue threshold
  DefringePurpleHueHi?: number; // Purple defringe high hue threshold
  DefringeGreenAmount?: number; // Green defringe amount
  DefringeGreenHueLo?: number; // Green defringe low hue threshold
  DefringeGreenHueHi?: number; // Green defringe high hue threshold

  // --- Perspective / Transform ---
  PerspectiveUpright?: number; // Upright auto-correction mode
  PerspectiveVertical?: number; // Vertical perspective correction
  PerspectiveHorizontal?: number; // Horizontal perspective correction
  PerspectiveRotate?: number; // Rotation correction
  PerspectiveAspect?: number; // Aspect ratio correction
  PerspectiveScale?: number; // Scale adjustment
  PerspectiveX?: number; // X offset
  PerspectiveY?: number; // Y offset

  // --- Effects ---
  ReshapeAmount?: number; // Shape warp amount
  GrainAmount?: number; // Film grain amount
  PostCropVignetteAmount?: number; // Post-crop vignette amount
  PostCropVignetteMidpoint?: number; // Vignette midpoint
  PostCropVignetteFeather?: number; // Vignette feather
  PostCropVignetteRoundness?: number; // Vignette roundness
  PostCropVignetteStyle?: number; // Vignette style (1=Highlight Priority, 2=Color Priority, 3=Paint Overlay)
  PostCropVignetteHighlightContrast?: number; // Vignette highlight contrast

  // --- Calibration ---
  ShadowTint?: number; // Shadow tint
  RedHue?: number; // Red primary hue
  RedSaturation?: number; // Red primary saturation
  GreenHue?: number; // Green primary hue
  GreenSaturation?: number; // Green primary saturation
  BlueHue?: number; // Blue primary hue
  BlueSaturation?: number; // Blue primary saturation

  // --- HDR / B&W ---
  HDREditMode?: number; // HDR edit mode
  ConvertToGrayscale?: boolean; // Convert to grayscale
  OverrideLookVignette?: boolean; // Override built-in lens vignette

  // --- Tone curves ---
  ToneCurveName2012?: string; // Curve preset name, e.g. "Linear", "Medium Contrast"
  ToneCurvePV2012?: string[]; // Parametric tone curve points
  ToneCurvePV2012Red?: string[]; // Red channel tone curve
  ToneCurvePV2012Green?: string[]; // Green channel tone curve
  ToneCurvePV2012Blue?: string[]; // Blue channel tone curve

  // --- Camera profile ---
  CameraProfile?: string; // Profile name, e.g. "Embedded", "Adobe Standard"
  CameraProfileDigest?: string; // Profile digest hash
  AutoToneDigest?: string; // Auto tone settings digest
  AutoToneDigestNoSat?: string; // Auto tone (no saturation) digest
  HasSettings?: boolean; // Whether develop settings are present

  // --- Crop ---
  CropTop?: number;
  CropLeft?: number;
  CropBottom?: number;
  CropRight?: number;
  CropAngle?: number; // Crop rotation angle
  CropConstrainToWarp?: number; // Crop constrained to warp
  CropConstrainToUnitSquare?: number; // Crop constrained to unit square
  HasCrop?: boolean; // Whether a crop is applied
  AlreadyApplied?: boolean; // Whether settings are baked into the image pixel data
}

/**
 * Exiftool composite (calculated) fields.
 * These are not stored directly but are derived by exiftool from other tags.
 */
export interface CompositeMetadata {
  DateTimeCreated?: string; // Derived from IPTC + EXIF creation tags
  DigitalCreationDateTime?: string; // Derived from IPTC + EXIF digitized tags
  ShutterSpeed?: string; // Derived from ExposureTime, e.g. "1/400"
  GPSDateTime?: string; // Derived from GPSDateStamp + GPSTimeStamp
  GPSPosition?: string; // Derived from GPSLatitude + GPSLongitude
  ScaleFactor35efl?: number; // Scale factor to 35mm-equivalent focal length
  CircleOfConfusion?: string; // Circle of confusion, e.g. "0.009 mm"
  DOF?: string; // Depth of field, e.g. "0.12 m (0.36 - 0.47 m)"
  FOV?: string; // Field of view, e.g. "73.7 deg"
  FocalLength35efl?: string; // 35mm-equivalent with original, e.g. "6.8 mm (35 mm equivalent: 24.0 mm)"
  HyperfocalDistance?: string; // Hyperfocal distance, e.g. "2.86 m"
  LightValue?: number; // Light value at ISO 100
}

/**
 * Video and audio codec/stream metadata.
 */
export interface VideoAudioMetadata {
  // --- Container & Stream Timestamps ---
  /** QuickTime Keys atom creation date (e.g. "2024:10:29 18:43:30-06:00") */
  CreationDate?: ExifDateTime;
  /** QuickTime track creation date */
  TrackCreateDate?: ExifDateTime;
  /** QuickTime media creation date */
  MediaCreateDate?: ExifDateTime;
  /** QuickTime track modification date */
  TrackModifyDate?: ExifDateTime;
  /** QuickTime media modification date */
  MediaModifyDate?: ExifDateTime;

  // --- Container (MP4/QuickTime movie header) ---
  /** File format brand, e.g. "MP4  Base Media v1 [IS0 14496-12:2003]". */
  MajorBrand?: string;
  /** Format minor version, e.g. "2.0.0". */
  MinorVersion?: string;
  /** Compatible format brands, e.g. `["isom", "iso2", "mp41"]`. */
  CompatibleBrands?: string[];
  /** Size in bytes of the movie data chunk. */
  MovieDataSize?: number;
  /** Byte offset of the movie data chunk. */
  MovieDataOffset?: number;
  /** Movie header version (0 or 1). */
  MovieHeaderVersion?: number;
  /** Time scale in units per second for the movie timeline. */
  TimeScale?: number;
  /** Preferred playback rate. */
  PreferredRate?: number;
  /** Time of the start of the preview, e.g. "0 s". */
  PreviewTime?: string | number;
  /** Preview duration, e.g. "0 s". */
  PreviewDuration?: string | number;
  /** Time of the poster/pause frame, e.g. "0 s". */
  PosterTime?: string | number;
  /** Time of the start of the selectable section, e.g. "0 s". */
  SelectionTime?: string | number;
  /** Duration of the selectable section, e.g. "0 s". */
  SelectionDuration?: string | number;
  /** Current movie time (usually 0), e.g. "0 s". */
  CurrentTime?: string | number;
  /** Next unused track ID. */
  NextTrackID?: number;

  // --- Track / media headers ---
  /** Track header version (0 or 1). */
  TrackHeaderVersion?: number;
  /** Track ID number. */
  TrackID?: number;
  /** Track layer (z-order), 0 = front. */
  TrackLayer?: number;
  /** Media header version (0 or 1). */
  MediaHeaderVersion?: number;
  /** Time scale in units per second for the media timeline. */
  MediaTimeScale?: number;
  /** Track handler type, e.g. "vide", "soun", "mett", "NRT Metadata". */
  HandlerType?: string;
  /** Metadata format for timed metadata tracks, e.g. "mett". */
  MetaFormat?: string;

  // --- Video ---
  VideoFrameRate?: number;
  CompressorID?: string;
  CompressorName?: string;
  VideoCodecID?: string;
  VideoCodec?: string;
  VideoCompression?: string;
  Compressor?: string;
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

  // --- Audio ---
  AudioFormat?: string;
  AudioCodecID?: string;
  AudioCodec?: string;
  AudioEncoding?: string;
  AudioChannels?: Integer;
  AudioBitsPerSample?: Integer;
  AudioSampleRate?: number;
  MediaLanguageCode?: string;
  TrackVolume?: string;
  Balance?: number;
  PreferredVolume?: string;
  HandlerDescription?: string;

  // --- Platform / source identifiers ---
  /** Free-form comment. TikTok writes a content ID here, e.g. "vid:v15044gf...". */
  Comment?: string;
  /** Encoder software string, e.g. "Lavf58.76.100" (FFmpeg libavformat). */
  Encoder?: string;
  /** TikTok AI-generated-content info JSON, e.g. '{"aigc_label_type":0}'. */
  Aigc_info?: string;

  // --- Android (QuickTime Keys, com.android.*) ---
  /** Android device manufacturer from the QuickTime Keys atom (`com.android.manufacturer`), e.g. "Google". */
  ComAndroidManufacturer?: string;
  /** Android device model from the QuickTime Keys atom (`com.android.model`), e.g. "Pixel 7". */
  ComAndroidModel?: string;
  /** Capture frame rate recorded by the Google Camera app (`com.android.capture.fps`). */
  ComAndroidCaptureFps?: number;
  /** Google Camera gallery special-type ID, e.g. "...SpecialType-TIMELAPSE". */
  SpecialTypeID?: string;
}

/**
 * PDF metadata.
 * These tags are emitted by exiftool for non-media documents.
 */
export interface PdfMetadata {
  Title?: string;
  Author?: string;
  Subject?: string;
  /** May be a string or, for some formats, an array of strings. */
  Keywords?: string | string[];
  /** PDF producer application, e.g. "Adobe PDF Library 17.0". */
  Producer?: string;
  Description?: string;
  Creator?: string;
  DocumentID?: string;
  InstanceID?: string;
  /** Page count (PDF). */
  PageCount?: Integer;
  /** Page count (Office documents). */
  Pages?: Integer;
  /** PDF version, e.g. "1.7". */
  PDFVersion?: string;
}

/**
 * Document metadata (PDF, Office, EPUB, text, etc.).
 * These tags are emitted by exiftool for non-media documents.
 */
export interface DocumentMetadata {
  Title?: string;
  Author?: string;
  Subject?: string;
  /** May be a string or, for some formats, an array of strings. */
  Keywords?: string | string[];
  /** PDF producer application, e.g. "Adobe PDF Library 17.0". */
  Producer?: string;
  /** Page count (PDF). */
  PageCount?: Integer;
  /** Page count (Office documents). */
  Pages?: Integer;
  /** PDF version, e.g. "1.7". */
  PDFVersion?: string;
}

// ============================================================================
// Combined Metadata interface
// ============================================================================

/**
 * The complete JSON object exiftool emits for one file with `-j`.
 * Fields are the raw tag names as produced by exiftool. Extends all
 * domain-specific metadata interfaces for a unified view.
 */
export interface Metadata
  extends
    ExifMetadata,
    IptcMetadata,
    IccProfileMetadata,
    XmpMetadata,
    AdobeDevelopSettings,
    CompositeMetadata,
    VideoAudioMetadata,
    PdfMetadata,
    DocumentMetadata {}
