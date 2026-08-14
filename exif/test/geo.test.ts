import { assertEquals, assertThrows } from '@std/assert';
import type { NominatimResponse } from '../src/geo/types.ts';
import { Geo } from '../src/mod.ts';

function lookupFrom(
  address: Record<string, string | undefined>,
  displayName?: string,
): Geo.AddressLookup {
  const api = new Geo.AddressLookup();
  api.parseNominatimResponse({ display_name: displayName, address });
  return api;
}

const FULL_ADDRESS: Record<string, string | undefined> = {
  house_number: '10',
  road: 'Downing Street',
  neighbourhood: 'Westminster',
  suburb: 'City of Westminster',
  city: 'London',
  county: 'Greater London',
  state: 'England',
  postcode: 'SW1A 2AA',
  country: 'United Kingdom',
  country_code: 'gb',
};

// --- parseNominatimResponse ---

Deno.test('Geo.AddressLookup.parseNominatimResponse', async (t) => {
  await t.step('parses all fields into the address getter', () => {
    const api = lookupFrom(
      FULL_ADDRESS,
      '10 Downing Street, Westminster, London, England, United Kingdom',
    );
    assertEquals(api.address, {
      country: 'United Kingdom',
      countryCode: 'GB',
      state: 'England',
      county: 'Greater London',
      city: 'London',
      location: 'City of Westminster',
      postalCode: 'SW1A 2AA',
      streetAddress: '10 Downing Street',
    });
  });

  await t.step('exposes the display name', () => {
    const api = lookupFrom(FULL_ADDRESS, '10 Downing Street, Westminster');
    assertEquals(api.displayName, '10 Downing Street, Westminster');
  });

  await t.step('exposes the raw response', () => {
    const api = lookupFrom(FULL_ADDRESS, '10 Downing Street, Westminster');
    assertEquals(api.response.address, FULL_ADDRESS);
    assertEquals(api.response.display_name, '10 Downing Street, Westminster');
  });

  await t.step('builds the full tag set from the raw address', () => {
    const api = lookupFrom(FULL_ADDRESS);
    assertEquals(api.tags, {
      'MWG:Country': 'United Kingdom',
      'MWG:CountryCode': 'GB',
      'MWG:State': 'England',
      'MWG:County': 'Greater London',
      'MWG:City': 'London',
      'MWG:Location': 'City of Westminster',
      'XMP-iptcCore:PostalCode': 'SW1A 2AA',
      'XMP-iptcCore:StreetAddress': '10 Downing Street',
    });
  });

  await t.step('throws when response data is requested before parsing', () => {
    const api = new Geo.AddressLookup();
    assertThrows(() => api.response);
  });

  await t.step('throws when address data is requested before parsing', () => {
    const api = new Geo.AddressLookup();
    assertThrows(() => api.address);
  });

  await t.step('throws when tags are requested before parsing', () => {
    const api = new Geo.AddressLookup();
    assertThrows(() => api.tags);
  });

  await t.step('throws when displayName is requested before parsing', () => {
    const api = new Geo.AddressLookup();
    assertThrows(() => api.displayName);
  });
});

// --- getTags granularity ---

Deno.test('Geo.AddressLookup.getTags granularity', async (t) => {
  const api = lookupFrom(FULL_ADDRESS);

  await t.step('country granularity returns only country tags', () => {
    const tags = api.getTags(Geo.Level.country);
    assertEquals(
      Object.keys(tags).sort(),
      ['MWG:Country', 'MWG:CountryCode'].sort(),
    );
    assertEquals(tags['MWG:Country'], 'United Kingdom');
    assertEquals(tags['MWG:CountryCode'], 'GB');
  });

  await t.step('state granularity adds State', () => {
    const tags = api.getTags(Geo.Level.state);
    assertEquals(tags['MWG:State'], 'England');
    assertEquals(tags['MWG:Country'], 'United Kingdom');
    assertEquals('MWG:County' in tags, false);
  });

  await t.step('county granularity adds County', () => {
    const tags = api.getTags(Geo.Level.county);
    assertEquals(tags['MWG:County'], 'Greater London');
    assertEquals(tags['MWG:State'], 'England');
    assertEquals('MWG:City' in tags, false);
  });

  await t.step('city granularity adds City', () => {
    const tags = api.getTags(Geo.Level.city);
    assertEquals(tags['MWG:City'], 'London');
    assertEquals(tags['MWG:County'], 'Greater London');
    assertEquals('MWG:Location' in tags, false);
  });

  await t.step('location granularity adds Location and PostalCode', () => {
    const tags = api.getTags(Geo.Level.location);
    assertEquals(tags['MWG:Location'], 'City of Westminster');
    assertEquals(tags['XMP-iptcCore:PostalCode'], 'SW1A 2AA');
    assertEquals('XMP-iptcCore:StreetAddress' in tags, false);
  });

  await t.step('exact granularity adds StreetAddress', () => {
    const tags = api.getTags(Geo.Level.exact);
    assertEquals(tags['XMP-iptcCore:StreetAddress'], '10 Downing Street');
    assertEquals(tags['MWG:City'], 'London');
  });
});

