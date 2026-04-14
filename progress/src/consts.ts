export const blocks = {
  // spinner: [
  //   ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  //   ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'],
  //   ['▖', '▘', '▝', '▗', '▚', '▞', '█'],
  //   ['◐', '◓', '◑', '◒'],
  // ],
  spinner: {
    // Braille - smoothest and most reliable
    braille: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'], // fav
    brailleCircle: ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'],
    brailleDots: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],

    // Quarter circles - clean and simple
    circles: ['◐', '◓', '◑', '◒'], // fav
    circles8: ['◐', '◔', '◑', '◕', '◒', '◖', '◓', '◗'],
    quadrants: ['◴', '◵', '◶', '◷'],

    // Box drawing - crisp in any terminal
    boxDraw: ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'],
    boxCorners: ['◰', '◳', '◲', '◱'],

    // Simple ASCII - works everywhere
    ascii: ['|', '/', '-', '\\'], // fav
    asciiDots: ['.', 'o', 'O', '0', 'O', 'o', '.'],

    // Block elements - universal
    blocks: ['▖', '▘', '▝', '▗', '▚', '▞', '█'],
    growingBlocks: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂', '▁'], // fav
    thickBlocks: ['▉', '▊', '▋', '▌', '▍', '▎', '▏', '▎', '▍', '▌', '▋', '▊'],
    bouncingBlocks: ['▖', '▘', '▝', '▗'],

    // Simple geometric - reliable
    triangles: ['◢', '◣', '◤', '◥'],
    arrows: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'], // fav
  },
  bounce: {
    ball: [
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
    comet: [
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
  },
  horizontal: ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'],
  vertical: [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
} as const;

export const defaultColor = 0xD02020;
export const favSpinners = ['braille', 'circles', 'ascii', 'growingBlocks', 'arrows', 'triangles'];

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
