/**
 * A class for formatting durations into strings.
 * @module
 */
import type * as Format from '../format.ts';
import type { HrMilliseconds, Milliseconds } from '../time-types.ts';
import { DurationRecord } from './record.ts';
import type * as Duration from './types.ts';
// import { formatToParts } from './intl-duration-format.ts';
import { type Integer, isDict, isInteger } from '@epdoc/type';

const REG = {
  isSepWhitespace: /^[,\s]+$/,
  isNumeric: new RegExp(/^(integer|decimal|fraction)$/),
  isLeadingZero: new RegExp(/^0\d$/),
};

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

/**
 * A class for formatting durations into strings.
 */
export class DurationFormatter {
  // @ts-ignore it gets initialized when it's first used, if not previously initialized
  protected _opts: Duration.Options;

  /**
   * Construct a new `DurationFormatter` instance.
   * @param {Format.Options} format - Defines the format.
   */
  constructor(format?: Format.Options) {
    if (format) {
      this._opts = Object.assign({}, format);
    }
  }

  /**
   * Use digital formatting.
   */
  get digital(): this {
    return this.style('digital');
  }

  /**
   * Use narrow formatting.
   */
  get narrow(): this {
    return this.style('narrow');
  }

  /**
   * Use short formatting.
   */
  get short(): this {
    return this.style('short');
  }

  /**
   * Use long formatting.
   */
  get long(): this {
    return this.style('long');
  }

  /**
   * Set the style of the format.
   * @param {Format.Style} style - The style to use.
   * @returns {this}
   */
  style(style: Format.Style): this {
    if (DEFAULT[style]) {
      this._opts = Object.assign({}, DEFAULT[style]);
    }
    return this;
  }

  /**
   * Set the number of fractional digits to display.
   * @param {Integer} digits - The number of digits.
   * @returns {this}
   */
  fractionalDigits(digits: Integer): this {
    this._opts.fractionalDigits = digits;
    return this;
  }

  /**
   * Set the number of fractional digits to display.
   * @param {Integer} digits - The number of digits.
   * @returns {this}
   */
  digits(digits: Integer): this {
    this._opts.fractionalDigits = digits;
    return this;
  }

  /**
   * Set the separator to use between parts of the formatted string.
   * @param {string} val - The separator string.
   * @returns {this}
   */
  separator(val: string): this {
    this._opts.separator = val;
    return this;
  }

  /**
   * Set the maximum unit to display.
   * @param {Duration.Field} field - The maximum unit.
   * @returns {this}
   */
  max(field: Duration.Field): this {
    this._opts.maxDisplay = field;
    return this;
  }

  /**
   * Set the minimum unit to display.
   * @param {Duration.Field} field - The minimum unit.
   * @returns {this}
   */
  min(field: Duration.Field): this {
    this._opts.minDisplay = field;
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

  /**
   * Apply a set of format options to the current options.
   * @param {Format.Options} format - The options to apply.
   * @returns {this}
   */
  public apply(format?: Format.Options): this {
    if (!isDict(this._opts)) {
      this._opts = Object.assign({}, DEFAULT.digital, format);
    } else {
      this._opts = Object.assign(this._opts, format);
    }
    return this;
  }

  /**
   * Format a duration into a string.
   * @param {Milliseconds | HrMilliseconds} ms - The duration to format.
   * @returns {string} The formatted string.
   */
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

  protected formatToParts(time: DurationRecord, opts: Format.Options): Duration.Part[] {
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

    const parts: Duration.Part[] = this.formatToParts(time, opts);
    const result: string[] = [];
    parts.forEach((part: Duration.Part) => {
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
    const parts: Duration.Part[] = this.formatToParts(time, opts);

    // Remove leading zeros from seconds and minutes if needed
    if (bRemoveSecondsLeadingZero || bRemoveMinutesLeadingZero) {
      parts.forEach((part: Duration.Part) => {
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
    const parts: Duration.Part[] = this.formatToParts(time, opts);
    return this._formatDigital(parts);
  }

  protected _formatDigital(parts: Duration.Part[]): string {
    const result: string[] = [];
    parts.forEach((part: Duration.Part) => {
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

  protected emitParts(parts: Duration.Part[]): void {
    const result: string[] = [];
    parts.forEach((part: Duration.Part) => {
      // result.push(JSON.stringify(part).replaceAll('"', "'"));
      result.push(JSON.stringify(part).replaceAll('"', "'"));
    });
    console.log(parts);
  }
}
