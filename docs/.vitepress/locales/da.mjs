
export const da = {
  label: '🇩🇰 DA - Dansk',
  lang: 'da-DK',
  link: '/da/',
  title: 'Sanskrit Course',
  description: 'Grammar textbook by Alois Payer',
  themeConfig: {
    outline: { level: [2, 3], label: 'On this page' },
    returnToTopLabel: 'Return to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme',
    langMenuLabel: 'Change language',
    nav: [
      { text: 'Home', link: '/da/' },
      { text: 'TOC', link: '/da/lektionen/inhaltsverzeichnis' },
      { text: 'QA', link: '/qa_viewer.html', target: '_blank' },
      { text: 'Credits', link: '/da/impressum' },
      { text: '<span class="nav-gear-icon"></span>', link: '/da/settings', ariaLabel: 'Open Settings' }
    ],
    docFooter: {
      prev: 'Previous Lesson',
      next: 'Next Lesson'
    },
    sidebar: [
      { text: 'Table of Contents', link: '/da/lektionen/inhaltsverzeichnis' },
      { text: 'Grammar Topics', link: '/da/grammatik' },
            { text: 'Grammar Index', link: '/da/themen' },
      { text: 'Vocabulary', link: '/da/lektionen/wortliste' },
      { text: 'Glossary', link: '/da/lektionen/glossar' },
      { text: 'Lessons', collapsed: false, items: [] },
      { text: 'Script (Introduction)', collapsed: true, items: [] },
      { text: 'Exercises', collapsed: true, items: [] },
      { text: 'Legal', collapsed: true, items: [
          { text: 'Legal Notice & Citation', link: '/da/impressum' },
          { text: 'Image Licenses', link: '/da/licenses' },
      ]}
    ],
    footer: {
      message: "Part of Tüpfli's Global Village Library",
      copyright: 'Copyright © 2008-2010 Alois Payer'
    }
  }
}
