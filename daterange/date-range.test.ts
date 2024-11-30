import { dateEx } from '@epdoc/datetime';
import { expect } from 'jsr:@std/expect';
import { describe, test } from 'jsr:@std/testing/bdd';
import { dateList, type DateRangeDef, dateStringToDate } from './mod.ts';

describe('date-range', () => {
  describe('dateStringToDate', () => {
    test('YYYYMMDD', () => {
      const d = dateStringToDate('20241123');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(10);
      expect(d.getDate()).toBe(23);
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(dateEx(d).toISOLocalString()).toContain('2024-11-23T00:00:00');
    });
    test('YYYYMMDDhhmm', () => {
      const d = dateStringToDate('202411231213');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(10);
      expect(d.getDate()).toBe(23);
      expect(d.getHours()).toBe(12);
      expect(d.getMinutes()).toBe(13);
      expect(dateEx(d).toISOLocalString()).toContain('2024-11-23T12:13:00');
    });
    test('YYYYMMDDHH', () => {
      const d = dateStringToDate('202411231213');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(10);
      expect(d.getDate()).toBe(23);
      expect(dateEx(d).toISOLocalString()).toContain('2024-11-23T12:13:00');
    });
  });
  describe('dateList', () => {
    test('YYYYMMDD-YYYYMMDD', () => {
      const d: DateRangeDef[] = dateList('20241123-20241124');
      expect(d[0].after?.getFullYear()).toBe(2024);
      expect(d[0].after?.getMonth()).toBe(10);
      expect(d[0].after?.getDate()).toBe(23);
      expect(d[0].after?.getHours()).toBe(0);
      expect(d[0].after?.getMinutes()).toBe(0);
      expect(dateEx(d[0].after).toISOLocalString()).toContain('2024-11-23T00:00:00');
      expect(d[0].before?.getFullYear()).toBe(2024);
      expect(d[0].before?.getMonth()).toBe(10);
      expect(d[0].before?.getDate()).toBe(25);
      expect(d[0].before?.getHours()).toBe(0);
      expect(d[0].before?.getMinutes()).toBe(0);
      expect(dateEx(d[0].before).toISOLocalString()).toContain('2024-11-25T00:00:00');
    });
    test('YYYYMMDDhh-YYYYMMDDhh', () => {
      const d: DateRangeDef[] = dateList('2024112312-2024112415');
      expect(d[0].after?.getFullYear()).toBe(2024);
      expect(d[0].after?.getMonth()).toBe(10);
      expect(d[0].after?.getDate()).toBe(23);
      expect(d[0].after?.getHours()).toBe(12);
      expect(d[0].after?.getMinutes()).toBe(0);
      expect(dateEx(d[0].after).toISOLocalString()).toContain('2024-11-23T12:00:00');
      expect(d[0].before?.getFullYear()).toBe(2024);
      expect(d[0].before?.getMonth()).toBe(10);
      expect(d[0].before?.getDate()).toBe(24);
      expect(d[0].before?.getHours()).toBe(15);
      expect(d[0].before?.getMinutes()).toBe(0);
      expect(dateEx(d[0].before).toISOLocalString()).toContain('2024-11-24T15:00:00');
    });
  });
});
