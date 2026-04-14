# Sanskritkurs Pipeline

## What This Is

Ein automatisiertes Produktionssystem (Static Site Generator Pipeline), das bestehende und neue Sanskrit-Lektionen in eine moderne Dokumentations-Website umwandelt. Das System kombiniert das Leseverhalten professioneller technischer Dokumentationen (Sidebar, Full-Text-Search, On-this-page-Navigation) mit warmen, lesefreundlichen Serif-Farbschemata.

## Core Value

Perfekte typografische Darstellung von Sanskrit/Devanāgarī eingebettet in eine blitzschnelle, übersichtliche und voll durchsuchbare Struktur, die als einfache Pipeline vollautomatisch neue Kapitel integrieren kann.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] **Konverter & Import**: Einliest der bestehenden `.htm`-Dateien aus dem `/sanskritkurs`-Ordner, Bereinigung von altem HTML und Umwandlung in sauberes Markdown (`.md`).
- [ ] **Bild-Übernahme**: Bilder werden inklusive Original-URLs in die neue Struktur gerettet.
- [ ] **Lizenz-Audit**: Ein Mechanismus/Step, um sicherzustellen, dass nur permissiv lizenzierte Bilder migriert/verwendet werden.
- [ ] **Typografie & Unicode**: Garantierte, makellose Darstellung von Devanāgarī (UTF-8), inklusive Laden der benötigten Webfonts.
- [ ] **Navigation & Seitenstruktur**: Autogenerierte Sidebar basierend auf Überschriften (mit einklappbaren Unterkapiteln), "Nächste/Vorherige Lektion"-Buttons und In-Page-Verzeichnis (rechts).
- [ ] **Theme & Design**: Überschreiben des kühlen Tech-Designs des SSGs durch das etablierte "warme" und lesefreundliche Layout (aus `index.html`).
- [ ] **Volltextsuche**: Integration einer funktionierenden Suche über alle Dokumente.
- [ ] **Deployment-Mechanismus**: Pipeline generiert fertigen Code für lokales Testen. Danach publizierbar auf GitHub Pages und beliebigen Standard-Hoster (wie z.B. Netlify/Vercel).

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Dynamisches Backend (PHP/DB) — Die Pipeline erzeugt statische Seiten (SSG), da dies ausreichend für Lektionen ist und das Hosting drastisch vereinfacht und absichert.

## Context

Das Original-Material existiert bereits in Form von `.htm` Dateien (z.B. Lektionen, Schriftübungen, Lösungen). Ein Proof-of-Concept in der `index.html` zeigte ein Single-Page-Laden dieser Dokumente mit einem schönen warmen Theme. Die neue Lösung erweitert das auf ein professionelles Production-Pipeline Setup (MkDocs/VitePress), bei dem künftig neue Markdown-Seiten einfach in das System "reingeworfen" und prozessiert werden können.

## Constraints

- **[Architektur]**: SSG-Ansatz — Die fertige Seite muss ein Set von statischen Dateien sein, um Hosting extrem unkompliziert und flexibel zu halten.
- **[Medien]**: Lizenzen der verwendeten Bilder müssen zwingend geklärt (permissive) sein.
- **[Design]**: Die Ästhetik (Farben, Typografie) muss dem warmen Serif-Konzept treu bleiben.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SSG (VitePress) | Bester Mix aus Auto-Navigation, Volltextsuche und statischem Deployment. | — Finished (Phase 2) |
| Markdown als Ziel-Quellformat | Dauerhaft leichter zu pflegen, standardisiert für alle modernen Dokumentations Tools. | — Finished (Phase 1) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 after initialization*
