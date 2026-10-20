import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  output: 'static',
  site: 'https://wonderloom.space',
  base: '/',
  trailingSlash: 'always',
  markdown: { processor: unified({ smartypants: false, remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex] }) },
});
