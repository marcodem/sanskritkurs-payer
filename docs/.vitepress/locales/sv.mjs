
export const sv = {
  label: '🇸🇪 SV - Svenska',
  lang: 'sv-SE',
  link: '/sv/',
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
      { text: 'Home', link: '/sv/' },
      { text: 'TOC', link: '/sv/lektionen/inhaltsverzeichnis' },
      { text: 'QA', link: '/qa_viewer.html', target: '_blank' },
      { text: 'Credits', link: '/sv/impressum' },
      { text: '<span class="nav-gear-icon"></span>', link: '/sv/settings', ariaLabel: 'Open Settings' }
    ],
    docFooter: {
      prev: 'Previous Lesson',
      next: 'Next Lesson'
    },
    sidebar: [
      { text: 'Table of Contents', link: '/sv/lektionen/inhaltsverzeichnis' },
      { text: 'Grammar Topics', link: '/sv/grammatik' },
            { text: 'Grammar Index', link: '/sv/themen' },
      { text: 'Vocabulary', link: '/sv/lektionen/wortliste' },
      { text: 'Glossary', link: '/sv/lektionen/glossar' },
      { text: 'Lessons', collapsed: false, items: [] },
      { text: 'Script (Introduction)', collapsed: true, items: [] },
      { text: 'Exercises', collapsed: true, items: [] },
      { text: 'Legal', collapsed: true, items: [
          { text: 'Legal Notice & Citation', link: '/sv/impressum' },
          { text: 'Image Licenses', link: '/sv/licenses' },
      ]}
    ],
    footer: {
      message: "Part of Tüpfli's Global Village Library",
      copyright: 'Copyright © 2008-2010 Alois Payer'
    }
  }
}
