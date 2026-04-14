# Project Retrospective: Sanskritkurs Pipeline

## Milestone: v1.0 — Initial MVP

**Shipped:** 2026-04-14
**Phases:** 4 | **Plans:** 4

### What Was Built
- Automated migration system for legacy Sanskrit content.
- Clean scholarly typography and Solarized design.
- Production-ready VitePress structure with full-text search and licensing audit.

### What Worked
- **Incremental Transitions**: Using SUMMARY.md to bridge phases kept the momentum.
- **Visual-First Feedback**: Tuning CSS live in the browser helped capture the "warm" feel quickly.
- **Regex-Based Content Cleanup**: Handled 133 files in seconds instead of manual editing.

### What Was Inefficient
- **Git State Management**: Starting with many untracked files made the final milestone completion more complex.
- **Table Formatting**: Some edge cases in nested blockquotes required manual post-processing. A better initial regex could have saved effort.

### Patterns Established
- **Clean URLs**: Consistent `/lektionen/lektionXX` routing.
- **Hierarchical CSS Numbering**: Offsetting content complexity out of Markdown and into the theme.

### Key Lessons
- Always commit work at the end of every phase to keep the Git history clean and stats accurate.
- Use the Browser Agent early for cross-browser visual validation of complex typography.

---

## Cross-Milestone Trends

| Milestone | Duration | Changes | Req Coverage | Status |
|-----------|----------|---------|--------------|--------|
| v1.0 | 2 days | 102 files | 100% | Shipped |
