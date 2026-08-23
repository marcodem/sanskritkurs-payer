import { defineConfig } from 'vitepress'
import { ACTIVE_LOCALES } from './languages.mjs'
// ── v1.2 languages ────────────────────────────────────────────────────────────
import { de } from './locales/de.mjs'
import { en } from './locales/en.mjs'
import { fr } from './locales/fr.mjs'
import { it } from './locales/it.mjs'
import { bg } from './locales/bg.mjs'
import { ru } from './locales/ru.mjs'
import { uk } from './locales/uk.mjs'
import { hi } from './locales/hi.mjs'
// ── v1.3 languages ────────────────────────────────────────────────────────────
import { es } from './locales/es.mjs'
import { ta } from './locales/ta.mjs'
import { pa } from './locales/pa.mjs'
// ── v1.3 additional ───────────────────────────────────────────────────────────
import { la } from './locales/la.mjs'
import { rm } from './locales/rm.mjs'
import { ro } from './locales/ro.mjs'
// ── hidden (planned for later versions) ───────────────────────────────────────
import { ar } from './locales/ar.mjs'
// import { arc } from './locales/arc.mjs'
import { id } from './locales/id.mjs'
import { zhCN } from './locales/zh-CN.mjs'
import { he } from './locales/he.mjs'
import { el } from './locales/el.mjs'
import { th } from './locales/th.mjs'
import { grc } from './locales/grc.mjs'
import { fi } from './locales/fi.mjs'
import { hu } from './locales/hu.mjs'
import { zh } from './locales/zh.mjs'
import { cop } from './locales/cop.mjs'
import { fa } from './locales/fa.mjs'
import { nl } from './locales/nl.mjs'
import { am } from './locales/am.mjs'
import { af } from './locales/af.mjs'
import { lt } from './locales/lt.mjs'
import { sh } from './locales/sh.mjs'
import { sq } from './locales/sq.mjs'
import { pt } from './locales/pt.mjs'
import { tr } from './locales/tr.mjs'
import { vi } from './locales/vi.mjs'
import { zu } from './locales/zu.mjs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const multimd_table = require('markdown-it-multimd-table')
import extensiblePlugin from 'markdown-it-extensible'
import { getSidebarItems } from './utils.mjs'

function populateSidebar(localeObj, lektionLabel, lektionPrefix, schriftLabel, uebungLabel) {
  if (!localeObj || !localeObj.themeConfig || !Array.isArray(localeObj.themeConfig.sidebar)) return;
  const itemGroups = localeObj.themeConfig.sidebar.filter(g => Array.isArray(g.items));
  if (itemGroups[0]) itemGroups[0].items = getSidebarItems('lektion', lektionLabel, lektionPrefix, 10);
  if (itemGroups[1]) itemGroups[1].items = getSidebarItems('schrift', schriftLabel, lektionPrefix);
  if (itemGroups[2]) itemGroups[2].items = getSidebarItems('uebung', uebungLabel, lektionPrefix, 10);
}

