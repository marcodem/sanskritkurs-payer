# Revision History (Changelog)

Alle wesentlichen Änderungen in diesem Projekt werden in dieser Datei nachgehalten.
Wir orientieren uns am Prinzip des [Semantic Versioning](https://semver.org/lang/de/).

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
