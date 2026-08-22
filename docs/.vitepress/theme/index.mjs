import { h, watch, onMounted } from 'vue'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { registerServiceWorker } from './sw-register.js'
import { setupInstallCapture } from './install-state.js'

import PayerNavButton from './components/PayerNavButton.vue'
import PayerDocFooter from './components/PayerDocFooter.vue'
import PayerTopicIndex from './components/PayerTopicIndex.vue'
import PayerRelatedLessons from './components/PayerRelatedLessons.vue'
import PayerWideToggle from './components/PayerWideToggle.vue'
import PayerLanguageSettings from './components/PayerLanguageSettings.vue'
import PayerOfflineIndicator from './components/PayerOfflineIndicator.vue'
import PayerNotFound from './components/PayerNotFound.vue'
import PayerSemanticSearch from './components/PayerSemanticSearch.vue'
import 'markdown-it-extensible/css'
import './custom.css'

import { ACTIVE_LOCALES as LANGUAGES } from '../languages.mjs'

function updateNavbarLangLabel() {
    if (typeof document === 'undefined') return;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let langCode = 'de';
    if (pathParts.length > 0 && LANGUAGES.includes(pathParts[0])) {
        langCode = pathParts[0];
    }
    
    const btn = document.querySelector('.VPNavBarTranslations button');
    if (btn) {
        let labelSpan = btn.querySelector('.custom-lang-label');
        if (!labelSpan) {
            labelSpan = document.createElement('span');
            labelSpan.className = 'custom-lang-label';
            labelSpan.style.marginLeft = '6px';
            labelSpan.style.fontSize = '11px';
            labelSpan.style.fontWeight = '600';
            labelSpan.style.textTransform = 'uppercase';
            labelSpan.style.color = 'var(--vp-c-text-1)';
            btn.appendChild(labelSpan);
        }
        labelSpan.textContent = langCode.toUpperCase();
    }
    
    const mBtn = document.querySelector('.VPNavScreenTranslations button');
    if (mBtn) {
        let labelSpan = mBtn.querySelector('.custom-lang-label');
        if (!labelSpan) {
            labelSpan = document.createElement('span');
            labelSpan.className = 'custom-lang-label';
            labelSpan.style.marginLeft = '6px';
            labelSpan.style.fontSize = '11px';
            labelSpan.style.fontWeight = '600';
            labelSpan.style.textTransform = 'uppercase';
            labelSpan.style.color = 'var(--vp-c-text-1)';
            mBtn.appendChild(labelSpan);
        }
        labelSpan.textContent = langCode.toUpperCase();
    }
}

function closeAllExcept(clickedGroup) {
    const levelClass = Array.from(clickedGroup.classList).find(c => c.startsWith('level-'));
    if (!levelClass) return;

    const peers = document.querySelectorAll('.VPSidebarItem.' + levelClass);
    peers.forEach(peer => {
        if (peer !== clickedGroup) {
            const isCollapsed = peer.classList.contains('collapsed') || peer.classList.contains('is-collapsed');
            if (!isCollapsed) {
                const btn = peer.querySelector('.item');
                if (btn) {
                    setTimeout(() => {
                        btn.click();
                    }, 0);
                }
            }
        }
    });
}

function closeInactiveGroups() {
    const allGroups = document.querySelectorAll('.VPSidebarItem.collapsible'); 
    const currentPath = window.location.pathname.replace(/\/$/, "");
    
    allGroups.forEach(group => {
         const links = Array.from(group.querySelectorAll('a'));
         const isGroupActive = links.some(link => {
             if (!link.href) return false;
             try {
                 const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
                 return linkPath === currentPath;
             } catch (e) { return false; }
         });
         
         const isCollapsed = group.classList.contains('collapsed') || group.classList.contains('is-collapsed');
         if (!isGroupActive && !isCollapsed) {
             const btn = group.querySelector('.item');
             if (btn) btn.click();
         }
    });
}

function mergeTableCells() {
    const tables = document.querySelectorAll('.vp-doc table');
    tables.forEach(table => {
        const rows = Array.from(table.rows);
        if (rows.length < 1) return;

        // 1. Horizontal Merging (colspan)
        rows.forEach(row => {
            const cells = Array.from(row.cells);
            for (let i = cells.length - 1; i > 0; i--) {
                const cell = cells[i];
                const prev = cells[i-1];
                if (cell.textContent.trim() === '←' || 
                    (cell.textContent.trim() === prev.textContent.trim() && cell.textContent.trim() !== '')) {
                    const colspan = (cell.colSpan || 1) + (prev.colSpan || 1);
                    prev.colSpan = colspan;
                    cell.style.display = 'none';
                    cells.splice(i, 1);
                }
            }
        });

        // 2. Vertical Merging (rowspan)
        const colCount = rows[0].cells.length;
        for (let col = 0; col < colCount; col++) {
            for (let rowIdx = rows.length - 1; rowIdx > 0; rowIdx--) {
                const cell = rows[rowIdx].cells[col];
                const prev = rows[rowIdx-1].cells[col];
                if (!cell || !prev) continue;
                if (cell.textContent.trim() === '↑' || cell.textContent.trim() === '^^') {
                    const rowspan = (cell.rowSpan || 1) + (prev.rowSpan || 1);
                    prev.rowSpan = rowspan;
                    cell.style.display = 'none';
                }
            }
        }
    });
}

