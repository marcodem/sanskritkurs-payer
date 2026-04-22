# Revision History (Changelog)

Alle wesentlichen Änderungen in diesem Projekt werden in dieser Datei nachgehalten.
Wir orientieren uns am Prinzip des [Semantic Versioning](https://semver.org/lang/de/).

## [1.1.2] - 2026-04-22
### Behoben
- **Tabellen-Layout:** Fehlerhafte Markdown-Tabellen in Lektion 52 (DE) korrigiert, um eine saubere Darstellung in VitePress zu gewährleisten.

## [1.1.1] - 2026-04-21
### Behoben
- **Build-Fehler:** Unmaskiertes `<Absolutive>`-Tag in `docs/en/lektionen/uebung37.md` korrigiert, das den Vue-Compiler blockierte.

## [1.1.0] - 2026-04-19
### Hinzugefügt
- **Interaktive Quiz-Module:** Einführung der `PayerQuiz`-Komponente zur Selbstdokumentation und Prüfung des Lernfortschritts.
- **Layout-Flexibilität:** Neuer "Wide Mode"-Toggle für die Desktop-Ansicht zur besseren Lesbarkeit langer Sanskrit-Sätze.
- **Internationalisierung (i18n):** Aufbau der englischen Version (`/en/`) inklusive strukturierter Übersetzung der Lektionen und Übungen.
- **Zustandsspeicherung:** Lokale Speicherung von UI-Präferenzen (z.B. Wide Mode) via `localStorage`.

### Geändert
- **Übersetzungsprozess:** Automatisierung der Batch-Übersetzungen von Übungstexten unter Beibehaltung der Devanagari- und IAST-Formatierung.
- **Navigation:** Optimierung der Seitenleiste für die mehrsprachige Struktur.

## [1.0.0] - 2026-04-13
### Hinzugefügt
- Komplette Migration des originalen statischen HTML-Sanskritkurses von Alois Payer.
- Aufbau der Infrastruktur mit **VitePress** für eine moderne, schnelle Applikationsumgebung.
- Akademisches "Scholarly Synthesis" Design in `.vitepress/theme/custom.css` (inkl. Diakritika-Fonts "Source Serif 4" und Inter).
- Automatisiertes Konvertierungs-Skript (`scripts/convert.js`) zur Umwandlung des Payer-HTML-Codes in reines Markdown mittels Turndown und JSDOM.

### Geändert
- **Restrukturierung:** Alle 61 Lektionen und Übungen wurden in handliche Sidebar-Menüblöcke gruppiert (z.B. "Lektion 11 - 20").
- **Navigation:** Implementierung einer maßgeschneiderten, synchronen Akkordeon-Seitenleiste durch Manipulation der Vue 3 Engine (`.vitepress/theme/index.mjs`).

### Behoben
- Beseitigung redundanter H1-Titel und Autoren-Vermerke, die Herr Payer in seinen Original-Dateien verstreut hatte.
- Vue-AST-Blockade bei unmaskierten `<caption>` und `<colgroup>` Tabs.
- Visuelles Entfernen alter toter Creative-Commons Bilder aus 2008 von Yahoo/Flickr (Hotlinks wurden neutralisiert).
