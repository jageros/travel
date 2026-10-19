import {isReviewBuild} from '../src/lib/build-mode.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parse} from 'yaml';

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
for(const file of htmlFiles) {
  const html=await fs.readFile(file,'utf8');
  const name=path.relative(dist,file);
  try {
    assert.match(html,/<html[^>]+lang="en-US"/,'English document language');
    assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,'one clear page heading');
    assert.match(html,/<title>[^<]+<\/title>/,'page title');
    assert.match(html,/<meta name="description" content="[^"]+"/,'page description');
    assert.match(html,/<link rel="canonical" href="https:\/\/[^\"]+"/,'absolute canonical');
    if(!indexable) assert.match(html,/<meta name="robots" content="noindex/,'nonproduction must be noindex');
    assert.doesNotMatch(html,/kulroakonsu|madurird|data-zone=|_kpopg|window\.open\(/,'legacy click-ad chain removed');
    for(const [,json] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(json);
    for(const [,href] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      if(href.startsWith('//')) continue;
      const target=path.join(dist,decodeURIComponent(href));
      const candidates=[target,`${target}.html`,path.join(target,'index.html')];
      assert.ok(await Promise.any(candidates.map(async candidate=>{const stat=await fs.stat(candidate);if(!stat.isFile())throw new Error('directory');return true;})).catch(()=>false),`broken internal URL ${href}`);
    }
  }catch(error){failures.push(`${name}: ${error.message}`);}
}
const sitemap=await fs.readFile(path.join(dist,'sitemap.xml'),'utf8');
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
assert.match(await fs.readFile(path.join(dist,'robots.txt'),'utf8'),/User-agent: \*/);
assert.ok(htmlFiles.some(file=>file.endsWith('/404.html')),'custom 404 output exists');
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
else console.log(`Static output verified: ${htmlFiles.length} pages; real links, metadata, JSON-LD, draft exclusion and legacy-ad removal passed (${review?'review':'public'} build).`);
