# Project Roadmap - Milestone v1.6

## Milestones

- ✅ **v1.0 Initial MVP** — Phasen 1-4 (shipped 2026-04-14)
- ✅ **v1.1 Interaktion & Flexibilität** — Phasen 5-9 (shipped 2026-04-19)
- ✅ **v1.2 Search, Index & I18n Expansion** — Phasen 10-14 (shipped 2026-05-27)
- ✅ **v1.3 Polyglot & Polish** — Phasen 15-17 (shipped 2026-06-11)
- ✅ **v1.4 Offline-First PWA** — Phasen 18-21 (shipped 2026-06-15)
- ✅ **v1.5 QA-Authoring-Split & UAT** — Phase 22 (shipped 2026-07-10)
- 🚧 **v1.6 Developer Experience / Extension** — Phase 23 (In Progress)


## Phasen

<details open>
<summary>📋 v1.2 Search, Index & I18n Expansion (Phasen 10-13)</summary>

### Phase 10: Search Optimization & Core Infrastructure
Fokus auf linguistischer Präzision und technischer Skalierbarkeit.
- [x] **Plan 10.1**: Implementierung von IAST-Folding und sprachspezifischer Suche.
- [x] **Plan 10.2**: Modularisierung der VitePress-Konfiguration (Locale-Splitting).
- **Erfolgskriterien**:
    - Suche nach "Sanskrit" findet "Saṃskṛta".
    - Konfiguration ist in separate Dateien pro Sprache aufgeteilt.

### Phase 11: Thematic Indexing & Navigation
Vertikale Erschließung der Inhalte durch Querverweise.
- [x] **Plan 11.1**: Aufbau des automatisierten Daten-Loaders für Frontmatter-Tags.
- [x] **Plan 11.2**: Erstellung der Themen-Register-Seite und der "Related Lessons" Komponente.
- **Erfolgskriterien**:
    - Eine zentrale Seite listet alle Lektionen nach Themen (z.B. Sandhi) auf.
    - Am Ende jeder Lektion erscheinen passende Themen-Vorschläge.

### Phase 12: I18n Expansion V1.3 — ES-Vervollständigung, Tamil (TA), Punjabi (PA)
Horizontale Erweiterung um drei neue Sprachen: ES vervollständigt (Übungen/Schriften), TA und PA neu.
**Plans:** 4/4 plans complete ✅

- [x] **Plan 12.0**: GUI-Aktivierung — config.mjs, pa.mjs Locale, Verzeichnisstrukturen (2026-05-31).
- [x] 12-1-PLAN.md — Übersetzungsabschluss: Vollständigkeitsprüfung und Nachhol-Jobs für ES/TA/PA
- [x] 12-2-PLAN.md — Wortlisten und licenses.md für ES, TA, PA generieren
- [x] 12-3-PLAN.md — QA: Platzhalter/CJK bereinigt, pre_push_check.py grün (2026-06-03)
- [x] 12-4-PLAN.md — Build-Gate bestanden, alle 14 Sprachen komplett (2026-06-03)

- **Erfolgskriterien**:
    - ES: alle 61 Lektionen + 11 Schriften + 61 Übungen + wortliste verfügbar.
    - TA und PA: alle 61 Lektionen + 11 Schriften + 61 Übungen + wortliste verfügbar.
    - Homepage bietet 11 Sprachen zur Auswahl (DE, EN, IT, BG, RU, UK, HI, FR, ES, TA, PA).
    - Build: `npm run docs:build` erfolgreich.

### Phase 13: QA Infrastructure Restoration
High-fidelity restoration and standardization of the Sanskrit QA viewer.
- [x] **Plan 13.1**: Completed.
- **Erfolgskriterien**:
    - Viewer resolve routing 404s.
    - Strict visual parity with "Scholarly Synthesis" design.

### Phase 14: Lektion 27 Fidelity & Review
High-fidelity manual reconstruction and validation of Sanskrit Lesson 27.
- [x] **Plan 14.1**: Surgical correction of paradigm tables (27.7.12) and missing Devanāgarī.
- [x] **Plan 14.2**: Standardization of wordlist images and captions in 27.5.
- [x] **Plan 14.3**: Verification against original HTML and license auditing.
- **Erfolgskriterien**:
    - 1:1 structural parity with original L27 HTML.
    - Zero-HTML in all sections.
    - Paradigm tables correctly formatted with all script entries.

</details>

<details open>
<summary>📋 v1.3 Editor First (Phasen 15-17)</summary>

### Phase 15: VitePress-aware Markdown Editor ⭐ PRIORITY
Der Kern von v1.3: ein Split-Pane-Editor mit Live-Vorschau, der VitePress-Containersyntax korrekt rendert.
**Plans:** 4/4 plans complete

