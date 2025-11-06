import type { HrMilliseconds, Milliseconds } from '../time-types.ts';
import { DurationRecord } from './record.ts';
import type * as Duration from './types.ts';
// import { formatToParts } from './intl-duration-format.ts';
import { _, type Integer, isDict, isInteger } from '@epdoc/type';
import { convertOptionsToDurationFormat } from './converter.ts';
import type * as Custom from './format.ts';
import * as I18n from './i18n.ts';
import type * as Intl2 from './intl.ts';

const REG = {
  isSepWhitespace: /^[,\s]+$/,
  isNumeric: new RegExp(/^(integer|decimal|fraction)$/),
  isLeadingZero: new RegExp(/^0\d$/),
};

const DEFAULT: Record<Custom.DurationUnitStyle, Custom.DurationFormatOptions> = {
  digital: {
    style: 'digital',
    yearsDaysSeparator: (locale) => {
      return I18n.translate(locale, 'yearSuffix');
    },
    daysHoursSeparator: (locale) => {
      return I18n.translate(locale, 'daySuffix');
    },
    hoursMinutesSeparator: (_locale) => {
      return ':';
    },
    minutesSecondsSeparator: (_locale) => {
      return ':';
    },
    fractionalDigits: 3,
    adaptiveDisplay: 'auto',
    // minDisplay: 'milliseconds',
    hours: '2-digit',
    hoursDisplay: 'auto',
  },
  narrow: {
    style: 'narrow',
    yearsDaysSeparator: (locale) => {
      return I18n.translate(locale, 'yearSuffix');
    },
    daysHoursSeparator: (locale) => {
      return I18n.translate(locale, 'daySuffix');
    },
    hoursMinutesSeparator: (locale) => {
      return I18n.translate(locale, 'hourSuffix');
    },
    secondsUnit: (locale) => {
      return I18n.translate(locale, 'secondSuffix');
    },
    fractionalDigits: 3,
    adaptiveDisplay: 'auto',
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
    adaptiveDisplay: 'auto',
    microsecondsDisplay: 'auto',
    nanosecondsDisplay: 'auto',
    separator: ', ',
  },
  short: {
    style: 'short',
    fractionalDigits: 3,
    adaptiveDisplay: 'auto',
    separator: ' ',
  },
};

/**
 * A class for formatting durations into strings.
 */
export class DurationFormatter {
  // @ts-ignore it gets initialized when it's first used, if not previously initialized
  protected _opts: Duration.Options & { maxAdaptiveUnits?: Integer };

