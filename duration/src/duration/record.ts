/**
 * A class for representing a duration of time as a record of time units.
 * @module
 */
import { type Dict, isDict } from '@epdoc/type';
import * as Time from '../consts.ts';
import { Fields } from './consts.ts';
import type * as Duration from './types.ts';

/**
 * A class for representing a duration of time as a record of time units.
 */
export class DurationRecord {
  protected _ms: number = 0;
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
   * @param {number | Duration.RecordOptions} arg - The duration in milliseconds or a record of time units.
   */
  constructor(arg: number | Duration.RecordOptions) {
    if (typeof arg === 'number') {
      if (arg < 0) {
        this._ms = -arg;
      } else {
        this._ms = arg;
      }

      // Duration.Fields.forEach((field) => {
      //   this.setField(field, Math.floor(this._ms / Time.Measures[field]) % Time.Ratios[field]);
      // });
      this.days = Math.floor(this._ms / Time.Measures.days);
      this.hours = Math.floor(this._ms / Time.Measures.hours) % Time.Ratios.hours;
      this.minutes = Math.floor(this._ms / Time.Measures.minutes) % Time.Ratios.minutes;
      this.seconds = Math.floor(this._ms / Time.Measures.seconds) % Time.Ratios.seconds;
      this.milliseconds = Math.floor(this._ms) % Time.Ratios.milliseconds;
      this.microseconds = Math.floor(this._ms * 1000) % Time.Ratios.microseconds;
      this.nanoseconds = Math.floor(this._ms * 1000000) % Time.Ratios.nanoseconds;
    } else if (isDict(arg)) {
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
      days: this.days,
      hours: this.hours,
      minutes: this.minutes,
      seconds: this.seconds,
      milliseconds: this.milliseconds,
      microseconds: this.microseconds,
      nanoseconds: this.nanoseconds,
    };
  }
}
