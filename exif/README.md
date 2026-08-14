# @epdoc/exif

Read and write EXIF metadata via the **exiftool** binary, with GPS parsing, date resolution, reverse geocoding, and
repair of stripped dates.

A thin wrapper around the industry-standard `exiftool` command-line tool. {@link readFiles} performs bulk reads that
create one {@link File} per path; {@link File} holds the metadata and provides typed getters plus setters for writing
dates, GPS, camera tags, location tags, and arbitrary tags back to the file.

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

This gives you a clean hierarchy: `Exif.readFiles`, `Exif.File`, `Exif.Meta.Resolver`, `Exif.Meta.Parse`, `Exif.Gps`,
`Exif.Geo`, etc.

### Reading metadata

#### Bulk read (multiple files)

`readFiles()` reads all files in a single exiftool invocation and returns one `File` per input path. File stats (and
optional digests) are computed in parallel.

```ts
import * as Exif from '@epdoc/exif';

const files = await Exif.readFiles(['/path/to/photo.jpg', '/path/to/video.mp4']);

for (const file of files) {
  console.log(file.path);
  console.log(file.resolver.originatedAt?.toString());
  console.log(file.resolver.width, 'x', file.resolver.height);
}
```

#### Single file

```ts
const file = new Exif.File('/path/to/photo.jpg');
await file.getMetadata();
console.log(file.metadata.CreateDate); // "2026:07:31 18:00:00"
```

#### Using typed section getters

`File` exposes typed getters for each metadata domain:

```ts
// Filesystem-level info (path, size, FS dates)
console.log(file.file);

// Image-specific fields
console.log(file.image); // { width, height, originatedAt, fNumber, iso, focalLength, ... }

// Video-specific fields
console.log(file.video); // { duration, codec, framerate, rotation, ... }

// Camera info
console.log(file.camera); // { make, model, lensModel, serialNumber, ... }

// GPS coordinates
console.log(file.gps); // { lat, lng, alt? }

// App-level info: last editor + detected source producer
console.log(file.app); // { editor, producer }

// Everything combined
console.log(file.info()); // returns FileInfo with all populated sections
```

### Working with dates

The `Resolver` (accessed via `file.resolver` or `Meta.Resolver.from(metadata)`) provides media-agnostic date resolution
with priority chains across EXIF, QuickTime, XMP, IPTC, and GPS tags:

```ts
const file = new Exif.File('/path/to/photo.jpg');
await file.getMetadata();

// Media dates from embedded metadata (not filesystem)
file.resolver.originatedAt; // DateTimeOriginal
file.resolver.digitizedAt; // CreateDate / DigitalCreationDateTime
file.resolver.modifiedAt; // ModifyDate
file.resolver.createdAt; // best of originatedAt → digitizedAt
file.resolver.primary; // best of createdAt → modifiedAt

// Timezone info on the primary date
console.log(file.resolver.hasTimezone); // true/false
console.log(file.resolver.tzOffset); // "+02:00" or undefined

// Media-agnostic properties (works for images, video, audio)
console.log(file.resolver.width); // content width
console.log(file.resolver.height); // content height
console.log(file.resolver.duration); // seconds
console.log(file.resolver.codec); // e.g. "HEVC; AAC"
console.log(file.resolver.producer); // detected source, e.g. "WhatsApp" | "TikTok"
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

All writes happen through `File`. The `Resolver` prepares date changesets and `File.applyTags()` queues them. Setters
accumulate pending changes; call `write()` to apply them in one exiftool invocation.

**Skip-if-unchanged:** every queued value is compared against the value already in the file's metadata (as strings, with
an absent tag and `''` treated as equivalent). If the value would not change the file, the tag is not queued and the
`dirty` flag stays `false` — setters are idempotent and `write()` is a no-op when nothing actually changed.

```ts
const file = new Exif.File('/path/to/photo.jpg');
await file.getMetadata();

file.setTag('City', 'New York');
file.setTag('City', 'New York'); // no-op — already queued
console.log(file.dirty); // true

await file.write(); // returns MetaModHistory[] — { tag, value, previousValue } per change
console.log(file.dirty); // false (pending cleared, metadata invalidated)
```

**Force writes.** The comparison uses the flat read model, which reflects exiftool's priority-merged value. For
group-prefixed tags (`MWG:City`, `XMP-dc:Date`, …) the value being compared may come from a _different_ group than the
one being written. When you need to guarantee a write lands in the targeted group(s) — e.g. normalizing a file whose
groups hold inconsistent values — pass `true` as the `force` argument to bypass the skip:

```ts
file.setTag('MWG:City', 'New York', true); // queue even if flat City already matches
file.applyTags({ 'MWG:City': 'New York', 'MWG:State': 'NY' }, true);
file.setAddressFromLookup(Exif.Geo.Level.city, true); // force-sync all location groups
```

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

Setting a date that already matches the file (e.g. re-running a script) leaves the file clean — `dirty` stays `false`
and `write()` returns an empty array.

#### Writing GPS and camera tags

```ts
// GPS coordinates (converted to DMS; each write skipped if unchanged)
file.setGPS({ lat: 51.5074, lng: -0.1278, alt: 12.5 });

