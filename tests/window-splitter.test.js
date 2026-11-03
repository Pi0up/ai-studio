import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WindowSplitter,
  calculateMaxWidth,
  clampWidth,
  MIN_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  STORAGE_KEY_SIDEBAR_WIDTH,
  STEP_KEYBOARD_PX,
  STEP_LARGE_PX,
} from '../src/scripts/window-splitter.js';

describe('Window Splitter — Calculs de Largeur & Contrainte 50vw', () => {
  it('calcule la largeur maximale à exactement 50% de la largeur du viewport', () => {
    expect(calculateMaxWidth(1920)).toBe(960);
    expect(calculateMaxWidth(1440)).toBe(720);
    expect(calculateMaxWidth(1000)).toBe(500);
    expect(calculateMaxWidth(800)).toBe(400);
  });

  it('ne descend jamais en-dessous du minimum même sur très petits écrans', () => {
    expect(calculateMaxWidth(300)).toBe(MIN_SIDEBAR_WIDTH);
  });

  it('borne correctement une largeur comprise dans les limites', () => {
    const vp = 1600; // max = 800
    expect(clampWidth(350, vp)).toBe(350);
    expect(clampWidth(240, vp)).toBe(240);
    expect(clampWidth(800, vp)).toBe(800);
  });

  it('borne une valeur inférieure au minimum à MIN_SIDEBAR_WIDTH', () => {
    const vp = 1600;
    expect(clampWidth(100, vp)).toBe(MIN_SIDEBAR_WIDTH);
    expect(clampWidth(0, vp)).toBe(MIN_SIDEBAR_WIDTH);
    expect(clampWidth(-50, vp)).toBe(MIN_SIDEBAR_WIDTH);
  });

  it('borne une valeur supérieure à 50% de l écran au maximum autorisé', () => {
    const vp = 1000; // max 50% = 500
    expect(clampWidth(600, vp)).toBe(500);
    expect(clampWidth(999, vp)).toBe(500);
  });
});

