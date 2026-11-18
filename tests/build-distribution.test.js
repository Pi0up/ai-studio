import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Build Distribution Pipeline (Modular & Standalone)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
  const distDir = path.resolve(__dirname, '../dist');
  const distStandaloneDir = path.resolve(__dirname, '../dist-standalone');

  describe('Configuration Vite & Scripts Package', () => {
    it('définit les scripts granulaires de build dans package.json', () => {
      expect(pkg.scripts['build:modular']).toBe('vite build --config vite.config.js');
      expect(pkg.scripts['build:standalone']).toBe('vite build --config vite.standalone.config.js');
      expect(pkg.scripts['build']).toContain('build:modular');
      expect(pkg.scripts['build']).toContain('build:standalone');
    });

    it('inclut dist-standalone dans .gitignore', () => {
      const gitignore = fs.readFileSync(path.resolve(__dirname, '../.gitignore'), 'utf8');
      expect(gitignore).toContain('dist-standalone/');
    });
  });

  describe('Dossier dist/ Modulaire', () => {
    it('génère un fichier dist/index.html valide avec ressources externes', () => {
      const indexPath = path.resolve(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf8');
        expect(html).toContain(`v${pkg.version}`);
        expect(html).toContain('id="sidebar-app-version"');
        expect(html).toMatch(/href="(?:\.\/)?css\/[^"]+\.css"/);
        expect(html).toMatch(/src="(?:\.\/)?js\/[^"]+\.js"/);
      }
    });

    it('génère les dossiers css/ et js/ séparés dans dist/', () => {
      const cssDir = path.resolve(distDir, 'css');
      const jsDir = path.resolve(distDir, 'js');
      if (fs.existsSync(cssDir) && fs.existsSync(jsDir)) {
        const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
        const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
        expect(cssFiles.length).toBeGreaterThan(0);
        expect(jsFiles.length).toBeGreaterThan(0);
      }
    });

    it('contient une copie dist/standalone.html pour distribution et GitHub Pages', () => {
      const standalonePath = path.resolve(distDir, 'standalone.html');
      if (fs.existsSync(standalonePath)) {
        const html = fs.readFileSync(standalonePath, 'utf8');
        expect(html).toContain(`v${pkg.version}`);
      }
    });
  });

  describe('Artefact Standalone Single-File', () => {
    it('génère un fichier dist-standalone/index.html tout-en-un', () => {
      const standalonePath = path.resolve(distStandaloneDir, 'index.html');
      if (fs.existsSync(standalonePath)) {
        const html = fs.readFileSync(standalonePath, 'utf8');

        // Doit contenir le code JS et CSS inlinés
        expect(html).toContain('<style');
        expect(html).toContain('<script');

        // Ne doit pas référencer de fichiers js/ ou css/ locaux externes
        expect(html).not.toMatch(/href="(?:\.\/)?css\//);
        expect(html).not.toMatch(/src="(?:\.\/)?js\//);

        // Doit avoir la version injectée
        expect(html).toContain(`v${pkg.version}`);
        expect(html).toContain('id="sidebar-app-version"');
      }
    });
  });
});
