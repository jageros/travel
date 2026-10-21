import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {parse,stringify} from 'yaml';
import {parse as parseHtml} from 'parse5';
import {CANONICAL_SITE_URL,SITE_NAME,SITE_EDITORIAL_TEAM} from '../src/lib/site-config.mjs';

function pageMetadata(html) {
 const nodes=[];
 function visit(node){if(node.tagName)nodes.push(node);for(const child of node.childNodes||[])visit(child);}
 visit(parseHtml(html));
 const attrs=node=>Object.fromEntries((node.attrs||[]).map(item=>[item.name,item.value]));
 const metas=nodes.filter(node=>node.tagName==='meta').map(attrs);
 return {
  canonical:attrs(nodes.find(node=>node.tagName==='link'&&attrs(node).rel==='canonical')).href,
  value:key=>metas.find(item=>item.property===key||item.name===key)?.content,
  schemas:nodes.filter(node=>node.tagName==='script'&&attrs(node).type==='application/ld+json').map(node=>JSON.parse(node.childNodes.map(child=>child.value||'').join('')))
 };
}

test('a staged production release has static content, working links, metadata and two gated ad positions',async()=>{
 const source=process.cwd();
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'travel-published-test-'));
 const root=path.join(temporary,'project');
 try {
  await fs.cp(source,root,{recursive:true,filter:(file)=>!path.relative(source,file).split(path.sep).some(segment=>['node_modules','.git','.astro','dist','reports','artifacts'].includes(segment))});
  await fs.symlink(path.join(source,'node_modules'),path.join(root,'node_modules'),'dir');
  // Own the fixture's release state so live editorial releases cannot turn the
  // unpublished-link and sitemap assertions into assertions about current data.
  const articlesDir=path.join(root,'src/content/articles');
  for(const name of await fs.readdir(articlesDir)){
   if(!name.endsWith('.md'))continue;
   const target=path.join(articlesDir,name);
   const parts=/^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(await fs.readFile(target,'utf8'));
   const data=parse(parts[1]);data.status='review';delete data.publishedAt;
   await fs.writeFile(target,`---\n${stringify(data,{defaultStringType:'QUOTE_DOUBLE'})}---\n${parts[2]}`);
  }
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
  const env={...process.env,PUBLIC_SITE_URL:CANONICAL_SITE_URL,ASTRO_TELEMETRY_DISABLED:'1',CONTENT_REVIEW_PREVIEW:'false',SITE_INDEXING_ENABLED:'true',DEPLOYMENT_ENV:'production',WORKERS_CI_BRANCH:'main',PUBLIC_GA_MEASUREMENT_ID:'G-FIXTURE123',ADSENSE_READY:'true',PUBLIC_ADSENSE_CLIENT:'ca-pub-1234567890123456',PUBLIC_ADSENSE_SLOT_MID_ARTICLE:'1234567890',PUBLIC_ADSENSE_SLOT_END_ARTICLE:'9876543210'};
  const options={cwd:root,env,encoding:'utf8',timeout:90000,maxBuffer:3_000_000};
  try {execFileSync(process.execPath,[path.join(source,'node_modules/astro/bin/astro.mjs'),'build'],options);}
  catch(error){throw new Error(error.stdout+'\n'+error.stderr);}
  execFileSync(process.execPath,['scripts/verify-build.mjs'],options);
  const html=await fs.readFile(path.join(root,'dist/guides/is-muni-pass-worth-it/index.html'),'utf8');
  const metadata=pageMetadata(html);
  const canonical=`${CANONICAL_SITE_URL}/guides/is-muni-pass-worth-it/`;
  assert.equal(metadata.canonical,canonical);
  assert.equal(metadata.value('og:url'),canonical);
  assert.equal(metadata.value('og:site_name'),SITE_NAME);
  assert.equal(new URL(metadata.value('og:image')).origin,CANONICAL_SITE_URL);
  assert.equal(metadata.value('twitter:image'),metadata.value('og:image'));
  const articleSchema=metadata.schemas.find(schema=>schema['@type']==='Article');
  assert.equal(articleSchema.mainEntityOfPage,canonical);
  assert.equal(articleSchema.publisher.name,SITE_NAME);
  assert.equal(articleSchema.author.name,SITE_EDITORIAL_TEAM);
  assert.equal(new URL(articleSchema.image).origin,CANONICAL_SITE_URL);
  assert.match(html,/<meta name="robots" content="index, follow/);
  assert.match(html,/application\/ld\+json/);
  assert.match(html,/"@type":"Article"/);
  assert.match(html,/Count fare windows/);
  assert.match(html,/https:\/\/www\.sfmta\.com/);
  assert.equal((html.match(/data-ad-container/g)||[]).length,2,'middle and end slots are present only in enabled published guide');
  assert.match(html,/data-analytics-id="G-FIXTURE123"/,'production keeps consent-gated analytics');
  assert.doesNotMatch(html,/<script[^>]+src="https:/,'no thirdparty request before consent');
  assert.match(html,/data-current-fact[^>]*hidden/,'precise facts stay hidden without a runtime freshness check');
  assert.match(html,/data-fact-fallback/,'official-source fallback is in static HTML');
  const sitemap=await fs.readFile(path.join(root,'dist/sitemap.xml'),'utf8');
  assert.match(sitemap,/guides\/is-muni-pass-worth-it\//);
  assert.doesNotMatch(sitemap,/guides\/sfo-to-fishermans-wharf-with-luggage\//);
  for(const [,url]of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g))assert.equal(new URL(url).origin,CANONICAL_SITE_URL);
  const robots=await fs.readFile(path.join(root,'dist/robots.txt'),'utf8');
  assert.ok(robots.includes(`Sitemap: ${CANONICAL_SITE_URL}/sitemap.xml`));
  const previewEnv={...env,DEPLOYMENT_ENV:'preview',WORKERS_CI_BRANCH:'feature/review'};
  delete previewEnv.CONTENT_REVIEW_PREVIEW;
  const previewOptions={...options,env:previewEnv};
  execFileSync(process.execPath,[path.join(source,'node_modules/astro/bin/astro.mjs'),'build'],previewOptions);
  execFileSync(process.execPath,['scripts/verify-build.mjs'],previewOptions);
  const previewHtml=await fs.readFile(path.join(root,'dist/guides/sfo-to-fishermans-wharf-with-luggage/index.html'),'utf8');
  const previewMetadata=pageMetadata(previewHtml);
  assert.equal(previewMetadata.canonical,`${CANONICAL_SITE_URL}/guides/sfo-to-fishermans-wharf-with-luggage/`);
  assert.equal(previewMetadata.value('og:url'),previewMetadata.canonical);
  assert.match(previewHtml,/Editorial review copy/,'Cloudflare previews automatically include review copies');
  assert.match(previewHtml,/<meta name="robots" content="noindex/);
  assert.doesNotMatch(previewHtml,/data-ad-container/,'no ads in review deployments even with configured IDs');
  assert.doesNotMatch(previewHtml,/data-analytics-id="G-FIXTURE123"/,'no analytics in review deployments even with indexing enabled');
  // A preview with only published content is still a preview: the content
  // visibility switch must not authorize indexing, analytics or advertising.
  const publicPreviewOptions={...options,env:{...previewEnv,CONTENT_REVIEW_PREVIEW:'false'}};
  execFileSync(process.execPath,[path.join(source,'node_modules/astro/bin/astro.mjs'),'build'],publicPreviewOptions);
  execFileSync(process.execPath,['scripts/verify-build.mjs'],publicPreviewOptions);
  const publicPreviewHtml=await fs.readFile(path.join(root,'dist/guides/is-muni-pass-worth-it/index.html'),'utf8');
  assert.match(publicPreviewHtml,/<meta name="robots" content="noindex/);
  assert.doesNotMatch(publicPreviewHtml,/data-ad-container|data-analytics-id="G-FIXTURE123"/,'published-only preview cannot enable ads or analytics');
  await assert.rejects(fs.stat(path.join(root,'dist/guides/sfo-to-fishermans-wharf-with-luggage/index.html')),{code:'ENOENT'});
  assert.doesNotMatch(await fs.readFile(path.join(root,'dist/sitemap.xml'),'utf8'),/<loc>/,'preview sitemap stays empty');
 }finally{await fs.rm(temporary,{recursive:true,force:true});}
});
