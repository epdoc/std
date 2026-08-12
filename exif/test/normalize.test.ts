import { assertEquals } from '@std/assert';
import type { Metadata } from '../src/meta-types.ts';
import * as Normalize from '../src/normalize.ts';

function cameraMeta(partial: Record<string, unknown>): Metadata {
  return partial as unknown as Metadata;
}

Deno.test('Normalize.cameraName', async (t) => {
  await t.step('returns undefined when no Make or Model', () => {
    assertEquals(Normalize.cameraName(cameraMeta({})), undefined);
  });

  await t.step('returns the Make when there is no Model', () => {
    assertEquals(Normalize.cameraName(cameraMeta({ Make: 'Nikon' })), 'Nikon');
  });

  await t.step('returns the Model when there is no Make', () => {
    assertEquals(Normalize.cameraName(cameraMeta({ Model: 'D7100' })), 'D7100');
  });

  await t.step('combines Make and Model for an unmapped make', () => {
    assertEquals(Normalize.cameraName(cameraMeta({ Make: 'Canon', Model: 'EOS R5' })), 'Canon EOS R5');
  });

  await t.step('uses the exact models lookup when the model matches', () => {
    assertEquals(
      Normalize.cameraName(cameraMeta({ Make: 'Samsung', Model: 'SM-J737T1' })),
      'Samsung Galaxy J7 Star',
    );
  });

  await t.step('maps DJI model codes to friendly names', () => {
    assertEquals(Normalize.cameraName(cameraMeta({ Make: 'DJI', Model: 'FC3582' })), 'DJI Mini 3 Pro');
  });

  await t.step('uses the model fn to strip the Make from the Model', () => {
    assertEquals(
      Normalize.cameraName(cameraMeta({ Make: 'NIKON CORPORATION', Model: 'NIKON D7100' })),
      'Nikon D7100',
    );
  });

  await t.step('uses the model fn to normalize Google Pixel models', () => {
    assertEquals(
      Normalize.cameraName(cameraMeta({ Make: 'Google', Model: 'PIXEL 7 PRO' })),
      'Google Pixel 7 Pro',
    );
    assertEquals(
      Normalize.cameraName(cameraMeta({ Make: 'Google', Model: 'PIXEL 9 PRO XL' })),
      'Google Pixel 9 Pro XL',
    );
  });

  await t.step('uses Android video tags when Make/Model are absent', () => {
    assertEquals(
      Normalize.cameraName(cameraMeta({ ComAndroidManufacturer: 'Google', ComAndroidModel: 'Pixel 7' })),
      'Google Pixel 7',
    );
  });
});

Deno.test('Normalize.isAppleIphone', async (t) => {
  const iphone = {
    ProfileDescription: 'Display P3',
    ProfileCMMType: 'Apple Computer Inc.',
    ImageWidth: 3024,
    ImageHeight: 4032,
  };

  await t.step('matches Display P3 + 12MP portrait resolution', () => {
    assertEquals(Normalize.isAppleIphone(cameraMeta(iphone)), true);
  });

  await t.step('matches Display P3 + 12MP landscape resolution', () => {
    assertEquals(
      Normalize.isAppleIphone(cameraMeta({ ...iphone, ImageWidth: 4032, ImageHeight: 3024 })),
      true,
    );
  });

  await t.step('requires an Apple profile author', () => {
    assertEquals(
      Normalize.isAppleIphone(cameraMeta({ ...iphone, ProfileCMMType: 'Adobe Systems Inc.' })),
      false,
    );
  });

  await t.step('requires the Display P3 profile', () => {
    assertEquals(
      Normalize.isAppleIphone(cameraMeta({ ...iphone, ProfileDescription: 'Adobe RGB (1998)' })),
      false,
    );
  });

  await t.step('requires the 12MP resolution', () => {
    assertEquals(
      Normalize.isAppleIphone(cameraMeta({ ...iphone, ImageWidth: 1920, ImageHeight: 1080 })),
      false,
    );
  });
});
