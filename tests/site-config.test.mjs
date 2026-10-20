import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CANONICAL_SITE_URL,SITE_NAME,SITE_EDITORIAL_TEAM,resolveSiteUrl} from '../src/lib/site-config.mjs';

test('Cedar Trips uses one canonical www identity and normalizes the bare domain',()=>{
 assert.equal(CANONICAL_SITE_URL,'https://www.cedartrips.com');
 assert.equal(SITE_NAME,'Cedar Trips');
 assert.equal(SITE_EDITORIAL_TEAM,'Cedar Trips Editorial Team');
 for(const value of [undefined,'','https://www.cedartrips.com','https://www.cedartrips.com/','https://cedartrips.com','https://cedartrips.com/'])assert.equal(resolveSiteUrl(value),CANONICAL_SITE_URL);
});

test('site URL configuration rejects stale, noncanonical, malformed and unsafe values',()=>{
 for(const value of [
  'https://travel.mumasir.com','https://travel.mumasir.com/',
  'https://mumasir.com','https://www.mumasir.com','http://www.cedartrips.com',
  'https://www.cedartrips.com.evil.example','https://evil.example',
  'https://user:secret@www.cedartrips.com','https://www.cedartrips.com:8443',
  'https://www.cedartrips.com/guide/','https://www.cedartrips.com/?preview=1',
  'https://www.cedartrips.com/#preview','//www.cedartrips.com','not-a-url',
 ])assert.throws(()=>resolveSiteUrl(value),undefined,value);
});

test('Vercel domain redirects are host-scoped and preserve paths without redirecting the unrelated root domain',async()=>{
 const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 const redirects=config.redirects||[];
 const expected=['cedartrips.com','travel.mumasir.com'];
 for(const host of expected) {
  const rules=redirects.filter(rule=>(rule.has||[]).some(condition=>condition.type==='host'&&condition.value===host));
  assert.equal(rules.length,1,`${host}: one scoped redirect`);
  assert.equal(rules[0].source,'/:path*');
  assert.equal(rules[0].destination,`${CANONICAL_SITE_URL}/:path*`);
  assert.ok(rules[0].permanent===true||rules[0].statusCode===308,'permanent 308 redirect');
 }
 for(const rule of redirects) {
  if(!rule.destination?.startsWith(CANONICAL_SITE_URL))continue;
  const hosts=(rule.has||[]).filter(condition=>condition.type==='host');
  assert.ok(hosts.length>0,'migration redirect must have a host condition');
  for(const host of hosts)assert.ok(expected.includes(host.value),'unrelated mumasir root/subdomains must not redirect');
  assert.ok(!rule.destination.includes('?'),'query string is not replaced by the migration destination');
 }
});
