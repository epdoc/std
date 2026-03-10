export const blocks = {
  spinner: [
    ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'],
    ['▖', '▘', '▝', '▗', '▚', '▞', '█'],
  ],
  bounce: [
    [
      '(●     )',
      '( ●    )',
      '(  ●   )',
      '(   ●  )',
      '(    ● )',
      '(     ●)',
      '(    ● )',
      '(   ●  )',
      '(  ●   )',
      '( ●    )',
    ],
    [
      '········',
      '█·······',
      '██······',
      '▓██·····',
      '▒▓██····',
      '░▒▓██···',
      '·░▒▓██··',
      '··░▒▓██·',
      '···░▒▓██',
      '····░▒▓█',
      '·····░▒▓',
      '······░▒',
      '·······░',
      '········',
      '·······█',
      '······█▓',
      '·····█▓▒',
      '····█▓▒░',
      '···█▓▒░·',
      '··█▓▒░··',
      '·█▓▒░···',
      '█▓▒░····',
      '▓▒░·····',
      '▒░······',
      '░·······',
      '········',
    ],
  ],
  horizontal: ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'],
  vertical: [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
} as const;
export type Mode = keyof typeof blocks;

export const defaultColor = 0xD02020;

/**
 * A map of named colors to their hexadecimal RGB values.
 *
 * Use these names as the `color` option in {@link ProgressLineOptions} for
 * convenient color selection without specifying hex values directly.
 */
export const colorMap: Record<string, number> = {
  red: 0xD02020,
  green: 0x20D020,
  blue: 0x2020D0,
  yellow: 0xD0D020,
  cyan: 0x20D0D0,
  magenta: 0xD020D0,
  white: 0xF0F0F0,
  black: 0x202020,
  orange: 0xD07020,
  gray: 0x808080,
  grey: 0x808080,
  purple: 0x8020D0,
};
