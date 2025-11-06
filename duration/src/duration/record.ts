/**
 * A class for representing a duration of time as a record of time units.
 * @module
 */
import { _, type Dict } from '@epdoc/type';
import * as Time from '../consts.ts';
import { Fields } from './consts.ts';
import type * as Intl2 from './intl.ts';
import type * as Duration from './types.ts';

function isDurationRecord(val: unknown): val is Intl2.DurationRecord {
  return _.isDict(val);
}

/**
 * A class for representing a duration of time as a record of time units.
 */
export class DurationRecord {
  protected _ms: number = 0;
  years: number = 0;
  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;
  milliseconds: number = 0;
  microseconds: number = 0;
  nanoseconds: number = 0;
  // [key: string]: Integer;

  /**
   * Construct a new `DurationRecord` instance.
   * @param {number | Intl2.DurationRecord} arg - The duration in milliseconds or a record of time units.
   */
  constructor(arg: number | Intl2.DurationRecord) {
    if (typeof arg === 'number') {
      if (arg < 0) {
        this._ms = -arg;
      } else {
        this._ms = arg;
      }

      // Duration.Fields.forEach((field) => {
      //   this.setField(field, Math.floor(this._ms / Time.Measures[field]) % Time.Ratios[field]);
      // });
      this.years = Math.floor(this._ms / Time.Measures.years);
      const remainingAfterYears = this._ms - (this.years * Time.Measures.years);
      this.days = Math.floor(remainingAfterYears / Time.Measures.days);
      const remainingAfterDays = remainingAfterYears - (this.days * Time.Measures.days);
      this.hours = Math.floor(remainingAfterDays / Time.Measures.hours);
      const remainingAfterHours = remainingAfterDays - (this.hours * Time.Measures.hours);
      this.minutes = Math.floor(remainingAfterHours / Time.Measures.minutes);
      const remainingAfterMinutes = remainingAfterHours - (this.minutes * Time.Measures.minutes);
      this.seconds = Math.floor(remainingAfterMinutes / Time.Measures.seconds);
      const remainingAfterSeconds = remainingAfterMinutes - (this.seconds * Time.Measures.seconds);
      this.milliseconds = Math.floor(remainingAfterSeconds);
      const remainingAfterMilliseconds = remainingAfterSeconds - this.milliseconds;
      this.microseconds = Math.floor(remainingAfterMilliseconds * 1000);
      const remainingAfterMicroseconds = remainingAfterMilliseconds - (this.microseconds / 1000);
      this.nanoseconds = Math.floor(remainingAfterMicroseconds * 1000000);
    } else if (isDurationRecord(arg)) {
      this.years = arg.years ?? 0;
      this.days = arg.days ?? 0;
      this.hours = arg.hours ?? 0;
      this.minutes = arg.minutes ?? 0;
      this.seconds = arg.seconds ?? 0;
      this.milliseconds = arg.milliseconds ?? 0;
      this.microseconds = arg.microseconds ?? 0;
      this.nanoseconds = arg.nanoseconds ?? 0;
      this._ms = this.days * Time.Measures.days +
        this.hours * Time.Measures.hours +
        this.minutes * Time.Measures.minutes +
        this.seconds * Time.Measures.seconds +
        this.milliseconds * Time.Measures.milliseconds +
        this.microseconds * Time.Measures.microseconds +
        this.nanoseconds * Time.Measures.nanoseconds;
    }
  }

  /**
   * Set the value of a field.
   * @param {Duration.Field} field - The field to set.
   * @param {number} value - The value to set.
   */
  setField(field: Duration.Field, value: number) {
    // @ts-ignore this is a valid index
    this[field] = value;
  }

  /**
   * Get the value of a field.
   * @param {Duration.Field} field - The field to get.
   * @returns {number} The value of the field.
   */
  getField(field: Duration.Field): number {
    // @ts-ignore this is a valid index
    return this[field];
  }