  /**
   * Construct a new `DurationFormatter` instance.
   * @param {Custom.DurationFormatOptions} format - Defines the format.
   */
  constructor(format?: Custom.DurationFormatOptions) {
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
   * @param {Custom.Style} style - The style to use.
   * @returns {this}
   */
  style(style: Custom.DurationUnitStyle): this {
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
   * Set the maximum number of significant non-zero units to display.
   * A value of 0 or undefined disables adaptive pruning.
   * @param {Integer} units - The maximum number of units (e.g., 2).
   * @returns {this}
   */
  public adaptive(units: Integer): this {
    this._opts.maxAdaptiveUnits = units;
    return this;
  }

  /**
   * Set adaptive display mode for trailing zeros.
   * @param {Custom.Display} display - 'auto' to suppress trailing zeros, 'always' to show them
   * @returns {this}
   */
  public adaptiveDisplay(display: Intl2.DurationUnitDisplay): this {
    this._opts.adaptiveDisplay = display;
    return this;
  }

  /**
   * Define a custom format by overwriting the already-set format options.
   * @param opts The `FormatMsName` name of one of the preset formats, or a
   * `FormatMsOptions` object, which are then used to override the individual
   * values.
   * @returns this
   */
  public options(format?: Custom.DurationFormatOptions): this {
    if (format) {
      this._opts = Object.assign({}, format);
    }
    return this;
  }

  /**
   * Apply a set of format options to the current options.
   * @param {Custom.DurationFormatOptions} format - The options to apply.
   * @returns {this}
   */
  public apply(format?: Custom.DurationFormatOptions): this {
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

    // Apply adaptive pruning after min/max pruning
    if (isInteger(this._opts.maxAdaptiveUnits) && this._opts.maxAdaptiveUnits > 0) {
      // Special case: if all fields are zero, don't apply adaptive pruning
      if (!time.isZero()) {
        time.pruneAdaptive(this._opts.maxAdaptiveUnits);

        // Apply adaptiveDisplay setting to control trailing zeros
        if (this._opts.adaptiveDisplay === 'auto') {
          // Suppress trailing zeros - set all zero fields to 'auto'
          if (time.seconds === 0) this._opts.secondsDisplay = 'auto';
          if (time.minutes === 0) this._opts.minutesDisplay = 'auto';
          if (time.hours === 0) this._opts.hoursDisplay = 'auto';
          if (time.days === 0) this._opts.daysDisplay = 'auto';
          if (time.years === 0) this._opts.yearsDisplay = 'auto';
        } else if (this._opts.adaptiveDisplay === 'always') {
          // Show trailing zeros within the adaptive window only
          // First, suppress all trailing zeros
          if (time.seconds === 0) this._opts.secondsDisplay = 'auto';
          if (time.minutes === 0) this._opts.minutesDisplay = 'auto';
          if (time.hours === 0) this._opts.hoursDisplay = 'auto';
          if (time.days === 0) this._opts.daysDisplay = 'auto';
          if (time.years === 0) this._opts.yearsDisplay = 'auto';

          // Then force display of zero units within the adaptive window
          const fields = ['years', 'days', 'hours', 'minutes', 'seconds'] as const;
          let unitsFromStart = 0;
          let foundFirstNonZero = false;

          for (const field of fields) {
            const value = time[field];
            if (!foundFirstNonZero && value > 0) {
              foundFirstNonZero = true;
            }
            if (foundFirstNonZero) {
              unitsFromStart++;
              if (unitsFromStart <= this._opts.maxAdaptiveUnits) {
                // Force display of units within adaptive window (even if zero)
                if (field === 'seconds') this._opts.secondsDisplay = 'always';
                else if (field === 'minutes') this._opts.minutesDisplay = 'always';
                else if (field === 'hours') this._opts.hoursDisplay = 'always';
                else if (field === 'days') this._opts.daysDisplay = 'always';
                else if (field === 'years') this._opts.yearsDisplay = 'always';
              }
            }
          }
        }

        // When adaptive formatting includes seconds, treat them as whole units (separate from milliseconds)
        if (this._opts.maxAdaptiveUnits > 0 && time.seconds > 0) {
          this._opts.fractionalDigits = 0;
        }
      }
    }

    if (this._opts.style === 'digital') {
      return this.formatDigital(time);
    } else if (this._opts.style === 'narrow') {
      return this.formatNarrow(time);
    }
    return this.formatLong(time);
  }

  protected formatToParts(time: DurationRecord, opts: Custom.DurationFormatOptions): Duration.Part[] {
    const intlOpts: Intl2.DurationFormatOptions = convertOptionsToDurationFormat(opts);
    // @ts-ignore DurationFormat is not yet in TS
    return new Intl.DurationFormat('en', intlOpts).formatToParts(time.toTime());
  }

  protected formatLong(time: DurationRecord): string {
    const opts: Custom.DurationFormatOptions = Object.assign({ fractionalDigits: 0, separator: ' ' }, this._opts);

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

    // Pass the plain object from DurationRecord.toTime() to Intl.DurationFormat
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
    const opts: Custom.DurationFormatOptions = Object.assign({}, this._opts, { style: 'digital' });

    // Flags to track when to remove leading zeros from time units
    let bRemoveMinutesLeadingZero = false;
    let bRemoveSecondsLeadingZero = false;

    // Cascade formatting based on the largest non-zero time unit
    // This creates adaptive formatting where smaller units become the primary display
    if (time.years == 0) {
      if (time.days == 0) {
        // No years or days: hours become the primary unit, use numeric format (no leading zeros)
        opts.hours = 'numeric';
        opts.hoursDisplay = 'auto';
        if (time.hours == 0) {
          // No hours: minutes become the primary unit, remove leading zero
          opts.minutes = 'numeric';
          bRemoveMinutesLeadingZero = true;
          if (time.minutes == 0) {
            // No minutes: seconds become the primary unit, remove leading zero
            opts.seconds = 'numeric';
            bRemoveSecondsLeadingZero = true;
          }
        }
      }
    }
    // Pass the plain object from DurationRecord.toTime() to Intl.DurationFormat
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
    const opts: Custom.DurationFormatOptions = Object.assign({}, this._opts);
    if (time.years == 0 && time.days == 0) {
      opts.hours = 'numeric';
      opts.hoursDisplay = 'auto';
    }
    // Pass the plain object from DurationRecord.toTime() to Intl.DurationFormat
    const parts: Duration.Part[] = this.formatToParts(time, opts);
    return this._formatDigital(parts);
  }

  protected _formatDigital(parts: Duration.Part[]): string {
    const result: string[] = [];
    let hasSeconds = false;

    parts.forEach((part: Duration.Part) => {
      if (part.unit && REG.isNumeric.test(part.type)) {
        if (part.unit === 'year' && _.isFunction(this._opts.yearsDaysSeparator)) {
          result.push(part.value);
          result.push(this._opts.yearsDaysSeparator(this._opts.locale));
        } else if (part.unit === 'day' && _.isFunction(this._opts.daysHoursSeparator)) {
          result.push(part.value);
          result.push(this._opts.daysHoursSeparator(this._opts.locale));
        } else if (part.unit === 'hour' && _.isFunction(this._opts.hoursMinutesSeparator)) {
          // if (time.days > 0 && part.type === 'integer') {
          //   result.push(`0${part.value}`.slice(-2));
          //   result.push(this._opts.hoursMinutesSeparator ?? ':');
          // } else {
          //   // do something
          // }
          result.push(part.value);
          result.push(this._opts.hoursMinutesSeparator(this._opts.locale));
        } else if (part.unit === 'minute' && _.isFunction(this._opts.minutesSecondsSeparator)) {
          result.push(part.value);
          result.push(this._opts.minutesSecondsSeparator(this._opts.locale));
        } else if (part.unit === 'second' && part.type === 'integer') {
          result.push(part.value);
          hasSeconds = true;
        } else if (part.unit === 'second' && (part.type === 'fraction' || part.type === 'decimal')) {
          result.push(part.value);
          hasSeconds = true;
        }
      }
    });
    if (this._opts.secondsUnit && hasSeconds) {
      result.push(this._opts.secondsUnit(this._opts.locale));
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
