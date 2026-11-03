/**
 * WindowSplitter — Conforme au standard W3C WAI-ARIA APG (Window Splitter Pattern)
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 *
 * Gère le redimensionnement interactif et accessible de la sidebar latérale.
 * Contrainte métier : la largeur maximale de la sidebar est strictement bornée
 * à 50% de la largeur du viewport.
 */

export const STORAGE_KEY_SIDEBAR_WIDTH = 'ia-studio-sidebar-width';
export const DEFAULT_SIDEBAR_WIDTH = 320;
export const MIN_SIDEBAR_WIDTH = 240;
export const STEP_KEYBOARD_PX = 10;
export const STEP_LARGE_PX = 50;

/**
 * Calcule la largeur maximale autorisée (50% de la largeur du viewport).
 * @param {number} [viewportWidth]
 * @returns {number}
 */
export function calculateMaxWidth(viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920) {
  const half = Math.floor(viewportWidth * 0.5);
  return Math.max(MIN_SIDEBAR_WIDTH, half);
}

/**
 * Borne la largeur entre la valeur minimale et 50% de la largeur de l'écran.
 * @param {number} width
 * @param {number} [viewportWidth]
 * @returns {number}
 */
export function clampWidth(width, viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920) {
  const max = calculateMaxWidth(viewportWidth);
  return Math.min(Math.max(Math.round(width), MIN_SIDEBAR_WIDTH), max);
}

export class WindowSplitter {
  /**
   * @param {HTMLElement} sidebarEl
   * @param {HTMLElement} splitterEl
   * @param {Object} [options]
   * @param {number} [options.defaultWidth=320]
   * @param {number} [options.minWidth=240]
   * @param {string} [options.storageKey]
   */
  constructor(sidebarEl, splitterEl, options = {}) {
    if (!sidebarEl || !splitterEl) return;

    this.sidebar = sidebarEl;
    this.splitter = splitterEl;
    this.minWidth = options.minWidth || MIN_SIDEBAR_WIDTH;
    this.defaultWidth = options.defaultWidth || DEFAULT_SIDEBAR_WIDTH;
    this.storageKey = options.storageKey || STORAGE_KEY_SIDEBAR_WIDTH;

    this.isDragging = false;
    this.startX = 0;
    this.startWidth = 0;

    this.currentWidth = this.loadSavedWidth();

    this.initAria();
    this.applyWidth(this.currentWidth, false);
    this.bindEvents();
  }

  /**
   * Initialise les attributs ARIA conformes au pattern Window Splitter
   */
  initAria() {
    this.splitter.setAttribute('role', 'separator');
    this.splitter.setAttribute('tabindex', '0');
    this.splitter.setAttribute('aria-orientation', 'vertical');
    this.splitter.setAttribute('aria-controls', this.sidebar.id || 'sidebar');
    if (!this.splitter.getAttribute('aria-label') && !this.splitter.getAttribute('aria-labelledby')) {
      this.splitter.setAttribute('aria-label', 'Redimensionner le panneau latéral');
    }
    this.updateAriaValues();
  }

  /**
   * Met à jour aria-valuenow, aria-valuemin et aria-valuemax
   */
  updateAriaValues() {
    const vpW = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const max = calculateMaxWidth(vpW);
    this.splitter.setAttribute('aria-valuenow', String(Math.round(this.currentWidth)));
    this.splitter.setAttribute('aria-valuemin', String(this.minWidth));
    this.splitter.setAttribute('aria-valuemax', String(max));
  }

  /**
   * Charge la largeur mémorisée dans localStorage
   * @returns {number}
   */
  loadSavedWidth() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const val = parseInt(saved, 10);
          if (!isNaN(val) && val > 0) {
            return clampWidth(val);
          }
        }
      }
    } catch (_) {
      // Ignorer les erreurs d'accès éventuelles (ex: sandbox iframes)
    }
    return clampWidth(this.defaultWidth);
  }

  /**
   * Sauvegarde la largeur dans localStorage
   * @param {number} width
   */
  saveWidth(width) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, String(Math.round(width)));
      }
    } catch (_) {
      // Ignorer
    }
  }

  /**
   * Applique la largeur spécifiée au composant et au CSS
   * @param {number} width
   * @param {boolean} [save=true]
   */
  applyWidth(width, save = true) {
    const clamped = clampWidth(width);
    this.currentWidth = clamped;

    if (this.sidebar) {
      this.sidebar.style.setProperty('--sidebar-width', `${clamped}px`);
      this.sidebar.style.width = `${clamped}px`;
    }

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--sidebar-width', `${clamped}px`);
    }

    this.updateAriaValues();

    if (save) {
      this.saveWidth(clamped);
    }
  }

  /**
   * Modifie la largeur par un incrément / décrément donné (en pixels)
   * @param {number} deltaPx
   */
  step(deltaPx) {
    this.applyWidth(this.currentWidth + deltaPx, true);
  }

  /**
   * Attache les écouteurs d'événements pointer, clavier et redimensionnement
   */
  bindEvents() {
    // Événements Pointer (souris & tactile)
    this.splitter.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.splitter.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.splitter.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.splitter.addEventListener('pointercancel', (e) => this.onPointerUp(e));

    // Double-clic : réinitialisation à la largeur par défaut
    this.splitter.addEventListener('dblclick', () => {
      this.applyWidth(this.defaultWidth, true);
    });

    // Événements Clavier (W3C APG Keyboard Pattern)
    this.splitter.addEventListener('keydown', (e) => this.onKeyDown(e));

    // Redimensionnement de fenêtre : recalcul de la limite 50% max
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.onWindowResize());
    }
  }

  onPointerDown(e) {
    if (e.button !== 0) return; // Uniquement clic principal gauche
    e.preventDefault();

    this.isDragging = true;
    this.startX = e.clientX;
    this.startWidth = this.sidebar ? this.sidebar.getBoundingClientRect().width : this.currentWidth;

    if (typeof this.splitter.setPointerCapture === 'function') {
      try {
        this.splitter.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add('resizing-sidebar');
    }

    if (this.sidebar) {
      this.sidebar.style.transition = 'none';
    }
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - this.startX;
    const newWidth = this.startWidth + deltaX;
    this.applyWidth(newWidth, false);
  }

  onPointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (typeof this.splitter.releasePointerCapture === 'function') {
      try {
        this.splitter.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('resizing-sidebar');
    }

    if (this.sidebar) {
      this.sidebar.style.removeProperty('transition');
    }

    this.saveWidth(this.currentWidth);
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.step(e.shiftKey ? -STEP_LARGE_PX : -STEP_KEYBOARD_PX);
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.step(e.shiftKey ? STEP_LARGE_PX : STEP_KEYBOARD_PX);
        break;

      case 'PageDown':
        e.preventDefault();
        this.step(-STEP_LARGE_PX);
        break;

      case 'PageUp':
        e.preventDefault();
        this.step(STEP_LARGE_PX);
        break;

      case 'Home':
        e.preventDefault();
        this.applyWidth(this.minWidth, true);
        break;

      case 'End': {
        e.preventDefault();
        const max = calculateMaxWidth(typeof window !== 'undefined' ? window.innerWidth : 1920);
        this.applyWidth(max, true);
        break;
      }

      case 'Enter':
        e.preventDefault();
        this.applyWidth(this.defaultWidth, true);
        break;

      default:
        break;
    }
  }

  onWindowResize() {
    const vpW = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const max = calculateMaxWidth(vpW);
    this.updateAriaValues();

    if (this.currentWidth > max) {
      this.applyWidth(max, true);
    }
  }
}
