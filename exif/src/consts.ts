export const APP_NORMALIZE_RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /^Adobe Photoshop Camera Raw /i, label: 'Adobe Camera Raw' },
  { pattern: /^Adobe Lightroom /i, label: 'Adobe Lightroom' },
  { pattern: /^Adobe Photoshop Express /i, label: 'Adobe Photoshop Express' },
  { pattern: /^Adobe Photoshop /i, label: 'Adobe Photoshop' },
  { pattern: /^Snapseed /i, label: 'Snapseed' },
  { pattern: /^Google /i, label: 'Google' },
  { pattern: /^Picasa /i, label: 'Picasa' },
  { pattern: /^HDR\+/i, label: 'HDR+' },
];

export const CAMERA_MODEL_MAP: Record<string, Record<string, string>> = {
  DJI: {
    FC7203: 'Mavic Mini / Mini SE',
    FC7303: 'Mini 2',
    FC7503: 'Mini 2 SE',
    FC7703: 'Mini 4K',
    FC3682: 'Mini 3',
    FC3582: 'Mini 3 Pro',
    FC8482: 'Mini 4 Pro',
  },
  Google: {
    'PIXEL 7': 'Pixel 7',
    'PIXEL 7 PRO': 'Pixel 7 Pro',
    'PIXEL 8': 'Pixel 8',
    'PIXEL 8 PRO': 'Pixel 8 Pro',
    'PIXEL 9': 'Pixel 9',
    'PIXEL 9 PRO': 'Pixel 9 Pro',
    'PIXEL 9 PRO XL': 'Pixel 9 Pro XL',
    'PIXEL 6': 'Pixel 6',
    'PIXEL 6 PRO': 'Pixel 6 Pro',
  },
  Nikon: {
    D7100: 'D7100',
  },
};
