import test from 'node:test';
import assert from 'node:assert/strict';
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
