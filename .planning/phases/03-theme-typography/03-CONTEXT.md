# Phase 3 Context: "Warmes" Theme & Typografie

## Decisions

### 1. Color & Contrast
- **Decision:** Stick with Parchment (#fcf9f2) background and Deep Ink (#03192e) text.
- **Rationale:** Established v1.0 design. High legibility and academic feel.

### 2. Devanāgarī Rendering
- **Decision:** Enable extended OpenType features for "Source Serif 4".
- **Implementation:** Use `font-variant-ligatures: common-ligatures, discretionary-ligatures;` and `font-feature-settings: "kern", "liga", "clig", "dlig";`.
- **Rationale:** Ensures authentic Sanskrit conjunct rendering.

### 3. Scholarly Table Design
- **Decision:** Custom styling for paradigms.
- **Implementation:** Consistent cell padding, subtle alternating background shifts (using parchment tints), and removal of harsh borders.

### 4. Layout & Content Start
- **Decision:** Remove redundant page metadata from the start of the content area.
- **Implementation:** The document area (`.vp-doc`) should start immediately with the content. Ensure no duplicate H1 if the sidebar already covers the context.
- **Constraint:** The VitePress Navigation Bar (Site Header) remains intact for Search and Home accessibility.

## Specifics

- Tables should handle Devanāgarī and IAST side-by-side with balanced column widths.
- Blockquotes should maintain their "Authoritative" left border.

## Deferred Ideas

- Dark mode fine-tuning (Wait for user feedback after parchment is perfected).
