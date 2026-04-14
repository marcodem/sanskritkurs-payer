# Sanskritkurs Pipeline

## What This Is

Ein automatisiertes Produktionssystem (Static Site Generator Pipeline), das bestehende und neue Sanskrit-Lektionen in eine moderne Dokumentations-Website umwandelt. Das System kombiniert das Leseverhalten professioneller technischer Dokumentationen (Sidebar, Full-Text-Search, On-this-page-Navigation) mit warmen, lesefreundlichen Serif-Farbschemata.

## Core Value

Perfekte typografische Darstellung von Sanskrit/Devanāgarī eingebettet in eine blitzschnelle, übersichtliche und voll durchsuchbare Struktur, die als einfache Pipeline vollautomatisch neue Kapitel integrieren kann.

## Current Milestone: v1.1 Interaktion & Flexibilität

**Goal:** Ausbau der Lernplattform zu einem interaktiven, mehrsprachigen System mit flexiblerem Layout.

**Target features:**
- **Interaktive Quiz-Module**: Vue-Komponenten für direktes Feedback bei Übungen.
- **Wide-Mode-Schalter**: Layout-Optimierung für große Bildschirme.
- **Mehrsprachigkeit (i18n)**: Vorbereitung der Struktur für Deutsch/Englisch.

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

### Active

- [ ] **Quiz-Komponenten**: Entwicklung einer Basis-Komponente für Single-Choice/Multiple-Choice Fragen.
- [ ] **Layout Toggle**: Integration eines Buttons in die VitePress-Navbar zur Breitensteuerung.
- [ ] **i18n Setup**: Konfiguration der `config.mjs` für Multi-Language Support und Erstellung des `/en/` Verzeichnisses.

### Out of Scope

- Dynamisches Backend (PHP/DB) — Die Pipeline erzeugt statische Seiten (SSG).

## Context

Das Projekt wurde erfolgreich migriert. Shipped v1.0 am 2026-04-14. Fokus liegt nun auf Interaction und UX-Verbesserungen.

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
*Last updated: 2026-04-14 after v1.1 milestone initialization*