- [x] 15-01-PLAN.md — buildRenderer-Modul: markdown-it + alle 12 Container + scholarly_fixes in qa_viewer.html
- [x] 15-02-PLAN.md — Editor-Tab UI: Button, Textarea, Preview-Div, setViewMode, Debounce, Lesson-Preload
- [x] 15-03-PLAN.md — Container-CSS: alle Stile gescoped auf .editor-preview, Dark-Mode-Overrides
- [x] 15-04-PLAN.md — Integration & Build-Gate: [[br]]-Tabellen-Verifikation, visuelle QA, npm run docs:build

- **Erfolgskriterien**:
    - Editor rendert alle VitePress-Container 1:1 wie der Produktions-Build.
    - Änderungen sind sofort in der Vorschau sichtbar.
    - `[[br]]` und MultiMD-Tabellen werden korrekt dargestellt.

### Phase 16: I18n Completion — PA, LA, RM, RO (+ BG/RU/UK gap-fill) ✅
Horizontale Erweiterung um neue Sprachen + Lückenfüllung bestehender.
- [x] **Plan 16.1**: Setup Verzeichnisstrukturen + VitePress-Config für LA, RM, RO, PA (2026-05-31).
- [x] **Plan 16.2**: Massenübersetzung via Qwen3.6-35B (nyx.local:8000) — 14 Sprachen × 61+11+61 Dateien (2026-06-03).
- [x] **Plan 16.3**: Glossar (gen_glossar.py), Wortliste, IVZ für alle neuen Sprachen generiert.
- [x] **Plan 16.4**: Pre-Push-Check grün: Platzhalter, CJK, YAML, HTML, Lizenzen (2026-06-03).
- **Erfolgskriterien** ✅:
    - LA, RM, RO, PA: alle 61 Lektionen + 11 Schriften + 61 Übungen + Glossar verfügbar.
    - Homepage bietet 14 Sprachen zur Auswahl (DE, EN, IT, BG, RU, UK, HI, FR, ES, TA, PA, LA, RM, RO).
    - *Übertrifft ursprünglichen Scope: RO als 14. Sprache zusätzlich geliefert.*

### Phase 17: Scholarly Polish — Captions, Metadata & Comparison (sekundär)
Standardisierung der Metadaten und Legacy-Vergleichswerkzeug.
- [x] **Plan 17.1**: Bildunterschriften bereits im Standardformat: `Abb.: text` + `(Bildquelle: [Details](/licenses#...))` *(de facto erledigt, 2026-06-03)*
- [x] **Plan 17.2**: Audit und Vervollständigung der licenses.md (2026-06-11).
- [x] **Plan 17.3**: Historical Comparison Mode (999.12) — Side-by-Side Legacy-HTML vs Modern-Markdown. *(erledigt durch QA-Viewer Split-View, 2026-06-02)*
- **Erfolgskriterien**:
    - Alle Bildunterschriften folgen dem L16-Ref Standard.
    - Vergleichsmodus über QA-Viewer erreichbar.

</details>

<details open>
<summary>📋 v1.4 Offline-First PWA (Phasen 18-21)</summary>

### Phase 18: PWA Foundation & Manifest
Setup der Progressive Web App Infrastruktur: manifest.json, Icons, Meta-Tags, Install-Prompt.
**Status:** Complete (2026-06-12)
**Plans:** 3/3 plans complete ✅

- [x] 18-1-PLAN.md — Web App Manifest erstellen (name, icons, theme_color, start_url) + 4 PNGs generiert
- [x] 18-2-PLAN.md — PWA Meta-Tags in config.mjs head() injizieren
- [x] 18-3-PLAN.md — Install-Prompt UI (beforeinstallprompt Event) in theme/index.mjs + custom.css
- **Status:** Complete (2026-06-12)
- **Plans:** 3/3 plans complete ✅
  - App zeigt "Installieren"-Button auf Mobile/Desktop
  - Manifest validiert via web.dev/validate-manifest
  - `npm run docs:build` erfolgreich

### Phase 19: Service Worker & Offline Caching
Implementierung des Service Workers mit intelligenten Cache-Strategien für Offline-Funktionalität.
**Status:** Complete (2026-06-12)
**Plans:** 4/4 plans complete ✅

- [x] 19-1-PLAN.md — Service Worker Registration in theme/sw-register.js + theme/index.mjs
- [x] 19-2-PLAN.md — Service Worker Lifecycle (install/activate, Cache-Versionierung)
- [x] 19-3-PLAN.md — Cache-Strategien: NetworkFirst (HTML), CacheFirst (CSS/JS/Fonts), StaleWhileRevalidate (Bilder)
- [x] 19-4-PLAN.md — Offline Fallback Page (offline.html) mit Auto-Reload + Design System
- **Erfolgskriterien** ✅:
    - App funktioniert offline nach erstem Besuch
    - Cache-Versionierung: payer-v19-r1 Convention
    - 3 Strategien implementiert ohne externe Dependencies
    - offline.html als Fallback für unbekannte Dokumente
    - Build erfolgreich (127s)

