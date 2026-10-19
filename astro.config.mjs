import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';
import visibleLinks from './src/lib/remark-visible-links.mjs';
import midArticleAd from './src/lib/remark-mid-ad.mjs';

export default defineConfig({
  site: 'https://travel.mumasir.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [react()],
  markdown: { processor: unified({ syntaxHighlight: false, remarkPlugins: [visibleLinks,midArticleAd] }) },
  build: { format: 'directory' },
  vite: { server: { allowedHosts: ['localhost', '127.0.0.1'] } }
});
