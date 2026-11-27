import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {parse,stringify} from 'yaml';
import {parse as parseHtml} from 'parse5';
import {CANONICAL_SITE_URL,SITE_NAME,SITE_EDITORIAL_TEAM} from '../src/lib/site-config.mjs';
import {articleDigest} from '../scripts/content-lib.mjs';

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

function assertDestinationFilters(html) {
 const nodes=[];
 function visit(node) {
  if(node.tagName)nodes.push({node,attrs:Object.fromEntries(node.attrs.map(({name,value})=>[name,value]))});
  for(const child of node.childNodes??[])visit(child);
 }
 visit(parseHtml(html));
 const controls=nodes.filter(({attrs})=>Object.hasOwn(attrs,'data-destination-filter'));
 assert.deepEqual(controls.map(({attrs})=>attrs['data-destination-filter']),['region','category']);
 for(const {node,attrs} of controls) {
  assert.equal(node.tagName,'button');
  assert.equal(attrs.role,'combobox');
  assert.equal(attrs['aria-expanded'],'false');
  const list=nodes.find(node=>node.attrs.id===attrs['aria-controls']);
  assert.equal(list?.attrs.role,'listbox');
  assert.ok(Object.hasOwn(list.attrs,'hidden'));
  const options=nodes.filter(option=>option.node.parentNode===list.node&&option.attrs.role==='option');
  assert.equal(options.filter(option=>option.attrs['aria-selected']==='true').length,1);
  assert.equal(options.find(option=>option.attrs['aria-selected']==='true').attrs['data-value'],'');
 }
 assert.ok(nodes.some(({attrs})=>Object.hasOwn(attrs,'data-destination-filters')&&Object.hasOwn(attrs,'hidden')));
}

function assertHomepageDestinations(html, {heroTitle, heroHref, cardHrefs}) {
 function descendants(node) {
  return (node.childNodes??[]).flatMap(child=>[child,...descendants(child)]);
 }
 const attr=(node,name)=>node.attrs?.find(item=>item.name===name)?.value;
 const hasClass=(node,name)=>attr(node,'class')?.split(/\s+/).includes(name);
 const content=node=>node?.nodeName==='#text'?node.value:(node?.childNodes??[]).map(content).join('');
 const nodes=descendants(parseHtml(html));
 const hero=nodes.find(node=>hasClass(node,'discovery-hero'));
 assert.ok(hero,'homepage has a hero');
 const heroNodes=descendants(hero);
 assert.equal(content(heroNodes.find(node=>node.tagName==='h1')).trim(),heroTitle);
 const heroLink=heroNodes.find(node=>node.tagName==='a'&&hasClass(node,'button'));
 assert.ok(heroLink,'hero action links to the destination');
 assert.equal(attr(heroLink,'href'),heroHref);
 const gallery=nodes.find(node=>hasClass(node,'homepage-destinations'));
 assert.ok(gallery,'homepage has a destination gallery');
 const cards=descendants(gallery).filter(node=>hasClass(node,'destination-card'));
 assert.deepEqual(cards.map(card=>{
  const link=descendants(card).find(node=>node.tagName==='a'&&attr(node,'href')?.includes('/destinations/'));
  assert.ok(link,'card links to the destination');
  return attr(link,'href');
 }),cardHrefs);
}

