---
phase: 07-automated-translation
status: active
updated: 2026-04-19T08:10:00Z
---

<rules>

### 1. Translation Scope
- **Translate**: All German prose, headers, metadata labels, and captions.
- **Preserve (Literal)**:
  - Devanagari script strings (e.g., `गणेशपूजनम्`).
  - IAST transliteration strings (e.g., `gaṇeśapūjanam`).
  - Image paths and alt text logic (translate description, keep path).
  - Link targets (unless they point to mirrored files).
  - Vue component names and prop keys (translate prop values if they are prose).
  - LaTeX math blocks.

### 2. Mandatory Label Mapping
- **"Abbildung" / "Abb."** -> "Figure"
- **"Quelle"** -> "Source"
- **"Zitierweise & Rechte"** -> "Citation & Rights"
- **"Lektion"** -> "Lesson"
- **"Übung"** -> "Exercise"
- **"Inhaltsverzeichnis"** -> "Table of Contents" / "TOC"

### 3. Syntax Guards
- Do not translate content inside code blocks or backticks.
- Do not translate IAST terms in tables (e.g. `a - अ` row remains a literal mapping).

</rules>

<canonical_refs>
- [docs/lektionen/lektion01.md](file:///Volumes/SanDisk1TB/proj/Payer/docs/lektionen/lektion01.md) (Reference for formatting)
</canonical_refs>
