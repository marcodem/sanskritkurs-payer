# Technical Stack Research

## Domain
Static Site Generator (SSG) for Sanskrit Educational Content

## Recommended Stack

### 1. The Generator: VitePress (Node.js/Vue)
- **Why**: VitePress ist extrem schnell ("blazing fast"), nutzt Markdown als First-Class-Citizen und generiert hochgradig optimierte statische HTML-Seiten (SSG). 
- **Entscheidungsgrund**: Im Gegensatz zu MkDocs (Python) lässt sich VitePress durch simples CSS/Vue extrem tiefgreifend visuell anpassen. Da das "warme" Design (Serif, dunkle Farben, Padding) essentiell ist, bietet VitePress hier die wenigsten Hürden.
- **Suche**: Bringt `minisearch` als lokale Volltextsuche von Haus aus mit.

### 2. Der Konverter: Node.js (jsdom + turndown)
- **Why**: Ein maßgeschneidertes Skript, um die Altlasten einzulesen.
- **jsdom**: Echter HTML-Parser, der kaputte/alte HTML-Strukturen aus den `.htm` Dateien robust verarbeiten kann.
- **turndown**: Konvertiert den gesäuberten DOM (Document Object Model) in sauberes `Markdown`.

### 3. Fonts & Typografie
- Fontsource (NPM) oder lokales Caching von "Playfair Display" und "Source Serif 4".
- Keine reinen CDN-Links, um DSGVO-Konformität (Hosten der Fonts) zu erleichtern und flackerfreies Laden (FOUT) bei Devanāgarī-Zeichen zu sichern.

## Was NICHT verwendet werden sollte
- **React/Next.js**: Komplett überdimensioniert für reine Content-Seiten.
- **Dynamische Server (Express/PHP)**: Verhindert leichtes GitHub-Pages Deployment.
