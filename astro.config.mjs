import { defineConfig } from 'astro/config';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  output: 'static',
  site: 'https://wonderloom.space',
  base: '/',
  trailingSlash: 'always',
  markdown: { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex] },
});
