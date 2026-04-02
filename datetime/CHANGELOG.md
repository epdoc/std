# Changelog for @epdoc/datetime

All notable changes to this project will be documented in this file.

## [3.2.3] - 2026-04-02

- Added nearMin and nearMax tests

## [3.2.2] - 2026-04-02

- Added min/max support

## [3.2.1] - 2026-04-02

- Added isDateLike method to DateTime class

## [3.2.0] - 2026-04-02

- Cleaned up API and marked some methods as deprected.

## [3.1.0] - 2026-03-30

- Finished with conversion to DateTime

## [3.0.1] - 2026-03-30

- Formatting only

## [3.0.0] - 2026-03-29

### Major Changes

- **BREAKING**: Migrated internal storage from `Date` to Temporal API (`Temporal.Instant`, `Temporal.PlainDateTime`,
  `Temporal.ZonedDateTime`)
- **BREAKING**: `getTz()` now returns `undefined` for Instant/PlainDateTime (previously always returned a value)
- **BREAKING**: Methods requiring timezone context now throw if called on Instant/PlainDateTime without timezone set

### Added

- New `getTzString()` method returning ISO offset string (e.g., "-05:00")
- New `temporal` getter to access the internal Temporal object
- Support for Temporal objects in constructor

### Changed

- `format()` now uses local timezone for Instant/PlainDateTime
- `toISOLocalString()` now defaults to local timezone for Instant/PlainDateTime
- `formatZDT()` removed erroneous UTC conversion
- Updated `formatZDT()` to properly handle Intl.DateTimeFormat with Temporal objects
