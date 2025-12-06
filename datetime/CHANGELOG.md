# Changelog

All notable changes to this project will be documented in this file.

## [2.0.5] - 2025-12-06

- Added support for MMMM and MMM in datetime format string

## [2.0.4] - 2025-12-06

- Updated dependencies

## [2.0.3] - 2025-11-13

- Fix TZ parsing bug for TZ=GMT

## [2.0.2] - 2025-11-13

- Update dependencies

## [2.0.1] - 2025-10-13

- Bump version to 2.0.0

## [2.0.0-beta.4] - 2025-10-06

- Made ISOTzDate a subclass of ISODate

## [2.0.0-beta.3] - 2025-10-05

- Changed type of toISOLocalString() to ISOTzDate

## [2.0.0-beta.2] - 2025-10-05

- Update @epdoc/type dependency.

## [2.0.0-beta.1] - 2025-10-05

- Reorganized code into src and test folders, moving utility functions from date.ts to utils.ts.
- Now using TypeScript Branded types for some types.
- Updated dependencies.

## [1.0.9-beta.1] - 2025-09-16

- Fixed google sheets date bug relating to timezones.
- Removed dependency on deprecated @epdoc/type pad function
- Fixed regressions that occured because of partial checkin.

## [1.0.9-alpha.0] - 2025-09-15

- Added IANA timezone support.
- Added back our hack for getting around google sheet tz bug when setting time.

## [1.0.8] - 2025-09-13

- Fixed google sheets date conversion TZ handling.
- Updated dependencies

## [1.0.7] - 2025-08-17

- Updated dependencies and remove `dep.ts`.
