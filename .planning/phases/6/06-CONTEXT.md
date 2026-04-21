---
phase: 06-i18n-foundation
status: decided
updated: 2026-04-19T07:54:54Z
---

<decisions>

### 1. Locale Architecture
- **Root (`/`)**: German (Deutsch).
- **Sub-directory (`/en/`)**: English.
- **VitePress Configuration**: Standard `locales` object in `config.mjs` to split theme config (nav, sidebar, labels).
- **Switcher Label**: Short format (`DE / EN`) in the navbar.

### 2. Structural Mirroring
- **Scope**: Mirror the **entire** directory structure from the root to `/en/`.
- **Relationship**: German exists as the leading source. English versions will be created as placeholders (initially containing the German content or a "Translation pending" note) for all Markdown files.
- **Target Directories**:
  - `/en/lektionen/`
  - `/en/schrift/`
  - `/en/uebungen/`
  - Root English files: `/en/index.md`, `/en/grammatik.md`, `/en/impressum.md`, `/en/licenses.md`.

### 3. Automated Navigation (Sidebar)
- **Generator**: Extend the `getSidebarItems` helper in `config.mjs` to be locale-aware.
- **Logic**: The helper should detect if it's being called for an English context and look for files in the corresponding `/en/` subdirectories to generate the English sidebar automatically.

### 4. UI Label Translation
- **Scope**: Include core UI labels in the i18n setup.
- **Labels to translate**:
  - **Search**: "Suchen" -> "Search"
  - **Outline**: "Auf dieser Seite" -> "On this page"
  - **DocFooter**: (Vorherige/Nächste Lektion) -> (Previous/Next Lesson)
  - **Navbar**: (Home, Inhaltsverzeichnis, Themen-Index, Impressum) -> (Home, TOC, Index, Credits)

</decisions>

<specifics>
- Use short language labels (`DE`, `EN`) in the top nav.
- Ensure the `lang` attribute in `<html>` correctly switches between `de-DE` and `en-US`.
</specifics>

<canonical_refs>
- [VitePress i18n Docs](https://vitepress.dev/guide/i18n)
- [config.mjs](file:///Volumes/SanDisk1TB/proj/Payer/docs/.vitepress/config.mjs)
</canonical_refs>