test('a staged production release has static content, working links, metadata and two gated ad positions',async()=>{
 const source=process.cwd();
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'travel-published-test-'));
 const root=path.join(temporary,'project');
 try {
  await fs.cp(source,root,{recursive:true,filter:(file)=>!path.relative(source,file).split(path.sep).some(segment=>['node_modules','.git','.astro','dist','reports','artifacts'].includes(segment))});
  const dependencies = path.join(source,'node_modules');
  const localModules = path.join(root,'node_modules');
  await fs.mkdir(localModules);
  // Reuse installed packages without sharing Astro's environment-specific content cache.
  const packages = (await fs.readdir(dependencies,{withFileTypes:true})).filter(entry=>!entry.name.startsWith('.'));
  await Promise.all(packages.map(entry=>fs.symlink(path.join(dependencies,entry.name),path.join(localModules,entry.name),entry.isDirectory()?'dir':'file')));
  // Own the fixture's release state so live editorial releases cannot turn the
  // unpublished-link and sitemap assertions into assertions about current data.
  const articlesDir=path.join(root,'src/content/articles');
  const daysAgo=days=>new Date(Date.now()-days*86400000).toISOString().slice(0,10);
  const goldenGateSlug='golden-gate-bridge-without-a-car';
  const homepageOrder=[
   'mammoth-cave-national-park',
   'andersonville-national-historic-site',
   'city-of-rocks-national-reserve',
   'indiana-dunes-national-park',
   'hot-springs-national-park',
   'kennedy-space-center',
   'national-mall',
   'statue-of-liberty',
   'yosemite',
   goldenGateSlug,
  ];
  const homepagePublications=[
   {slug:'grand-canyon',date:daysAgo(1),time:'20:00:00Z'},
   {slug:homepageOrder[0],date:daysAgo(1),time:'17:00:00Z'},
   {slug:homepageOrder[1],date:daysAgo(1),time:'05:00:00Z'},
   // No ledger entry for City of Rocks, which ranks by its article date.
   ...homepageOrder.slice(3,-1).map((slug,index)=>({slug,date:daysAgo(3),time:`${15-index}:00:00Z`})),
   {slug:goldenGateSlug,date:daysAgo(4),time:'05:00:00Z'},
  ];
  for(const name of await fs.readdir(articlesDir)){
   if(!name.endsWith('.md'))continue;
   const target=path.join(articlesDir,name);
   const parts=/^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(await fs.readFile(target,'utf8'));
   const data=parse(parts[1]);
   const publication=homepagePublications.find(row=>row.slug===data.slug);
   data.status=homepageOrder.includes(data.slug)?'published':'review';
   delete data.publishedAt;
   if(data.status==='published')data.publishedAt=publication?.date??daysAgo(2);
   if(publication)publication.contentSha256=articleDigest(data,parts[2]);
   await fs.writeFile(target,`---\n${stringify(data,{defaultStringType:'QUOTE_DOUBLE'})}---\n${parts[2]}`);
  }
  const ledgerFile=path.join(root,'automation/editorial.json');
  const ledger=JSON.parse(await fs.readFile(ledgerFile,'utf8'));
  ledger.publications=homepagePublications.reverse().map(({slug,date,time,contentSha256})=>({
   slug,publishedAt:`${date}T${time}`,contentSha256,manualApproval:false,
  }));
  await fs.writeFile(ledgerFile,JSON.stringify(ledger));

  // Isolate Spanish so live translation releases cannot change this homepage fixture.
  const translationsDir=path.join(root,'src/content/translations');
  await fs.rm(translationsDir,{recursive:true});
  await fs.mkdir(path.join(translationsDir,'es'),{recursive:true});
  for(const [index,slug] of homepageOrder.slice(0,4).entries()){
   const name=path.join('es',`${slug}.md`);
   const text=await fs.readFile(path.join(source,'src/content/translations',name),'utf8');
   const [,frontmatter,body]=/^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
   const data=parse(frontmatter);
   data.status=index===0?'review':'published';
   data.updatedAt=daysAgo(4-index);
   await fs.writeFile(path.join(translationsDir,name),`---\n${stringify(data,{defaultStringType:'QUOTE_DOUBLE'})}---\n${body}`);
  }
  const englishHomepage={
   heroTitle:'Mammoth Cave National Park',
   heroHref:`/destinations/${homepageOrder[0]}/`,
   cardHrefs:homepageOrder.slice(1,9).map(slug=>`/destinations/${slug}/`),
  };
  const spanishHomepage={
   heroTitle:'Sitio Histórico Nacional de Andersonville',
   heroHref:`/es/destinations/${homepageOrder[1]}/`,
   cardHrefs:homepageOrder.slice(2,4).map(slug=>`/es/destinations/${slug}/`),
  };
  const file=path.join(root,'src/content/articles/is-muni-pass-worth-it.md');
  const raw=await fs.readFile(file,'utf8');
  const parts=/^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  const article=parse(parts[1]);
  article.status='published';article.publishedAt=new Date().toISOString().slice(0,10);
  // The production fixture keeps this guide for the article and ad checks.
  article.related=[];
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
  const home=await fs.readFile(path.join(root,'dist/index.html'),'utf8');
  const spanishHome=await fs.readFile(path.join(root,'dist/es/index.html'),'utf8');
  const destinations=await fs.readFile(path.join(root,'dist/destinations/index.html'),'utf8');
  const topics=await fs.readFile(path.join(root,'dist/topics/index.html'),'utf8');
  assertHomepageDestinations(home,englishHomepage);
  assertHomepageDestinations(spanishHome,spanishHomepage);
  const reviewTranslation=path.join(root,'dist/es/destinations',homepageOrder[0],'index.html');
  await assert.rejects(fs.stat(reviewTranslation),{code:'ENOENT'});
  assert.match(home,/href="\/topics\/san-francisco-without-a-car\/"/);
  assert.match(topics,/class="topic-card" href="\/destinations\/"[\s\S]+class="topic-card" href="\/topics\/san-francisco-without-a-car\/"/);
  assert.match(destinations,/data-destination-card/);
  assertDestinationFilters(destinations);
  assert.match(destinations,/data-region="California"/);
  assert.match(destinations,/data-category="landmarks"/);
  assert.match(destinations,/href="\/destinations\/golden-gate-bridge-without-a-car\/"/);
  assert.doesNotMatch(destinations,/href="\/destinations\/grand-canyon\/"/);
  const goldenGate=await fs.readFile(path.join(root,'dist/destinations/golden-gate-bridge-without-a-car/index.html'),'utf8');
  const metadataPlace=pageMetadata(goldenGate);
  const place=metadataPlace.schemas.find(schema=>schema['@type']==='TouristAttraction');
  assert.equal(metadataPlace.canonical,`${CANONICAL_SITE_URL}/destinations/golden-gate-bridge-without-a-car/`);
  assert.equal(place.url,metadataPlace.canonical);
  assert.equal(place.address.addressLocality,'San Francisco');
  assert.equal(place.address.addressCountry,'US');
  assert.match(goldenGate,/id="car-free-planning"/);
  assert.match(goldenGate,/south-end visit/);
  const sitemap=await fs.readFile(path.join(root,'dist/sitemap.xml'),'utf8');
  assert.match(sitemap,/guides\/is-muni-pass-worth-it\//);
  assert.ok(sitemap.includes(`<loc>${CANONICAL_SITE_URL}/destinations/</loc>`));
  assert.ok(sitemap.includes(`<loc>${CANONICAL_SITE_URL}/destinations/golden-gate-bridge-without-a-car/</loc>`));
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
  const previewDestinations=await fs.readFile(path.join(root,'dist/destinations/index.html'),'utf8');
  assert.match(previewDestinations,/<meta name="robots" content="noindex/);
  assert.doesNotMatch(previewDestinations,/data-ad-container|data-analytics-id="G-FIXTURE123"/);
  assertHomepageDestinations(await fs.readFile(path.join(root,'dist/index.html'),'utf8'),englishHomepage);
  assertHomepageDestinations(await fs.readFile(path.join(root,'dist/es/index.html'),'utf8'),spanishHomepage);
  assert.ok((await fs.stat(reviewTranslation)).isFile(),'the review translation is available by direct URL in preview');
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
