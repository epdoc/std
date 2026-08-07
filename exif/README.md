# @epdoc/exif

Read and write EXIF metadata via the **exiftool** binary, with GPS parsing, date resolution, and reverse geocoding.

A thin wrapper around the industry-standard `exiftool` command-line tool. {@link Reader} is used for bulk reads that
create one {@link File} per path; {@link File} holds the metadata and provides setters for writing dates, GPS, camera
tags, and arbitrary tags back to the file.

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

The recommended import style is:

```ts
import * as Exif from '@epdoc/exif';
```

This gives you a clean hierarchy: `Exif.Reader`, `Exif.File`, `Exif.Meta.Resolver`, `Exif.Gps`, `Exif.Geo`, etc.

### Reading metadata

#### Bulk read (multiple files)

```ts
import * as Exif from '@epdoc/exif';

const reader = new Exif.Reader();
const files = await reader.read(['/path/to/photo.jpg', '/path/to/video.mp4']);

for (const file of files) {
  console.log(file.path);
  console.log(file.resolver.originatedAt()?.toString());
  console.log(file.resolver.width(), 'x', file.resolver.height());
}
```

#### Single file

```ts
const file = new Exif.File('/path/to/photo.jpg');
await file.getMetadata();
console.log(file.metadata.CreateDate); // "2026:07:31 18:00:00"
```

#### Using typed section getters

File exposes typed getters for each metadata domain:

```ts
// Image-specific fields
console.log(file.image); // { width, height, originatedAt, fNumber, iso, focalLength, ... }

// Video-specific fields
console.log(file.video); // { duration, codec, framerate, rotation, ... }

// Camera info
console.log(file.camera); // { make, model, lensModel, serialNumber, ... }

// GPS coordinates
console.log(file.gps); // { lat, lng, alt? }

// Everything combined
console.log(file.info()); // returns FileInfo with all populated sections
```

### Working with dates

The `Resolver` (accessed via `file.resolver` or `Meta.Resolver.from(metadata)`) provides media-agnostic date resolution
with priority chains across EXIF, QuickTime, XMP, IPTC, and GPS tags:

```ts
import * as Exif from '@epdoc/exif';

const file = new Exif.File('/path/to/photo.jpg');
await file.getMetadata();

// Media dates from embedded metadata (not filesystem)
file.resolver.originatedAt(); // DateTimeOriginal
file.resolver.digitizedAt(); // CreateDate / DigitalCreationDateTime
file.resolver.modifiedAt(); // ModifyDate
file.resolver.createdAt(); // best of originatedAt → digitizedAt
file.resolver.primary(); // best of createdAt → modifiedAt

// Timezone info on the primary date
console.log(file.resolver.hasTimezone); // true/false
console.log(file.resolver.tzOffset); // "+02:00" or undefined

// Media-agnostic properties (works for images, video, audio)
console.log(file.resolver.width()); // content width
console.log(file.resolver.height()); // content height
console.log(file.resolver.duration()); // seconds
console.log(file.resolver.codec()); // e.g. "HEVC; AAC"
```

#### Parsing and formatting dates manually

```ts
import { Meta } from '@epdoc/exif';

// Parse an EXIF date string into components
const parts = Meta.Parse.dateString('2026:07:31 18:00:00.500-06:00');
// { year: 2026, month: 7, day: 31, hour: 18, minute: 0, second: 0, millisecond: 500, tzOffset: '-06:00' }

// Build a DateTime from EXIF tags
const dt = Meta.Resolver.buildDateTime(
  '2026:07:31 18:00:00',
  '500', // SubSecTimeOriginal
  '+02:00', // OffsetTimeOriginal
);

// Format a DateTime back to EXIF form
Meta.Resolver.toExifDateTimeString(dt); // "2026:07:31 18:00:00"
```

### Writing metadata

All writes happen through `File`. Date operations are prepared by the `Resolver` and applied via `File.applyTags()`.
Setters accumulate pending changes; call `write()` to apply them in one exiftool invocation.

#### Writing dates

