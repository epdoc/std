import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import { humanize } from '../src/mod.ts';

describe('Humanize', () => {
  describe('immediate time ranges', () => {
    it("handles 'now' correctly", () => {
      expect(humanize(0)).toBe('now');
      expect(humanize(0, true)).toBe('now');
    });

    it('formats moments appropriately', () => {
      expect(humanize(250)).toBe('a moment');
      expect(humanize(499)).toBe('a moment');
      expect(humanize(500)).toBe('a moment');
      expect(humanize(1999)).toBe('a moment');
      expect(humanize(2000)).toBe('a moment');
    });

    it('applies suffixes to moments correctly', () => {
      expect(humanize(250, true)).toBe('in a moment');
      expect(humanize(-250, true)).toBe('a moment ago');
      expect(humanize(1000, true)).toBe('in a moment');
      expect(humanize(-1000, true)).toBe('a moment ago');
    });
  });

  describe('seconds transitions', () => {
    it('handles less than a minute', () => {
      expect(humanize(10 * 1000)).toBe('about 10 seconds');
      expect(humanize(30 * 1000)).toBe('30 seconds');
      expect(humanize(52.4 * 1000)).toBe('52 seconds');
    });
  });

  describe('minute transitions', () => {
    it('transitions to about a minute', () => {
      expect(humanize(52.5 * 1000)).toBe('53 seconds');
      expect(humanize(52.51 * 1000)).toBe('about a minute');
      expect(humanize(70 * 1000)).toBe('about a minute');
      expect(humanize(90 * 1000)).toBe('over a minute');
    });

    it('shows precise minutes up to 57', () => {
      expect(humanize(2.5 * 60 * 1000 - 1)).toBe('about 2 minutes');
      expect(humanize(3 * 60 * 1000)).toBe('about 3 minutes');
      expect(humanize(10 * 60 * 1000)).toBe('about 10 minutes');
      expect(humanize(17 * 60 * 1000)).toBe('17 minutes');
      expect(humanize(56.9 * 60 * 1000)).toBe('57 minutes');
    });

    it('applies suffixes to minute ranges', () => {
      expect(humanize(30 * 1000, true)).toBe('in 30 seconds');
      expect(humanize(-30 * 1000, true)).toBe('30 seconds ago');
      expect(humanize(5 * 60 * 1000, true)).toBe('in about 5 minutes');
      expect(humanize(-5 * 60 * 1000, true)).toBe('about 5 minutes ago');
    });
  });

  describe('hour transitions', () => {
    it('transitions from minutes to hours smoothly', () => {
      expect(humanize(57 * 60 * 1000)).toBe('57 minutes');
      expect(humanize(57.01 * 60 * 1000)).toBe('about an hour');
      expect(humanize(1.2 * 60 * 60 * 1000)).toBe('about an hour');
      expect(humanize(1.5 * 60 * 60 * 1000)).toBe('over an hour');
    });

    it('shows precise hours up to 23', () => {
      expect(humanize(2.5 * 60 * 60 * 1000 - 1)).toBe('about 2 hours');
      expect(humanize(3 * 60 * 60 * 1000)).toBe('about 3 hours');
      expect(humanize(6 * 60 * 60 * 1000)).toBe('about 6 hours');
      expect(humanize(12 * 60 * 60 * 1000)).toBe('12 hours');
      expect(humanize(23.4 * 60 * 60 * 1000)).toBe('23 hours');
    });

    it('applies suffixes to hour ranges', () => {
      expect(humanize(1.5 * 60 * 60 * 1000, true)).toBe('in over an hour');
      expect(humanize(-1.5 * 60 * 60 * 1000, true)).toBe('over an hour ago');
      expect(humanize(8 * 60 * 60 * 1000, true)).toBe('in about 8 hours');
    });
  });

  describe('internationalization', () => {
    describe('French (fr)', () => {
      it('handles basic time ranges', () => {
        expect(humanize(0, { locale: 'fr' })).toBe('maintenant');
        expect(humanize(1500, { locale: 'fr' })).toBe('un instant');
        expect(humanize(30000, { locale: 'fr' })).toBe('30 secondes');
        expect(humanize(300000, { locale: 'fr' })).toBe('environ 5 minutes');
        expect(humanize(3600000, { locale: 'fr' })).toBe('environ une heure');
      });

      it('handles suffixes correctly', () => {
        expect(humanize(30000, { locale: 'fr', withSuffix: true })).toBe('dans 30 secondes');
        expect(humanize(-30000, { locale: 'fr', withSuffix: true })).toBe('il y a 30 secondes');
        expect(humanize(3600000, { locale: 'fr', withSuffix: true })).toBe('dans environ une heure');
      });
    });

    describe('Spanish (es)', () => {
      it('handles basic time ranges', () => {
        expect(humanize(0, { locale: 'es' })).toBe('ahora');
        expect(humanize(1500, { locale: 'es' })).toBe('un momento');
        expect(humanize(30000, { locale: 'es' })).toBe('30 segundos');
        expect(humanize(300000, { locale: 'es' })).toBe('cerca de 5 minutos');
        expect(humanize(3600000, { locale: 'es' })).toBe('cerca de una hora');
      });

      it('handles suffixes correctly', () => {
        expect(humanize(30000, { locale: 'es', withSuffix: true })).toBe('en 30 segundos');
        expect(humanize(-30000, { locale: 'es', withSuffix: true })).toBe('hace 30 segundos');
        expect(humanize(3600000, { locale: 'es', withSuffix: true })).toBe('en cerca de una hora');
      });
    });

    describe('Chinese (zh)', () => {
      it('handles basic time ranges', () => {
        expect(humanize(0, { locale: 'zh' })).toBe('现在');
        expect(humanize(1500, { locale: 'zh' })).toBe('片刻');
        expect(humanize(30000, { locale: 'zh' })).toBe('30秒');
        expect(humanize(300000, { locale: 'zh' })).toBe('大约5分钟');
        expect(humanize(3600000, { locale: 'zh' })).toBe('大约一小时');
      });

      it('handles suffixes correctly', () => {
        expect(humanize(30000, { locale: 'zh', withSuffix: true })).toBe('30秒后');
        expect(humanize(-30000, { locale: 'zh', withSuffix: true })).toBe('30秒前');
        expect(humanize(3600000, { locale: 'zh', withSuffix: true })).toBe('大约一小时后');
      });
    });

    describe('fallback to English', () => {
      it('uses English for unsupported locales', () => {
        expect(humanize(30000, { locale: 'de' })).toBe('30 seconds');
        expect(humanize(30000, { locale: 'invalid', withSuffix: true })).toBe('in 30 seconds');
      });
    });

    describe('backward compatibility', () => {
      it('supports legacy boolean parameter', () => {
        expect(humanize(30000, true)).toBe('in 30 seconds');
        expect(humanize(-30000, true)).toBe('30 seconds ago');
      });
    });
  });
});
