# Anforderungen (Requirements)

## 1. Konverter Pipeline (Ingestion)
- [ ] Skript liest alle `.htm` Dateien aus `/sanskritkurs`
- [ ] Erzwingt oder verifiziert UTF-8 Encoding, sodass Devanāgarī (z.B. ā, ī, ṭ) erhalten bleibt
- [ ] Entfernt alten "HTML Garbage" (z.B. veraltete Tabellen, FONT-Tags) per `jsdom`
- [ ] Konvertiert den reinen Content via `turndown` zu `.md`
- [ ] Schreibt interne Linkverweise (`href="lektionX.htm"`) korrekt auf die generierten Pfade um
- [ ] Passt Bild-URLs an, sodass der SSG sie im `public/` Verzeichnis findet

## 2. Bild & Lizenz Handling
- [ ] Mechanismus zum Extrahieren und physischen Übertragen gefundener Bilder
- [ ] Bereitstellen eines Logs der verwendeten Bilder, um die permissive Lizenzprüfung durchzuführen

## 3. Dokumentations-System (SSG)
- [ ] Integration von VitePress (Node.js) als ultraschneller, moderner Generator
- [ ] Automatische Generierung der Navigations-Sidebar (links) basierend auf dem Dateibaum
- [ ] Generierung von In-Page-Menüs (rechts) aus den Markdown-Headings
- [ ] Aktivierte "Next / Previous" Footer-Navigation für durchgehendes Lesen
- [ ] Lokale Volltextsuche (Search-Plugin) konfigurieren
- [ ] **Ergänzung:** Zentrale Übersicht der Grammatik-Themen mit Verlinkung zu den Lektionen (Index-Page)

## 4. Visuals & Theme
- [ ] Umfangreiches CSS-Override des VitePress Default-Themes
- [ ] Farbpalette auf das warme `index.html` Modell setzen (Backgrounds, Border, Text-Colors)
- [ ] Lokale CSS Einbindung oder Fontsource für "Playfair Display" und "Source Serif 4"
- [ ] Bugfreie Darstellung der Sanskrit-Typografie unter dem neuen Theme

## 5. Deployment
- [ ] npm script `docs:build` generiert fehlerfreien, leicht einsetzbaren statischen `/dist` Ordner
- [ ] Dokumentierter Workflow zum initialen Testen und zur GitHub-Veröffentlichung
