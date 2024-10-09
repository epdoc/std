import * as Duration from './duration-types.ts';

export type PruneOptions = Partial<{
  min: Duration.Field;
  max: Duration.Field;
}>;

export class DurationRecord {
  protected _ms: number;
  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;
  milliseconds: number = 0;
  microseconds: number = 0;
  nanoseconds: number = 0;
  // [key: string]: Integer;

  constructor(milliseconds: number) {
    if (milliseconds < 0) {
      this._ms = -milliseconds;
    } else {
      this._ms = milliseconds;
    }

    // Duration.Fields.forEach((field) => {
    //   this.setField(field, Math.floor(this._ms / Duration.TIME[field]) % Duration.RATIO[field]);
    // });
    this.days = Math.floor(this._ms / Duration.TIME.days);
    this.hours = Math.floor(this._ms / Duration.TIME.hours) % Duration.RATIO.hours;
    this.minutes = Math.floor(this._ms / Duration.TIME.minutes) % Duration.RATIO.minutes;
    this.seconds = Math.floor(this._ms / Duration.TIME.seconds) % Duration.RATIO.seconds;
    this.milliseconds = Math.floor(this._ms) % Duration.RATIO.milliseconds;
    this.microseconds = Math.floor(this._ms * 1000) % Duration.RATIO.microseconds;
    this.nanoseconds = Math.floor(this._ms * 1000000) % Duration.RATIO.nanoseconds;
  }

  setField(field: Duration.Field, value: number) {
    // @ts-ignore this is a valid index
    this[field] = value;
  }
  getField(field: Duration.Field): number {
    // @ts-ignore this is a valid index
    return this[field];
  }

  public pruneMin(minFieldName: Duration.Field): this {
    // Minimize upwards into fractional values
    if (minFieldName) {
      const minFieldTime = Duration.TIME[minFieldName];
      // let remainder = 0;
      Duration.Fields.reverse().forEach((fieldName) => {
        const fieldTime = Duration.TIME[fieldName];
        // const fieldRatio = Duration.RATIO[fieldName];
        // const fieldValue = this.getField(fieldName);
        if (fieldTime < minFieldTime) {
          // remainder = this.getField(fieldName) * fieldRatio;
          this.setField(fieldName, 0);
          // } else if (false && fieldTime === minFieldTime && remainder > 0) {
          //   this.setField(fieldName, fieldValue + remainder * fieldRatio);
        } else if (fieldTime === minFieldTime) {
          this.setField(fieldName, (this._ms / Duration.TIME[minFieldName]) % Duration.RATIO[minFieldName]);
        }
      });
    }
    return this;
  }

  public pruneMax(maxFieldName: Duration.Field): this {
    // Maximize downwards into integer values
    if (maxFieldName) {
      const maxFieldTime = Duration.TIME[maxFieldName];
      Duration.Fields.forEach((fieldName) => {
        const fieldTime = Duration.TIME[fieldName];
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
}
