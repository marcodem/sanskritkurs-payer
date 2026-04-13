# Architecture Research

## Domain
Pipeline for converting legacy HTML to Static Site

## Komponenten & Boundaries

### 1. Ingestion Layer (Der Konverter)
- **Input**: `/sanskritkurs/*.htm` (Windows-1252 / Alt-Text)
- **Process**: Node.js Skript `convert.js`.
  1. Liest HTML.
  2. Erzwingt UTF-8 Encoding-Konvertierung (falls von Nöten).
  3. Schneidet Header/Footer ab (nur Content extrahieren).
  4. Schreibt Links um (`lektion01.htm` -> `/lektionen/01.md`).
  5. Konvertiert zu Markdown.
- **Output**: `/docs/**/*.md`

### 2. SSG Configuration Layer
- **Input**: Ordnerstruktur unter `/docs`
- **Process**: `vitepress` greift die Markdown-Files ab.
- **Config**: `.vitepress/config.js` (generiert die Sidebar aus den Files), inkl. Custom CSS für Farbschema.

### 3. Generation Layer (Build)
- **Kommando**: `npm run docs:build`
- **Output**: Generierte Single-Page-App Dateien im `/docs/.vitepress/dist` Ordner, alles statisch.

### 4. Deployment Layer
- Einfacher Push/Upload des `dist` Ordners auf jeden beliebigen Webserver (Apache, Nginx, GitHub Pages).

## Build-Reihenfolge
1. Konverter bauen und Test-HTML zu Markdown überführen.
2. Link- und Bild-Routing im Konverter perfektionieren.
3. VitePress initialisieren und Theme überschreiben.
4. Pipeline Testlauf.
