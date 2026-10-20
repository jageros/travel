import {isReviewBuild} from '../src/lib/build-mode.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parse} from 'yaml';
import {parse as parseHtml} from 'parse5';
import {CANONICAL_SITE_URL,SITE_NAME,SITE_EDITORIAL_TEAM} from '../src/lib/site-config.mjs';

const root=process.cwd();
const dist=path.join(root,'dist');
const review=isReviewBuild(process.env);
const indexable=process.env.SITE_INDEXING_ENABLED==='true'&&!review&&(!process.env.VERCEL_ENV||process.env.VERCEL_ENV==='production');
async function walk(dir) {
  const entries=await fs.readdir(dir,{withFileTypes:true});
  return (await Promise.all(entries.map(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):path.join(dir,entry.name)))).flat();
}
const all=await walk(dist);
const htmlFiles=all.filter(file=>file.endsWith('.html'));
const failures=[];
// Match the retired proper name, without rejecting ordinary US travel guides.
const legacyOutputPatterns=[/\bUS\s+Travel\s+Guide\b/,/\btravel\.mumasir\.com\b/i];
function assertNoLegacyIdentity(value,label) {
  for(const pattern of legacyOutputPatterns)assert.doesNotMatch(value,pattern,label);
}
function elements(document) {
  const found=[];
  function visit(node) {
    if(node.tagName)found.push(node);
    for(const child of node.childNodes||[])visit(child);
    if(node.content)visit(node.content);
  }
  visit(document);
  return found;
}
function attributes(node) {return Object.fromEntries((node.attrs||[]).map(attr=>[attr.name,attr.value]));}
function textContent(node) {
  if(!node)return '';
  if(['script','style'].includes(node.tagName))return '';
  return node.nodeName==='#text'?node.value:(node.childNodes||[]).map(textContent).join(' ');
}
function assertOwnUrl(value,label) {
  const url=new URL(value);
  assert.equal(url.origin,CANONICAL_SITE_URL,`${label} must use the canonical www domain`);
  assert.equal(url.username+url.password,'',`${label} cannot contain credentials`);
  return url;
}
async function assertLocalAsset(value,label) {
  let local=value;
  if(value.startsWith('https://')) {
    const url=new URL(value);
    if(url.origin!==CANONICAL_SITE_URL)return;
    local=url.pathname;
  }
  if(!local.startsWith('/')||local.startsWith('//'))return;
  const clean=local.split(/[?#]/)[0];
  const target=path.join(dist,decodeURIComponent(clean));
  const candidates=[target,`${target.replace(/[\\/]$/,'')}.html`,path.join(target,'index.html')];
  assert.ok(await Promise.any(candidates.map(async candidate=>{const stat=await fs.stat(candidate);if(!stat.isFile())throw new Error('directory');return true;})).catch(()=>false),`broken ${label} ${value}`);
}
for(const file of htmlFiles) {
  const html=await fs.readFile(file,'utf8');
  const name=path.relative(dist,file);
  try {
    const document=parseHtml(html);
    const nodes=elements(document);
    const metas=nodes.filter(node=>node.tagName==='meta').map(attributes);
    const meta=(key)=>metas.find(item=>item.property===key||item.name===key)?.content;
    const canonicalNodes=nodes.filter(node=>node.tagName==='link'&&attributes(node).rel==='canonical');
    assert.equal(canonicalNodes.length,1,'one canonical URL');
    const canonical=attributes(canonicalNodes[0]).href;
    const expectedPath=name==='404.html'?'/404/':`/${name.replace(/index\.html$/,'').replace(/\.html$/,'/')}`;
    assert.equal(canonical,new URL(expectedPath,CANONICAL_SITE_URL).href,'canonical route uses the www site');
    assertOwnUrl(canonical,'canonical');
    assert.equal(meta('og:url'),canonical,'Open Graph URL matches canonical');
    assert.equal(meta('og:site_name'),SITE_NAME,'Open Graph site name');
    const ogImage=meta('og:image');
    const twitterImage=meta('twitter:image');
    assertOwnUrl(ogImage,'Open Graph image');
    assertOwnUrl(twitterImage,'Twitter image');
    assert.equal(twitterImage,ogImage,'social channels share the same local image');
    await assertLocalAsset(ogImage,'Open Graph image');
    await assertLocalAsset(twitterImage,'Twitter image');
    const titleNode=nodes.find(node=>node.tagName==='title');
    assert.ok(textContent(titleNode).includes(SITE_NAME),'title includes the current brand');
    assertNoLegacyIdentity(textContent(document).replace(/\s+/g,' '),'visible copy uses the current brand and domain');
    for(const node of nodes)for(const value of Object.values(attributes(node)))assertNoLegacyIdentity(value,'DOM attributes have no legacy brand or domain');
    assert.match(html,/<html[^>]+lang="en-US"/,'English document language');
    assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,'one clear page heading');
    assert.match(html,/<title>[^<]+<\/title>/,'page title');
    assert.match(html,/<meta name="description" content="[^"]+"/,'page description');
    assert.match(html,/<link rel="canonical" href="https:\/\/[^\"]+"/,'absolute canonical');
    if(!indexable) assert.match(html,/<meta name="robots" content="noindex/,'nonproduction must be noindex');
    assert.doesNotMatch(html,/kulroakonsu|madurird|data-zone=|_kpopg|window\.open\(/,'legacy click-ad chain removed');
    const schemas=nodes.filter(node=>node.tagName==='script'&&attributes(node).type==='application/ld+json').map(node=>JSON.parse((node.childNodes||[]).map(child=>child.value||'').join('')));
    assert.ok(schemas.some(schema=>schema['@type']==='WebSite'&&schema.name===SITE_NAME),'current brand WebSite schema');
    for(const schema of schemas) {
      assertNoLegacyIdentity(JSON.stringify(schema),'JSON-LD has no legacy brand or domain');
      if(schema['@type']==='WebSite')assertOwnUrl(schema.url,'WebSite schema URL');
      if(schema['@type']==='Article') {
        assert.equal(schema.publisher?.name,SITE_NAME,'Article publisher brand');
        assert.equal(schema.author?.name,SITE_EDITORIAL_TEAM,'Article editorial team');
        assert.equal(schema.mainEntityOfPage,canonical,'Article canonical identity');
        assertOwnUrl(schema.publisher.url,'publisher URL');
        assertOwnUrl(schema.author.url,'editorial team URL');
        if(schema.image) {assertOwnUrl(schema.image,'Article image');await assertLocalAsset(schema.image,'Article image');}
      }
      if(schema['@type']==='BreadcrumbList')for(const item of schema.itemListElement||[])assertOwnUrl(item.item,'breadcrumb item');
    }
    for(const node of nodes) {
      const attrs=attributes(node);
      for(const key of ['href','src'])if(attrs[key])await assertLocalAsset(attrs[key],'internal URL');
      for(const key of ['srcset','imagesrcset'])if(attrs[key])for(const candidate of attrs[key].split(',')) {
        const url=candidate.trim().split(/\s+/)[0];
        if(url)await assertLocalAsset(url,'responsive image');
      }
    }
  }catch(error){failures.push(`${name}: ${error.message}`);}
}
const sitemap=await fs.readFile(path.join(dist,'sitemap.xml'),'utf8');
assertNoLegacyIdentity(sitemap,'sitemap uses current site identity');
for(const [,location]of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g))assertOwnUrl(location,'sitemap location');
const entries=await fs.readdir(path.join(root,'src/content/articles'));
for(const file of entries.filter(file=>file.endsWith('.md'))) {
  const text=await fs.readFile(path.join(root,'src/content/articles',file),'utf8');
  const data=parse(text.split(/^---\s*$/m)[1]);
  const route=`/${data.type==='destination'?'destinations':'guides'}/${data.slug}/`;
  const exists=all.includes(path.join(dist,route,'index.html'));
  const shouldExist=data.status==='published'||(review&&data.status==='review');
  if(exists!==shouldExist) failures.push(`${route}: visibility does not match editorial state`);
  if(data.status!=='published'&&sitemap.includes(route)) failures.push(`${route}: draft leaked into sitemap`);
}
const robots=await fs.readFile(path.join(dist,'robots.txt'),'utf8');
assert.match(robots,/User-agent: \*/);
assertNoLegacyIdentity(robots,'robots uses current site identity');
if(indexable)assert.match(robots,new RegExp(`^Sitemap: ${CANONICAL_SITE_URL.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}/sitemap\\.xml$`,'m'),'robots points to canonical sitemap');
else assert.doesNotMatch(robots,/^Sitemap:/m,'nonindexable builds do not advertise a sitemap');
assert.ok(htmlFiles.some(file=>file.endsWith('/404.html')),'custom 404 output exists');
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
else console.log(`Static output verified: ${htmlFiles.length} pages; real links, metadata, JSON-LD, draft exclusion and legacy-ad removal passed (${review?'review':'public'} build).`);