```ts
import { DateTime } from '@epdoc/datetime';
import * as Exif from '@epdoc/exif';

const file = new Exif.File('/path/to/photo.jpg');
await file.getMetadata();

const dt = DateTime.from('2026-07-31T18:00:00+02:00');

// Set individual dates (returns a tag changeset)
file.applyTags(file.resolver.setOriginatedAt(dt)); // DateTimeOriginal
file.applyTags(file.resolver.setDigitizedAt(dt)); // CreateDate
file.applyTags(file.resolver.setModifiedAt(dt)); // ModifyDate

// Or set all three at once
file.applyTags(file.resolver.setAllDates(dt));

// Shift all dates by a duration (e.g. camera clock drift)
file.applyTags(file.resolver.adjustAllDates({ seconds: 192 }));

// Re-base timestamps to a different timezone
file.applyTags(file.resolver.shiftTimezone('-07:00'));

// Set timezone offset tags without changing wall-clock time
file.applyTags(file.resolver.setTimezoneOffset('+02:00'));

await file.write();
```

The `DateTime` type controls how dates are written:

| DateTime type   | Written date tags                | Offset tags           |
| --------------- | -------------------------------- | --------------------- |
| `ZonedDateTime` | wall-clock time in that timezone | the DateTime's offset |
| `PlainDateTime` | wall-clock time                  | removed (no timezone) |
| `Instant`       | UTC wall-clock time              | `+00:00`              |

#### Writing GPS and camera tags

```ts
// GPS coordinates
file.setGPS({ lat: 51.5074, lng: -0.1278, alt: 12.5 });

// Camera info
file.camera = { make: 'Canon', model: 'EOS R5', lensModel: 'RF 50mm F1.2L' };

// Arbitrary tags
file.setTag('Artist', 'Jane Doe');
file.setTag('Keywords', 'vacation, family');
file.setTag('OldTag', undefined); // deletes the tag

await file.write();
```

#### Dry-run mode

```ts
const reader = new Exif.Reader({ dryRun: true });
const file = new Exif.File('/path/to/photo.jpg', { dryRun: true });
// Logs what would happen without invoking exiftool
```

### Reverse geocoding

The `Geo` namespace provides reverse geocoding via OpenStreetMap's Nominatim API, converting GPS coordinates into EXIF
location tags:

```ts
import * as Exif from '@epdoc/exif';

const file = new Exif.File('/path/to/photo.jpg');
await file.getMetadata();

const gps = file.gps;
if (gps) {
  const nominatim = new Exif.Geo.NominatimApi({ dryRun: false });
  const result = await nominatim.reverse(gps.lat, gps.lng);

  // Convert address to EXIF location tags at desired detail level
  const tags = Exif.Geo.buildLocationTags(
    result.address,
    Exif.Geo.LocationGranularity.city, // country | state | city | sublocation | exact
  );
  // { Country: "United Kingdom", CountryCode: "GB", State: "England", City: "London" }

  file.applyTags(tags);
  await file.write();
}
```

The `LocationGranularity` enum controls how much location detail is written:

| Level         | Tags written                        |
| ------------- | ----------------------------------- |
| `country`     | Country, CountryCode                |
| `state`       | + State                             |
| `city`        | + City                              |
| `sublocation` | + Sub-location (neighbourhood/road) |
| `exact`       | + house number in Sub-location      |

### MakerNotes

The binary MakerNote block is exposed through `File.makerNotes` and included in `File.camera`:

```ts
console.log(file.makerNotes);
console.log(file.camera.makerNotes);
```

## The JSON shape

Exiftool emits EXIF tag names verbatim. Key formats you'll encounter:

| Field                                                     | Format                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `CreateDate`, `DateTimeOriginal`, …                       | `"YYYY:MM:DD HH:MM:SS"` (canonical EXIF form)                          |
| `OffsetTimeOriginal`, `OffsetTimeDigitized`, `OffsetTime` | `"+02:00"`, `"-06:00"`, etc.                                           |
| `SubSecTimeOriginal`, `SubSecTimeDigitized`, `SubSecTime` | fractional seconds as a string                                         |
| `Duration` (video)                                        | `"2.00 s"`, `"H:MM:SS"`, or a number with `-n`                         |
| `GPSLatitude` / `GPSLongitude`                            | DMS string `"51 deg 30' 26.00\" N"` (default) or decimal number (`-n`) |

## License

MIT
