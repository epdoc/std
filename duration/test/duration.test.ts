import { Duration, duration, Time } from '../src/mod.ts';
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

describe('duration-util', () => {
  describe('digital', () => {
    it('defaults', () => {
      expect(new Duration.Formatter().format(-4443454)).toEqual('1:14:03.454');
      expect(new Duration.Formatter().format(-4443454)).toEqual('1:14:03.454');
      expect(new Duration.Formatter().format(968588820)).toEqual('11d05:03:08.820');
      expect(new Duration.Formatter().format(982440990)).toEqual('11d08:54:00.990');
      expect(new Duration.Formatter().format(982440990)).toEqual('11d08:54:00.990');
      expect(new Duration.Formatter().options().format(982440990)).toEqual('11d08:54:00.990');
      expect(new Duration.Formatter().format(3454)).toEqual('00:03.454');
      expect(new Duration.Formatter().format(455)).toEqual('00:00.455');
      expect(new Duration.Formatter().format(1)).toEqual('00:00.001');
      expect(new Duration.Formatter().format(0)).toEqual('00:00.000');
    });
    // it('overrides', () => {
    //   expect(new  Duration.Util(982440990).options(':').options({ ms: false }).format()).toEqual('11d08:54:01');
    //   expect(new  Duration.Util(3454).options({ decimal: ',' }).format()).toEqual('0:03,454');
    // });
    it('fractionalDigits', () => {
      let n = 3454.345898;
      expect(duration().digital.format(n)).toEqual('00:03.454');
      expect(new Duration.Formatter().digital.fractionalDigits(6).format(n)).toEqual('00:03.454345');
      expect(new Duration.Formatter().digital.fractionalDigits(9).format(n)).toEqual('00:03.454345898');
      expect(new Duration.Formatter().digital.fractionalDigits(7).format(n)).toEqual('00:03.4543458');
      expect(new Duration.Formatter().digital.fractionalDigits(1).format(n)).toEqual('00:03.4');
      expect(new Duration.Formatter().digital.fractionalDigits(2).format(n)).toEqual('00:03.45');
      n += 3 * Time.Measures.minutes;
      expect(new Duration.Formatter().digital.fractionalDigits(6).format(n)).toEqual('03:03.454345');
      expect(new Duration.Formatter().digital.fractionalDigits(9).format(n)).toEqual('03:03.454345897');
      expect(new Duration.Formatter().digital.fractionalDigits(7).format(n)).toEqual('03:03.4543458');
      expect(new Duration.Formatter().digital.fractionalDigits(1).format(n)).toEqual('03:03.4');
      expect(new Duration.Formatter().digital.fractionalDigits(2).format(n)).toEqual('03:03.45');
    });
    it('years support', () => {
      const oneYear = Time.Measures.years;
      expect(new Duration.Formatter().digital.format(oneYear)).toEqual('1y00:00.000');
      expect(new Duration.Formatter().digital.format(oneYear + 5 * Time.Measures.days)).toEqual('1y5d00:00.000');
      expect(new Duration.Formatter().digital.format(2.5 * oneYear)).toEqual('2y182d15:00:00.000');
    });
  });
  describe('narrow', () => {
    it('defaults', () => {
      expect(new Duration.Formatter().narrow.format(-4443454)).toEqual('1h14m03.454s');
      expect(new Duration.Formatter().narrow.format(968588820)).toEqual('11d05h03m08.820s');
      expect(new Duration.Formatter().narrow.format(982440990)).toEqual('11d08h54m00.990s');
      expect(new Duration.Formatter().narrow.format(3454)).toEqual('3.454s');
      expect(new Duration.Formatter().narrow.format(455)).toEqual('0.455s');
      expect(new Duration.Formatter().narrow.format(1)).toEqual('0.001s');
      expect(new Duration.Formatter().narrow.format(0)).toEqual('0.000s');
    });
    it('fractionalDigits', () => {
      let n = 3454.345898;
      expect(new Duration.Formatter().narrow.format(n)).toEqual('3.454s');
      expect(new Duration.Formatter().narrow.fractionalDigits(6).format(n)).toEqual('3.454345s');
      expect(new Duration.Formatter().narrow.fractionalDigits(9).format(n)).toEqual('3.454345898s');
      expect(new Duration.Formatter().narrow.fractionalDigits(7).format(n)).toEqual('3.4543458s');
      expect(new Duration.Formatter().narrow.fractionalDigits(1).format(n)).toEqual('3.4s');
      expect(new Duration.Formatter().narrow.fractionalDigits(2).format(n)).toEqual('3.45s');
      n += 3 * Time.Measures.minutes;
      expect(new Duration.Formatter().narrow.fractionalDigits(9).format(n)).toEqual('3m03.454345897s');
      expect(new Duration.Formatter().narrow.fractionalDigits(7).format(n)).toEqual('3m03.4543458s');
      expect(new Duration.Formatter().narrow.fractionalDigits(1).format(n)).toEqual('3m03.4s');
      n += 8 * Time.Measures.hours;
      expect(new Duration.Formatter().narrow.fractionalDigits(9).format(n)).toEqual('8h03m03.454345897s');
      expect(new Duration.Formatter().narrow.fractionalDigits(7).format(n)).toEqual('8h03m03.4543458s');
      expect(new Duration.Formatter().narrow.fractionalDigits(1).format(n)).toEqual('8h03m03.4s');
    });
    it('fractionalDigits in years', () => {
      const n = -1760451163065;
      expect(new Duration.Formatter().narrow.fractionalDigits(3).format(n)).toEqual('55y286d20h12m43.065s');
    });
    it('years support', () => {
      const oneYear = Time.Measures.years;
      expect(new Duration.Formatter().narrow.format(oneYear)).toEqual('1y00.000s');
      expect(new Duration.Formatter().narrow.format(oneYear + 5 * Time.Measures.days)).toEqual('1y5d00.000s');
      expect(new Duration.Formatter().narrow.format(2.5 * oneYear)).toEqual('2y182d15h00m00.000s');
    });
  });
  describe('adaptive', () => {
    describe('narrow format', () => {
      it('basic adaptive functionality', () => {
        const n = -1760451163065; // 55y286d20h12m43.065s
        expect(new Duration.Formatter().narrow.adaptive(2).format(n)).toEqual('55y286d');
        expect(new Duration.Formatter().narrow.adaptive(3).format(n)).toEqual('55y286d20h');
        expect(new Duration.Formatter().narrow.adaptive(4).format(n)).toEqual('55y286d20h12m');
        expect(new Duration.Formatter().narrow.adaptive(1).format(n)).toEqual('55y');
      });
      it('adaptive with zero intermediate units', () => {
        // 2 years, 0 days, 5 hours
        const n = 2 * Time.Measures.years + 5 * Time.Measures.hours;
        expect(new Duration.Formatter().narrow.adaptive(2).format(n)).toEqual('2y');
        expect(new Duration.Formatter().narrow.adaptive(3).format(n)).toEqual('2y05h');
      });
      it('adaptive starting from smaller units', () => {
        const n = 5 * Time.Measures.hours + 30 * Time.Measures.minutes + 15 * Time.Measures.seconds;
        expect(new Duration.Formatter().narrow.adaptive(2).format(n)).toEqual('5h30m');
        expect(new Duration.Formatter().narrow.adaptive(3).format(n)).toEqual('5h30m15s');
        expect(new Duration.Formatter().narrow.adaptive(1).format(n)).toEqual('5h');
      });
      it('adaptive with only seconds', () => {
        const n = 45123; // 45.123 seconds in milliseconds
        expect(new Duration.Formatter().narrow.adaptive(1).format(n)).toEqual('45s');
        expect(new Duration.Formatter().narrow.adaptive(2).format(n)).toEqual('45s');
      });
      it('adaptive edge cases', () => {
        expect(new Duration.Formatter().narrow.adaptive(0).format(1000)).toEqual('1.000s'); // 0 should disable adaptive
        expect(new Duration.Formatter().narrow.adaptive(10).format(1000)).toEqual('1s'); // More than available units
      });
      it('adaptiveDisplay controls trailing zeros', () => {
        const n = 3661000; // 1 hour, 1 minute, 1 second
        expect(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(n)).toEqual('1h01m');
        expect(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('always').format(n)).toEqual('1h01m');

        const n2 = 3600000; // 1 hour exactly
        expect(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(n2)).toEqual('1h');
        expect(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('always').format(n2)).toEqual('1h00m');

        // Test with different adaptive units
        const n3 = 7323000; // 2h02m03s
        expect(new Duration.Formatter().narrow.adaptive(3).adaptiveDisplay('auto').format(n3)).toEqual('2h02m03s');
        expect(new Duration.Formatter().narrow.adaptive(3).adaptiveDisplay('always').format(n3)).toEqual('2h02m03s');
        expect(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(n3)).toEqual('2h02m');
        expect(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('always').format(n3)).toEqual('2h02m');

        // Test with zero intermediate units
        const n4 = 7203000; // 2h00m03s
        expect(new Duration.Formatter().narrow.adaptive(3).adaptiveDisplay('auto').format(n4)).toEqual('2h00m03s');
        expect(new Duration.Formatter().narrow.adaptive(3).adaptiveDisplay('always').format(n4)).toEqual('2h00m03s');
      });
      it('adaptiveDisplay default behavior', () => {
        const n = 3600000; // 1 hour exactly
        // Default should be 'auto'
        expect(new Duration.Formatter().narrow.adaptive(2).format(n)).toEqual('1h');
        expect(new Duration.Formatter().narrow.adaptive(2).adaptiveDisplay('auto').format(n)).toEqual('1h');
      });
      it('adaptiveDisplay with different formats', () => {
        const n = 3600000; // 1 hour exactly
        expect(new Duration.Formatter().digital.adaptive(2).adaptiveDisplay('auto').format(n)).toEqual('1:');
        expect(new Duration.Formatter().digital.adaptive(2).adaptiveDisplay('always').format(n)).toEqual('1:00:');

        expect(new Duration.Formatter().long.adaptive(2).adaptiveDisplay('auto').format(n)).toEqual('1 hour');
        expect(new Duration.Formatter().long.adaptive(2).adaptiveDisplay('always').format(n)).toEqual(
          '1 hour, 0 minutes',
        );
      });
    });
    describe('digital format', () => {
      it('basic adaptive functionality', () => {
        const n = -1760451163065;
        expect(new Duration.Formatter().digital.adaptive(2).format(n)).toEqual('55y286d');
        expect(new Duration.Formatter().digital.adaptive(3).format(n)).toEqual('55y286d20:');
      });
    });
    describe('long format', () => {
      it('basic adaptive functionality', () => {
        const n = 5 * Time.Measures.hours + 30 * Time.Measures.minutes + 15 * Time.Measures.seconds;
        expect(new Duration.Formatter().long.adaptive(2).format(n)).toEqual('5 hours, 30 minutes');
      });
    });
  });
  describe('years edge cases', () => {
    it('very large durations', () => {
      const centuryMs = 100 * Time.Measures.years;
      expect(new Duration.Formatter().narrow.format(centuryMs)).toEqual('100y00.000s');
      expect(new Duration.Formatter().narrow.adaptive(1).format(centuryMs)).toEqual('100y');
    });
    it('fractional years', () => {
      const n = 1.5 * Time.Measures.years; // 1.5 years
      expect(new Duration.Formatter().narrow.format(n)).toEqual('1y182d15h00m00.000s');
      expect(new Duration.Formatter().narrow.adaptive(2).format(n)).toEqual('1y182d');
    });
    it('years with zero days', () => {
      const n = 2 * Time.Measures.years + 3 * Time.Measures.hours;
      expect(new Duration.Formatter().narrow.adaptive(3).format(n)).toEqual('2y03h');
    });
  });
  describe('long', () => {
    it('defaults', () => {
      expect(new Duration.Formatter().long.format(-4443454)).toEqual(
        '1 hour, 14 minutes, 3 seconds, 454 milliseconds',
      );
    });
    it('fractionalDigits', () => {
      let n = 3454.345898;
      const formatter = new Duration.Formatter().long;
      expect(formatter.digits(9).format(n)).toEqual(
        '3 seconds, 454 milliseconds, 345 microseconds, 898 nanoseconds',
      );
      expect(formatter.digits(8).format(n)).toEqual(
        '3 seconds, 454 milliseconds, 345 microseconds, 898 nanoseconds',
      );
      expect(formatter.digits(3).format(n)).toEqual('3 seconds, 454 milliseconds');
      expect(formatter.digits(6).format(n)).toEqual('3 seconds, 454 milliseconds, 345 microseconds');
      expect(formatter.digits(7).format(n)).toEqual(
        '3 seconds, 454 milliseconds, 345 microseconds, 898 nanoseconds',
      );
      expect(formatter.digits(1).format(n)).toEqual('3 seconds, 454 milliseconds');
      expect(formatter.digits(2).format(n)).toEqual('3 seconds, 454 milliseconds');
      n += 3 * Time.Measures.minutes;
      expect(formatter.digits(9).format(n)).toEqual(
        '3 minutes, 3 seconds, 454 milliseconds, 345 microseconds, 897 nanoseconds',
      );
      expect(formatter.digits(7).format(n)).toEqual(
        '3 minutes, 3 seconds, 454 milliseconds, 345 microseconds, 897 nanoseconds',
      );
      expect(formatter.digits(1).format(n)).toEqual('3 minutes, 3 seconds, 454 milliseconds');
      n += 8 * Time.Measures.hours;
      expect(formatter.digits(9).format(n)).toEqual(
        '8 hours, 3 minutes, 3 seconds, 454 milliseconds, 345 microseconds, 897 nanoseconds',
      );
      expect(formatter.digits(7).format(n)).toEqual(
        '8 hours, 3 minutes, 3 seconds, 454 milliseconds, 345 microseconds, 897 nanoseconds',
      );
      expect(formatter.digits(1).format(n)).toEqual('8 hours, 3 minutes, 3 seconds, 454 milliseconds');
    });
    it('years support', () => {
      const oneYear = Time.Measures.years;
      expect(new Duration.Formatter().long.format(oneYear)).toEqual('1 year');
      expect(new Duration.Formatter().long.format(2 * oneYear + 5 * Time.Measures.days)).toEqual('2 years, 5 days');
    });
  });
  describe('short', () => {
    it('defaults', () => {
      expect(new Duration.Formatter().short.format(-4443454)).toEqual('1 hr 14 min 3 sec 454 ms');
      expect(new Duration.Formatter().short.separator('; ').format(-4443454)).toEqual('1 hr; 14 min; 3 sec; 454 ms');
    });
    it('fractionalDigits', () => {
      let n = 3454.345898;
      const formatter = new Duration.Formatter().short;
      expect(formatter.digits(9).format(n)).toEqual('3 sec 454 ms 345 μs 898 ns');
      expect(formatter.digits(8).format(n)).toEqual('3 sec 454 ms 345 μs 898 ns');
      expect(formatter.digits(3).format(n)).toEqual('3 sec 454 ms');
      expect(formatter.digits(6).format(n)).toEqual('3 sec 454 ms 345 μs');
      expect(formatter.digits(7).format(n)).toEqual('3 sec 454 ms 345 μs 898 ns');
      expect(formatter.digits(1).format(n)).toEqual('3 sec 454 ms');
      expect(formatter.digits(2).format(n)).toEqual('3 sec 454 ms');
      n += 3 * Time.Measures.minutes;
      expect(formatter.digits(9).format(n)).toEqual('3 min 3 sec 454 ms 345 μs 897 ns');
      expect(formatter.digits(7).format(n)).toEqual('3 min 3 sec 454 ms 345 μs 897 ns');
      expect(formatter.digits(1).format(n)).toEqual('3 min 3 sec 454 ms');
      n += 8 * Time.Measures.hours;
      expect(formatter.digits(9).format(n)).toEqual('8 hr 3 min 3 sec 454 ms 345 μs 897 ns');
      expect(formatter.digits(7).format(n)).toEqual('8 hr 3 min 3 sec 454 ms 345 μs 897 ns');
      expect(formatter.digits(1).format(n)).toEqual('8 hr 3 min 3 sec 454 ms');
    });
    it('years support', () => {
      const oneYear = Time.Measures.years;
      expect(new Duration.Formatter().short.format(oneYear)).toEqual('1 yr');
      expect(new Duration.Formatter().short.format(2 * oneYear + 5 * Time.Measures.days)).toEqual('2 yrs 5 days');
    });
  });
  describe('general', () => {
    it('separator', () => {
      const n = 3454.345898;
      const formatter = new Duration.Formatter().long;
      expect(formatter.digits(9).separator('; ').format(n)).toEqual(
        '3 seconds; 454 milliseconds; 345 microseconds; 898 nanoseconds',
      );
      expect(formatter.short.digits(3).separator(':').format(n)).toEqual('3 sec:454 ms');
    });
    it('zero duration', () => {
      expect(new Duration.Formatter().narrow.adaptive(2).format(0)).toEqual('0.000s');
      expect(new Duration.Formatter().digital.adaptive(3).format(0)).toEqual('00:00.000');
    });
  });
  describe('internationalization', () => {
    describe('French (fr)', () => {
      let n = 3454.345898 + 3 * Time.Measures.minutes + 8 * Time.Measures.hours;
      // Intl.DurationFormatter add narrow spaces
      const r1 = new Duration.Formatter('fr').short.separator('; ').format(-4443454);
      expect(r1.replace(/[^\S ]/g, ' ')).toEqual('1 h; 14 min; 3 s; 454 ms');
      const r2 = new Duration.Formatter('fr').short.digits(9).format(n);
      expect(r2.replace(/[^\S ]/g, ' ')).toEqual('8 h 3 min 3 s 454 ms 345 μs 897 ns');
      n += +452 * Time.Measures.days;
      const r3 = new Duration.Formatter('fr').long.digits(6).format(n);
      expect(r3.replace(/[^\S ]/g, ' ')).toEqual(
        '1 an, 87 jours, 2 heures, 3 minutes, 3 secondes, 454 millisecondes, 345 microsecondes',
      );
      const n2 = -1760451163065;
      expect(new Duration.Formatter('fr').digital.adaptive(2).format(n2)).toEqual('55a286j');
    });
    describe('Spanish (es)', () => {
      let n = 3454.345898 + 3 * Time.Measures.minutes + 8 * Time.Measures.hours;
      // Intl.DurationFormatter add narrow spaces
      const r1 = new Duration.Formatter('es').short.separator('; ').format(-4443454);
      expect(r1.replace(/[^\S ]/g, ' ')).toEqual('1 h; 14 min; 3 s; 454 ms');
      const r2 = new Duration.Formatter('es').short.digits(9).format(n);
      expect(r2.replace(/[^\S ]/g, ' ')).toEqual('8 h 3 min 3 s 454 ms 345 μs 897 ns');
      n += +452 * Time.Measures.days;
      const r3 = new Duration.Formatter('es').long.digits(6).format(n);
      expect(r3.replace(/[^\S ]/g, ' ')).toEqual(
        '1 año, 87 días, 2 horas, 3 minutos, 3 segundos, 454 milisegundos, 345 microsegundos',
      );
      const n2 = -1760451163065;
      expect(new Duration.Formatter('es').digital.adaptive(2).format(n2)).toEqual('55a286d');
    });
    describe('Chinese (zh)', () => {
      let n = 3454.345898 + 3 * Time.Measures.minutes + 8 * Time.Measures.hours;
      // Intl.DurationFormatter add narrow spaces
      const r1 = new Duration.Formatter('zh').short.format(-4443454);
      expect(r1.replace(/[^\S ]/g, ' ')).toEqual('1小时14分钟3秒454毫秒');
      const r2 = new Duration.Formatter('zh').short.digits(9).format(n);
      expect(r2.replace(/[^\S ]/g, ' ')).toEqual('8小时3分钟3秒454毫秒345微秒897纳秒');
      n += +452 * Time.Measures.days;
      const r3 = new Duration.Formatter('zh').long.digits(6).format(n);
      expect(r3.replace(/[^\S ]/g, ' ')).toEqual('1年87天2小时3分钟3秒钟454毫秒345微秒');
      const n2 = -1760451163065;
      expect(new Duration.Formatter('zh').digital.adaptive(2).format(n2)).toEqual('55年286天');
    });
  });
});
