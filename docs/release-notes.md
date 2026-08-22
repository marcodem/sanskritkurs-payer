---
layout: doc
title: Release Notes & Version History
description: Overview of updates, new features, and technical enhancements in Sanskritkurs.
---

# Release Notes & Version History

Overview of releases, new features, and technical optimizations in the Sanskritkurs platform.

---

## 🚀 Version 1.7.0 (August 2026)

**Focus:** *100% Completion in Key Target Locales, Offline-First PWA & UI Polish*

### ✨ Features & Highlights
- **100% Completion without Fallbacks**: English (`en`) and Russian (`ru`) locales are 100% clean translated (136/136 files, 0 fallbacks) and write-locked.
- **Full UI Localization (SSOT)**: All navigation and control elements (Previous/Next Lesson, Exercises, Table of Contents) are dynamically served across all active locales from a single source of truth.
- **Typography & Quality Assurance**: Upright Devanāgarī typography without italic distortion, unentangled signal-red tags, and sanitized prose across all completed language versions.
- **PWA & Offline-First**: Complete offline capability for all course content across active language versions.
- **Design & Layout**: Refined Hero presentation and feature card layouts without unwanted top divider lines.

---

## 🛠 Version 1.6.1 (July 2026)

**Focus:** *QA-Viewer Parity & Sidebar Integrity*

- **QA-Viewer Synchronization**: `#left-lang` and `#right-lang` in `qa_viewer.html` match `config.mjs` locales exactly.
- **Sidebar Grouping**: Fixed nesting regressions in lesson and chapter overviews.
- **Container Syntax**: Rigorous validation and enforcement of nested `grammar-box` containers.

---

## ⚙️ Version 1.6.0 (July 2026)

**Focus:** *Surgical Fallback Repair & System Stability*

- **Surgical Fallback Logic**: Automatic block-by-block re-translation of incomplete chunks.
- **Integrity Checks**: Automated pre-push build gate to prevent corrupted markdown files from entering the repository.
- **Wordlists & Glossary**: Complete synchronization of all wordlists and terminology definitions across modular libraries.
