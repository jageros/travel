import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {parse,stringify} from 'yaml';

test('a staged production release has static content, working links, metadata and two gated ad positions',async()=>{
 const source=process.cwd();
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'travel-published-test-'));
 const root=path.join(temporary,'project');
 try {
  await fs.cp(source,root,{recursive:true,filter:(file)=>!path.relative(source,file).split(path.sep).some(segment=>['node_modules','.git','.astro','dist','reports','artifacts'].includes(segment))});
  await fs.symlink(path.join(source,'node_modules'),path.join(root,'node_modules'),'dir');
  const file=path.join(root,'src/content/articles/is-muni-pass-worth-it.md');
  const raw=await fs.readFile(file,'utf8');
  const parts=/^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  const article=parse(parts[1]);
  article.status='published';article.publishedAt=new Date().toISOString().slice(0,10);
  await fs.writeFile(file,`---\n${stringify(article,{defaultStringType:'QUOTE_DOUBLE'})}---\n${parts[2]}`);
  const healthFile=path.join(root,'automation/source-health.json');
  const registry=JSON.parse(await fs.readFile(path.join(root,'automation/sources.json'),'utf8'));
  const today=new Date().toISOString().slice(0,10);
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
  for(const source of registry.sources)for(const fact of source.facts){fact.checkedAt=today;if(fact.dynamic)fact.expiresAt=tomorrow;}
  await fs.writeFile(path.join(root,'automation/sources.json'),JSON.stringify(registry));
  await fs.writeFile(healthFile,JSON.stringify({checkedAt:new Date().toISOString(),sources:registry.sources.map(source=>({id:source.id,status:'unchanged'})),conflicts:[]}));
  const env={...process.env,ASTRO_TELEMETRY_DISABLED:'1',CONTENT_REVIEW_PREVIEW:'false',SITE_INDEXING_ENABLED:'true',VERCEL_ENV:'production',ADSENSE_READY:'true',PUBLIC_ADSENSE_CLIENT:'ca-pub-1234567890123456',PUBLIC_ADSENSE_SLOT_MID_ARTICLE:'1234567890',PUBLIC_ADSENSE_SLOT_END_ARTICLE:'9876543210'};
  const options={cwd:root,env,encoding:'utf8',timeout:90000,maxBuffer:3_000_000};
  try {execFileSync(process.execPath,[path.join(source,'node_modules/astro/bin/astro.mjs'),'build'],options);}
  catch(error){throw new Error(error.stdout+'\n'+error.stderr);}
  execFileSync(process.execPath,['scripts/verify-build.mjs'],options);
  const html=await fs.readFile(path.join(root,'dist/guides/is-muni-pass-worth-it/index.html'),'utf8');
  assert.match(html,/<meta name="robots" content="index, follow/);
  assert.match(html,/application\/ld\+json/);
  assert.match(html,/"@type":"Article"/);
  assert.match(html,/Count fare windows/);
  assert.match(html,/https:\/\/www\.sfmta\.com/);
  assert.equal((html.match(/data-ad-container/g)||[]).length,2,'middle and end slots are present only in enabled published guide');
  assert.doesNotMatch(html,/<script[^>]+src="https:/,'no thirdparty request before consent');
  assert.match(html,/data-current-fact[^>]*hidden/,'precise facts stay hidden without a runtime freshness check');
  assert.match(html,/data-fact-fallback/,'official-source fallback is in static HTML');
  const sitemap=await fs.readFile(path.join(root,'dist/sitemap.xml'),'utf8');
  assert.match(sitemap,/guides\/is-muni-pass-worth-it\//);
  assert.doesNotMatch(sitemap,/guides\/sfo-to-fishermans-wharf-with-luggage\//);
  const previewEnv={...env,VERCEL_ENV:'preview'};
  delete previewEnv.CONTENT_REVIEW_PREVIEW;
  const previewOptions={...options,env:previewEnv};
  execFileSync(process.execPath,[path.join(source,'node_modules/astro/bin/astro.mjs'),'build'],previewOptions);
  execFileSync(process.execPath,['scripts/verify-build.mjs'],previewOptions);
  const previewHtml=await fs.readFile(path.join(root,'dist/guides/sfo-to-fishermans-wharf-with-luggage/index.html'),'utf8');
  assert.match(previewHtml,/Editorial review copy/,'Vercel Preview automatically includes review copies');
  assert.match(previewHtml,/<meta name="robots" content="noindex/);
  assert.doesNotMatch(previewHtml,/data-ad-container/,'no ads in review deployments even with configured IDs');
 }finally{await fs.rm(temporary,{recursive:true,force:true});}
});