populateSidebar(de, 'Lektion', 'root', 'Schrift', 'Übung');
populateSidebar(en, 'Lesson', 'en', 'Script', 'Exercise');
populateSidebar(it, 'Lezione', 'it', 'Scrittura', 'Esercizio');
populateSidebar(es, 'Lección', 'es', 'Escritura', 'Ejercicio');
populateSidebar(ta, 'பாடம்', 'ta', 'எழுத்து', 'பயிற்சி');
populateSidebar(pa, 'ਪਾਠ', 'pa', 'ਲਿਪੀ', 'ਅਭਿਆਸ');
populateSidebar(ru, 'Лекция', 'ru', 'Письмо', 'Упражнение');
populateSidebar(uk, 'Лекція', 'uk', 'Письмо', 'Вправа');
populateSidebar(hi, 'पाठ', 'hi', 'लिपि', 'अभ्यास');
populateSidebar(fr, 'Leçon', 'fr', 'Écriture', 'Exercice');
populateSidebar(rm, 'Lecziun', 'rm', 'Scrittira', 'Exercizi');
populateSidebar(ro, 'Lecție', 'ro', 'Scriere', 'Exercițiu');
populateSidebar(ar, 'الدرس', 'ar', 'الكتابة', 'التمرين');
populateSidebar(he, 'שיעור', 'he', 'כתב', 'תרגיל');
populateSidebar(la, 'Lectio', 'la', 'Scriptura', 'Exercitatio');
populateSidebar(id, 'Pelajaran', 'id', 'Aksara', 'Latihan');
populateSidebar(zhCN, '第', 'zh-CN', '书写', '练习');
populateSidebar(fi, 'Oppitunti', 'fi', 'Kirjoitusjärjestelmä', 'Harjoitus');
populateSidebar(hu, 'Lecke', 'hu', 'Írásrendszer', 'Gyakorlat');
populateSidebar(el, 'Μάθημα', 'el', 'Γραφή', 'Άσκηση');
populateSidebar(th, 'บทที่', 'th', 'ตัวอักษร', 'แบบฝึกหัด');
populateSidebar(grc, 'Μάθημα', 'grc', 'Γραφή', 'Ἄσκησις');
populateSidebar(zh, '第', 'zh', '書寫', '練習');
populateSidebar(cop, 'ⲙⲁⲑⲏⲙⲁ', 'cop', 'ⲥϧⲁⲓ', 'ⲅⲩⲙⲛⲁⲥⲓⲁ');
populateSidebar(fa, 'درس', 'fa', 'خط', 'تمرین');
populateSidebar(nl, 'Les', 'nl', 'Schrift', 'Oefening');
populateSidebar(am, 'ትምህርት', 'am', 'ጽሕፈት', 'መልመጃ');
populateSidebar(af, 'Lesing', 'af', 'Skrif', 'Oefening');
populateSidebar(lt, 'Pamoka', 'lt', 'Raštas', 'Pratimas');
populateSidebar(sh, 'Lekcija', 'sh', 'Pismo', 'Vežba');
populateSidebar(sq, 'Mësimi', 'sq', 'Shkrimi', 'Ushtrimi');
populateSidebar(pt, 'Lição', 'pt', 'Escrita', 'Exercício');
populateSidebar(bg, 'Урок', 'bg', 'Писмо', 'Упражнение');
populateSidebar(tr, 'Ders', 'tr', 'Yazı', 'Egzersiz');
populateSidebar(vi, 'Bài học', 'vi', 'Chữ viết', 'Bài tập');
populateSidebar(zu, 'Isifundo', 'zu', 'Ukubhala', 'Ukuzivocavoca');


const localeObjects = {
  de, en, it, ru, uk, hi, fr, es, ta, pa, la, rm, ro, id, 'zh-CN': zhCN, he, ar, el, th, grc, fi, hu, zh, cop, fa, nl, am, af, lt, sh, sq, pt, bg, tr, vi, zu
};
const allLocales = ACTIVE_LOCALES.map(code => localeObjects[code]).filter(Boolean);

// QA Viewer navbar link enabled for convenient testing

