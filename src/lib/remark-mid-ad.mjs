import {isIndexableBuild} from './build-mode.mjs';
/** Insert a controlled display slot between Markdown sections, never from model HTML. */
export default function midArticleAd() {
  return function(tree,file) {
    const frontmatter=file.data?.astro?.frontmatter;
    const client=process.env.PUBLIC_ADSENSE_CLIENT||'';
    const slot=process.env.PUBLIC_ADSENSE_SLOT_MID_ARTICLE||'';
    if(frontmatter?.status!=='published'||!isIndexableBuild(process.env)||process.env.ADSENSE_READY!=='true'||!/^ca-pub-\d{16}$/.test(client)||!/^\d+$/.test(slot)) return;
    const sections=tree.children.map((node,index)=>node.type==='heading'&&node.depth===2?index:-1).filter(index=>index>=0);
    if(sections.length<4) return;
    tree.children.splice(sections[Math.floor(sections.length/2)],0,{
      type:'html',value:`<aside class="ad-slot" aria-label="Advertisement" data-ad-container hidden><span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins></aside>`
    });
  };
}