### Phase 20: Sprachauswahl (Runtime-Filter) ⭐ PRIORITY
User-seitige Sprachauswahl via Settings-Page. Server hostet alle 14 Sprachen,
Client entscheidet welche gecacht + angezeigt werden. Kein Build/Docker-Änderung.
**Status:** Complete (2026-06-12)
**Plans:** 6 plans (6/6 complete)

- [x] 20-1-PLAN.md — Settings-Page UI: 14 Checkboxen mit Persistenz in localStorage ✅
- [x] 20-2-PLAN.md — Sidebar-Filter: nur gewählte Sprachen sichtbar (JS/CSS) ✅
- [x] 20-3-PLAN.md — Service Worker selektives Caching (nur URLs gewählter Sprachen) ✅
- [x] 20-4-PLAN.md — Nachladen: neue Sprache in Settings → Fetch + Cache + UI-Update ✅
- [x] 20-5-PLAN.md — Progress-Bar für Pre-Caching bei Installation (~70MB) ✅
- [x] 20-6-PLAN.md — README.md mit PWA- + Docker-Abschnitten erweitern (2026-06-12)
- [x] 20-UAT.md — User Acceptance Testing Checklist (14 Test Cases) bereit
- **Erfolgskriterien**:
  - User wählt DE+EN+IT in Settings, Sidebar zeigt nur diese 3
  - Service Worker cacht nur URLs der gewählten Sprachen (~70MB)
  - Neue Sprache hinzufügen = online Nachladen + Cache-Update
  - Progress-Bar bei Erstinstallation sichtbar
  - `npm run docs:build` erfolgreich (unverändert, Full Build)
  - Docker-Image unverändert (Full Build, alle 14 Sprachen)

### Phase 21: Offline QA & Polishing
End-to-End-Testing der Offline-Funktionalität, Performance-Optimization, UX-Polish.
**Status:** Complete (2026-06-15)
**Plans:** 4/4 plans complete ✅

- [x] 21-1-PLAN.md — Offline Testing: Chrome DevTools Offline-Mode + Lighthouse Audit
- [x] 21-2-PLAN.md — Performance: Assets optimieren (WebP für Bilder, minify CSS/JS)
- [x] 21-3-PLAN.md — UX: Offline-Indikator (Banner wenn offline), Sync-Status
- [x] 21-4-PLAN.md — Dokumentation: README + User-Guide für Offline-Installation
- **Erfolgskriterien** ✅:
  - Lighthouse PWA: Best Practices ≥ 90, Performance ≥ 80, PWA ≥ 90
  - E2E-Test: Online → Offline → Navigation funktioniert ohne Netzwerk
  - User-Guide auf Deutsch + Englisch dokumentiert
  - `npm run docs:build` erfolgreich

</details>

<details open>
<summary>📋 v1.5 QA-Authoring-Split & UAT (Phase 22)</summary>

### Phase 22: QA-Modus-Split (zwei Builds, zwei Domains)
Trennung von Public- und Authoring-Version mit dedizierten Domains und Builds.

**Domains**:
- `payer.birchville.cc` — Public (ohne QA-Tools, PWA)
- `author.payer.birchville.cc` — Authoring (QA, Editor, deleteme-box, Authelia-Auth)

**Pläne**:
- [x] **Plan 22.1**: `config.author.mjs` erstellen (gelöst durch ENV `VITEPRESS_ENV=author`)
- [x] **Plan 22.2**: QA-Komponenten conditional aktivieren
- [x] **Plan 22.3**: Build-Script in package.json (`deploy.yml` Action übernimmt dies)
- [x] **Plan 22.4**: CI/CD-Workflow für author.payer.birchville.cc
- [x] **Plan 22.5**: Authelia-Reverse-Proxy konfigurieren (Backend Express-Server)
- [x] **Plan 22.6**: Migration, Testing, Public-Bundle ohne QA-Code verifizieren

**Migrierte Komponenten**:
1. QA Viewer (`docs/public/qa_viewer.html`)
2. Editor-Tab (Phase 15, `PayerEditorTab.vue`)
3. deleteme-box Container (Markdown-Container für Lizenzen/TODOs)
4. `docs/public/qa/` Verzeichnis (Legacy HTML)
5. `markdown.lineNumbers: true` (nur in config.author.mjs)
6. Ggf. weitere interne Tools (Debug-UI, Migration-Skripte)

