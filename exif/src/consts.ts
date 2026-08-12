import type { Metadata } from './meta-types.ts';

export const APP_NORMALIZE_RULES: { pattern: RegExp; label: string | undefined }[] = [
  { pattern: /^Adobe Photoshop Camera Raw /i, label: 'Adobe Camera Raw' },
  { pattern: /^Adobe Lightroom /i, label: 'Adobe Lightroom' },
  { pattern: /^Adobe Photoshop Express /i, label: 'Adobe Photoshop Express' },
  { pattern: /^Adobe Photoshop /i, label: 'Adobe Photoshop' },
  { pattern: /^Snapseed /i, label: 'Snapseed' },
  { pattern: /^Google /i, label: 'Google' },
  { pattern: /^Picasa /i, label: 'Picasa' },
  { pattern: /^Lavf\d/i, label: 'FFmpeg' },
  { pattern: /^HDR\+/i, label: undefined },
];

export type ModelFn = (m: Metadata) => string | undefined;

export interface MakeConfig {
  /** Custom display name for the manufacturer */
  name: string;
  /** A test for the make  */
  test: RegExp;
  /** Custom model mappings (key: upper-cased raw model tag) */
  models?: Record<string, string>;
  model?: ModelFn;
}

export const CAMERA_MAP: Record<string, MakeConfig> = {
  samsung: {
    test: /^samsung/i,
    name: 'Samsung',
    models: {
      'SM-J737T1': 'Galaxy J7 Star',
    },
  },
  dji: {
    test: /^DJI/i,
    name: 'DJI',
    models: {
      FC7203: 'Mavic Mini / Mini SE',
      FC7303: 'Mini 2',
      FC7503: 'Mini 2 SE',
      FC7703: 'Mini 4K',
      FC3682: 'Mini 3',
      FC3582: 'Mini 3 Pro',
      FC8482: 'Mini 4 Pro',
    },
  },
  google: {
    test: /^google/i,
    name: 'Google',
    model: (m: Metadata) => {
      return m.Model?.trim().replace('PIXEL', 'Pixel').replace(/\bPRO\b/g, 'Pro');
    },
    // models: {
    //   'PIXEL 3': 'Pixel 3',
    //   'PIXEL 7': 'Pixel 7',
    //   'PIXEL 7 PRO': 'Pixel 7 Pro',
    //   'PIXEL 8': 'Pixel 8',
    //   'PIXEL 8 PRO': 'Pixel 8 Pro',
    //   'PIXEL 9': 'Pixel 9',
    //   'PIXEL 9 PRO': 'Pixel 9 Pro',
    //   'PIXEL 9 PRO XL': 'Pixel 9 Pro XL',
    //   'PIXEL 6': 'Pixel 6',
    //   'PIXEL 6 PRO': 'Pixel 6 Pro',
    // },
  },
  nikon: {
    test: /^nikon/i,
    name: 'Nikon',
    model: (m: Metadata) => {
      return m.Model?.replace(/nikon/i, '').trim();
    },
  },
};

export const CODEC_MAP: Record<string, string> = {
  'Progressive DCT, Huffman coding': 'pJPEG',
  'Baseline DCT, Huffman coding': 'JPEG',
};

export const REPAIRABLE: string[] = ['WhatsApp', 'TikTok'];
