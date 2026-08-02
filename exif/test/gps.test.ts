import { assertAlmostEquals, assertEquals } from '@std/assert';
import * as Gps from '../src/gps.ts';

Deno.test('Gps.parse', async (t) => {
  await t.step('returns undefined for missing or empty input', () => {
    assertEquals(Gps.parse(undefined, undefined), undefined);
    assertEquals(Gps.parse(null as unknown as string, undefined), undefined);
    assertEquals(Gps.parse('', undefined), undefined);
    assertEquals(Gps.parse('   ', undefined), undefined);
    assertEquals(Gps.parse(NaN, undefined), undefined);
  });

  await t.step('returns undefined for unparseable strings', () => {
    assertEquals(Gps.parse('not a coordinate', undefined), undefined);
  });

  await t.step('passes through positive decimal numbers', () => {
    assertEquals(Gps.parse(51.5072222, 'N'), 51.5072222);
    assertEquals(Gps.parse(51.5072222, undefined), 51.5072222);
  });

  await t.step('applies S/W single-letter refs to decimal numbers', () => {
    assertEquals(Gps.parse(33.8688, 'S'), -33.8688);
    assertEquals(Gps.parse(122.4194, 'W'), -122.4194);
    assertEquals(Gps.parse(33.8688, 's'), -33.8688);
    assertEquals(Gps.parse(122.4194, 'w'), -122.4194);
  });

  await t.step('applies long-form refs as emitted by exiftool by default', () => {
    assertEquals(Gps.parse(33.8688, 'South'), -33.8688);
    assertEquals(Gps.parse(122.4194, 'West'), -122.4194);
    assertEquals(Gps.parse(51.5072222, 'North'), 51.5072222);
    assertEquals(Gps.parse(2.3522, 'East'), 2.3522);
  });

  await t.step('avoids double negation for already-negative numbers', () => {
    assertEquals(Gps.parse(-33.8688, 'S'), -33.8688);
    assertEquals(Gps.parse(-33.8688, 'South'), -33.8688);
  });

  await t.step('parses numeric strings with refs', () => {
    assertEquals(Gps.parse('51.5072222', 'N'), 51.5072222);
    assertEquals(Gps.parse('9.9281', 'E'), 9.9281);
    assertEquals(Gps.parse('151.2093', 'W'), -151.2093);
    assertEquals(Gps.parse('151.2093', 'West'), -151.2093);
  });

  await t.step('parses DMS with plain space separators', () => {
    assertAlmostEquals(Gps.parse('51 30 26 N', undefined)!, 51 + 30 / 60 + 26 / 3600);
    assertAlmostEquals(Gps.parse('33 52 7.68 S', undefined)!, -(33 + 52 / 60 + 7.68 / 3600));
    assertAlmostEquals(Gps.parse('51 30 26', undefined)!, 51 + 30 / 60 + 26 / 3600);
  });

  await t.step('applies long-form refs to DMS strings', () => {
    assertAlmostEquals(Gps.parse('33 52 7.68', 'South')!, -(33 + 52 / 60 + 7.68 / 3600));
    assertAlmostEquals(Gps.parse('151 12 33.48', 'West')!, -(151 + 12 / 60 + 33.48 / 3600));
  });

  await t.step('parses exiftool DMS format with deg and minute marks', () => {
    assertAlmostEquals(Gps.parse('51 deg 30\' 26.00" N', undefined)!, 51 + 30 / 60 + 26 / 3600);
    assertAlmostEquals(Gps.parse('33 deg 52\' 7.68" S', undefined)!, -(33 + 52 / 60 + 7.68 / 3600));
    assertAlmostEquals(Gps.parse('51 deg 30\' 26.00"', undefined)!, 51 + 30 / 60 + 26 / 3600);
    assertAlmostEquals(Gps.parse("51 deg 30'", undefined)!, 51.5);
    assertAlmostEquals(Gps.parse('51 deg', undefined)!, 51);
  });

  await t.step('prefers the ref argument over an embedded direction', () => {
    assertAlmostEquals(Gps.parse('51 deg 30\' 26.00" N', 'S')!, -(51 + 30 / 60 + 26 / 3600));
    assertAlmostEquals(Gps.parse('33 deg 52\' 7.68" S', 'North')!, 33 + 52 / 60 + 7.68 / 3600);
  });
});

Deno.test('Gps.toDms', async (t) => {
  await t.step('formats northern latitudes', () => {
    assertEquals(Gps.toDms(51.5072222, 'lat', 2), { dms: '51 deg 30\' 26.00"', ref: 'N' });
  });

  await t.step('formats southern latitudes', () => {
    assertEquals(Gps.toDms(-33.8688, 'lat', 2), { dms: '33 deg 52\' 7.68"', ref: 'S' });
  });

  await t.step('formats western longitudes', () => {
    assertEquals(Gps.toDms(-122.4194, 'lng', 2), { dms: '122 deg 25\' 9.84"', ref: 'W' });
  });

  await t.step('formats eastern longitudes', () => {
    assertEquals(Gps.toDms(2.3522, 'lng', 2), { dms: '2 deg 21\' 7.92"', ref: 'E' });
  });

  await t.step('carries rounded seconds into minutes', () => {
    assertEquals(Gps.toDms(51.5166656, 'lat', 2), { dms: '51 deg 31\' 0.00"', ref: 'N' });
  });

  await t.step('respects the second precision option', () => {
    assertEquals(Gps.toDms(51.5072222, 'lat', 0), { dms: '51 deg 30\' 26"', ref: 'N' });
  });

  await t.step('handles whole degrees and sub-degree coordinates', () => {
    assertEquals(Gps.toDms(51, 'lat', 2), { dms: '51 deg 0\' 0.00"', ref: 'N' });
    assertEquals(Gps.toDms(-0.5, 'lat', 2), { dms: '0 deg 30\' 0.00"', ref: 'S' });
  });

  await t.step('round-trips through parse within precision', () => {
    const dms = Gps.toDms(51.5072222, 'lat', 2);
    assertAlmostEquals(Gps.parse(dms.dms, dms.ref)!, 51.5072222, 0.01);
  });
});
