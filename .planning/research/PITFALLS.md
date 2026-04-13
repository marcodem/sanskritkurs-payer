# Pitfalls Research

## Domain
Data Migration of older HTML files to Markdown for SSG.

## Common Mistakes (Warning Signs)

### 1. Encoding-Fallen (Character Mojibake)
- **Das Problem**: Viele alte HTMLs von 1990-2010 nutzen Windows-1252 oder Latin-1. Wenn Node.js sie als UTF-8 einliest, zerbrechen Umlaute und Sonderzeichen sofort. Sanskrit-Transliterationen (ā, ī, ṭ, ḍ) werden unlesbar.
- **Die Prävention**: Das Konverter-Skript MUSS die Dateien binär/als Puffer laden und das Encoding (mittels libraries wie `iconv-lite`) erzwingen/überprüfen, bevor es in Strings umgewandelt wird.

### 2. Gebrochene interne Links (Link Rot)
- **Das Problem**: Markdown konvertiert `<a href="lektion02.htm">` exakt so. Der SSG erwartet aber `.md`-Endungen oder Pfade. Resultat: Alle Querlinks auf der generierten Seite führen ins Leere (404).
- **Die Prävention**: Regex-Replacer im Skript, der lokale `.htm` Links vor der Markdown-Speicherung umschreibt.

### 3. Bild-Asset Pfade
- **Das Problem**: SSGs wie VitePress erwarten Bilder oft im `public/` Verzeichnis. Ein `<img src="bilder/test.jpg">` geht kaputt, wenn die `.md` Datei plötzlich im Unterordner `/docs/lektionen/` liegt.
- **Die Prävention**: Das Skript muss den Asset-Pfad im Markdown anpassen (z. B. absolute Pfade wie `/bilder/test.jpg` erzwingen) und Skript kopiert die Bilder automatisch in den neuen `public` Ordner.

### 4. DOM Garbage (HTML-Relikte)
- **Das Problem**: Alter `<font>` oder `<table>` Code wird vom HTML-to-Markdown Konverter oft ignoriert und belassen. VitePress/Vue stürzt beim Rendern unter Umständen ab, wenn unsauberes HTML im Markdown liegt.
- **Die Prävention**: Radikales HTML-Sanitizing VOR der Markdown-Transformation.
