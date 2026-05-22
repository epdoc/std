import { rgb24 } from '@std/fmt/colors';
import type { Integer } from '@epdoc/type';

export interface BytesOptions {
  decimals?: Integer;
  separator?: string;
  unitColor?: number;
}

export function bytes(options?: BytesOptions | Integer): (bytes: unknown) => string {
  const opts: BytesOptions = typeof options === 'number'
    ? { decimals: options }
    : { decimals: 1, separator: ' ', ...options };

  const decimals = opts.decimals ?? 1;
  const separator = opts.separator ?? ' ';

  return (value: unknown): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value ?? '');
    if (num === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

    const i = Math.floor(Math.log(num) / Math.log(k));
    const val = num / Math.pow(k, i);

    const unit = opts.unitColor ? rgb24(sizes[i], opts.unitColor) : sizes[i];
    return `${val.toFixed(dm)}${separator}${unit}`;
  };
}