function fixTableColors() {
    // Safari workaround for :has() bug on client-side navigation
    const targets = document.querySelectorAll('.vp-doc .grammar-box table strong em, .vp-doc .grammar-box table em strong');
    targets.forEach(el => {
        if (!el.querySelector('.sanskrit-dev')) {
            el.style.setProperty('color', 'inherit', 'important');
        }
    });
}

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'doc-before': () => h(PayerOfflineIndicator),
    'doc-footer-before': () => h(PayerDocFooter),
    'nav-bar-content-after': () => h(PayerWideToggle),
    'nav-bar-search-before': () => h(PayerSemanticSearch)
  }),
  NotFound: PayerNotFound,
  setup() {
    const route = useRoute();

    // Register Service Worker (PWA support)
    registerServiceWorker()

    // Capture PWA install prompt globally. The actual install button lives in
    // PayerLanguageSettings.vue (Settings page only) — it reads the deferred prompt
    // from install-state.js. This keeps install UI out of every other page.
    onMounted(() => {
        setupInstallCapture()
        updateNavbarLangLabel()
    })

    if (typeof document !== 'undefined') {
        watch(() => route.path, (path) => {
             setTimeout(() => {
                 closeInactiveGroups();
                 mergeTableCells();
                 fixTableColors();
                 updateNavbarLangLabel();
             }, 250);
             
             // License Audit ID Migration (Move ID from <a> to <tr> for highlighting)
             if (path.includes('licenses')) {
                 setTimeout(() => {
                     document.querySelectorAll('.license-page tr a[id]').forEach(a => {
                         const id = a.id;
                         const tr = a.closest('tr');
                         if (tr && id) {
                             tr.id = id;
                             a.removeAttribute('id');
                         }
                     });
                     // Re-trigger hash targeting without adding history entries
                     if (window.location.hash) {
                         const h = window.location.hash;
                         window.location.replace(h);
                     }
                 }, 500);
             }

             const m = path.match(/(lektion|schrift|uebung)(\d+)/i);
             if (m) {
                 localStorage.setItem('payer_last_lesson', m[2]);
             }
        }, { immediate: true });
    }
  },
  enhanceApp({ app }) {

      app.component('PayerNavButton', PayerNavButton)
      app.component('PayerTopicIndex', PayerTopicIndex)
      app.component('PayerRelatedLessons', PayerRelatedLessons)
      app.component('PayerLanguageSettings', PayerLanguageSettings)
      app.component('PayerOfflineIndicator', PayerOfflineIndicator)
      app.component('PayerSemanticSearch', PayerSemanticSearch)
      
      if (typeof window !== 'undefined') {
          // Suche: Detailansicht immer einschalten
          localStorage.setItem('vitepress:local-search-detailed-list', 'true');

          console.log("Sanskrit-Akkordeon: Aktiviert");
          
          // Automatische Erkennung für Split-Viewer (Embedded Mode)
          if (window.parent !== window) {
              document.documentElement.classList.add('is-embedded');
          }

          const getActiveHeader = () => {
              const isValid = (el) => {
                  const t = el.innerText ? el.innerText.replace(/[\u200B\uFEFF]/g, '').trim() : '';
                  if (/^[1-9]\d*(\.\d+)*\.?(\s|$)/.test(t)) return true;
                  if (el.tagName.startsWith('H')) return true;
                  if (/(Wortliste|Übung)/i.test(t)) return true;
                  return false;
              };
              const all = Array.from(document.querySelectorAll('.vp-doc h1, .vp-doc h2, .vp-doc h3, .vp-doc h4, .vp-doc b, .vp-doc strong, .vp-doc p'));
              const headers = all.filter(isValid);
              const syncLine = window.scrollY + 80; 
              let active = null;
              let minDiff = Infinity;
              
              for (const h of headers) {
                  const diff = Math.abs(h.offsetTop - syncLine);
                  if (diff < minDiff) {
                      minDiff = diff;
                      active = h;
                  }
                  if (h.offsetTop > syncLine + 300) break;
              }
              return active ? active.innerText.trim() : null;
          };

          window.addEventListener('scroll', () => {
              if (window.parent !== window) { 
                  window.parent.postMessage({
                      type: 'scroll',
                      pct: window.scrollY / (document.documentElement.scrollHeight - window.innerHeight),
                      activeHeader: getActiveHeader(),
                      id: window.name || 'left-frame'
                  }, '*');
              }
          });

          window.addEventListener('message', (e) => {
              if (e.data.type === 'setScroll') {
                  window.scrollTo({ top: e.data.top, behavior: 'auto' });
              }
          });

          window.addEventListener('click', (e) => {
              if (!e.isTrusted) return;
              const itemHeader = e.target.closest('.VPSidebarItem.collapsible > .item');
              if (itemHeader) {
                   const clickedGroup = itemHeader.closest('.VPSidebarItem');
                   if (!clickedGroup) return;
                   const isCollapsed = clickedGroup.classList.contains('collapsed') || clickedGroup.classList.contains('is-collapsed');
                   if (isCollapsed) {
                       closeAllExcept(clickedGroup);
                   }
              }
          }, true);
      }
  }
}