describe('Window Splitter — Classe & Conformité W3C WAI-ARIA APG', () => {
  let mockSidebar;
  let mockSplitter;
  let mockStorage;
  let eventListeners;

  beforeEach(() => {
    mockStorage = {};
    eventListeners = { splitter: {}, window: {} };

    globalThis.localStorage = {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, val) => {
        mockStorage[key] = String(val);
      },
      removeItem: (key) => {
        delete mockStorage[key];
      },
    };

    globalThis.window = {
      innerWidth: 1600, // 50% = 800
      addEventListener: (evt, handler) => {
        if (!eventListeners.window[evt]) eventListeners.window[evt] = [];
        eventListeners.window[evt].push(handler);
      },
    };

    globalThis.document = {
      documentElement: {
        style: {
          setProperty: vi.fn(),
        },
      },
      body: {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      },
    };

    const attrs = {};
    mockSplitter = {
      id: 'sidebar-splitter',
      attributes: attrs,
      setAttribute: (name, val) => {
        attrs[name] = String(val);
      },
      getAttribute: (name) => attrs[name] || null,
      addEventListener: (evt, handler) => {
        if (!eventListeners.splitter[evt]) eventListeners.splitter[evt] = [];
        eventListeners.splitter[evt].push(handler);
      },
      dispatchEvent: (event) => {
        const handlers = eventListeners.splitter[event.type] || [];
        handlers.forEach((h) => h(event));
      },
    };

    const sidebarStyles = {};
    mockSidebar = {
      id: 'sidebar',
      style: {
        setProperty: (prop, val) => {
          sidebarStyles[prop] = val;
        },
        removeProperty: (prop) => {
          delete sidebarStyles[prop];
        },
        width: '320px',
      },
      getBoundingClientRect: () => ({ left: 0, width: 320 }),
    };
  });

  it('initialise correctement les attributs WAI-ARIA APG', () => {
    const splitter = new WindowSplitter(mockSidebar, mockSplitter);

    expect(mockSplitter.getAttribute('role')).toBe('separator');
    expect(mockSplitter.getAttribute('tabindex')).toBe('0');
    expect(mockSplitter.getAttribute('aria-orientation')).toBe('vertical');
    expect(mockSplitter.getAttribute('aria-controls')).toBe('sidebar');
    expect(mockSplitter.getAttribute('aria-label')).toBe('Redimensionner le panneau latéral');
    expect(mockSplitter.getAttribute('aria-valuemin')).toBe(String(MIN_SIDEBAR_WIDTH));
    expect(mockSplitter.getAttribute('aria-valuemax')).toBe('800'); // 50% de 1600
    expect(mockSplitter.getAttribute('aria-valuenow')).toBe(String(DEFAULT_SIDEBAR_WIDTH));
  });

  it('charge la largeur mémorisée depuis localStorage si valide', () => {
    mockStorage[STORAGE_KEY_SIDEBAR_WIDTH] = '450';
    const splitter = new WindowSplitter(mockSidebar, mockSplitter);

    expect(splitter.currentWidth).toBe(450);
    expect(mockSplitter.getAttribute('aria-valuenow')).toBe('450');
  });

  it('restreint la largeur sauvegardée si elle dépasse 50% de l écran', () => {
    mockStorage[STORAGE_KEY_SIDEBAR_WIDTH] = '1200'; // sur vp 1600, max est 800
    const splitter = new WindowSplitter(mockSidebar, mockSplitter);

    expect(splitter.currentWidth).toBe(800);
    expect(mockSplitter.getAttribute('aria-valuenow')).toBe('800');
  });

  it('gère les interactions clavier : ArrowLeft, ArrowRight, Home, End', () => {
    const splitter = new WindowSplitter(mockSidebar, mockSplitter);

    const preventDefault = vi.fn();

    // ArrowRight (+10px)
    mockSplitter.dispatchEvent({ key: 'ArrowRight', shiftKey: false, preventDefault, type: 'keydown' });
    expect(splitter.currentWidth).toBe(320 + STEP_KEYBOARD_PX);
    expect(preventDefault).toHaveBeenCalled();

    // Shift + ArrowRight (+50px)
    mockSplitter.dispatchEvent({ key: 'ArrowRight', shiftKey: true, preventDefault, type: 'keydown' });
    expect(splitter.currentWidth).toBe(330 + STEP_LARGE_PX);

    // ArrowLeft (-10px)
    mockSplitter.dispatchEvent({ key: 'ArrowLeft', shiftKey: false, preventDefault, type: 'keydown' });
    expect(splitter.currentWidth).toBe(370);

    // Shift + ArrowLeft (-50px)
    mockSplitter.dispatchEvent({ key: 'ArrowLeft', shiftKey: true, preventDefault, type: 'keydown' });
    expect(splitter.currentWidth).toBe(320);

    // End -> Max (800)
    mockSplitter.dispatchEvent({ key: 'End', preventDefault, type: 'keydown' });
    expect(splitter.currentWidth).toBe(800);
    expect(mockSplitter.getAttribute('aria-valuenow')).toBe('800');

    // Home -> Min (240)
    mockSplitter.dispatchEvent({ key: 'Home', preventDefault, type: 'keydown' });
    expect(splitter.currentWidth).toBe(MIN_SIDEBAR_WIDTH);
    expect(mockSplitter.getAttribute('aria-valuenow')).toBe(String(MIN_SIDEBAR_WIDTH));

    // Enter -> Default (320)
    mockSplitter.dispatchEvent({ key: 'Enter', preventDefault, type: 'keydown' });
    expect(splitter.currentWidth).toBe(DEFAULT_SIDEBAR_WIDTH);
  });

  it('ajuste la largeur lors d un redimensionnement de fenêtre si nécessaire', () => {
    const splitter = new WindowSplitter(mockSidebar, mockSplitter);
    splitter.applyWidth(700, true);
    expect(splitter.currentWidth).toBe(700);

    globalThis.window.innerWidth = 1000;
    const resizeHandlers = eventListeners.window['resize'] || [];
    resizeHandlers.forEach((h) => h());

    expect(mockSplitter.getAttribute('aria-valuemax')).toBe('500');
    expect(splitter.currentWidth).toBe(500);
    expect(mockSplitter.getAttribute('aria-valuenow')).toBe('500');
  });
});

describe('Window Splitter — Intégration DOM & HTML/CSS', () => {
  it('contient le séparateur WAI-ARIA APG dans src/index.html', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');

    expect(html).toContain('id="sidebar-splitter"');
    expect(html).toContain('class="window-splitter"');
    expect(html).toContain('role="separator"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain('aria-controls="sidebar"');
    expect(html).toContain('aria-label="Redimensionner le panneau latéral"');
  });

  it('définit les styles nécessaires pour le splitter et le repli dans layout.css', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/layout.css'), 'utf8');

    expect(css).toContain('--sidebar-width');
    expect(css).toContain('.window-splitter');
    expect(css).toContain('cursor: col-resize');
    expect(css).toContain('#sidebar.collapsed + #sidebar-splitter');
    expect(css).toContain('max-width: 50vw');
  });
});