  /**
   * Prune the record to a minimum unit.
   * @param {Duration.Field} minFieldName - The minimum unit to keep.
   * @returns {this}
   */
  public pruneMin(minFieldName?: Duration.Field): this {
    // Minimize upwards into fractional values
    if (minFieldName) {
      const minFieldTime = Time.Measures[minFieldName];
      // let remainder = 0;
      Fields.reverse().forEach((fieldName) => {
        const fieldTime = Time.Measures[fieldName];
        // const fieldTime.Ratios = Time.Ratios[fieldName];
        // const fieldValue = this.getField(fieldName);
        if (fieldTime < minFieldTime) {
          // remainder = this.getField(fieldName) * fieldTime.Ratios;
          this.setField(fieldName, 0);
          // } else if (false && fieldTime.Measures === minFieldTime.Measures && remainder > 0) {
          //   this.setField(fieldName, fieldValue + remainder * fieldTime.Ratios);
        } else if (fieldTime === minFieldTime) {
          this.setField(fieldName, (this._ms / Time.Measures[minFieldName]) % Time.Ratios[minFieldName]);
        }
      });
    }
    return this;
  }

  /**
   * Prune the record to display only the N most significant non-zero units.
   * @param {number} maxUnits - The maximum number of non-zero units to keep (e.g., 2).
   * @returns {this}
   */
  public pruneAdaptive(maxUnits: number = 2): this {
    // Special case: if all fields are zero, don't prune anything
    if (this.isZero()) {
      return this;
    }

    let unitsKept = 0;
    let startedCounting = false;

    // Fields should be ordered from largest to smallest (e.g., years, days, hours...)
    for (const fieldName of Fields) {
      const fieldValue = this.getField(fieldName);

      // Once we find the first non-zero field, start counting
      if (!startedCounting && fieldValue !== 0) {
        startedCounting = true;
      }

      // If we're counting, keep units up to the limit
      if (startedCounting) {
        unitsKept++;

        // If we've hit the limit, zero out all subsequent fields
        if (unitsKept > maxUnits) {
          this.setField(fieldName, 0);
        }
      }
    }
    return this;
  }

  /**
   * Prune the record to a maximum unit.
   * @param {Duration.Field} maxFieldName - The maximum unit to keep.
   * @returns {this}
   */
  public pruneMax(maxFieldName?: Duration.Field): this {
    // Maximize downwards into integer values
    if (maxFieldName) {
      const maxFieldTime = Time.Measures[maxFieldName];
      Fields.forEach((fieldName) => {
        const fieldTime = Time.Measures[fieldName];
        const fieldValue = this.getField(fieldName);
        if (fieldTime > maxFieldTime && fieldValue > 0) {
          // @ts-ignore this is a valid index
          this.setField(maxFieldName, this.getField(maxFieldName) + (fieldTime / maxFieldTime) * fieldValue);
          this.setField(fieldName, 0);
        }
      });
    }
    return this;
  }

  /**
   * Check if the duration is zero.
   * @returns {boolean} True if the duration is zero, false otherwise.
   */
  isZero(): boolean {
    return (
      this.years === 0 &&
      this.days === 0 &&
      this.hours === 0 &&
      this.minutes === 0 &&
      this.seconds === 0 &&
      this.milliseconds === 0 &&
      this.microseconds === 0 &&
      this.nanoseconds === 0
    );
  }

  /**
   * Convert the record to a plain object.
   * @returns {Dict} The record as a plain object.
   */
  public toTime(): Dict {
    return {
      years: Math.floor(this.years),
      days: Math.floor(this.days),
      hours: Math.floor(this.hours),
      minutes: Math.floor(this.minutes),
      seconds: Math.floor(this.seconds),
      milliseconds: Math.floor(this.milliseconds),
      microseconds: Math.floor(this.microseconds),
      nanoseconds: Math.floor(this.nanoseconds),
    };
  }
}
