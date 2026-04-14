# Phase 2 Context: VitePress Setup & Erster Build

## Decisions

### 1. Search Strategy
- **Decision:** Built-in local search is sufficient for now.
- **Rationale:** The current course volume does not require Algolia yet.
- **Constraints:** None.

### 2. Navigation & Structure
- **Decision:** Maintain the 10-lesson block grouping in the sidebar.
- **New Feature:** Implement a central "Grammar Topics" (Grammatik Themen) index page that maps topics to specific lessons.
- **Rationale:** Keeps the sidebar clean while providing a conceptual entry point.

### 3. Heading Numeration
- **Decision:** Implement automatic numbering (3.1, 3.1.1, etc.) globally via CSS counters.
- **Rationale:** Ensures consistency across all lessons without manual Markdown editing in every file.

### 4. Asset Management
- **Decision:** ALL images and media must be hosted locally within the repository.
- **Rationale:** Guarantees offline availability and prevents broken links from external sources.
- **Action:** Conversion script must download and localize assets.

## Specifics

- The "Grammar Topics" page should be accessible via the main navigation or a prominent sidebar link.
- CSS counters should be applied to `h2`, `h3` tags within the `.vp-doc` container.

## Deferred Ideas

- None at this stage.
