import * as Format from './duration-format.ts';
import { DurationRecord } from './duration-record.ts';
import * as Duration from './duration-types.ts';
import { type HrMilliseconds, Milliseconds } from './time-types.ts';
import type { Integer } from './types.ts';
import { isDict, isInteger } from './utils.ts';

const REG = {
  isSepWhitespace: /^[,\s]+$/,
  isNumeric: new RegExp(/^(integer|decimal|fraction)$/),
  isLeadingZero: new RegExp(/^0\d$/),
};

/**
 * Construct a new `DurationUtil` instance. If `formatting` is not a
 * `FormatMsName` then will initialize formatting with default `:` format.
 * @param {Milliseconds} ms - The duration we are outputing. We use the absolute value.
 * @param {FormatMsOptions | FormatMsName} formatting - Defines the format.
 * @see options
 */
export function durationUtil(format?: Format.Options) {
  return new DurationUtil(format);
}

const DEFAULT: Record<Format.Style, Format.Options> = {
  digital: {
    style: 'digital',
    daysHoursSeparator: 'd',
    hoursMinutesSeparator: ':',
    minutesSecondsSeparator: ':',
    fractionalDigits: 3,
    // minDisplay: 'milliseconds',
    hours: '2-digit',
    hoursDisplay: 'auto',
  },
  narrow: {
    style: 'narrow',
    daysHoursSeparator: 'd',
    hoursMinutesSeparator: 'h',
    minutesSecondsSeparator: 'm',
    secondsUnit: 's',
    fractionalDigits: 3,
    // minDisplay: 'milliseconds',
    daysDisplay: 'auto',
    hoursDisplay: 'auto',
    minutesDisplay: 'auto',
    secondsDisplay: 'always',
    hours: '2-digit',
    minutes: '2-digit',
    seconds: '2-digit',
  },
  long: {
    style: 'long',
    fractionalDigits: 3,
    microsecondsDisplay: 'auto',
    nanosecondsDisplay: 'auto',
    separator: ', ',
  },
  short: {
    style: 'short',
    fractionalDigits: 3,
    separator: ' ',
  },
};

type DurationPart = {
  type: 'literal' | 'integer' | 'unit' | 'decimal' | 'fraction';
  value: string;
  unit?: Duration.Field;
};

export class DurationUtil {
  // @ts-ignore it gets initialized when it's first used, if not previously initialized
  protected _opts: Duration.Options;

  /**
   * Construct a new `DurationUtil` instance. If `formatting` is not a
   * `FormatMsName` then will initialize formatting with default `:` format.
   * @param {Milliseconds} ms - The duration we are outputing. We use the absolute value.
   * @param {FormatMsOptions | FormatMsName} formatting - Defines the format.
   * @see options
   */
  constructor(format?: Format.Options) {
    if (format) {
      this._opts = Object.assign({}, format);
    }
  }

  get digital(): this {
    return this.style('digital');
  }

  get narrow(): this {
    return this.style('narrow');
  }

  get short(): this {
    return this.style('short');
  }

  get long(): this {
    return this.style('long');
  }

  style(style: Format.Style): this {
    if (DEFAULT[style]) {
      this._opts = Object.assign({}, DEFAULT[style]);
    }
    return this;
  }

  fractionalDigits(digits: Integer): this {
    this._opts.fractionalDigits = digits;
    return this;
  }

  digits(digits: Integer): this {
    this._opts.fractionalDigits = digits;
    return this;
  }

  separator(val: string): this {
    this._opts.separator = val;
    return this;
  }

  /**
   * Define a custom format by overwriting the already-set format options.
   * @param opts The `FormatMsName` name of one of the preset formats, or a
   * `FormatMsOptions` object, which are then used to override the individual
   * values.
   * @returns this
   */
  public options(format?: Format.Options): this {
    if (format) {
      this._opts = Object.assign({}, format);
    }
    return this;
  }

  public apply(format?: Format.Options): this {
    if (!isDict(this._opts)) {
      this._opts = Object.assign({}, DEFAULT.digital, format);
    } else {
      this._opts = Object.assign(this._opts, format);
    }
    return this;
  }

  public format(ms: Milliseconds | HrMilliseconds): string {
    if (!isDict(this._opts)) {
      this._opts = Object.assign({}, DEFAULT.digital);
    }

    const time: DurationRecord = new DurationRecord(ms)
      .pruneMin(this._opts.minDisplay)
      .pruneMax(this._opts.maxDisplay);

    if (this._opts.style === 'digital') {
      return this.formatDigital(time);
    } else if (this._opts.style === 'narrow') {
      return this.formatNarrow(time);
    }
    return this.formatLong(time);
  }

