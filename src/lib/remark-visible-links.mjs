import {isReviewBuild} from './build-mode.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'yaml';

/** Keep an unpublished guide's label readable without creating a broken public link. */
export function rewriteUnpublishedLinks(tree, visibleRoutes) {
  function textOf(node) { return node.value || (node.children || []).map(textOf).join(''); }
  function visit(node) {
    if(node.type==='link' && /^\/(?:guides|destinations)\//.test(node.url||'')) {
      const route=new URL(node.url,'https://travel.mumasir.com').pathname.replace(/\/?$/,'/');
      if(!visibleRoutes.has(route)) {node.type='text';node.value=textOf(node);delete node.children;delete node.url;delete node.title;}
    }
    for(const child of node.children||[]) visit(child);
  }
  visit(tree);
}
export default function visibleLinks(options={}) {
  return function(tree) {
    const directory=path.join(process.cwd(),'src/content/articles');
    const visibleRoutes=new Set();
    if(fs.existsSync(directory)) for(const file of fs.readdirSync(directory).filter(name=>name.endsWith('.md'))) {
      const raw=fs.readFileSync(path.join(directory,file),'utf8');
      const frontmatter=/^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
      if(!frontmatter) continue;
      const article=parse(frontmatter[1]);
      if(article.status==='published'||((options.review??isReviewBuild(process.env))&&article.status==='review')) visibleRoutes.add(`/${article.type==='destination'?'destinations':'guides'}/${article.slug}/`);
    }
    rewriteUnpublishedLinks(tree,visibleRoutes);
  };
}
