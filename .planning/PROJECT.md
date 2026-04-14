# Sanskritkurs Pipeline

## What This Is

Ein automatisiertes Produktionssystem (Static Site Generator Pipeline), das bestehende und neue Sanskrit-Lektionen in eine moderne Dokumentations-Website umwandelt. Das System kombiniert das Leseverhalten professioneller technischer Dokumentationen (Sidebar, Full-Text-Search, On-this-page-Navigation) mit warmen, lesefreundlichen Serif-Farbschemata.

## Core Value

Perfekte typografische Darstellung von Sanskrit/Devanāgarī eingebettet in eine blitzschnelle, übersichtliche und voll durchsuchbare Struktur, die als einfache Pipeline vollautomatisch neue Kapitel integrieren kann.

## Requirements

### Validated

- ✓ **Konverter & Import** — v1.0 (Skripte konvertieren 133 Lektionen)
- ✓ **Bild-Übernahme** — v1.0 (513 Assets erfolgreich migriert)
- ✓ **Lizenz-Audit** — v1.0 (Alle 513 Bilder in licenses.md dokumentiert)
- ✓ **Typografie & Unicode** — v1.0 (OpenType Ligaturen für Devanāgarī aktiv)
- ✓ **Navigation & Seitenstruktur** — v1.0 (Hierarchische Sidebar mit CSS-Numbering)
- ✓ **Theme & Design** — v1.0 (Solarized Dark/Light Custom Theme)
- ✓ **Volltextsuche** — v1.0 (VitePress Search integriert)
- ✓ **Deployment-Mechanismus** — v1.0 (Produktions-Build via npm run docs:build)

### Active

- [ ] **Erweiterte Übungs-Validierung**: Automatisierte Prüfung auf korrekte Sanskrit-Transliteration-Einbettung in den Übungen.
- [ ] **Interaktive Quiz-Module**: Integration von interaktiven Test-Komponenten für Vokabelabfragen.

### Out of Scope

- Dynamisches Backend (PHP/DB) — Die Pipeline erzeugt statische Seiten (SSG), da dies ausreichend für Lektionen ist und das Hosting drastisch vereinfacht und absichert.

## Context

Das Projekt wurde erfolgreich von einer Sammlung statischer HTML-Dateien in ein modernes VitePress-System migriert. Shipped v1.0 mit ~35,277 Zeilen Content/Code. Das Original-Material wird nun durch zwei Post-Processing Skripte (`fix_links.js`, `cleanup_html.js`) sauber aufbereitet.

## Constraints

- **[Architektur]**: SSG-Ansatz — Die fertige Seite muss ein Set von statischen Dateien sein.
- **[Medien]**: Lizenzen der verwendeten Bilder müssen zwingend geklärt (permissive) sein.
- **[Design]**: Die Ästhetik (Farben, Typografie) muss dem warmen Serif-Konzept treu bleiben.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SSG (VitePress) | Bester Mix aus Auto-Navigation, Volltextsuche und statischem Deployment. | ✓ Good (Phase 2) |
| Markdown als Ziel-Quellformat | Dauerhaft leichter zu pflegen, standardisiert. | ✓ Good (Phase 1) |
| CSS-Hierarchy | Vermeidung von manuellem Nummerieren in MD Files. | ✓ Good (Phase 2) |
| Solarized Dark | Ergonomische Lösung für langes Lesen von Sanskrit-Texten. | ✓ Good (Phase 3) |

---
*Last updated: 2026-04-14 after v1.0 milestone completion*