export default defineConfig({
  title: "Sanskritkurs",
  description: "Grammatik Lehrbuch von Alois Payer",
  lang: 'de-DE',
  base: '/',
  ignoreDeadLinks: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
    ['link', { rel: 'icon', href: '/favicon.png', type: 'image/png' }],
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    ['meta', { name: 'theme-color', content: '#03192e' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'Sanskritkurs' }],
    ['link', { rel: 'apple-touch-icon', href: '/pwa-icons/icon-192.png' }],
    ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
  ],

  locales: {
    root: { ...de },
    en: { ...en },
    it: { ...it },
    ru: { ...ru },
    uk: { ...uk },
    hi: { ...hi },
    fr: { ...fr },
    es: { ...es },
    ta: { ...ta },
    pa: { ...pa },
    la: { ...la },
    rm: { ...rm },
    ro: { ...ro },
    id: { ...id },
    'zh-CN': { ...zhCN },
    he: { ...he },
    ar: { ...ar },
    el: { ...el },
    th: { ...th },
    grc: { ...grc },
    fi: { ...fi },
    hu: { ...hu },
    zh: { ...zh },
    cop: { ...cop },
    fa: { ...fa },
    nl: { ...nl },
    am: { ...am },
    af: { ...af },
    lt: { ...lt },
    sh: { ...sh },
    sq: { ...sq },
    pt: { ...pt },
    bg: { ...bg }
  },
  
  themeConfig: {
    search: { 
      provider: 'local', 
      options: {
        detailedView: true,
        miniSearch: {
          options: {
            processTerm: function(term) {
              if (!term) return term;
              const map = {
                'ā': 'a', 'ī': 'i', 'ū': 'u', 'ṛ': 'r', 'ṝ': 'r', 'ḷ': 'l', 'ḹ': 'l',
                'ṁ': 'm', 'ṃ': 'm', 'ḥ': 'h', 'ṅ': 'n', 'ñ': 'n', 'ṭ': 't', 'ḍ': 'd',
                'ṇ': 'n', 'ś': 's', 'ṣ': 's'
              };
              let n = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              for (const k in map) {
                n = n.replace(new RegExp(k, 'g'), map[k]);
              }
              return n;
            }
          },
          searchOptions: {
            fuzzy: false,
            prefix: function(term) { return term.length >= 4; },
            boost: { title: 5, text: 1, titles: 3 },
            filter: function(result) {
              const ACTIVE = ACTIVE_LOCALES.filter(c => c !== 'de');
              const seg = (typeof window !== 'undefined' ? window.location.pathname : '/').split('/').filter(Boolean)[0] || '';
              if (ACTIVE.includes(seg)) {
                // Sprachseite: nur Ergebnisse dieser Sprache
                return result.id.startsWith('/' + seg + '/');
              }
              // Root/DE: nur Seiten ohne Sprachpräfix (kein /xx/ am Anfang)
              return !result.id.match(/^\/[a-z]{2,3}\//);
            }
          }
        },
        locales: {
          // ── v1.2 languages ────────────────────────────────────────────────────
          root: { translations: { button: { buttonText: 'Suchen' } } },
          en: { translations: { button: { buttonText: 'Search' } } },
          it: { translations: { button: { buttonText: 'Cerca' } } },
          // bg: { translations: { button: { buttonText: 'Търсене' } } },
          ru: { translations: { button: { buttonText: 'Поиск' } } },
          uk: { translations: { button: { buttonText: 'Пошук' } } },
          hi: { translations: { button: { buttonText: 'खोज' } } },
          fr: { translations: { button: { buttonText: 'Rechercher' } } },
          // ── v1.3 languages ────────────────────────────────────────────────────
          es: { translations: { button: { buttonText: 'Buscar' } } },
          ta: { translations: { button: { buttonText: 'தேடு' } } },
          pa: { translations: { button: { buttonText: 'ਖੋਜ' } } },
          id: { translations: { button: { buttonText: 'Cari' } } },
          'zh-CN': { translations: { button: { buttonText: '搜索' } } },
          he: { translations: { button: { buttonText: 'חפש' } } },
          rm: { translations: { button: { buttonText: 'Tschertgar' } } },
          ar: { translations: { button: { buttonText: 'بحث' } } },
          // arc: { translations: { button: { buttonText: 'ܒܥܬܐ' } } },
          la: { translations: { button: { buttonText: 'Quaerere' } } },
          sq: { translations: { button: { buttonText: 'Kërko' } } },
          el: { translations: { button: { buttonText: 'Αναζήτηση' } } },
          th: { translations: { button: { buttonText: 'ค้นหา' } } },
          ro: { translations: { button: { buttonText: 'Căutare' } } },
          grc: { translations: { button: { buttonText: 'Ἀναζήτησις' } } }
        }
      }
    }
  },
  
  markdown: {
    lineNumbers: false,
    breaks: true,
    config: (md) => {

      md.use(multimd_table, {
        multiline: true,
        rowspan: true,
        headerless: true,
        multiscript: true,
        colspans: true
      });
      md.use(extensiblePlugin);
    }
  },


  buildEnd: async (siteConfig) => {
    const fs = require('fs')
    const path = require('path')
    function copyMdFiles(src, out) {
      if (!fs.existsSync(src)) return
      for (const e of fs.readdirSync(src, { withFileTypes: true })) {
        if (e.name === '.vitepress' || e.name === 'deleteme') continue
        const s = path.join(src, e.name), d = path.join(out, e.name)
        if (e.isDirectory()) copyMdFiles(s, d)
        else if (e.name.endsWith('.md')) {
          fs.mkdirSync(path.dirname(d), { recursive: true })
          fs.copyFileSync(s, d)
        }
      }
    }
    copyMdFiles(siteConfig.srcDir, siteConfig.outDir)

    // Force copy qa_viewer.html to output dir
    const qaHtmlSrc = path.join(siteConfig.srcDir, 'public', 'qa_viewer.html')
    const qaHtmlDest = path.join(siteConfig.outDir, 'qa_viewer.html')
    if (fs.existsSync(qaHtmlSrc)) {
      fs.copyFileSync(qaHtmlSrc, qaHtmlDest)
    }
  }
})
