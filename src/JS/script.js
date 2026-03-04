/**
 * script.js
 * Nijm Alrimal — Theme & Language Toggle
 *
 * RULES:
 *  - Vanilla JS only. No frameworks.
 *  - Dark mode: toggles .dark class on <html>
 *  - Language: toggles lang + dir attributes on <html>
 *  - Preferences saved to localStorage
 *  - No flash of unstyled content (FOUC prevention in <head>)
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  THEME: 'najm-theme',   // 'dark' | 'light'
  LANG:  'najm-lang',    // 'ar'   | 'en'
};

const DEFAULTS = {
  THEME: 'light',
  LANG:  'ar',
};


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
  localStorage.setItem(STORAGE_KEYS.THEME, theme);

  // Update aria-pressed state on toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    themeToggle.setAttribute('aria-label',
      theme === 'dark'
        ? (document.documentElement.lang === 'ar' ? 'تفعيل الوضع الفاتح' : 'Switch to light mode')
        : (document.documentElement.lang === 'ar' ? 'تفعيل الوضع المظلم' : 'Switch to dark mode')
    );
  }
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || DEFAULTS.THEME;
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

/**
 * Get the saved or system-preferred theme
 * @returns {'light'|'dark'}
 */
function getPreferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  if (saved === 'dark' || saved === 'light') return saved;

  // Fall back to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return DEFAULTS.THEME;
}


// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply language to <html> attributes
 * @param {'ar'|'en'} lang
 */
function applyLanguage(lang) {
  const html = document.documentElement;

  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  // Persist preference
  localStorage.setItem(STORAGE_KEYS.LANG, lang);

  // Update toggle button state
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.textContent  = lang === 'ar' ? 'EN' : 'عربي';
    langToggle.setAttribute('aria-label',
      lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'
    );
  }

  // Update all translated elements
  document.querySelectorAll('[data-ar][data-en]').forEach((el) => {
    el.textContent = el.dataset[lang] || el.textContent;
  });
}

/**
 * Toggle between Arabic and English
 */
function toggleLanguage() {
  const currentLang = localStorage.getItem(STORAGE_KEYS.LANG) || DEFAULTS.LANG;
  applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
}

/**
 * Get the saved language preference
 * @returns {'ar'|'en'}
 */
function getPreferredLanguage() {
  const saved = localStorage.getItem(STORAGE_KEYS.LANG);
  if (saved === 'ar' || saved === 'en') return saved;
  return DEFAULTS.LANG;
}


// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// Runs after DOM is ready
// ─────────────────────────────────────────────────────────────────────────────

function init() {
  // Apply saved preferences
  applyTheme(getPreferredTheme());
  applyLanguage(getPreferredLanguage());

  // Bind theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Bind language toggle button
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', toggleLanguage);
  }

  // Listen for system theme changes (when no saved preference)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only follow system if user hasn't set a manual preference
      if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


// ─────────────────────────────────────────────────────────────────────────────
// FOUC PREVENTION SNIPPET
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Copy this inline <script> into the <head> of every HTML file
// BEFORE any stylesheet links to prevent flash of wrong theme:
//
// <script>
//   (function() {
//     const t = localStorage.getItem('najm-theme');
//     if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
//       document.documentElement.classList.add('dark');
//     }
//   })();
// </script>
