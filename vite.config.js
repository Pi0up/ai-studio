import { defineConfig } from 'vite';
import { resolve } from 'path';
import { minify } from 'html-minifier-terser';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf8'));

function htmlVersionPlugin() {
  return {
    name: 'vite:html-transform-version',
    transformIndexHtml(html) {
      return html
        .replace(/__APP_VERSION__/g, pkg.version)
        .replace(
          /Information Architecture Studio — Visualiseur Unifié v[0-9.]+/g,
          `Information Architecture Studio — Visualiseur Unifié v${pkg.version}`
        );
    },
  };
}

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
      console.log(`⚡ Minified modular index.html (${rawHtml.length} -> ${minifiedHtml.length} bytes)`);
    },
  };
}

const publicDir = fs.existsSync(resolve(__dirname, 'public')) ? resolve(__dirname, 'public') : false;

export default defineConfig({
  base: './',
  root: 'src',
  publicDir,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    htmlVersionPlugin(),
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
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  test: {
    root: resolve(__dirname),
    globals: true,
    environment: 'node',
    pool: 'forks',
  },
});
