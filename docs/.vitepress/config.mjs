import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'

// Auto-Navigation Generator (Locale-Aware)
function getSidebarItems(prefix, labelTitle, locale = 'root', groupSize = 0) {
  // Use process.cwd() to ensure reliable path resolution from the project root
  const baseDir = locale === 'en' ? 'docs/en/lektionen' : 'docs/lektionen';
  const lektionenDir = path.resolve(process.cwd(), baseDir);
  
  if (!fs.existsSync(lektionenDir)) {
    console.error(`[Sidebar Error] Directory not found: ${lektionenDir}`);
    return [];
  }
  
  const files = fs.readdirSync(lektionenDir).filter(f => f.startsWith(prefix) && f.endsWith('.md'));
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  
  const linkPrefix = locale === 'en' ? '/en/lektionen/' : '/lektionen/';
  
  const items = files.map(file => ({
    text: file.replace('.md', '').replace(new RegExp('^' + prefix + '0*', 'i'), labelTitle + ' ').trim(),
    link: linkPrefix + file.replace('.md', '')
  }));

  if (groupSize > 0 && items.length > 0) {
    const groups = [];
    for (let i = 0; i < items.length; i += groupSize) {
      const chunk = items.slice(i, i + groupSize);
      const startText = chunk[0].text.split(' ').pop();
      const endText = chunk[chunk.length - 1].text.split(' ').pop();
      
      groups.push({
        text: `${labelTitle} ${startText} - ${endText}`,
        collapsed: true,
        items: chunk
      });
    }
    return groups;
  }
  return items;
}

export default defineConfig({
  title: "Sanskritkurs",
  description: "Grammatik Lehrbuch von Alois Payer",
  cleanUrls: true,

  locales: {
    root: {
      label: 'DE',
      lang: 'de-DE',
      themeConfig: {
        outline: { level: [2, 3], label: 'Auf dieser Seite' },
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Inhaltsverzeichnis', link: '/lektionen/inhaltsverzeichnis' },
          { text: 'Themen-Index', link: '/grammatik' },
          { text: 'Impressum', link: '/impressum' }
        ],
        docFooter: {
          prev: 'Vorherige Lektion',
          next: 'Nächste Lektion'
        },
        sidebar: [
          { text: 'Inhaltsverzeichnis', link: '/lektionen/inhaltsverzeichnis' },
          { text: 'Grammatik Themen (Index)', link: '/grammatik' },
          { text: 'Wortliste', link: '/lektionen/wortliste' },
          { text: 'Lektionen', collapsed: false, items: getSidebarItems('lektion', 'Lektion', 'root', 10) },
          { text: 'Schrift (Einführung)', collapsed: true, items: getSidebarItems('schrift', 'Schrift', 'root') },
          { text: 'Übungen', collapsed: true, items: getSidebarItems('uebung', 'Übung', 'root', 10) },
          { text: 'Rechtliches', collapsed: true, items: [
              { text: 'Impressum & Zitieren', link: '/impressum' },
              { text: 'Bildlizenzen (Audit)', link: '/licenses' }
          ]}
        ]
      }
    },
    en: {
      label: 'EN',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        outline: { level: [2, 3], label: 'On this page' },
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'TOC', link: '/en/lektionen/inhaltsverzeichnis' },
          { text: 'Index', link: '/en/grammatik' },
          { text: 'Credits', link: '/en/impressum' }
        ],
        docFooter: {
          prev: 'Previous Lesson',
          next: 'Next Lesson'
        },
        sidebar: [
          { text: 'Table of Contents', link: '/en/lektionen/inhaltsverzeichnis' },
          { text: 'Grammar Topics (Index)', link: '/en/grammatik' },
          { text: 'Vocabulary', link: '/en/lektionen/wortliste' },
          { text: 'Lessons', collapsed: false, items: getSidebarItems('lektion', 'Lesson', 'en', 10) },
          { text: 'Script (Introduction)', collapsed: true, items: getSidebarItems('schrift', 'Script', 'en') },
          { text: 'Exercises', collapsed: true, items: getSidebarItems('uebung', 'Exercise', 'en', 10) },
          { text: 'Legal', collapsed: true, items: [
              { text: 'Credits & Citation', link: '/en/impressum' },
              { text: 'Image Licenses', link: '/en/licenses' }
          ]}
        ]
      }
    }
  },
  
  themeConfig: {
    search: { 
      provider: 'local', 
      options: { 
        locales: { 
          root: { translations: { button: { buttonText: 'Suchen' } } },
          en: { translations: { button: { buttonText: 'Search' } } }
        } 
      } 
    },
    footer: {
      message: "Teil der Tüpfli's Global Village Library",
      copyright: 'Copyright © 2008-2010 Alois Payer'
    }
  }
})
