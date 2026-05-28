// ==========================================
// 1. Define the TypeScript Types
// ==========================================

export type IconType = typeof Icon;

// ==========================================
// 2. Define the Complete Icon Implementation
// ==========================================

export const Icon = {
  Circle: {
    open: '○',
    filled: '●',
    dot: '‧',
    bullet: '•',
    fisheye: '◉',
    bullseye: '◎',
  },
  Check: {
    standard: '✓',
    heavy: '✔',
    boxOpen: '☑',
  },
  Cross: {
    standard: '✕', // Clean, centered cross (Dingbat \u2715)
    heavy: '✘', // Solid, heavy ballot cross (\u2718)
    ballot: '✗', // Light ballot cross (\u2717)
  },
  Arrow: {
    Line: {
      right: '→',
      left: '←',
      up: '↑',
      down: '↓',
    },
    Double: {
      right: '⇒',
      left: '⇐',
      up: '⇑',
      down: '⇓',
    },
    Ptr: {
      right: '▸',
      left: '◂',
      up: '▴',
      down: '▾',
    },
  },
  Square: {
    open: '□',
    filled: '■',
    smallOpen: '▫',
    smallFilled: '▪',
  },
  Alert: {
    warning: '⚠',
    info: 'ℹ',
    star: '★',
    starOpen: '☆',
  },
} as const;