  protected formatToParts(time: DurationRecord, opts: Format.Options): DurationPart[] {
    // @ts-ignore DurationFormat is not yet in TS
    return new Intl.DurationFormat('en', opts ? opts : this._opts).formatToParts(time);
  }

  protected formatLong(time: DurationRecord): string {
    const opts: Format.Options = Object.assign({ fractionalDigits: 0, separator: ' ' }, this._opts);

    if (opts.fractionalDigits === 0) {
      time.milliseconds = 0;
    }
    // type guard only because TS can't see it has been set
    if (isInteger(opts.fractionalDigits)) {
      if (opts.fractionalDigits <= 3) {
        time.microseconds = 0;
      }
      if (opts.fractionalDigits < 7) {
        time.nanoseconds = 0;
      }
    }

    const parts: DurationPart[] = this.formatToParts(time, opts);
    const result: string[] = [];
    parts.forEach((part: DurationPart) => {
      if (part.type === 'literal' && typeof part.unit !== 'string') {
        // @ts-ignore separator is defined
        result.push(opts.separator);
      } else {
        result.push(part.value);
      }
    });
    // this.emitParts(parts);
    // console.log(JSON.stringify(result));
    return result.join('');
  }

  protected formatNarrow(time: DurationRecord): string {
    const opts: Format.Options = Object.assign({}, this._opts, { style: 'digital' });
    let bRemoveMinutesLeadingZero = false;
    let bRemoveSecondsLeadingZero = false;
    if (time.days == 0) {
      opts.hours = 'numeric';
      opts.hoursDisplay = 'auto';
      if (time.hours == 0) {
        opts.minutes = 'numeric';
        bRemoveMinutesLeadingZero = true;
        if (time.minutes == 0) {
          opts.seconds = 'numeric';
          bRemoveSecondsLeadingZero = true;
        }
      }
    }
    const parts: DurationPart[] = this.formatToParts(time, opts);

    // Remove leading zeros from seconds and minutes if needed
    if (bRemoveSecondsLeadingZero || bRemoveMinutesLeadingZero) {
      parts.forEach((part: DurationPart) => {
        if (
          bRemoveSecondsLeadingZero &&
          part.unit === 'second' &&
          part.type === 'integer' &&
          REG.isLeadingZero.test(part.value)
        ) {
          part.value = part.value.replace(/^0/, '');
        } else if (
          bRemoveMinutesLeadingZero &&
          part.unit === 'minute' &&
          part.type === 'integer' &&
          REG.isLeadingZero.test(part.value)
        ) {
          part.value = part.value.replace(/^0/, '');
        }
      });
    }
    return this._formatDigital(parts);
  }

  protected formatDigital(time: DurationRecord): string {
    const opts: Format.Options = Object.assign({}, this._opts);
    if (time.days == 0) {
      opts.hours = 'numeric';
      opts.hoursDisplay = 'auto';
    }
    const parts: DurationPart[] = this.formatToParts(time, opts);
    return this._formatDigital(parts);
  }

  protected _formatDigital(parts: DurationPart[]): string {
    const result: string[] = [];
    parts.forEach((part: DurationPart) => {
      if (part.unit && REG.isNumeric.test(part.type)) {
        if (part.unit === 'day') {
          result.push(part.value);
          result.push(this._opts.daysHoursSeparator ?? 'd');
        } else if (part.unit === 'hour') {
          // if (time.days > 0 && part.type === 'integer') {
          //   result.push(`0${part.value}`.slice(-2));
          //   result.push(this._opts.hoursMinutesSeparator ?? ':');
          // } else {
          //   // do something
          // }
          result.push(part.value);
          result.push(this._opts.hoursMinutesSeparator ?? ':');
        } else if (part.unit === 'minute') {
          result.push(part.value);
          result.push(this._opts.minutesSecondsSeparator ?? ':');
        } else if (part.unit === 'second' && part.type === 'integer') {
          result.push(part.value);
        } else if (part.unit === 'second' && (part.type === 'fraction' || part.type === 'decimal')) {
          result.push(part.value);
        }
      }
    });
    if (this._opts.secondsUnit) {
      result.push(this._opts.secondsUnit);
    }
    return result.join('');
  }

  protected emitParts(parts: DurationPart[]): void {
    const result: string[] = [];
    parts.forEach((part: DurationPart) => {
      // result.push(JSON.stringify(part).replaceAll('"', "'"));
      result.push(JSON.stringify(part).replaceAll('"', "'"));
    });
    console.log(parts);
  }
}
