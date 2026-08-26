
export const is = {
  label: '🇮🇸 IS - Íslenska',
  lang: 'is-IS',
  link: '/is/',
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
      { text: 'Home', link: '/is/' },
      { text: 'TOC', link: '/is/lektionen/inhaltsverzeichnis' },
      { text: 'QA', link: '/qa_viewer.html', target: '_blank' },
      { text: 'Credits', link: '/is/impressum' },
      { text: '<span class="nav-gear-icon"></span>', link: '/is/settings', ariaLabel: 'Open Settings' }
    ],
    docFooter: {
      prev: 'Previous Lesson',
      next: 'Next Lesson'
    },
    sidebar: [
      { text: 'Table of Contents', link: '/is/lektionen/inhaltsverzeichnis' },
      { text: 'Grammar Topics', link: '/is/grammatik' },
            { text: 'Grammar Index', link: '/is/themen' },
      { text: 'Vocabulary', link: '/is/lektionen/wortliste' },
      { text: 'Glossary', link: '/is/lektionen/glossar' },
      { text: 'Lessons', collapsed: false, items: [] },
      { text: 'Script (Introduction)', collapsed: true, items: [] },
      { text: 'Exercises', collapsed: true, items: [] },
      { text: 'Legal', collapsed: true, items: [
          { text: 'Legal Notice & Citation', link: '/is/impressum' },
          { text: 'Image Licenses', link: '/is/licenses' },
      ]}
    ],
    footer: {
      message: "Part of Tüpfli's Global Village Library",
      copyright: 'Copyright © 2008-2010 Alois Payer'
    }
  }
}
