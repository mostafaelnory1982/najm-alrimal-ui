/**
 * script.js
 * Nijm Alrimal — Theme, Language & Mobile Menu Toggle
 *
 * RULES:
 *  - Vanilla JS only. No frameworks.
 *  - Dark mode: toggles .dark class on <html>
 *  - Language: toggles lang + dir attributes on <html>
 *  - Mobile menus: toggles .is-active class on overlay + menu panels
 *  - Preferences saved to localStorage (with try/catch for Edge file:// restriction)
 *  - No flash of unstyled content (FOUC prevention inline script in <head>)
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  THEME: 'najm-theme',  // 'dark' | 'light'
  LANG:  'najm-lang',   // 'ar'   | 'en'
};

const DEFAULTS = {
  THEME: 'light',
  LANG:  'ar',
};

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE HELPERS
// Edge blocks localStorage when page is opened as file://
// All reads/writes go through these helpers to avoid console errors
// ─────────────────────────────────────────────────────────────────────────────

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently ignore — storage blocked (file://, private mode, etc.)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply theme to <html> without transition flash
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  const html = document.documentElement;

  // Suppress transition flash during theme swap
  html.style.transition = 'none';

  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  // Re-enable transitions on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.style.transition = '';
    });
  });

  // Persist preference
  storageSet(STORAGE_KEYS.THEME, theme);

  // Update toggle button aria state
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const isAr = html.lang === 'ar';
    themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    themeToggle.setAttribute('aria-label',
      theme === 'dark'
        ? (isAr ? 'تفعيل الوضع الفاتح' : 'Switch to light mode')
        : (isAr ? 'تفعيل الوضع المظلم' : 'Switch to dark mode')
    );
  }
}

/**
 * Toggle between light and dark
 */
function toggleTheme() {
  const current = storageGet(STORAGE_KEYS.THEME) || DEFAULTS.THEME;
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/**
 * Get saved or system-preferred theme
 * @returns {'light'|'dark'}
 */
function getPreferredTheme() {
  const saved = storageGet(STORAGE_KEYS.THEME);
  if (saved === 'dark' || saved === 'light') return saved;

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return DEFAULTS.THEME;
}

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply language to <html>
 * @param {'ar'|'en'} lang
 */
function applyLanguage(lang) {
  const html = document.documentElement;

  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  // Persist preference
  storageSet(STORAGE_KEYS.LANG, lang);

  // Update toggle button label
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.textContent = lang === 'ar' ? 'EN' : 'عربي';
    langToggle.setAttribute('aria-label',
      lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'
    );
  }

  // Update all bilingual elements using data-ar / data-en attributes
  document.querySelectorAll('[data-ar][data-en]').forEach((el) => {
    el.textContent = el.dataset[lang] || el.textContent;
  });
}

/**
 * Toggle between Arabic and English
 */
function toggleLanguage() {
  const current = storageGet(STORAGE_KEYS.LANG) || DEFAULTS.LANG;
  applyLanguage(current === 'ar' ? 'en' : 'ar');
}

/**
 * Get saved language preference
 * @returns {'ar'|'en'}
 */
