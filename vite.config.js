import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { minify } from 'html-minifier-terser';
import fs from 'fs';

function htmlMinifierPlugin() {
  return {
    name: 'vite:minify-index-html',
    enforce: 'post',
    apply(config, { command }) {
      return command === 'build' && !process.env.VITEST;
    },
    async closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const indexPath = resolve(distDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;

      const rawHtml = fs.readFileSync(indexPath, 'utf8');
      const minifiedHtml = await minify(rawHtml, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
        keepClosingSlash: true,
        caseSensitive: true,
        sortAttributes: true,
        sortClassName: true,
        collapseBooleanAttributes: true,
      });

      fs.writeFileSync(indexPath, minifiedHtml, 'utf8');
      console.log(`⚡ Minified & optimized index.html (${rawHtml.length} -> ${minifiedHtml.length} bytes)`);
    },
  };
}

export default defineConfig({
  base: './',
  root: 'src',
  publicDir: false,
  plugins: [
    viteSingleFile({ removeViteModuleLoader: true }),
    htmlMinifierPlugin(),
  ],
  esbuild: {
    legalComments: 'none',
    drop: ['debugger'],
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  test: {
    root: resolve(__dirname),
    globals: true,
    environment: 'node',
  },
});
