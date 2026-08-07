import { assertEquals } from '@std/assert';
import { Geo } from '../src/mod.ts';
import type { AddressComponents } from '../src/geo/types.ts';
import { extractAddress } from '../src/geo/utils.ts';

// --- buildLocationTags ---

Deno.test('Geo.buildLocationTags', async (t) => {
  const addr: AddressComponents = {
    houseNumber: '10',
    road: 'Downing Street',
    neighbourhood: 'Westminster',
    suburb: undefined,
    city: 'London',
    town: undefined,
    village: undefined,
    state: 'England',
    country: 'United Kingdom',
    countryCode: 'GB',
  };

  await t.step('country granularity returns only country tags', () => {
    const tags = Geo.buildLocationTags(addr, Geo.LocationGranularity.country);
    assertEquals(Object.keys(tags).sort(), ['Country', 'CountryCode'].sort());
    assertEquals(tags['Country'], 'United Kingdom');
    assertEquals(tags['CountryCode'], 'GB');
  });

  await t.step('state granularity adds State', () => {
    const tags = Geo.buildLocationTags(addr, Geo.LocationGranularity.state);
    assertEquals(tags['State'], 'England');
    assertEquals(tags['Country'], 'United Kingdom');
  });

  await t.step('city granularity adds City', () => {
    const tags = Geo.buildLocationTags(addr, Geo.LocationGranularity.city);
    assertEquals(tags['City'], 'London');
    assertEquals(tags['State'], 'England');
  });

  await t.step('city granularity uses town if city is missing', () => {
    const townAddr: AddressComponents = {
      ...addr,
      city: undefined,
      town: 'Brighton',
    };
    const tags = Geo.buildLocationTags(townAddr, Geo.LocationGranularity.city);
    assertEquals(tags['City'], 'Brighton');
  });

  await t.step('city granularity uses village if city and town are missing', () => {
    const villageAddr: AddressComponents = {
      ...addr,
      city: undefined,
      town: undefined,
      village: 'Cotswolds',
    };
    const tags = Geo.buildLocationTags(villageAddr, Geo.LocationGranularity.city);
    assertEquals(tags['City'], 'Cotswolds');
  });

  await t.step('sublocation granularity adds Sub-location with road and neighbourhood', () => {
    const tags = Geo.buildLocationTags(addr, Geo.LocationGranularity.sublocation);
    assertEquals(tags['Sub-location'], 'Downing Street, Westminster');
    assertEquals(tags['City'], 'London');
  });

  await t.step('sublocation granularity uses suburb if neighbourhood is missing', () => {
    const suburbAddr: AddressComponents = {
      ...addr,
      neighbourhood: undefined,
      suburb: 'Mayfair',
    };
    const tags = Geo.buildLocationTags(suburbAddr, Geo.LocationGranularity.sublocation);
    assertEquals(tags['Sub-location'], 'Downing Street, Mayfair');
  });

  await t.step('exact granularity includes house number', () => {
    const tags = Geo.buildLocationTags(addr, Geo.LocationGranularity.exact);
    assertEquals(tags['Sub-location'], '10, Downing Street, Westminster');
  });

  await t.step('exact granularity without house number falls back to sublocation behaviour', () => {
    const noHouse: AddressComponents = { ...addr, houseNumber: undefined };
    const tags = Geo.buildLocationTags(noHouse, Geo.LocationGranularity.exact);
    assertEquals(tags['Sub-location'], 'Downing Street, Westminster');
  });

  await t.step('omits State when state is undefined', () => {
    const noState: AddressComponents = { ...addr, state: undefined };
    const tags = Geo.buildLocationTags(noState, Geo.LocationGranularity.state);
    assertEquals('State' in tags, false);
    assertEquals(tags['Country'], 'United Kingdom');
  });

  await t.step('omits Sub-location when no road or area is available', () => {
    const bare: AddressComponents = {
      houseNumber: undefined,
      road: undefined,
      neighbourhood: undefined,
      suburb: undefined,
      city: 'Tokyo',
      town: undefined,
      village: undefined,
      state: undefined,
      country: 'Japan',
      countryCode: 'JP',
    };
    const tags = Geo.buildLocationTags(bare, Geo.LocationGranularity.exact);
    assertEquals(tags['City'], 'Tokyo');
    assertEquals('Sub-location' in tags, false);
  });
});

// --- extractAddress ---

Deno.test('extractAddress', async (t) => {
  await t.step('extracts all fields from a full Nominatim address', () => {
    const result = extractAddress({
      house_number: '10',
      road: 'Downing Street',
      neighbourhood: 'Westminster',
      suburb: 'City of Westminster',
      city: 'London',
      state: 'England',
      country: 'United Kingdom',
      country_code: 'gb',
    });
    assertEquals(result.houseNumber, '10');
    assertEquals(result.road, 'Downing Street');
    assertEquals(result.neighbourhood, 'Westminster');
    assertEquals(result.suburb, 'City of Westminster');
    assertEquals(result.city, 'London');
    assertEquals(result.state, 'England');
    assertEquals(result.country, 'United Kingdom');
    assertEquals(result.countryCode, 'GB');
  });

  await t.step('uses pedestrian tag as road fallback', () => {
    const result = extractAddress({
      pedestrian: 'Oxford Street',
      country: 'UK',
      country_code: 'gb',
    });
    assertEquals(result.road, 'Oxford Street');
  });

  await t.step('uses street tag as road fallback', () => {
    const result = extractAddress({
      street: 'Baker Street',
      country: 'UK',
      country_code: 'gb',
    });
    assertEquals(result.road, 'Baker Street');
  });

  await t.step('picks town as city fallback', () => {
    const result = extractAddress({
      town: 'Brighton',
      country: 'UK',
      country_code: 'gb',
    });
    assertEquals(result.city, 'Brighton');
  });

  await t.step('picks village as city fallback', () => {
    const result = extractAddress({
      village: 'Cotswolds',
      country: 'UK',
      country_code: 'gb',
    });
    assertEquals(result.city, 'Cotswolds');
  });

  await t.step('picks municipality as city fallback', () => {
    const result = extractAddress({
      municipality: 'Borough',
      country: 'UK',
      country_code: 'gb',
    });
    assertEquals(result.city, 'Borough');
  });

  await t.step('city takes priority over town/village/municipality', () => {
    const result = extractAddress({
      city: 'London',
      town: 'Brighton',
      village: 'Cotswolds',
      municipality: 'Borough',
      country: 'UK',
      country_code: 'gb',
    });
    assertEquals(result.city, 'London');
  });

  await t.step('handles missing country and country code', () => {
    const result = extractAddress({});
    assertEquals(result.country, '');
    assertEquals(result.countryCode, '');
  });

  await t.step('uppercases country code', () => {
    const result = extractAddress({
      country_code: 'de',
      country: 'Germany',
    });
    assertEquals(result.countryCode, 'DE');
  });
});

// --- NominatimApi dry-run ---

Deno.test('Geo.NominatimApi.reverse dry-run', async (t) => {
  await t.step('returns a synthetic result without making a network call', async () => {
    const api = new Geo.NominatimApi({ dryRun: true });
    const result = await api.reverse(51.5074, -0.1278);
    assertEquals(result.displayName, '[DRYRUN] 51.5074,-0.1278');
    assertEquals(result.lat, '51.5074');
    assertEquals(result.lon, '-0.1278');
    assertEquals(result.address.country, '[DRYRUN]');
    assertEquals(result.address.countryCode, 'XX');
  });
});