function getPreferredLanguage() {
  const saved = storageGet(STORAGE_KEYS.LANG);
  if (saved === 'ar' || saved === 'en') return saved;
  return DEFAULTS.LANG;
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY HEADER SCROLL STATE
// Figma spec: afterscroll=true → height 80px, backdrop-blur(24px), rgba(255,255,255,0.70)
// Trigger: add .is-scrolled to #site-header when scrollY > 48 (utility bar height)
// ─────────────────────────────────────────────────────────────────────────────

function initScrollHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const SCROLL_THRESHOLD = 48; // ~utility bar height

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  // Use passive listener for performance
  window.addEventListener('scroll', onScroll, { passive: true });

  // Run once on init in case page loads mid-scroll
  onScroll();
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE MENU SYSTEM
// Controls both primary (hamburger) and secondary (3-dots) mobile menus
// ─────────────────────────────────────────────────────────────────────────────

const MobileMenu = {
  overlay: null,
  primaryMenu: null,
  secondaryMenu: null,
  primaryBtn: null,
  secondaryBtn: null,
  closePrimaryBtn: null,
  closeSecondaryBtn: null,

  /**
   * Initialize mobile menu system
   */
  init() {
    // Get DOM elements
    this.overlay = document.getElementById('mobile-menu-overlay');
    this.primaryMenu = document.getElementById('mobile-menu-primary');
    this.secondaryMenu = document.getElementById('mobile-menu-secondary');
    this.primaryBtn = document.getElementById('mobile-menu-btn');
    this.secondaryBtn = document.getElementById('secondary-menu-btn');
    this.closePrimaryBtn = document.getElementById('close-primary-menu');
    this.closeSecondaryBtn = document.getElementById('close-secondary-menu');

    // Bind event listeners
    if (this.primaryBtn) {
      this.primaryBtn.addEventListener('click', () => this.togglePrimary());
    }

    if (this.secondaryBtn) {
      this.secondaryBtn.addEventListener('click', () => this.toggleSecondary());
    }

    if (this.closePrimaryBtn) {
      this.closePrimaryBtn.addEventListener('click', () => this.closePrimary());
    }

    if (this.closeSecondaryBtn) {
      this.closeSecondaryBtn.addEventListener('click', () => this.closeSecondary());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeAll());
    }

    // ESC key to close menus
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this.closeAll();
      }
    });
  },

  /**
   * Toggle primary menu (hamburger)
   */
  togglePrimary() {
    const isOpen = this.primaryMenu && this.primaryMenu.classList.contains('is-active');
    
    if (isOpen) {
      this.closePrimary();
    } else {
      this.closeSecondary(); // Close other menu first
      this.openPrimary();
    }
  },

  /**
   * Toggle secondary menu (3-dots)
   */
  toggleSecondary() {
    const isOpen = this.secondaryMenu && this.secondaryMenu.classList.contains('is-active');
    
    if (isOpen) {
      this.closeSecondary();
    } else {
      this.closePrimary(); // Close other menu first
      this.openSecondary();
    }
  },

  /**
   * Open primary menu
   */
  openPrimary() {
    if (!this.primaryMenu) return;

    this.primaryMenu.classList.add('is-active');
    if (this.overlay) this.overlay.classList.add('is-active');
    if (this.primaryBtn) {
      this.primaryBtn.classList.add('is-open');
      this.primaryBtn.setAttribute('aria-expanded', 'true');
    }
    
    document.body.classList.add('menu-open');
    
    // Focus management: focus first link in menu
    requestAnimationFrame(() => {
      const firstLink = this.primaryMenu.querySelector('.mobile-menu__link');
      if (firstLink) firstLink.focus();
    });
  },

  /**
   * Open secondary menu
   */
  openSecondary() {
    if (!this.secondaryMenu) return;

    this.secondaryMenu.classList.add('is-active');
    if (this.overlay) this.overlay.classList.add('is-active');
    if (this.secondaryBtn) {
      this.secondaryBtn.setAttribute('aria-expanded', 'true');
    }
    
    document.body.classList.add('menu-open');
    
    // Focus management: focus first card in menu
    requestAnimationFrame(() => {
      const firstCard = this.secondaryMenu.querySelector('.mobile-action-card');
      if (firstCard) firstCard.focus();
    });
  },

  /**
   * Close primary menu
   */
  closePrimary() {
    if (!this.primaryMenu) return;

    this.primaryMenu.classList.remove('is-active');
    if (this.primaryBtn) {
      this.primaryBtn.classList.remove('is-open');
      this.primaryBtn.setAttribute('aria-expanded', 'false');
    }
    
    this.checkCloseOverlay();
  },

  /**
   * Close secondary menu
   */
  closeSecondary() {
    if (!this.secondaryMenu) return;

    this.secondaryMenu.classList.remove('is-active');
    if (this.secondaryBtn) {
      this.secondaryBtn.setAttribute('aria-expanded', 'false');
    }
    
    this.checkCloseOverlay();
  },

  /**
   * Close all menus
   */
  closeAll() {
    this.closePrimary();
    this.closeSecondary();
    this.checkCloseOverlay();
  },

  /**
   * Check if all menus are closed, then close overlay
   */
  checkCloseOverlay() {
    const anyMenuOpen = 
      (this.primaryMenu && this.primaryMenu.classList.contains('is-active')) ||
      (this.secondaryMenu && this.secondaryMenu.classList.contains('is-active'));

    if (!anyMenuOpen) {
      if (this.overlay) this.overlay.classList.remove('is-active');
      document.body.classList.remove('menu-open');
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

function init() {
  applyTheme(getPreferredTheme());
  applyLanguage(getPreferredLanguage());

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', toggleLanguage);
  }

  // Follow system preference only if user has no saved preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!storageGet(STORAGE_KEYS.THEME)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Sticky header scroll behaviour
  initScrollHeader();

  // Initialize mobile menu system
  MobileMenu.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ─────────────────────────────────────────────────────────────────────────────
// YOUTUBE CHANNEL PLAYER
// Vanilla JS — YouTube Channel Player
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  const cards    = document.querySelectorAll('.yt-channel__playlist .thumbnail-card');
  const iframe   = document.getElementById('yt-iframe');
  const thumb    = document.getElementById('yt-thumbnail');
  const playBtn  = document.getElementById('yt-play-btn');
  const player   = document.getElementById('yt-player');

  if (!cards.length || !iframe || !thumb || !playBtn || !player) return;

  function activateCard(card) {
    cards.forEach(c => {
      c.classList.remove('is-active');
      c.setAttribute('aria-pressed', 'false');
    });
    card.classList.add('is-active');
    card.setAttribute('aria-pressed', 'true');

    const videoId = card.dataset.videoId;
    // Reset player to thumbnail state
    player.classList.remove('is-playing');
    iframe.style.display = 'none';
    iframe.src = '';
    thumb.src  = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    thumb.style.display = 'block';
    playBtn.style.display = 'flex';
  }

  function playVideo(videoId) {
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.style.display = 'block';
    thumb.style.display  = 'none';
    playBtn.style.display = 'none';
    player.classList.add('is-playing');
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      activateCard(card);
    });
  });

  playBtn.addEventListener('click', () => {
    const activeCard = document.querySelector('.thumbnail-card.is-active');
    if (activeCard) playVideo(activeCard.dataset.videoId);
  });
})();


// ─────────────────────────────────────────────────────────────────────────────
// FOUC PREVENTION — paste this in <head> BEFORE stylesheet links
// ─────────────────────────────────────────────────────────────────────────────
//
// <script>
//   (function() {
//     try {
//       var t = localStorage.getItem('najm-theme');
//       if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
//         document.documentElement.classList.add('dark');
//       }
//     } catch(e) {}
//   })();
// </script>