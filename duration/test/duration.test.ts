import { Duration, duration, Time } from '../src/mod.ts';
import { assertEquals } from '@std/assert';

Deno.test('duration-util', async (t) => {
  await t.step('digital', async (t) => {
    await t.step('defaults', () => {
      assertEquals(new Duration.Formatter().format(-4443454), '1:14:03.454');
      assertEquals(new Duration.Formatter().format(-4443454), '1:14:03.454');
      assertEquals(new Duration.Formatter().format(968588820), '11d05:03:08.820');
      assertEquals(new Duration.Formatter().format(982440990), '11d08:54:00.990');
      assertEquals(new Duration.Formatter().format(982440990), '11d08:54:00.990');
      assertEquals(new Duration.Formatter().options().format(982440990), '11d08:54:00.990');
      assertEquals(new Duration.Formatter().format(3454), '00:03.454');
      assertEquals(new Duration.Formatter().format(455), '00:00.455');
      assertEquals(new Duration.Formatter().format(1), '00:00.001');
      assertEquals(new Duration.Formatter().format(0), '00:00.000');
    });
    await t.step('fractionalDigits', () => {
      let n = 3454.345898;
      assertEquals(duration().digital.format(n), '00:03.454');
      assertEquals(new Duration.Formatter().digital.fractionalDigits(6).format(n), '00:03.454345');
      assertEquals(new Duration.Formatter().digital.fractionalDigits(9).format(n), '00:03.454345898');
      assertEquals(new Duration.Formatter().digital.fractionalDigits(7).format(n), '00:03.4543458');
      assertEquals(new Duration.Formatter().digital.fractionalDigits(1).format(n), '00:03.4');
      assertEquals(new Duration.Formatter().digital.fractionalDigits(2).format(n), '00:03.45');
      n += 3 * Time.Measures.minutes;
      assertEquals(new Duration.Formatter().digital.fractionalDigits(6).format(n), '03:03.454345');
      assertEquals(new Duration.Formatter().digital.fractionalDigits(9).format(n), '03:03.454345897');
      assertEquals(new Duration.Formatter().digital.fractionalDigits(7).format(n), '03:03.4543458');
      assertEquals(new Duration.Formatter().digital.fractionalDigits(1).format(n), '03:03.4');
      assertEquals(new Duration.Formatter().digital.fractionalDigits(2).format(n), '03:03.45');
    });
    await t.step('years support', () => {
      const oneYear = Time.Measures.years;
      assertEquals(new Duration.Formatter().digital.format(oneYear), '1y00:00.000');
      assertEquals(new Duration.Formatter().digital.format(oneYear + 5 * Time.Measures.days), '1y5d00:00.000');
      assertEquals(new Duration.Formatter().digital.format(2.5 * oneYear), '2y182d15:00:00.000');
    });
  });
  await t.step('narrow', async (t) => {
    await t.step('defaults', () => {
      assertEquals(new Duration.Formatter().narrow.format(-4443454), '1h14m03.454s');
      assertEquals(new Duration.Formatter().narrow.format(968588820), '11d05h03m08.820s');
      assertEquals(new Duration.Formatter().narrow.format(982440990), '11d08h54m00.990s');
      assertEquals(new Duration.Formatter().narrow.format(3454), '3.454s');
      assertEquals(new Duration.Formatter().narrow.format(455), '0.455s');
      assertEquals(new Duration.Formatter().narrow.format(1), '0.001s');
      assertEquals(new Duration.Formatter().narrow.format(0), '0.000s');
    });
    await t.step('fractionalDigits', () => {
      let n = 3454.345898;
      assertEquals(new Duration.Formatter().narrow.format(n), '3.454s');
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(6).format(n), '3.454345s');
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(9).format(n), '3.454345898s');
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(7).format(n), '3.4543458s');
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(1).format(n), '3.4s');
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(2).format(n), '3.45s');
      n += 3 * Time.Measures.minutes;
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(9).format(n), '3m03.454345897s');
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(7).format(n), '3m03.4543458s');
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(1).format(n), '3m03.4s');
      n += 8 * Time.Measures.hours;
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(9).format(n), '8h03m03.454345897s');
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(7).format(n), '8h03m03.4543458s');
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(1).format(n), '8h03m03.4s');
    });
    await t.step('fractionalDigits in years', () => {
      const n = -1760451163065;
      assertEquals(new Duration.Formatter().narrow.fractionalDigits(3).format(n), '55y286d20h12m43.065s');
    });
    await t.step('years support', () => {
      const oneYear = Time.Measures.years;
      assertEquals(new Duration.Formatter().narrow.format(oneYear), '1y00.000s');
      assertEquals(new Duration.Formatter().narrow.format(oneYear + 5 * Time.Measures.days), '1y5d00.000s');
      assertEquals(new Duration.Formatter().narrow.format(2.5 * oneYear), '2y182d15h00m00.000s');
    });
  });
  await t.step('adaptive', async (t) => {
    await t.step('narrow format', async (t) => {
      await t.step('basic adaptive functionality', () => {
        const n = -1760451163065;
        assertEquals(new Duration.Formatter().narrow.adaptive(2).format(n), '55y286d');
        assertEquals(new Duration.Formatter().narrow.adaptive(3).format(n), '55y286d20h');
        assertEquals(new Duration.Formatter().narrow.adaptive(4).format(n), '55y286d20h12m');
        assertEquals(new Duration.Formatter().narrow.adaptive(1).format(n), '55y');
      });
      await t.step('adaptive with zero intermediate units', () => {
        const n = 2 * Time.Measures.years + 5 * Time.Measures.hours;
        assertEquals(new Duration.Formatter().narrow.adaptive(2).format(n), '2y');
        assertEquals(new Duration.Formatter().narrow.adaptive(3).format(n), '2y05h');
      });
      await t.step('adaptive starting from smaller units', () => {
        const n = 5 * Time.Measures.hours + 30 * Time.Measures.minutes + 15 * Time.Measures.seconds;
        assertEquals(new Duration.Formatter().narrow.adaptive(2).format(n), '5h30m');
        assertEquals(new Duration.Formatter().narrow.adaptive(3).format(n), '5h30m15s');
        assertEquals(new Duration.Formatter().narrow.adaptive(1).format(n), '5h');
      });
      await t.step('adaptive with only seconds', () => {
        const n = 45123;
        assertEquals(new Duration.Formatter().narrow.adaptive(1).format(n), '45s');
        assertEquals(new Duration.Formatter().narrow.adaptive(2).format(n), '45s');
      });
      await t.step('adaptive edge cases', () => {
        assertEquals(new Duration.Formatter().narrow.adaptive(0).format(1000), '1.000s');
        assertEquals(new Duration.Formatter().narrow.adaptive(10).format(1000), '1s');
      });
      await t.step('adaptiveDisplay controls trailing zeros', () => {
        const n = 3661000;
        assertEquals(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(n), '1h01m');
        assertEquals(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('always').format(n), '1h01m');

        const n2 = 3600000;
        assertEquals(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(n2), '1h');
        assertEquals(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('always').format(n2), '1h00m');

        const n3 = 7323000;
        assertEquals(new Duration.Formatter().narrow.adaptive(3).adaptiveDisplay('auto').format(n3), '2h02m03s');
        assertEquals(new Duration.Formatter().narrow.adaptive(3).adaptiveDisplay('always').format(n3), '2h02m03s');
        assertEquals(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(n3), '2h02m');
        assertEquals(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('always').format(n3), '2h02m');

        const n4 = 7203000;
        assertEquals(new Duration.Formatter().narrow.adaptive(3).adaptiveDisplay('auto').format(n4), '2h00m03s');
        assertEquals(new Duration.Formatter().narrow.adaptive(3).adaptiveDisplay('always').format(n4), '2h00m03s');
      });
      await t.step('adaptiveDisplay default behavior', () => {
        const n = 3600000;
        assertEquals(new Duration.Formatter().narrow.adaptive(2).format(n), '1h');
        assertEquals(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(n), '1h');
      });
      await t.step('adaptiveDisplay with different formats', () => {
        const n = 3600000;
        assertEquals(new Duration.Formatter().digital.adaptive(2).adaptiveDisplay('auto').format(n), '1:');
        assertEquals(new Duration.Formatter().digital.adaptive(2).adaptiveDisplay('always').format(n), '1:00:');

        assertEquals(new Duration.Formatter().long.adaptive(2).adaptiveDisplay('auto').format(n), '1 hour');
        assertEquals(
          new Duration.Formatter().long.adaptive(2).adaptiveDisplay('always').format(n),
          '1 hour, 0 minutes',
        );
      });
    });
    await t.step('digital format', async (t) => {
      await t.step('basic adaptive functionality', () => {
        const n = -1760451163065;
        assertEquals(new Duration.Formatter().digital.adaptive(2).format(n), '55y286d');
        assertEquals(new Duration.Formatter().digital.adaptive(3).format(n), '55y286d20:');
      });
    });
    await t.step('long format', async (t) => {
      await t.step('basic adaptive functionality', () => {
        const n = 5 * Time.Measures.hours + 30 * Time.Measures.minutes + 15 * Time.Measures.seconds;
        assertEquals(new Duration.Formatter().long.adaptive(2).format(n), '5 hours, 30 minutes');
      });
    });
  });
  await t.step('years edge cases', async (t) => {
    await t.step('very large durations', () => {
      const centuryMs = 100 * Time.Measures.years;
      assertEquals(new Duration.Formatter().narrow.format(centuryMs), '100y00.000s');
      assertEquals(new Duration.Formatter().narrow.adaptive(1).format(centuryMs), '100y');
    });
    await t.step('fractional years', () => {
      const n = 1.5 * Time.Measures.years;
      assertEquals(new Duration.Formatter().narrow.format(n), '1y182d15h00m00.000s');
      assertEquals(new Duration.Formatter().narrow.adaptive(2).format(n), '1y182d');
    });
    await t.step('years with zero days', () => {
      const n = 2 * Time.Measures.years + 3 * Time.Measures.hours;
      assertEquals(new Duration.Formatter().narrow.adaptive(3).format(n), '2y03h');
    });
  });
  await t.step('long', async (t) => {
    await t.step('defaults', () => {
      assertEquals(new Duration.Formatter().long.format(-4443454), '1 hour, 14 minutes, 3 seconds, 454 milliseconds');
    });
    await t.step('fractionalDigits', () => {
      let n = 3454.345898;
      const formatter = new Duration.Formatter().long;
      assertEquals(formatter.digits(9).format(n), '3 seconds, 454 milliseconds, 345 microseconds, 898 nanoseconds');
      assertEquals(formatter.digits(8).format(n), '3 seconds, 454 milliseconds, 345 microseconds, 898 nanoseconds');
      assertEquals(formatter.digits(3).format(n), '3 seconds, 454 milliseconds');
      assertEquals(formatter.digits(6).format(n), '3 seconds, 454 milliseconds, 345 microseconds');
      assertEquals(formatter.digits(7).format(n), '3 seconds, 454 milliseconds, 345 microseconds, 898 nanoseconds');
      assertEquals(formatter.digits(1).format(n), '3 seconds, 454 milliseconds');
      assertEquals(formatter.digits(2).format(n), '3 seconds, 454 milliseconds');
      n += 3 * Time.Measures.minutes;
      assertEquals(
        formatter.digits(9).format(n),
        '3 minutes, 3 seconds, 454 milliseconds, 345 microseconds, 897 nanoseconds',
      );
      assertEquals(
        formatter.digits(7).format(n),
        '3 minutes, 3 seconds, 454 milliseconds, 345 microseconds, 897 nanoseconds',
      );
      assertEquals(formatter.digits(1).format(n), '3 minutes, 3 seconds, 454 milliseconds');
      n += 8 * Time.Measures.hours;
      assertEquals(
        formatter.digits(9).format(n),
        '8 hours, 3 minutes, 3 seconds, 454 milliseconds, 345 microseconds, 897 nanoseconds',
      );
      assertEquals(
        formatter.digits(7).format(n),
        '8 hours, 3 minutes, 3 seconds, 454 milliseconds, 345 microseconds, 897 nanoseconds',
      );
      assertEquals(formatter.digits(1).format(n), '8 hours, 3 minutes, 3 seconds, 454 milliseconds');
    });
    await t.step('years support', () => {
      const oneYear = Time.Measures.years;
      assertEquals(new Duration.Formatter().long.format(oneYear), '1 year');
      assertEquals(new Duration.Formatter().long.format(2 * oneYear + 5 * Time.Measures.days), '2 years, 5 days');
    });
  });
  await t.step('short', async (t) => {
    await t.step('defaults', () => {
      assertEquals(new Duration.Formatter().short.format(-4443454), '1 hr 14 min 3 sec 454 ms');
      assertEquals(new Duration.Formatter().short.separator('; ').format(-4443454), '1 hr; 14 min; 3 sec; 454 ms');
    });
    await t.step('fractionalDigits', () => {
      let n = 3454.345898;
      const formatter = new Duration.Formatter().short;
      assertEquals(formatter.digits(9).format(n), '3 sec 454 ms 345 μs 898 ns');
      assertEquals(formatter.digits(8).format(n), '3 sec 454 ms 345 μs 898 ns');
      assertEquals(formatter.digits(3).format(n), '3 sec 454 ms');
      assertEquals(formatter.digits(6).format(n), '3 sec 454 ms 345 μs');
      assertEquals(formatter.digits(7).format(n), '3 sec 454 ms 345 μs 898 ns');
      assertEquals(formatter.digits(1).format(n), '3 sec 454 ms');
      assertEquals(formatter.digits(2).format(n), '3 sec 454 ms');
      n += 3 * Time.Measures.minutes;
      assertEquals(formatter.digits(9).format(n), '3 min 3 sec 454 ms 345 μs 897 ns');
      assertEquals(formatter.digits(7).format(n), '3 min 3 sec 454 ms 345 μs 897 ns');
      assertEquals(formatter.digits(1).format(n), '3 min 3 sec 454 ms');
      n += 8 * Time.Measures.hours;
      assertEquals(formatter.digits(9).format(n), '8 hr 3 min 3 sec 454 ms 345 μs 897 ns');
      assertEquals(formatter.digits(7).format(n), '8 hr 3 min 3 sec 454 ms 345 μs 897 ns');
      assertEquals(formatter.digits(1).format(n), '8 hr 3 min 3 sec 454 ms');
    });
    await t.step('years support', () => {
      const oneYear = Time.Measures.years;
      assertEquals(new Duration.Formatter().short.format(oneYear), '1 yr');
      assertEquals(new Duration.Formatter().short.format(2 * oneYear + 5 * Time.Measures.days), '2 yrs 5 days');
    });
  });
  await t.step('general', async (t) => {
    await t.step('separator', () => {
      const n = 3454.345898;
      const formatter = new Duration.Formatter().long;
      assertEquals(
        formatter.digits(9).separator('; ').format(n),
        '3 seconds; 454 milliseconds; 345 microseconds; 898 nanoseconds',
      );
      assertEquals(formatter.short.digits(3).separator(':').format(n), '3 sec:454 ms');
    });
    await t.step('zero duration', () => {
      assertEquals(new Duration.Formatter().narrow.adaptive(2).format(0), '0.000s');
      assertEquals(new Duration.Formatter().digital.adaptive(3).format(0), '00:00.000');
    });
  });
  await t.step('internationalization', async (t) => {
    await t.step('French (fr)', () => {
      let n = 3454.345898 + 3 * Time.Measures.minutes + 8 * Time.Measures.hours;
      const r1 = new Duration.Formatter('fr').short.separator('; ').format(-4443454);
      assertEquals(r1.replace(/[^\S ]/g, ' '), '1 h; 14 min; 3 s; 454 ms');
      const r2 = new Duration.Formatter('fr').short.digits(9).format(n);
      assertEquals(r2.replace(/[^\S ]/g, ' '), '8 h 3 min 3 s 454 ms 345 μs 897 ns');
      n += +452 * Time.Measures.days;
      const r3 = new Duration.Formatter('fr').long.digits(6).format(n);
      assertEquals(
        r3.replace(/[^\S ]/g, ' '),
        '1 an, 87 jours, 2 heures, 3 minutes, 3 secondes, 454 millisecondes, 345 microsecondes',
      );
      const n2 = -1760451163065;
      assertEquals(new Duration.Formatter('fr').digital.adaptive(2).format(n2), '55a286j');
    });
    await t.step('Spanish (es)', () => {
      let n = 3454.345898 + 3 * Time.Measures.minutes + 8 * Time.Measures.hours;
      const r1 = new Duration.Formatter('es').short.separator('; ').format(-4443454);
      assertEquals(r1.replace(/[^\S ]/g, ' '), '1 h; 14 min; 3 s; 454 ms');
      const r2 = new Duration.Formatter('es').short.digits(9).format(n);
      assertEquals(r2.replace(/[^\S ]/g, ' '), '8 h 3 min 3 s 454 ms 345 μs 897 ns');
      n += +452 * Time.Measures.days;
      const r3 = new Duration.Formatter('es').long.digits(6).format(n);
      assertEquals(
        r3.replace(/[^\S ]/g, ' '),
        '1 año, 87 días, 2 horas, 3 minutos, 3 segundos, 454 milisegundos, 345 microsegundos',
      );
      const n2 = -1760451163065;
      assertEquals(new Duration.Formatter('es').digital.adaptive(2).format(n2), '55a286d');
    });
    await t.step('Chinese (zh)', () => {
      let n = 3454.345898 + 3 * Time.Measures.minutes + 8 * Time.Measures.hours;
      const r1 = new Duration.Formatter('zh').short.format(-4443454);
      assertEquals(r1.replace(/[^\S ]/g, ' '), '1小时14分钟3秒454毫秒');
      const r2 = new Duration.Formatter('zh').short.digits(9).format(n);
      assertEquals(r2.replace(/[^\S ]/g, ' '), '8小时3分钟3秒454毫秒345微秒897纳秒');
      n += +452 * Time.Measures.days;
      const r3 = new Duration.Formatter('zh').long.digits(6).format(n);
      assertEquals(r3.replace(/[^\S ]/g, ' '), '1年87天2小时3分钟3秒钟454毫秒345微秒');
      const n2 = -1760451163065;
      assertEquals(new Duration.Formatter('zh').digital.adaptive(2).format(n2), '55年286天');
    });
  });
});
