import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'

// Auto-Navigation Generator
function getSidebarItems(prefix, labelTitle, groupSize = 0) {
  const lektionenDir = path.join(__dirname, '../lektionen');
  if (!fs.existsSync(lektionenDir)) return [];
  
  const files = fs.readdirSync(lektionenDir).filter(f => f.startsWith(prefix) && f.endsWith('.md'));
  
  // Sortiere alphabetisch/numerisch
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  
  const items = files.map(file => {
    let text = file.replace('.md', '');
    text = text.replace(new RegExp('^' + prefix + '0*', 'i'), labelTitle + ' ');
    
    return {
      text: text.trim(),
      link: `/lektionen/${file.replace('.md', '')}`
    }
  });

  // Wenn Gruppierung erwünscht ist und wir genug Items haben
  if (groupSize > 0 && items.length > groupSize) {
    const groups = [];
    for (let i = 0; i < items.length; i += groupSize) {
      const chunk = items.slice(i, i + groupSize);
      // Nimm nur die Nummer/Suffix aus dem formatierten Namen für den Titel (z.B. "10")
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
  
  themeConfig: {
    outline: {
      level: [2, 3],
      label: 'Auf dieser Seite'
    },
    
    search: {
      provider: 'local',
      options: {
        locales: {
          root: { translations: { button: { buttonText: 'Suchen' } } }
        }
      }
    },
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Inhaltsverzeichnis', link: '/lektionen/inhaltsverzeichnis' },
      { text: 'Impressum', link: '/impressum' },
      { text: 'Lizenzen', link: '/licenses' }
    ],
    
    sidebar: [
      {
        text: 'Inhaltsverzeichnis',
        link: '/lektionen/inhaltsverzeichnis'
      },
      {
        text: 'Lektionen',
        collapsed: false,
        items: getSidebarItems('lektion', 'Lektion', 10)
      },
      {
        text: 'Schrift (Einführung)',
        collapsed: true,
        items: getSidebarItems('schrift', 'Schrift')
      },
      {
        text: 'Übungen',
        collapsed: true,
        items: getSidebarItems('uebung', 'Übung', 10)
      },
      {
        text: 'Rechtliches',
        collapsed: true,
        items: [
          { text: 'Impressum & Zitieren', link: '/impressum' },
          { text: 'Bildlizenzen (Audit)', link: '/licenses' }
        ]
      }
    ],

    footer: {
      message: "Teil der Tüpfli's Global Village Library",
      copyright: 'Copyright © 2008-2010 Alois Payer'
    }
  }
})
