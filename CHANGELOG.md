# Revision History (Changelog)

Alle wesentlichen Änderungen in diesem Projekt werden in dieser Datei nachgehalten.
Wir orientieren uns am Prinzip des [Semantic Versioning](https://semver.org/lang/de/).
## [1.7.4] - 2026-08-26 (Hotfix)
### Behoben
- **Build-Fix:** Fehlendes `languages.mjs` Update für die nordischen Sprachen eingecheckt. Das Script verursachte Diskrepanzen zwischen dem lokalen Pre-Push-Check und der GitHub Actions Umgebung.

## [1.7.2] - 2026-08-26 (Hotfix)
### Behoben
- **Build-Fix:** Hinzufügen der fehlenden VitePress-Konfigurationsdateien (`da.mjs`, `et.mjs`, `is.mjs`, `no.mjs`, `sv.mjs`) für die nordischen Sprachen, die den CI-Build (`docs:build`) auf GitHub Actions abstürzen ließen.

## [1.7.1] - 2026-08-26 (Hotfix)
### Behoben
- **VitePress Suche Absturz:** Hotfix für `ACTIVE_LOCALES` Scope-Bug im Such-Filter, der die lokale Suche auf der Produktionsseite zum Absturz brachte.
- **Deutsch-Rückstände in Tabellen (z.B. 4.1.1.1.2):** Erweiterung der `translation_qa.py` Keyword-Listen (`STRICT_DE_GRAMMAR_KEYWORDS`) um spezifische deutsche Phrasen ("er, sie, es; der, die, das"), um unübersetzte Fragmente innerhalb von Tabellen, die von Lingua ignoriert werden, zuverlässig abzufangen.

## [1.7.0] - Unreleased
### Hinzugefügt
- **PWA Decoupling (Offline-Architektur):** Die verfügbaren UI-Sprachen sind jetzt vollständig von den Offline-Downloads (Service Worker) entkoppelt. Benutzer können selektiv einzelne Sprachen für die Offline-Verwendung herunterladen, wodurch die Caching-Zeiten drastisch verkürzt werden.
- **QA-Viewer (Zero-Backend):** Der `author-server` wurde komplett entfernt. Der Editor agiert nun als reiner Client, der direkt über die GitHub REST API (PAT) kommuniziert (inklusive Branches, Commits und Pull Requests aus dem Browser).
- **Massive Sprach-Erweiterung:** 9 neue Sprachen erreichen den Status 100% (136/136 Dateien): Thai (th), Bulgarisch (bg), Traditionelles Chinesisch (zh), Altgriechisch (grc), Finnisch (fi), Ungarisch (hu), Latein (la), Persisch (fa) und Türkisch (tr).
- **Übersetzungs-Kaskade & Linguistische Analyse:** Signifikante Verbesserung des Übersetzungsprozesses durch Einführung einer mehrstufigen LLM-Kaskade inkl. DeepL-Integration und tiefgreifender spezifischer linguistischer Analyse zur Vermeidung von Halluzinationen.
- **Pipeline-Upgrades:** Einführung des autonomen Stufe-5-Manövers zur selbstständigen Auflösung von Deadlocks (TM-Bereinigung) und Injection von 8 weiteren neuen Sprachen in die UI-Config.

### Behoben
- **Devanagari-Schutz & CJK:** Kollisionen bei Regex-Parsing (z.B. von chinesischen Buchtitel-Klammern `《...》` und Sanskrit-Tags `⟪...⟫`) behoben, indem das `markdown-it-extensible` Plugin als Hotfix via `esm.sh` aktualisiert wurde.

## [1.6.0] - 2026-07-13
### Behoben
- **Surgical Fallback & Integrity:** Umfangreicher Korrekturlauf zur Behebung von Übersetzungs-Lücken und fehlerhaften Fallback-Tags in massiven Dateien (z.B. `wortliste.md`, `glossar.md`).
- **Sprachen-Fixes:** Lückenlose Vervollständigung der Übersetzungsstände für Indonesisch (ID), Hindi (HI), Tamil (TA), Arabisch (AR) und Vereinfachtes Chinesisch (zh-CN) auf 100% (61/61 Lektionen, Schriften, Übungen, Root).

## [1.5.0] - 2026-07-10
### Hinzugefügt
- **Neue Sprachen (HE, AR, ARC, zh-CN):** Vollständige Integration von Hebräisch, Arabisch, Aramäisch und Vereinfachtem Chinesisch über alle 61 Lektionen, Schriften, Übungen und Glossare.
- **RTL UI & Layout:** Unterstützung für `dir="rtl"` in hebräischen und arabischen Ansichten sowie Lokalisierung der Einstellungsseiten.
- **PWA Caching & Manifeste:** Automatisierte Erstellung von PWA-Manifesten für alle 21 Locales zur Gewährleistung der Offline-Fähigkeit aller aktiven Sprachen.

### Geändert
- **QA-Viewer & Lokales Editing:** Lokalisierung des Autoren-Interfaces ins Englische und Integration eines automatischen OpenRouter-Fallback-Systems bei lokalen QC-Fehlern.
- **Settings-Page Refactoring:** Aufteilung in aktive und herunterladbare/hinzufügbare Sprachen.

### Behoben
- **Syntax-Bereinigung:** Umfassender Cleanup veralteter `::: container` Direktiven zu `:::container` zur Beseitigung von Parse-Fehlern im VitePress-Build.
- **Sanskritrot-Styling:** Behebung von CSS-Hiccups bezüglich roter Sanskrit-Zeichen in Tabellen und HTML-Überschreibungen.

## [1.4.0] - 2026-06-15
### Hinzugefügt
- **Offline-First PWA:** Integration eines Service Workers zur vollständigen Offline-Nutzung aller Kursinhalte und Lektionen.
- **Laufzeit-Sprachfilter:** Dynamische Sprachauswahl und Caching-Einstellungen direkt über die Benutzeroberfläche.

## [1.3.0] - 2026-06-03
### Hinzugefügt
- **Markdown-Editor:** Integration eines Split-Pane-Editors mit Live-Vorschau und bidirektionalem, prozentualem Scroll-Sync im QA-Viewer.
- **5 neue Sprachen:** Vollständige Übersetzung des Kurses in Latein (LA), Rumantsch Grischun (RM), Rumänisch (RO), Punjabi (PA) und Indonesisch (ID).
- **Qualitätssicherung:** Einführung des `pre_push_check.py` Skripts zur automatischen Validierung der Markdown-Syntax, Links und HTML-Richtlinien vor Git-Commits.

## [1.2.0] - 2026-05-27
### Hinzugefügt
- **IAST-Suche:** Intelligentes Diakritikafolding zur Suche von Sanskrit-Begriffen ohne Sonderzeichen (z. B. `samskrta` findet `Saṃskṛta`).
- **Modulare Konfiguration:** Aufteilung der VitePress-Konfiguration in sprachspezifische Locale-Dateien zur besseren Wartbarkeit.
- **Thematisches Register:** Dynamischer VitePress Data Loader zur vollautomatischen Generierung eines alphabetischen Themenindexes.
- **Verwandte Lektionen:** Integration der `PayerRelatedLessons`-Komponente unter Einhaltung des Scholarly Synthesis Designs.
- **Russisch & Ukrainisch:** Erweiterung um die locales `/ru/` und `/uk/`.

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
- **Navigation:** Implementierung einer maßgeschneiderten, synchronen Akkordeon-Seitenleiste durch Modulation der Vue 3 Engine (`.vitepress/theme/index.mjs`).

### Behoben
- Beseitigung redundanter H1-Titel und Autoren-Vermerke, die Herr Payer in seinen Original-Dateien verstreut hatte.
- Vue-AST-Blockade bei unmaskierten `<caption>` und `<colgroup>` Tabs.
- Visuelles Entfernen alter toter Creative-Commons Bilder aus 2008 von Yahoo/Flickr (Hotlinks wurden neutralisiert).
