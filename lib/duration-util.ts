import { isDict } from 'https://raw.githubusercontent.com/jpravetz/typeutil/master/mod.ts';
import { DurationRecord } from './duration-record.ts';
import * as Duration from './duration-types.ts';
import { type HrMilliseconds, Milliseconds } from './types.ts';

/**
 * Construct a new `DurationUtil` instance. If `formatting` is not a
 * `FormatMsName` then will initialize formatting with default `:` format.
 * @param {Milliseconds} ms - The duration we are outputing. We use the absolute value.
 * @param {FormatMsOptions | FormatMsName} formatting - Defines the format.
 * @see options
 */
export function durationUtil(format?: Duration.Options) {
  return new DurationUtil(format);
}

const DEFAULT_OPTS: Duration.Options = {
  style: 'digital',
  daysHoursSeparator: 'd',
  hoursMinutesSeparator: 'h',
  minutesSecondsSeparator: 'm',
  secondsUnit: 's',
  minDisplay: 'seconds',
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
  constructor(format?: Duration.Options) {
    if (format) {
      this._opts = Object.assign({}, format);
    }
  }

  /**
   * Define a custom format by overwriting the already-set format options.
   * @param opts The `FormatMsName` name of one of the preset formats, or a
   * `FormatMsOptions` object, which are then used to override the individual
   * values.
   * @returns this
   */
  public options(format?: Duration.Options): this {
    this._opts = Object.assign({}, format);
    return this;
  }

  public apply(format?: Duration.Options): this {
    if (!isDict(this._opts)) {
      this._opts = Object.assign({}, DEFAULT_OPTS, format);
    } else {
      this._opts = Object.assign(this._opts, format);
    }
    return this;
  }

  public format(ms: Milliseconds | HrMilliseconds): string {
    if (!isDict(this._opts)) {
      this._opts = Object.assign({}, DEFAULT_OPTS);
    }

    const time: DurationRecord = new DurationRecord(ms).prune({
      min: this._opts.minDisplay,
      max: this._opts.maxDisplay,
    });

    // @ts-ignore DurationFormat is not yet in TS
    return new Intl.DurationFormat('en', this._opts).format(time);
  }
}
