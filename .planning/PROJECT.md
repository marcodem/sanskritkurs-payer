# Sanskritkurs Pipeline

## What This Is

Ein automatisiertes Produktionssystem (Static Site Generator Pipeline), das bestehende und neue Sanskrit-Lektionen in eine moderne Dokumentations-Website umwandelt. Das System kombiniert das Leseverhalten professioneller technischer Dokumentationen (Sidebar, Full-Text-Search, On-this-page-Navigation) mit warmen, lesefreundlichen Serif-Farbschemata.

## Core Value

Perfekte typografische Darstellung von Sanskrit/Devanāgarī eingebettet in eine blitzschnelle, übersichtliche und voll durchsuchbare Struktur, die als einfache Pipeline vollautomatisch neue Kapitel integrieren kann.

## Current State: v1.1 Interaktion & Flexibilität (Shipped)

**Satus:** Die Grundplattform ist interaktiv und mehrsprachig. Alle Lexionen (1-60) sind ins Englische übersetzt.

**Shipped v1.1:**
- **Interactive Quizzes**: `PayerQuiz` Komponente für Single/Multiple Choice Fragen integriert.
- **i18n Foundation**: Vollständiger locales Support (DE/EN) mit Sprachumschalter und gespiegelter Struktur.
- **Batch Translation**: Vollständige Übersetzung der Übungsdateien (Batch 2 & 3).

## Next Milestone Goals (v1.2)
- **Thematische Indizes**: Deep-Linking von grammatikalischen Konzepten über alle Lektionen hinweg.
- **Erweiterte Suche**: Integration von Devanāgarī-spezifischer Suche und Filterung.
- **Multimedia**: Pilot-Phase für Audio-Integration zur Aussprache-Unterstützung.

## Requirements

### Validated

- ✓ **Konverter & Import** — v1.0
- ✓ **Bild-Übernahme** — v1.0
- ✓ **Lizenz-Audit** — v1.0
- ✓ **Typografie & Unicode** — v1.0
- ✓ **Navigation & Seitenstruktur** — v1.0
- ✓ **Theme & Design** — v1.0
- ✓ **Volltextsuche** — v1.0
- ✓ **Deployment-Mechanismus** — v1.0
- ✓ **Quiz-Komponenten (L10N)** — v1.1
- ✓ **i18n Setup (DE/EN)** — v1.1
- ✓ **Grammar Exercise Translation (1-60)** — v1.1
- ⚠ **Wide-Mode (Layout Toggle)** — Discarded in v1.1 in favor of standard responsive layout.

### Active

- [ ] **Thematische Indizes**: Aufbau einer Querverweis-Struktur für grammatikalische Begriffe.
- [ ] **Devanāgarī-Suche**: Optimierung der Suchfunktion für transliterierte und native Devanāgarī Zeichen.

### Out of Scope

- Dynamisches Backend (PHP/DB) — Die Pipeline erzeugt statische Seiten (SSG).
- Forum / Community-Features — Fokus auf Content und Lernstruktur.

## Context

Shipped v1.1 am 2026-04-19. Das System ist nun technisch bereit für eine breitere internationale Nutzerschaft. Nächster Fokus ist die vertikale Erschließung der Inhalte (Indizes, Suche).

---
*Last updated: 2026-04-21 after v1.1 milestone completion*
