
export const no = {
  label: '🇳🇴 NO - Norsk',
  lang: 'nb-NO',
  link: '/no/',
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
      { text: 'Home', link: '/no/' },
      { text: 'TOC', link: '/no/lektionen/inhaltsverzeichnis' },
      { text: 'QA', link: '/qa_viewer.html', target: '_blank' },
      { text: 'Credits', link: '/no/impressum' },
      { text: '<span class="nav-gear-icon"></span>', link: '/no/settings', ariaLabel: 'Open Settings' }
    ],
    docFooter: {
      prev: 'Previous Lesson',
      next: 'Next Lesson'
    },
    sidebar: [
      { text: 'Table of Contents', link: '/no/lektionen/inhaltsverzeichnis' },
      { text: 'Grammar Topics', link: '/no/grammatik' },
            { text: 'Grammar Index', link: '/no/themen' },
      { text: 'Vocabulary', link: '/no/lektionen/wortliste' },
      { text: 'Glossary', link: '/no/lektionen/glossar' },
      { text: 'Lessons', collapsed: false, items: [] },
      { text: 'Script (Introduction)', collapsed: true, items: [] },
      { text: 'Exercises', collapsed: true, items: [] },
      { text: 'Legal', collapsed: true, items: [
          { text: 'Legal Notice & Citation', link: '/no/impressum' },
          { text: 'Image Licenses', link: '/no/licenses' },
      ]}
    ],
    footer: {
      message: "Part of Tüpfli's Global Village Library",
      copyright: 'Copyright © 2008-2010 Alois Payer'
    }
  }
}
