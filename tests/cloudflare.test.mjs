import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const headerText=await readFile(new URL('../public/_headers',import.meta.url),'utf8');
const headerRules=headerText.split(/\n\s*\n/).map(block=>block.split('\n').filter(line=>line.trim()&&!line.trim().startsWith('#'))).filter(lines=>lines.length).map(([pattern,...lines])=>({pattern,headers:Object.fromEntries(lines.map(line=>{const colon=line.indexOf(':');assert.ok(colon>0,`valid header: ${line}`);return [line.slice(0,colon).trim().toLowerCase(),line.slice(colon+1).trim()];}))}));

test('Cloudflare serves static directory pages and a real 404 without a Worker runtime',()=>{
 assert.equal(config.name,'cedar-trips');
 assert.match(config.compatibility_date,/^\d{4}-\d{2}-\d{2}$/);
 assert.deepEqual(config.assets,{
  directory:'./dist',
  html_handling:'auto-trailing-slash',
  not_found_handling:'404-page',
 });
 for(const key of ['main','vars','kv_namespaces','d1_databases','r2_buckets','services','triggers'])assert.ok(!(key in config),`no unused server-side ${key}`);
});

test('production default hostnames are disabled while isolated Worker Previews are configured',()=>{
 assert.equal(config.workers_dev,false);
 assert.equal(config.preview_urls,false);
 assert.deepEqual(config.previews,{},'a separate Previews configuration is required even for a static-only Worker');
 for(const route of config.routes||[]){
  assert.equal(route.pattern,'www.cedartrips.com');
  assert.equal(route.custom_domain,true,'any eventual route must use the sole canonical custom domain');
 }
 assert.ok(!config.route,'no extra singular route or unrelated domain');
});

test('all static responses retain the existing browser security protections',()=>{
 const global=headerRules.find(rule=>rule.pattern==='/*');
 assert.ok(global,'one global security rule');
 assert.equal(global.headers['x-content-type-options'],'nosniff');
 assert.equal(global.headers['referrer-policy'],'strict-origin-when-cross-origin');
 assert.equal(global.headers['permissions-policy'],'camera=(), microphone=(), geolocation=()');
});

test('only fingerprinted Astro assets are immutable without conflicting cache directives',()=>{
 const cacheRules=headerRules.filter(rule=>'cache-control' in rule.headers);
 assert.deepEqual(cacheRules.map(rule=>rule.pattern).sort(),['/_astro/*','/images/*']);
 assert.equal(cacheRules.find(rule=>rule.pattern==='/_astro/*').headers['cache-control'],'public, max-age=31536000, immutable');
 assert.equal(cacheRules.find(rule=>rule.pattern==='/images/*').headers['cache-control'],'public, max-age=86400');
 assert.ok(!headerRules.find(rule=>rule.pattern==='/*').headers['cache-control'],'other assets use the Cloudflare default revalidation policy without duplicate headers');
 assert.doesNotMatch(headerText,/!\s*Cache-Control/i,'cache policy does not depend on detach/reattach ordering');
});
