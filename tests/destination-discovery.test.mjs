import assert from 'node:assert/strict';
import test from 'node:test';
import {
  destinationRefillStatus, discoverDestinations, lookupDiscoveredDestination,
} from '../scripts/destination-discovery.mjs';

const ready = slug => ({ slug, topic: 'us-destinations', type: 'destination', status: 'ready' });
const article = (slug, status = 'review') => ({ data: { ...ready(slug), status } });
const sourceRegistry = {
  allowedHosts: ['www.nps.gov'],
  sources: [{ url: 'https://www.nps.gov/grca/planyourvisit/basicinfo.htm' }],
};
const index = rows => `<!doctype html><main><ul id="list_parks">${rows.join('')}</ul></main>`;
const park = ({ code, name, state, designation = 'National Park', href = `/${code}/` }) => `
<li id="asset_${code}">
  <div class="list_left">
    <p class="list_left__kicker">${designation}</p>
    <h3><a href="${href}">${name}</a></h3>
    <p class="list_left__subtitle">${state}</p>
    <p>This public park protects scenic landscapes and supports visitor planning.</p>
  </div>
  <div class="stateListLinks">
    <a href="https://www.nps.gov/${code}/planyourvisit/conditions.htm">Conditions</a>
    <a href="http://www.nps.gov/${code}/planyourvisit/basicinfo.htm">Basic Info</a>
    <a href="https://www.nps.gov/else/planyourvisit/maps.htm">Foreign park link</a>
    <a href="https://example.com/${code}/planyourvisit/maps.htm">External link</a>
  </div>
</li>`;
const htmlResponse = (html, status = 200) => new Response(html, {
  status, headers: { 'content-type': 'text/html;charset=UTF-8' },
});

test('refill counts unique eligible U.S. attraction review drafts and reserves six', () => {
  const topics = [
    ready('one'), ready('one'), ready('two'), ready('already-released'), ready('unwritten'),
    { ...ready('research'), status: 'needs-research' },
    { ...ready('city-guide'), type: 'guide' },
  ];
  const articles = [
    article('one'), article('two'), article('already-released'), article('research'), article('city-guide'),
  ];
  const publications = [{ slug: 'already-released' }];
  assert.deepEqual(destinationRefillStatus(topics, articles, publications), { ready: 2, target: 6, needed: 4 });
  assert.deepEqual(destinationRefillStatus(topics, articles, publications, {
    canUse: (topic, entry) => entry.data.status === 'review' && topic.slug !== 'two',
  }), { ready: 1, target: 6, needed: 5 });
  const stocked = Array.from({ length: 8 }, (_, index) => ready(`park-${index}`));
  assert.deepEqual(destinationRefillStatus(stocked, stocked.map(topic => article(topic.slug))), { ready: 8, target: 6, needed: 0 });
});

test('discovery prioritizes unrepresented states and excludes aliases for registered parks', async () => {
  const denali = park({ code: 'dena', name: 'Denali', state: 'Denali Park, AK', designation: 'National Park &amp; Preserve' });
  const alternatives = [
    park({ code: 'gaar', name: 'Gates of the Arctic', state: 'Bettles, AK', designation: 'National Park &amp; Preserve' }),
    park({ code: 'klgo', name: 'Klondike Gold Rush', state: 'Skagway, AK', designation: 'National Historical Park' }),
  ];
  const pages = {
    al: index([park({ code: 'liri', name: 'Little River Canyon', state: 'Fort Payne, AL' })]),
    ak: index([denali, ...alternatives]),
    az: index([park({ code: 'grca', name: 'Grand Canyon National Park', state: 'Grand Canyon, AZ' })]),
    ar: index([
      park({ code: 'hosp', name: 'Hot Springs National Park', state: 'Hot Springs, AR' }),
      park({ code: 'bufr', name: 'Buffalo', state: 'Harrison, AR', designation: 'National River' }),
    ]),
    ca: index([park({ code: 'leba', name: 'Cabrillo', state: 'San Diego, CA', href: 'https://example.com/leba/' })]),
    co: index([park({ code: 'romo', name: 'Rocky Mountain', state: 'Estes Park, CO' })]),
  };
  const requested = [];
  const fetcher = async (url, options) => {
    assert.equal(options.redirect, 'error');
    const code = new URL(url).pathname.split('/')[2];
    requested.push(code);
    return htmlResponse(pages[code] ?? '', code in pages ? 200 : 403);
  };
  const result = await discoverDestinations({
    articles: [{ data: { ...article('covered-alabama').data, region: 'Alabama' } }],
    topics: [{ ...ready('klondike-gold-rush-national-historical-park') }], sourceRegistry, fetcher, limit: 3,
  });
  assert.deepEqual(result.candidates.map(candidate => candidate.parkCode), ['dena', 'hosp', 'romo']);
  assert.equal(result.candidates[0].location, 'Denali Park');
  assert.equal(result.candidates[0].slug, 'denali-national-park-preserve');
  assert.deepEqual(result.candidates[0].sourceUrls, [
    'https://www.nps.gov/dena/index.htm', 'https://www.nps.gov/dena/planyourvisit/basicinfo.htm',
    'https://www.nps.gov/dena/planyourvisit/conditions.htm',
  ]);
  assert.ok(!requested.includes('al'));
  assert.ok(result.unavailable.every(issue => issue.reason.includes('403')));
});

test('adder lookup binds the exact park and state to the authorized NPS index', async () => {
  const fetcher = async url => {
    assert.equal(url, 'https://www.nps.gov/state/me/index.htm');
    return htmlResponse(index([
      park({ code: 'acad', name: 'Acadia', state: 'Bar Harbor, Maine, ME' }),
      park({ code: 'appa', name: 'Appalachian', state: 'Maine to Georgia, GA, ME, NH', designation: 'National Scenic Trail' }),
      park({ code: 'roos', name: 'Roosevelt Campobello', state: 'Welshpool, NB' }),
    ]));
  };
  const parameters = { region: 'Maine', sourceRegistry, fetcher };
  const found = await lookupDiscoveredDestination({ ...parameters, parkCode: 'acad' });
  assert.equal(found.title, 'Acadia National Park');
  assert.equal(found.category, 'national-parks');
  assert.equal(found.region, 'Maine');
  assert.equal(found.location, 'Bar Harbor');
  assert.equal(await lookupDiscoveredDestination({ ...parameters, parkCode: 'appa' }), null);
  assert.equal(await lookupDiscoveredDestination({ ...parameters, parkCode: 'roos' }), null);
  await assert.rejects(lookupDiscoveredDestination({ ...parameters, parkCode: '../acad' }), /Invalid NPS park code/);
  await assert.rejects(lookupDiscoveredDestination({
    ...parameters, parkCode: 'acad', sourceRegistry: { allowedHosts: ['example.com'] }, fetcher: async () => assert.fail('fetch'),
  }), /Unapproved official source URL/);
  await assert.rejects(lookupDiscoveredDestination({
    ...parameters, parkCode: 'acad', fetcher: async () => htmlResponse('', 403),
  }), /HTTP 403/);
});
