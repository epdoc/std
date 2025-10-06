import type { ISODate, ISOTzDate } from '@epdoc/datetime';

/**
 * Represents a definition of a date range with optional before and after dates.
 * @typedef {Object} DateRangeDef
 * @property {Date} [before] - The end datetime of the range.
 * @property {Date} [after] - The start datetime of the range.
 */

export type DateRangeDef = {
  before?: Date;
  after?: Date;
};

/**
 * The format of DateRanges toJSON method.
 */
export type DateRangeJSON = {
  after?: ISODate | ISOTzDate;
  before?: ISODate | ISOTzDate;
};
