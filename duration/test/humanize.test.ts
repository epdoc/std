import { expect } from 'jsr:@std/expect@1.0.17';
import { describe, it } from 'jsr:@std/testing@1.0.16/bdd';
import { humanize } from '../src/duration/humanize.ts';

describe('humanize', () => {
  describe('basic humanization', () => {
    it('should handle zero and small durations', () => {
      expect(humanize(0)).toEqual('now');
      expect(humanize(500)).toEqual('a moment');
      expect(humanize(1000)).toEqual('a second');
      expect(humanize(2000)).toEqual('2 seconds');
    });

    it('should handle seconds to minutes transition', () => {
      expect(humanize(44999)).toEqual('45 seconds'); // rounds to 45
      expect(humanize(45000)).toEqual('less than a minute');
      expect(humanize(89999)).toEqual('over a minute');
      expect(humanize(90000)).toEqual('about 2 minutes');
    });

    it('should handle larger durations', () => {
      expect(humanize(3600000)).toEqual('an hour');
      expect(humanize(86400000)).toEqual('24 hours');
    });
  });

  describe('with suffix', () => {
    it('should handle zero specially', () => {
      expect(humanize(0, true)).toEqual('now');
    });

    it('should add appropriate suffixes', () => {
      expect(humanize(500, true)).toEqual('in a moment');
      expect(humanize(-500, true)).toEqual('a moment ago');
      expect(humanize(1000, true)).toEqual('in a second');
      expect(humanize(-1000, true)).toEqual('a second ago');
      expect(humanize(45000, true)).toEqual('in less than a minute');
      expect(humanize(-45000, true)).toEqual('less than a minute ago');
    });
  });

  describe('threshold boundaries', () => {
    it('should handle sub-second thresholds', () => {
      expect(humanize(999)).toEqual('a moment');
      expect(humanize(1000)).toEqual('a second');
    });

    it('should handle second to minute thresholds', () => {
      expect(humanize(44999)).toEqual('45 seconds');
      expect(humanize(45000)).toEqual('a minute');
      expect(humanize(89999)).toEqual('a minute');
      expect(humanize(90000)).toEqual('about 2 minutes'); // 1.5 min rounds to about 2
    });

    it('should handle minute to hour thresholds', () => {
      expect(humanize(2699999)).toEqual('45 minutes'); // 44.99 min rounds to 45
      expect(humanize(2700000)).toEqual('an hour'); // 45 min
      expect(humanize(5399999)).toEqual('an hour'); // 89.99 min
      expect(humanize(5400000)).toEqual('about 2 hours'); // 90 min = 1.5 hr rounds to about 2
    });
  });

  describe('about vs exact', () => {
    it('should use exact values when no significant rounding', () => {
      expect(humanize(120000)).toEqual('2 minutes'); // exactly 2 minutes
      expect(humanize(7200000)).toEqual('2 hours'); // exactly 2 hours
    });

    it('should use "about" for significantly rounded values', () => {
      expect(humanize(90000)).toEqual('about 2 minutes'); // 1.5 min -> about 2
      expect(humanize(138000)).toEqual('about 2 minutes'); // 2.3 min -> about 2
      expect(humanize(5400000)).toEqual('about 2 hours'); // 1.5 hr -> about 2
      expect(humanize(8640000)).toEqual('about 2 hours'); // 2.4 hr -> about 2
    });

    it('should handle close to exact values', () => {
      // Close to exact - no "about"
      const oneYear = 365.25 * 24 * 60 * 60 * 1000;
      const twoDays = 2 * 24 * 60 * 60 * 1000;
      expect(humanize(oneYear + twoDays)).toEqual('a year'); // 1yr + 2days ≈ 1yr
    });
  });

  describe('fractional values', () => {
    it('should handle fractional rounding with about', () => {
      expect(humanize(90000)).toEqual('about 2 minutes'); // 1.5 minutes -> about 2 minutes (rounded)
      expect(humanize(5400000)).toEqual('about 2 hours'); // 1.5 hours -> about 2 hours (rounded)
      expect(humanize(138000)).toEqual('about 2 minutes'); // 2.3 minutes -> about 2 minutes
      expect(humanize(3500)).toEqual('4 seconds'); // 3.5 seconds -> 4 seconds (rounded)
      expect(humanize(146880000)).toEqual('a day'); // 1.7 days -> a day
    });

    it('should handle fractional values with suffix', () => {
      expect(humanize(5400000, true)).toEqual('in about 2 hours'); // 1.5 hours with suffix
      expect(humanize(-90000, true)).toEqual('about 2 minutes ago'); // -1.5 minutes with suffix
    });
  });

  describe('years', () => {
    it('should handle year durations', () => {
      const oneYear = 365.25 * 24 * 60 * 60 * 1000;
      expect(humanize(oneYear)).toEqual('a year');
      expect(humanize(oneYear * 2)).toEqual('2 years');
      expect(humanize(oneYear, true)).toEqual('in a year');
      expect(humanize(-oneYear, true)).toEqual('a year ago');
    });
  });
});
