import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://wonderloom.space',
  base: '/',
  trailingSlash: 'always',
});
