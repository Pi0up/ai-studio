import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { APP_VERSION } from '../src/scripts/app.js';

describe('App Version & Sidebar Badge', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));

  it('fournit une version d application valide qui respecte SemVer', () => {
    expect(APP_VERSION).toBeDefined();
    expect(typeof APP_VERSION).toBe('string');
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('correspond à la version déclarée dans package.json par défaut', () => {
    expect(APP_VERSION).toBe(pkg.version);
  });

  it('inclut le badge de version d application dans la sidebar de index.html', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
    expect(html).toContain('id="sidebar-app-version"');
    expect(html).toContain('title="Version de l\'application"');
  });

  it('génère un bundle dist avec la version injectée dans le titre et le badge', () => {
    const distPath = path.resolve(__dirname, '../dist/index.html');
    if (fs.existsSync(distPath)) {
      const html = fs.readFileSync(distPath, 'utf8');
      expect(html).toContain(`v${pkg.version}`);
      expect(html).toContain('id="sidebar-app-version"');
    }
  });
});
