import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { formatters } from '../src/formatters.ts';

describe('formatters.percent', () => {
  it('should format basic percentage with default 2 decimals and space separator', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(0.5), '50.00 %');
  });

  it('should format zero', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(0), '0.00 %');
  });

  it('should format one (100%)', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(1), '100.00 %');
  });

  it('should format small values below threshold', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(0.00009), '<0.01%');
    assertEquals(fmt(0.00005), '<0.01%');
  });

  it('should format exactly 0.01%', () => {
    const fmt = formatters.percent();
    // 0.0001 * 100 = 0.01, which is exactly the threshold
    assertEquals(fmt(0.0001), '0.01 %');
    assertEquals(fmt(0.00011), '0.01 %');
  });

  it('should format with custom decimals', () => {
    const fmt0 = formatters.percent(0);
    assertEquals(fmt0(0.5), '50 %');

    const fmt1 = formatters.percent(1);
    assertEquals(fmt1(0.5), '50.0 %');

    const fmt3 = formatters.percent(3);
    assertEquals(fmt3(0.12345), '12.345 %');
  });

  it('should support no separator option', () => {
    const fmt = formatters.percent({ decimals: 2, separator: '' });
    assertEquals(fmt(0.5), '50.00%');
  });

  it('should support custom separator', () => {
    const fmt = formatters.percent({ decimals: 1, separator: '_' });
    assertEquals(fmt(0.452), '45.2_%');
  });

  it('should handle negative values', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(-0.5), '-50.00 %');
  });

  it('should handle values greater than 1', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(1.5), '150.00 %');
    assertEquals(fmt(10), '1000.00 %');
  });

  it('should handle NaN gracefully', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(NaN), 'NaN');
  });

  it('should handle undefined and null', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(undefined), '');
    assertEquals(fmt(null), '0.00 %'); // null coerces to 0
  });

  it('should handle non-numeric values', () => {
    const fmt = formatters.percent();
    assertEquals(fmt('not a number'), 'not a number');
  });
});

describe('formatters.bytes', () => {
  it('should format zero bytes', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(0), '0 B');
  });

  it('should format bytes (B)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(500), '500.0 B');
  });

  it('should format kilobytes (KiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1024), '1.0 KiB');
    assertEquals(fmt(1536), '1.5 KiB');
  });

  it('should format megabytes (MiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1048576), '1.0 MiB'); // 1024^2
    assertEquals(fmt(5242880), '5.0 MiB');
  });

  it('should format gigabytes (GiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1073741824), '1.0 GiB'); // 1024^3
    assertEquals(fmt(9663676416), '9.0 GiB');
  });

  it('should format terabytes (TiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1099511627776), '1.0 TiB'); // 1024^4
  });

  it('should format petabytes (PiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1125899906842624), '1.0 PiB'); // 1024^5
  });

  it('should use custom decimals', () => {
    const fmt0 = formatters.bytes(0);
    assertEquals(fmt0(1536), '2 KiB'); // Rounded

    const fmt2 = formatters.bytes(2);
    assertEquals(fmt2(1536), '1.50 KiB');

    const fmt3 = formatters.bytes(3);
    assertEquals(fmt3(1536), '1.500 KiB');
  });

  it('should support no separator option', () => {
    const fmt = formatters.bytes({ decimals: 1, separator: '' });
    assertEquals(fmt(1536), '1.5KiB');
  });

  it('should support custom separator', () => {
    const fmt = formatters.bytes({ decimals: 2, separator: '_' });
    assertEquals(fmt(1536), '1.50_KiB');
  });

  it('should handle fractional bytes with rounding', () => {
    const fmt = formatters.bytes(2);
    assertEquals(fmt(1234567), '1.18 MiB');
  });

  it('should handle NaN gracefully', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(NaN), 'NaN');
  });

  it('should handle undefined and null', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(undefined), '');
    assertEquals(fmt(null), '0 B'); // null coerces to 0
  });

  it('should handle non-numeric values', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt('not a number'), 'not a number');
  });

  it('should handle negative decimals as zero', () => {
    const fmt = formatters.bytes(-1);
    // Should clamp to 0 decimals
    assertEquals(fmt(1536), '2 KiB');
  });
});

describe('formatters.uptime', () => {
  it('should format seconds only', () => {
    const fmt = formatters.uptime();
    assertEquals(fmt(45), '45s');
  });

  it('should format minutes and seconds', () => {
    const fmt = formatters.uptime();
    // 61 seconds = 1m01s, but adaptive(3) will show top 3 units
    const result = fmt(90);
    // Duration formatter with narrow.adaptive(3) will show "1m30s"
    assertEquals(result, '1m30s');
  });

  it('should format hours and minutes', () => {
    const fmt = formatters.uptime();
    // 3661 seconds = 1h 1m 1s, adaptive(3) shows "1h01m01s"
    const result = fmt(3661);
    assertEquals(result, '1h01m01s');
  });

  it('should format days, hours, and minutes', () => {
    const fmt = formatters.uptime();
    // 2700090 seconds = 31d 6h 1m 30s, adaptive(3) shows top 3: "31d06h01m"
    const result = fmt(2700090);
    assertEquals(result, '31d06h01m');
  });

  it('should format zero seconds', () => {
    const fmt = formatters.uptime();
    // Duration formatter outputs with 3 decimals for sub-second values
    assertEquals(fmt(0), '0.000s');
  });

  it('should format one day exactly', () => {
    const fmt = formatters.uptime();
    const result = fmt(86400); // 1 day
    assertEquals(result, '1d');
  });

  it('should handle NaN gracefully', () => {
    const fmt = formatters.uptime();
    assertEquals(fmt(NaN), 'NaN');
  });

  it('should handle undefined and null', () => {
    const fmt = formatters.uptime();
    assertEquals(fmt(undefined), '');
    assertEquals(fmt(null), '0.000s'); // null coerces to 0
  });

  it('should handle non-numeric values', () => {
    const fmt = formatters.uptime();
    assertEquals(fmt('not a number'), 'not a number');
  });

  it('should handle fractional seconds', () => {
    const fmt = formatters.uptime();
    // Should work with fractional input
    const result = fmt(90.5);
    // Duration handles milliseconds, so 90.5s = 90500ms
    assertEquals(result, '1m30s');
  });

  it('should support space separator option', () => {
    const fmt = formatters.uptime({ separator: ' ' });
    const result = fmt(2700090); // 31d06h01m
    assertEquals(result, '31 d 06 h 01 m');
  });

  it('should support custom units count', () => {
    const fmt2 = formatters.uptime({ units: 2 });
    assertEquals(fmt2(2700090), '31d06h'); // Only top 2 units

    const fmt1 = formatters.uptime({ units: 1 });
    assertEquals(fmt1(2700090), '31d'); // Only top 1 unit
  });

  it('should support combining separator and units', () => {
    const fmt = formatters.uptime({ separator: ' ', units: 2 });
    assertEquals(fmt(3661), '1 h 01 m'); // 1h 1m 1s, but only 2 units
  });
});
