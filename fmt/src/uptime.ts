import { Duration } from '@epdoc/duration';
import { rgb24 } from '@std/fmt/colors';
import type { Integer } from '@epdoc/type';

export interface UptimeOptions {
  separator?: string;
  unitColor?: number;
  units?: Integer;
}

export function uptime(options?: UptimeOptions): (seconds: unknown) => string {
  const opts: UptimeOptions = { separator: '', units: 3, ...options };
  const separator = opts.separator ?? '';
  const units = opts.units ?? 3;

  return (value: unknown): string => {
    const seconds = Number(value);
    if (isNaN(seconds)) return String(value ?? '');

    const formatted = new Duration.Formatter().narrow.adaptive(units).format(seconds * 1000);

    if (separator === '' && !opts.unitColor) {
      return formatted;
    }

    const parts = formatted.match(/(\d+)([a-z]+)/gi) || [];
    if (parts.length === 0) return formatted;

    return parts.map((part) => {
      const match = part.match(/^(\d+)([a-z]+)$/i);
      if (!match) return part;

      const [, value, unit] = match;
      const styledUnit = opts.unitColor ? rgb24(unit, opts.unitColor) : unit;
      return `${value}${separator}${styledUnit}`;
    }).join(separator);
  };
}
