
export const et = {
  label: '🇪🇪 ET - Eesti',
  lang: 'et-EE',
  link: '/et/',
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
      { text: 'Home', link: '/et/' },
      { text: 'TOC', link: '/et/lektionen/inhaltsverzeichnis' },
      { text: 'QA', link: '/qa_viewer.html', target: '_blank' },
      { text: 'Credits', link: '/et/impressum' },
      { text: '<span class="nav-gear-icon"></span>', link: '/et/settings', ariaLabel: 'Open Settings' }
    ],
    docFooter: {
      prev: 'Previous Lesson',
      next: 'Next Lesson'
    },
    sidebar: [
      { text: 'Table of Contents', link: '/et/lektionen/inhaltsverzeichnis' },
      { text: 'Grammar Topics', link: '/et/grammatik' },
            { text: 'Grammar Index', link: '/et/themen' },
      { text: 'Vocabulary', link: '/et/lektionen/wortliste' },
      { text: 'Glossary', link: '/et/lektionen/glossar' },
      { text: 'Lessons', collapsed: false, items: [] },
      { text: 'Script (Introduction)', collapsed: true, items: [] },
      { text: 'Exercises', collapsed: true, items: [] },
      { text: 'Legal', collapsed: true, items: [
          { text: 'Legal Notice & Citation', link: '/et/impressum' },
          { text: 'Image Licenses', link: '/et/licenses' },
      ]}
    ],
    footer: {
      message: "Part of Tüpfli's Global Village Library",
      copyright: 'Copyright © 2008-2010 Alois Payer'
    }
  }
}
