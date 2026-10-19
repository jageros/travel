import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';
import visibleLinks from './src/lib/remark-visible-links.mjs';
import midArticleAd from './src/lib/remark-mid-ad.mjs';
import {isReviewBuild} from './src/lib/build-mode.mjs';

export default defineConfig({
  site: 'https://travel.mumasir.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [react()],
  markdown: { processor: unified({ syntaxHighlight: false, remarkPlugins: [[visibleLinks,{review:isReviewBuild(process.env)}],[midArticleAd,{review:isReviewBuild(process.env),enabled:process.env.ADSENSE_READY==='true',client:process.env.PUBLIC_ADSENSE_CLIENT||'',slot:process.env.PUBLIC_ADSENSE_SLOT_MID_ARTICLE||''}]] }) },
  build: { format: 'directory' },
  vite: { server: { allowedHosts: ['localhost', '127.0.0.1'] } }
});
