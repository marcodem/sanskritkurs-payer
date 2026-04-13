# Project Roadmap

This document outlines the phased execution plan for the Sanskritkurs SSG Pipeline project.

## Phase 1: Pipeline Fundament & Konverter
- **Goal:** Das Konverter-Skript lauffähig machen, das aus altem `.htm` sauberes Markdown mit korrekten Links und intaktem Devanāgarī macht.
- **Milestone:** Erste 5 Lektionen lassen sich fehlerfrei mit `node convert.js` prozessieren.

## Phase 2: VitePress Setup & Erster Build
- **Goal:** VitePress aufsetzen, die Suche einbauen und die Menüstruktur aus den Markdown-Headings formatieren.
- **Milestone:** `npm run docs:dev` zeigt die generierten Inhalte an (noch im Standard-Design).

## Phase 3: "Warmes" Theme & Typografie
- **Goal:** Dem kalten Tech-SSG das warme, edle Design aus `index.html` überstülpen (Fonts, Custom CSS Variable Overrides).
- **Milestone:** Die Dokumentation sieht im Dark/Light-Mode exakt so hochwertig aus wie das Proof-of-Concept.

## Phase 4: Migration & Lizenz-Audit
- **Goal:** Gesamten `sanskritkurs` Ordner konvertieren, alle Bilder kopieren und deren Lizenzen prüfen.
- **Milestone:** Das Skript konvertiert alle `~130` Dateien; die Deployment Pipeline steht.