// Camera info
file.setCamera({ make: 'Canon', model: 'EOS R5', lensModel: 'RF 50mm F1.2L' });

// Arbitrary tags
file.setTag('Artist', 'Jane Doe');
file.setTag('Keywords', 'vacation, family');
file.setTag('OldTag', undefined); // deletes the tag (no-op if already absent)

await file.write();
```

#### Dry-run mode

```ts
const file = new Exif.File('/path/to/photo.jpg', { dryRun: true });
await file.getMetadata();

file.applyTags(file.resolver.setAllDates(DateTime.from('2026-07-31T18:00:00+02:00')));
const changes = await file.write(); // computes the changeset but does NOT invoke exiftool

for (const mod of changes) {
  console.log(`${mod.tag}: ${mod.previousValue} → ${mod.value}`);
}
```

### Repairing stripped dates (WhatsApp / TikTok)

TikTok and WhatsApp strip embedded dates when a file is downloaded. `File.repair()` restores them using the filesystem
timestamp (or the filename timestamp for WhatsApp) and tags the file with its source platform.

```ts
const file = new Exif.File('/path/to/IMG-20260406-WA0005.jpg', { dryRun: true });
await file.getMetadata();

const changes = await file.repair(); // MetaModHistory[] of queued changes ([] when nothing to repair)
if (changes.length) {
  for (const mod of changes) {
    console.log(`  ${mod.tag}: ${mod.previousValue} → ${mod.value}`);
  }
  await file.write(); // no-op in dry-run; clears the pending queue
}
```

The repair strategy depends on the detected source (`file.resolver.producer`):

| Source   | Dates written                                                                                                                                                               | `Software` tag |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| WhatsApp | `DateTimeOriginal` from the filename timestamp (local tz) — e.g. `IMG-20260406-WA0005.jpg` → `2026:04:06 00:00:00`; `CreateDate`/`ModifyDate` from the filesystem timestamp | `WhatsApp`     |
| TikTok   | `CreateDate`/`ModifyDate` + `Track*Date`/`Media*Date` from the filesystem timestamp; `DateTimeOriginal` left untouched (re-encode, no meaningful original)                  | `TikTok`       |

Repair is skipped when the file already has valid embedded dates, and the `Software` tag is not queued when it already
carries the producer name. In dry-run mode the changeset is queued but not written, so the returned `MetaModHistory[]`
lets you report exactly what would change; `file.write()` then clears the queue.

### Extracting dates from filenames

`dateFromFilename()` parses datetimes out of media filenames produced by common software — WhatsApp (both the mobile
`IMG-20260406-WA0005.jpg` and macOS `WhatsApp Image 2026-06-29 at 17.20.56.jpeg` conventions), Signal, epoch-ms exports,
and generic compact `YYYYMMDD-HHMMSS` patterns:

```ts
import { dateFromFilename, isWhatsAppFilename } from '@epdoc/exif';

const dt = dateFromFilename('WhatsApp Image 2026-06-29 at 17.20.56.jpeg');
dt?.withTz('local').format('yyyy-MM-dd HH:mm:ss'); // "2026-06-29 17:20:56"

isWhatsAppFilename('IMG-20260406-WA0005.jpg'); // true
```

The returned `DateTime` carries no timezone — callers interpret the wall-clock components in the timezone of their
choosing (`.withTz('local')`, `.withTz('utc')`, etc.).

### Reverse geocoding

The `Geo` namespace provides reverse geocoding via OpenStreetMap's Nominatim API, converting GPS coordinates into EXIF
location tags. `File.lookupAddress()` performs the lookup and `File.setAddressFromLookup()` queues the resulting tags.

```ts
import * as Exif from '@epdoc/exif';

const file = new Exif.File('/path/to/photo.jpg');
await file.getMetadata();

const gps = file.gps;
if (gps) {
  await file.lookupAddress('myapp/1.2.3'); // Nominatim requires an identifying User-Agent

  // Queue location tags at the desired detail level (default: location)
  file.setAddressFromLookup(Exif.Geo.Level.city); // country | state | county | city | location | exact

  await file.write();
}
```

The `Geo.Level` enum controls how much location detail is written:

| Level      | Tags written                          |
| ---------- | ------------------------------------- |
| `country`  | Country, CountryCode                  |
| `state`    | + State                               |
| `county`   | + County                              |
| `city`     | + City                                |
| `location` | + Location/Sub-location, PostalCode   |
| `exact`    | + StreetAddress (house number + road) |

`Geo.AddressLookup` can also be used standalone:

```ts
import * as Exif from '@epdoc/exif';

const lookup = new Exif.Geo.AddressLookup();
await lookup.lookup('myapp/1.2.3', 51.5074, -0.1278);
console.log(lookup.address); // { country, state, city, ... }
console.log(lookup.tags); // full MetaTagDict of MWG/XMP location tags
```

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