// --- field priority ---

Deno.test('Geo.AddressLookup field priority', async (t) => {
  await t.step('road falls back to pedestrian, footway, and street', () => {
    const pedestrian = lookupFrom({ pedestrian: 'Oxford Street', country: 'UK', country_code: 'gb' });
    assertEquals(pedestrian.address.streetAddress, 'Oxford Street');

    const footway = lookupFrom({ footway: 'Baker Street', country: 'UK', country_code: 'gb' });
    assertEquals(footway.address.streetAddress, 'Baker Street');

    const street = lookupFrom({ street: 'Regent Street', country: 'UK', country_code: 'gb' });
    assertEquals(street.address.streetAddress, 'Regent Street');
  });

  await t.step('road takes priority over pedestrian', () => {
    const api = lookupFrom({ road: 'Downing Street', pedestrian: 'Oxford Street' });
    assertEquals(api.address.streetAddress, 'Downing Street');
  });

  await t.step('city falls back to town, village, and municipality', () => {
    const town = lookupFrom({ town: 'Brighton', country: 'UK', country_code: 'gb' });
    assertEquals(town.address.city, 'Brighton');

    const village = lookupFrom({ village: 'Cotswolds', country: 'UK', country_code: 'gb' });
    assertEquals(village.address.city, 'Cotswolds');

    const municipality = lookupFrom({ municipality: 'Borough', country: 'UK', country_code: 'gb' });
    assertEquals(municipality.address.city, 'Borough');
  });

  await t.step('hamlet and town take priority over city', () => {
    const hamlet = lookupFrom({ hamlet: 'Dartmoor', town: 'Brighton', city: 'London' });
    assertEquals(hamlet.address.city, 'Dartmoor');

    const town = lookupFrom({ city: 'London', town: 'Brighton' });
    assertEquals(town.address.city, 'Brighton');
  });

  await t.step('state falls back to province and region', () => {
    const province = lookupFrom({ province: 'Ontario', country: 'Canada', country_code: 'ca' });
    assertEquals(province.address.state, 'Ontario');

    const region = lookupFrom({ region: 'Normandy', country: 'France', country_code: 'fr' });
    assertEquals(region.address.state, 'Normandy');
  });

  await t.step('location picks suburb over neighbourhood', () => {
    const both = lookupFrom({ suburb: 'City of Westminster', neighbourhood: 'Westminster' });
    assertEquals(both.address.location, 'City of Westminster');

    const onlyNeighbourhood = lookupFrom({ neighbourhood: 'Westminster' });
    assertEquals(onlyNeighbourhood.address.location, 'Westminster');
  });

  await t.step('combines house number and road into the street address', () => {
    const api = lookupFrom({ house_number: '10', road: 'Downing Street' });
    assertEquals(api.address.streetAddress, '10 Downing Street');
  });

  await t.step('street address is just the road when house number is missing', () => {
    const api = lookupFrom({ road: 'Downing Street' });
    assertEquals(api.address.streetAddress, 'Downing Street');
  });

  await t.step('omits street address when there is no road', () => {
    const api = lookupFrom({ house_number: '10' });
    assertEquals('XMP-iptcCore:StreetAddress' in api.tags, false);
    assertEquals(api.address.streetAddress, undefined);
  });

  await t.step('uppercases the country code', () => {
    const api = lookupFrom({ country: 'Germany', country_code: 'de' });
    assertEquals(api.address.countryCode, 'DE');
    assertEquals(api.tags['MWG:CountryCode'], 'DE');
  });
});

// --- error handling ---

Deno.test('Geo.AddressLookup error handling', async (t) => {
  await t.step('throws with the API error message', () => {
    const api = new Geo.AddressLookup();
    assertThrows(
      () => api.parseNominatimResponse({ error: 'Unable to geocode' }),
      Error,
      'Unable to geocode',
    );
  });

  await t.step('throws when the response is empty', () => {
    const api = new Geo.AddressLookup();
    assertThrows(
      () => api.parseNominatimResponse(undefined as unknown as NominatimResponse),
      Error,
      'Nominatim returned no data',
    );
  });

  await t.step('throws when getTags is called before parsing', () => {
    const api = new Geo.AddressLookup();
    assertThrows(() => api.getTags());
  });
});
