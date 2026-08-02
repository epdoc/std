import { assertAlmostEquals, assertEquals } from '@std/assert';
import { decimalToDms, dms2decimal } from '../src/gps.ts';

Deno.test('dms2decimal', async (t) => {
  await t.step('returns undefined for missing or empty input', () => {
    assertEquals(dms2decimal(undefined, undefined), undefined);
    assertEquals(dms2decimal(null as unknown as string, undefined), undefined);
    assertEquals(dms2decimal('', undefined), undefined);
    assertEquals(dms2decimal('   ', undefined), undefined);
    assertEquals(dms2decimal(NaN, undefined), undefined);
  });

  await t.step('returns undefined for unparseable strings', () => {
    assertEquals(dms2decimal('not a coordinate', undefined), undefined);
  });

  await t.step('passes through positive decimal numbers', () => {
    assertEquals(dms2decimal(51.5072222, 'N'), 51.5072222);
    assertEquals(dms2decimal(51.5072222, undefined), 51.5072222);
  });

  await t.step('applies S/W single-letter refs to decimal numbers', () => {
    assertEquals(dms2decimal(33.8688, 'S'), -33.8688);
    assertEquals(dms2decimal(122.4194, 'W'), -122.4194);
    assertEquals(dms2decimal(33.8688, 's'), -33.8688);
    assertEquals(dms2decimal(122.4194, 'w'), -122.4194);
  });

  await t.step('applies long-form refs as emitted by exiftool by default', () => {
    assertEquals(dms2decimal(33.8688, 'South'), -33.8688);
    assertEquals(dms2decimal(122.4194, 'West'), -122.4194);
    assertEquals(dms2decimal(51.5072222, 'North'), 51.5072222);
    assertEquals(dms2decimal(2.3522, 'East'), 2.3522);
  });

  await t.step('avoids double negation for already-negative numbers', () => {
    assertEquals(dms2decimal(-33.8688, 'S'), -33.8688);
    assertEquals(dms2decimal(-33.8688, 'South'), -33.8688);
  });

  await t.step('parses numeric strings with refs', () => {
    assertEquals(dms2decimal('51.5072222', 'N'), 51.5072222);
    assertEquals(dms2decimal('9.9281', 'E'), 9.9281);
    assertEquals(dms2decimal('151.2093', 'W'), -151.2093);
    assertEquals(dms2decimal('151.2093', 'West'), -151.2093);
  });

  await t.step('parses DMS with plain space separators', () => {
    assertAlmostEquals(dms2decimal('51 30 26 N', undefined)!, 51 + 30 / 60 + 26 / 3600);
    assertAlmostEquals(dms2decimal('33 52 7.68 S', undefined)!, -(33 + 52 / 60 + 7.68 / 3600));
    assertAlmostEquals(dms2decimal('51 30 26', undefined)!, 51 + 30 / 60 + 26 / 3600);
  });

  await t.step('applies long-form refs to DMS strings', () => {
    assertAlmostEquals(dms2decimal('33 52 7.68', 'South')!, -(33 + 52 / 60 + 7.68 / 3600));
    assertAlmostEquals(dms2decimal('151 12 33.48', 'West')!, -(151 + 12 / 60 + 33.48 / 3600));
  });

  await t.step('parses exiftool DMS format with deg and minute marks', () => {
    assertAlmostEquals(dms2decimal('51 deg 30\' 26.00" N', undefined)!, 51 + 30 / 60 + 26 / 3600);
    assertAlmostEquals(dms2decimal('33 deg 52\' 7.68" S', undefined)!, -(33 + 52 / 60 + 7.68 / 3600));
    assertAlmostEquals(dms2decimal('51 deg 30\' 26.00"', undefined)!, 51 + 30 / 60 + 26 / 3600);
    assertAlmostEquals(dms2decimal("51 deg 30'", undefined)!, 51.5);
    assertAlmostEquals(dms2decimal('51 deg', undefined)!, 51);
  });

  await t.step('prefers the ref argument over an embedded direction', () => {
    assertAlmostEquals(dms2decimal('51 deg 30\' 26.00" N', 'S')!, -(51 + 30 / 60 + 26 / 3600));
    assertAlmostEquals(dms2decimal('33 deg 52\' 7.68" S', 'North')!, 33 + 52 / 60 + 7.68 / 3600);
  });
});

Deno.test('decimalToDms', async (t) => {
  await t.step('formats northern latitudes', () => {
    assertEquals(decimalToDms(51.5072222, 'lat', 2), { dms: '51 deg 30\' 26.00"', ref: 'N' });
  });

  await t.step('formats southern latitudes', () => {
    assertEquals(decimalToDms(-33.8688, 'lat', 2), { dms: '33 deg 52\' 7.68"', ref: 'S' });
  });

  await t.step('formats western longitudes', () => {
    assertEquals(decimalToDms(-122.4194, 'lng', 2), { dms: '122 deg 25\' 9.84"', ref: 'W' });
  });

  await t.step('formats eastern longitudes', () => {
    assertEquals(decimalToDms(2.3522, 'lng', 2), { dms: '2 deg 21\' 7.92"', ref: 'E' });
  });

  await t.step('carries rounded seconds into minutes', () => {
    assertEquals(decimalToDms(51.5166656, 'lat', 2), { dms: '51 deg 31\' 0.00"', ref: 'N' });
  });

  await t.step('respects the second precision option', () => {
    assertEquals(decimalToDms(51.5072222, 'lat', 0), { dms: '51 deg 30\' 26"', ref: 'N' });
  });

  await t.step('handles whole degrees and sub-degree coordinates', () => {
    assertEquals(decimalToDms(51, 'lat', 2), { dms: '51 deg 0\' 0.00"', ref: 'N' });
    assertEquals(decimalToDms(-0.5, 'lat', 2), { dms: '0 deg 30\' 0.00"', ref: 'S' });
  });

  await t.step('round-trips through dms2decimal within precision', () => {
    const dms = decimalToDms(51.5072222, 'lat', 2);
    assertAlmostEquals(dms2decimal(dms.dms, dms.ref)!, 51.5072222, 0.01);
  });
});
