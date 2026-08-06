import type { DateTime } from '@epdoc/datetime';
import type { Metadata } from '../meta-types.ts';
import * as Util from './utils.ts';

/** The fields {@link format} requires. */
export interface Input {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export class Meta {
  meta: Metadata;
  constructor(meta: Metadata) {
    this.meta = meta;
  }

  static from(meta: Metadata): Meta {
    return new Meta(meta);
  }

  /**
   * Return the creation date/time from an EXIF metadata object.
   *
   * Alias/Wrapper for getOriginal with fallback to Digitized or OS File Dates.
   */
  created(): DateTime | undefined {
    return this.original() ?? this.digitized(); //  ?? Util.build(this.meta.FileModifyDate);
  }

  /**
   * Return the original capture/recording date/time from internal metadata.
   * Checks EXIF, QuickTime Keys/UserData (videos), XMP, IPTC, and GPS.
   */
  original(): DateTime | undefined {
    const meta = this.meta;
    return (
      // Priority 1: ExifTool Composite Tag (includes subsec & offset)
      Util.build(meta.SubSecDateTimeOriginal) ??
        // Priority 2: Standard EXIF / QuickTime UserData + split offset/subsec
        Util.build(
          meta.DateTimeOriginal,
          meta.SubSecTimeOriginal,
          meta.OffsetTimeOriginal,
        ) ??
        // Priority 3: QuickTime Keys CreationDate (iOS/Android smartphones video capture date + TZ)
        Util.build(meta.CreationDate) ??
        // Priority 4: XMP / IPTC Original Date Tags
        Util.build(meta.DateCreated) ??
        // Priority 5: GPS Timestamp (UTC)
        Util.build(meta.GPSDateTime)
    );
  }
  /**
   * Return the digitization date/time (CreateDate / DigitalCreationDateTime).
   */
  digitized(): DateTime | undefined {
    const meta = this.meta;
    return (
      // Priority 1: ExifTool Composite Tag
      Util.build(meta.SubSecCreateDate) ??
        // Priority 2: Standard EXIF Tags (EXIF DateTimeDigitized is CreateDate in ExifTool)
        Util.build(
          meta.CreateDate,
          meta.SubSecTimeDigitized,
          meta.OffsetTimeDigitized,
        ) ??
        // Priority 3: QuickTime Track and Media Stream Creation Dates
        Util.build(meta.TrackCreateDate) ??
        Util.build(meta.MediaCreateDate) ??
        // Priority 4: XMP / IPTC Digitized Tags
        Util.build(meta.DigitalCreationDateTime) ??
        Util.build(meta.DigitalCreationDate) ??
        // Priority 5: Fallback to Original Date (For native photos/videos where taken == digitized)
        this.original()
    );
  }

  /**
   * Return the metadata modification date/time.
   */
  modified(): DateTime | undefined {
    const meta = this.meta;
    return (
      Util.build(
        meta.SubSecModifyDate ?? meta.ModifyDate,
        meta.SubSecTime,
        meta.OffsetTime,
      ) ??
        // Priority 2: QuickTime Track and Media Stream Modification Dates
        Util.build(meta.TrackModifyDate) ??
        Util.build(meta.MediaModifyDate) ??
        // Priority 3: XMP Metadata Last Modified Date
        Util.build(meta.MetadataDate)
    );
  }

  /**
   * Return the "primary" date/time from an EXIF metadata object, in priority order:
   * original (DateTimeOriginal) → digitized (CreateDate) → modified (ModifyDate).
   */
  primary(): DateTime | undefined {
    return this.created() ?? this.modified();
  }
}
