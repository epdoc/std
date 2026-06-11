import { assertEquals } from '@std/assert';
import { humanize } from '../src/mod.ts';

Deno.test('Humanize', async (t) => {
  await t.step('immediate time ranges', async (t) => {
    await t.step("handles 'now' correctly", () => {
      assertEquals(humanize(0), 'now');
      assertEquals(humanize(0, true), 'now');
    });

    await t.step('formats moments appropriately', () => {
      assertEquals(humanize(250), 'a moment');
      assertEquals(humanize(499), 'a moment');
      assertEquals(humanize(500), 'a moment');
      assertEquals(humanize(1999), 'a moment');
      assertEquals(humanize(2000), 'a moment');
    });

    await t.step('applies suffixes to moments correctly', () => {
      assertEquals(humanize(250, true), 'in a moment');
      assertEquals(humanize(-250, true), 'a moment ago');
      assertEquals(humanize(1000, true), 'in a moment');
      assertEquals(humanize(-1000, true), 'a moment ago');
    });
  });

  await t.step('seconds transitions', async (t) => {
    await t.step('handles less than a minute', () => {
      assertEquals(humanize(10 * 1000), 'about 10 seconds');
      assertEquals(humanize(30 * 1000), '30 seconds');
      assertEquals(humanize(52.4 * 1000), '52 seconds');
    });
  });

  await t.step('minute transitions', async (t) => {
    await t.step('transitions to about a minute', () => {
      assertEquals(humanize(52.5 * 1000), '53 seconds');
      assertEquals(humanize(52.51 * 1000), 'about a minute');
      assertEquals(humanize(70 * 1000), 'about a minute');
      assertEquals(humanize(90 * 1000), 'over a minute');
    });

    await t.step('shows precise minutes up to 57', () => {
      assertEquals(humanize(2.5 * 60 * 1000 - 1), 'about 2 minutes');
      assertEquals(humanize(3 * 60 * 1000), 'about 3 minutes');
      assertEquals(humanize(10 * 60 * 1000), 'about 10 minutes');
      assertEquals(humanize(17 * 60 * 1000), '17 minutes');
      assertEquals(humanize(56.9 * 60 * 1000), '57 minutes');
    });

    await t.step('applies suffixes to minute ranges', () => {
      assertEquals(humanize(30 * 1000, true), 'in 30 seconds');
      assertEquals(humanize(-30 * 1000, true), '30 seconds ago');
      assertEquals(humanize(5 * 60 * 1000, true), 'in about 5 minutes');
      assertEquals(humanize(-5 * 60 * 1000, true), 'about 5 minutes ago');
    });
  });

  await t.step('hour transitions', async (t) => {
    await t.step('transitions from minutes to hours smoothly', () => {
      assertEquals(humanize(57 * 60 * 1000), '57 minutes');
      assertEquals(humanize(57.01 * 60 * 1000), 'about an hour');
      assertEquals(humanize(1.2 * 60 * 60 * 1000), 'about an hour');
      assertEquals(humanize(1.5 * 60 * 60 * 1000), 'over an hour');
    });

    await t.step('shows precise hours up to 23', () => {
      assertEquals(humanize(2.5 * 60 * 60 * 1000 - 1), 'about 2 hours');
      assertEquals(humanize(3 * 60 * 60 * 1000), 'about 3 hours');
      assertEquals(humanize(6 * 60 * 60 * 1000), 'about 6 hours');
      assertEquals(humanize(12 * 60 * 60 * 1000), '12 hours');
      assertEquals(humanize(23.4 * 60 * 60 * 1000), '23 hours');
    });

    await t.step('applies suffixes to hour ranges', () => {
      assertEquals(humanize(1.5 * 60 * 60 * 1000, true), 'in over an hour');
      assertEquals(humanize(-1.5 * 60 * 60 * 1000, true), 'over an hour ago');
      assertEquals(humanize(8 * 60 * 60 * 1000, true), 'in about 8 hours');
    });
  });

  await t.step('internationalization', async (t) => {
    await t.step('French (fr)', async (t) => {
      await t.step('handles basic time ranges', () => {
        assertEquals(humanize(0, { locale: 'fr' }), 'maintenant');
        assertEquals(humanize(1500, { locale: 'fr' }), 'un instant');
        assertEquals(humanize(30000, { locale: 'fr' }), '30 secondes');
        assertEquals(humanize(300000, { locale: 'fr' }), 'environ 5 minutes');
        assertEquals(humanize(3600000, { locale: 'fr' }), 'environ une heure');
      });

      await t.step('handles suffixes correctly', () => {
        assertEquals(humanize(30000, { locale: 'fr', withSuffix: true }), 'dans 30 secondes');
        assertEquals(humanize(-30000, { locale: 'fr', withSuffix: true }), 'il y a 30 secondes');
        assertEquals(humanize(3600000, { locale: 'fr', withSuffix: true }), 'dans environ une heure');
      });
    });

    await t.step('Spanish (es)', async (t) => {
      await t.step('handles basic time ranges', () => {
        assertEquals(humanize(0, { locale: 'es' }), 'ahora');
        assertEquals(humanize(1500, { locale: 'es' }), 'un momento');
        assertEquals(humanize(30000, { locale: 'es' }), '30 segundos');
        assertEquals(humanize(300000, { locale: 'es' }), 'cerca de 5 minutos');
        assertEquals(humanize(3600000, { locale: 'es' }), 'cerca de una hora');
      });

      await t.step('handles suffixes correctly', () => {
        assertEquals(humanize(30000, { locale: 'es', withSuffix: true }), 'en 30 segundos');
        assertEquals(humanize(-30000, { locale: 'es', withSuffix: true }), 'hace 30 segundos');
        assertEquals(humanize(3600000, { locale: 'es', withSuffix: true }), 'en cerca de una hora');
      });
    });

    await t.step('Chinese (zh)', async (t) => {
      await t.step('handles basic time ranges', () => {
        assertEquals(humanize(0, { locale: 'zh' }), '现在');
        assertEquals(humanize(1500, { locale: 'zh' }), '片刻');
        assertEquals(humanize(30000, { locale: 'zh' }), '30秒');
        assertEquals(humanize(300000, { locale: 'zh' }), '大约5分钟');
        assertEquals(humanize(3600000, { locale: 'zh' }), '大约一小时');
      });

      await t.step('handles suffixes correctly', () => {
        assertEquals(humanize(30000, { locale: 'zh', withSuffix: true }), '30秒后');
        assertEquals(humanize(-30000, { locale: 'zh', withSuffix: true }), '30秒前');
        assertEquals(humanize(3600000, { locale: 'zh', withSuffix: true }), '大约一小时后');
      });
    });

    await t.step('fallback to English', () => {
      assertEquals(humanize(30000, { locale: 'de' }), '30 seconds');
      assertEquals(humanize(30000, { locale: 'invalid', withSuffix: true }), 'in 30 seconds');
    });

    await t.step('backward compatibility', () => {
      assertEquals(humanize(30000, true), 'in 30 seconds');
      assertEquals(humanize(-30000, true), '30 seconds ago');
    });
  });
});