**Erfolgskriterien**:
- `npm run docs:build` erzeugt Public-Bundle ohne QA-Code
- `npm run docs:build:author` erzeugt Authoring-Bundle mit allen QA-Tools
- `author.payer.birchville.cc` nur via Authelia-Auth erreichbar
- Bundle-Size-Differenz messbar (Public < Authoring)
- Beide Domains zeigen identischen Content (61 Lektionen, 14 Sprachen)

**Status**: Complete (2026-06-30). Awaiting visual inspection and final translation push.
**Reference**: CONTEXT.md D9

</details>

<details open>
<summary>📋 v1.6 Developer Experience & Translations (Phase 23) ✅</summary>

### Phase 23a: VSCode Markdown Extension
Entwicklung einer VSCode-Erweiterung (`vscode-payer-markdown`) als Template für selbstdefinierte Markdown Extensions. Die Extension klinkt sich in VSCode ein und liefert Syntax-Highlighting und Snippets für Payer-spezifische Container.

**Stufe 1 (Syntax & Snippets)**:
- [x] Highlighting für `::: grammar-box`, `::: media`, etc. in VSCode
- [x] Autocomplete-Snippets (z.B. `gbox` -> Container)
- [x] Injection Grammars (`payer-markdown.tmLanguage.json`)

**Stufe 2 (Preview Rendering)**:
- [x] Integration von `markdown-it` Plugins in den nativen VSCode-Preview.
- [x] Live-Darstellung der Boxen direkt im VSCode-Vorschaufenster.

### Phase 23b: Thai (`th`) & Modern Greek (`el`) Translations
Vollständige Übersetzung und Integration der thailändischen und neugriechischen Übersetzungspakete.
- [x] Aktivierung der Locales `th` und `el` in `docs/.vitepress/config.mjs` und `docs/.vitepress/theme/lang-settings.js`
- [x] Durchführung der automatischen Übersetzungen (Lektionen, Übungen, Schriften, Wortlisten, Lizenzen)
- [x] Layout-Synchronisation und Verifikation

**Status**: Complete (2026-08-11)
**Reference**: .planning/phases/23-vscode-extension/23-1-PLAN.md

</details>

## Backlog

### Release 1.7.1 Kandidaten
- [ ] **AI-Warnung auf der Hauptseite:** Hinweis anbringen: "Achtung: Einzig die DE Version ist original von Prof. Payer. Alle anderen Sprachen sind so gut wie möglich automatisch übersetzt und nicht auf Qualität geprüft. Deshalb werden kompetente Lektoren und Kuratoren für alle Sprachen gesucht."

### Quality & Content Cleanup (Phase 23-Kandidaten)

- [x] **BG-Version beibehalten (Ausblendung storniert)** — Bulgarisch (`bg`) bleibt vollständig in der öffentlichen Navigation und in `DEFAULT_LOCALES` aktiv.

- [x] **"Diese Übersicht ..."-Abschnitt entfernen** — Bereits erledigt; auf `grammatik.md` existieren keine Copy-Paste-Reste mehr.

- [x] **Settings-Page: Nur gewählte Sprache auflisten** — Bereits erledigt; `PayerLanguageSettings.vue` trennt bereits sauber in „Aktive Sprachen“ und „Weitere Sprachen hinzufügen“.

- [x] **Themen-Index aus Menubar entfernen** — Link "Themen-Index" aus der Top-Nav
  (in allen Locales `nav[]`-Config) entfernen und stattdessen in der Sidebar unter
  "Grammatik-Themen" platzieren (als Child-Item "Grammatik Index").
  *Erledigt 2026-06-12* — umgesetzt als "Grammatik Index" direkt unter
  "Grammatik Themen" in allen 14 Locales Nav-Bar + Sidebar.

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-4 | v1.0 | 4/4 | Complete | 2026-04-14 |
| 5-9 | v1.1 | 5/5 | Complete | 2026-04-19 |
| 10 | v1.2 | 2/2 | Complete | 2026-04-26 |
| 11 | v1.2 | 2/2 | Complete | 2026-04-26 |
| 12 | v1.2 | 4/4 | Complete | 2026-06-03 |
| 13 | v1.2 | 1/1 | Complete | 2026-05-08 |
| 14 | v1.2 | 3/3 | Complete | 2026-05-16 |
| 15 | v1.3 | 4/4 | Complete | 2026-05-31 |
| 16 | v1.3 | 4/4 | Complete | 2026-06-03 |
| 17 | v1.3 | 3/3 | Complete | 2026-06-11 |
| 18 | v1.4 | 3/3 | Complete | 2026-06-12 |
| 19 | v1.4 | 4/4 | Complete | 2026-06-12 |
| 20 | v1.4 | 6/6 | Complete | 2026-06-12 |
| 21 | v1.4 | 4/4 | Complete | 2026-06-15 |
| 22 | v1.5 | 6/6 | Complete | 2026-06-30 |
