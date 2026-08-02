# @epdoc/exif

Read and write EXIF metadata via the **exiftool** binary.

A thin wrapper around the industry-standard `exiftool` command-line tool. `Exiftool` is used for bulk reads that create
one {@link File} per path; {@link File} holds the metadata and provides setters for writing dates, offsets, and
arbitrary tags back to the file.

## Why exiftool instead of a native JS library?

We intentionally shell out to `exiftool` rather than parse metadata in JavaScript:

- **It's the industry standard.** Exiftool is the de facto reference implementation for metadata across virtually every
  camera, phone, and media format.
- **Support breadth.** exiftool understands an enormous number of tags and formats (EXIF, IPTC, XMP, MakerNotes, GPS,
  video/audio formats like MP4/MKV, raw camera formats, and more).
- **Performance.** exiftool is a compiled Perl binary tuned for bulk processing; reading a file's metadata is a single
  fast subprocess call. With `-j`, we get a complete JSON document per file in one invocation.
- **Reliability & maintenance.** exiftool is battle-tested and actively maintained.

The trade-off is that `exiftool` must be installed on the machine. The wrapper uses `@epdoc/cmd`, so it is dry-run aware
and the binary is invoked only when you call it.

## Installation

```bash
deno add jsr:@epdoc/exif
```

The `exiftool` binary must be on `PATH`:

```bash
# macOS
brew install exiftool

# Debian/Ubuntu
apt install exiftool
```

## Usage

### Bulk read

```ts
import { Exiftool, getMetaDateTime } from '@epdoc/exif';

const exiftool = new Exiftool();
const [file] = await exiftool.getInfo(['/path/to/video.mp4']);

const meta = await file.getMetadata();
console.log(meta.CreateDate); // "2026:07:31 18:00:00"
console.log(meta.ImageWidth); // 1920
console.log(file.duration); // "2.00 s" -> 2
```

`getInfo` runs `exiftool -j <files...>` and returns one {@link File} per input file.

### Date & time helpers

Exif dates are read in canonical EXIF form (`"YYYY:MM:DD HH:MM:SS"`) so that a missing timezone can be distinguished
from an explicit one. Helpers parse that form and build {@link @epdoc/datetime!DateTime} values.

```ts
import { buildExifDateTime, getMetaDateTime, parseExifDateTime } from '@epdoc/exif';

const parts = parseExifDateTime('2026:07:31 18:00:00.500-06:00');
// { year: 2026, month: 7, day: 31, hour: 18, minute: 0, second: 0, millisecond: 500, tzOffset: '-06:00' }

// DateTime from a base tag + separate sub-second/tz tags:
const { dateTime, tzOffset, hasTimezone } =
  buildExifDateTime(meta.SubSecCreateDate ?? meta.CreateDate, meta.SubSecTimeDigitized, meta.OffsetTimeDigitized) ?? {};

// Highest-priority date on a metadata object (original -> digitized -> modified):
const primary = getMetaDateTime(meta);
if (!primary.hasTimezone) {
  // timezone was not recorded in the file
}
```

Use {@link parseExifTzOffset} to convert `"-06:00"` to intuitive signed minutes (positive = ahead of UTC) and {@link
formatExifDateTime} to write components back in exiftool's format.

### Write / modify tags

All writes happen through {@link File}. Setters accumulate pending changes in a Map; call `write()` to apply them in one
exiftool invocation.

```ts
import { DateTime } from '@epdoc/datetime';
import { File } from '@epdoc/exif';

const file = new File('/path/to/photo.jpg');
await file.getMetadata();

// Set creation date and timezone
file.setCreatedAt(DateTime.from('2026-07-31T18:00:00+02:00'));
file.setTimezoneOffset('+02:00');

// Or set all date tags at once
file.setAllDates(DateTime.from('2026-07-31T18:00:00+02:00'));

// Arbitrary tags (GPS, location, keywords, etc.)
file.setTag('GPSLatitude', '51.5074');
file.setTag('Artist', undefined); // deletes the tag

await file.write();
```

Date setters accept {@link @epdoc/datetime!DateTime} only:

| DateTime type   | Written date tags                | Offset tags           |
| --------------- | -------------------------------- | --------------------- |
| `ZonedDateTime` | wall-clock time in that timezone | the DateTime's offset |
| `PlainDateTime` | wall-clock time                  | removed (no timezone) |
| `Instant`       | UTC wall-clock time              | `+00:00`              |

The dirty flag tells you whether there are pending changes:

```ts
file.setModifiedAt(DateTime.fromComponents(2026, 7, 31, 18, 0, 0));
console.log(file.dirty); // true
await file.write();
console.log(file.dirty); // false
```

`new Exiftool({ dryRun: true })` and `new File(path, { dryRun: true })` log what they would do without invoking the
binary.

## The JSON shape

Exiftool emits EXIF tag names verbatim. Key formats you'll encounter:

| Field                                                     | Format                                                                |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `CreateDate`, `DateTimeOriginal`, …                       | `"YYYY:MM:DD HH:MM:SS"` (canonical EXIF form)                         |
| `OffsetTimeOriginal`, `OffsetTimeDigitized`, `OffsetTime` | `"+02:00"`, `"-06:00"`, etc.                                          |
| `SubSecTimeOriginal`, `SubSecTimeDigitized`, `SubSecTime` | fractional seconds as a string                                        |
| `Duration` (video)                                        | `"2.00 s"`, `"H:MM:SS"`, or a number with `-n` — see `File.duration`  |
| `GPSLatitude` / `GPSLongitude`                            | DMS string `"51 deg 30' 26.00" N"` (default) or decimal number (`-n`) |

See [`exif-schema.ts`](src/exif-schema.ts) for the precise types.

## License

MIT
