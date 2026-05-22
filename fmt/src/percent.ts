import { rgb24 } from '@std/fmt/colors';
import type { Integer } from '@epdoc/type';

export interface PercentOptions {
  decimals?: Integer;
  separator?: string;
  unitColor?: number;
}

export function percent(options?: PercentOptions | Integer): (ratio: unknown) => string {
  const opts: PercentOptions = typeof options === 'number'
    ? { decimals: options }
    : { decimals: 2, separator: ' ', ...options };

  const decimals = opts.decimals ?? 2;
  const separator = opts.separator ?? ' ';

  return (value: unknown): string => {
    const num = Number(value);
    if (isNaN(num)) return String(value ?? '');

    const unit = opts.unitColor ? rgb24('%', opts.unitColor) : '%';
    const percent = num * 100;
    if (percent < 0.01 && percent > 0) {
      return `<0.01${separator}${unit}`;
    }

    return `${percent.toFixed(decimals)}${separator}${unit}`;
  };
}
