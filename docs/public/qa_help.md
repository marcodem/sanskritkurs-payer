# QA Editor & Translator Guidelines

This reference documents tricky edge cases, container nesting, and specific rules for the Payer project.

## 1. Offline Editing Process and Functions

With version 1.7.0, the QA Viewer operates entirely serverless. This means you read and save changes directly via the **GitHub Cloud**.

### The Most Important Buttons
* **Load from Cloud (Blue Button):** This is the most crucial step! When you open the QA Viewer, you only see a read-only preview. Click this button to download the markdown source code live from GitHub and unlock the editor.
* **File ▾ Menu:**
  - **Set PAT (GitHub Token):** Before you can save to the cloud, you must provide your Personal Access Token (PAT) here once, so GitHub recognizes you as an author. **To apply for a PAT, please contact the publisher via email at `webmaster@birchville.org`.**
  - **Save (Commit to PR):** Saves your changes, creates a new Git commit in the background, and pushes it directly into a Pull Request. This also triggers the "Silent Auto-Repair" for broken tables.
* **Sync:** Controls how the left and right halves of the screen are coupled when scrolling (e.g., based on headings).
* **View:** Toggles the left reading view between the finished website (Rendered) and the raw markdown code.
* **SWAP:** Swaps the left and right columns.
* **VIM:** Activates special keyboard shortcuts (for advanced users only; activates a subset of the VIM editor keybindings).
* **Reset:** Discards all local, unsaved changes and restores the original text.
* **Left vs. Right:** Set the reference language on the **left side** (usually DE) and the target language on the **right side** (e.g., ID, ES, EN).

## 2. The 4-Colon Problem (Container Nesting)

When a container block (like `::: indent` or `::: center`) is placed **inside** another container (like `::: grammar-box`), the outer container must NOT be declared with 3 colons (`:::`). Otherwise, the Markdown engine cannot determine the correct boundaries.
Instead, the outer container must be defined with **4 colons (`::::`)**!

**Wrong:**
```markdown
::: grammar-box
This text is inside the box.
::: indent
This is indented.
:::
:::
```

**Right:**
```markdown
:::: grammar-box
This text is inside the box.
::: indent
This is indented.
:::
::::
```

## 3. Extended Table Features

### Colspan (`>`) & Rowspan (`^`)
The MultiMD table engine allows spanning cells across columns and rows:
- **Colspan (`>`)**: Put a single `>` in a cell to span it to the right (into the next column).
- **Rowspan (`^`)**: Put a single `^` in a cell to span it upwards (into the cell above).

Example:
```markdown
| Header 1 | Header 2 | Header 3 |
|---|---|---|
| Spans two columns | > | Row 1 |
| Spans up | Cell | ^ |
```

### Table Containers
* **`::: no-header`**: Wrap a table here to completely hide the table header (essential if Payer had no visual header). Leave header cells empty (`| | |`).
* **`::: compact`**: Wraps a table to render it with tighter padding and smaller font size (useful for large lists).
* **`::: laut-table`**: Specialized container for linguistic/sound tables.
* **`::: metrik-schema`**: Specialized container for metric structures and schemas.

### Devanāgarī Formatting (`:br`)
Devanāgarī characters in table cells must **never be enclosed in parentheses**. Instead, write the Latin transliteration in bold, followed by a line break (`:br`) and the Devanāgarī script:
```markdown
| **devī**:brदेवी | **nāma**:brनाम |
```

### Empty Cells in Tables
Make sure that empty cells in tables always contain a single space (`| |` instead of `||`), otherwise the Markdown rendering in the live preview will break.

## 4. Images, Licenses & Captions

- **Captions** must always be on **a single line**. Line breaks inside a caption break the layout.
- **Licenses**: Full bibliographic details, links, and access dates must *not* be placed below the image. They must strictly be moved to the end of the document into the `::: deleteme-box` (under `### Quellen`).

## 5. Scholarly Red vs. Signal Red

There are two different red colors used in this project:

**1. Scholarly Red (`#b22222`)**
Used for Devanāgarī and morphological highlights. It is automatically applied to text inside the Devanāgarī brackets `...`. 
Please **do not** manually color Latin letters red using standard Markdown formatting (like `***`) to fake Scholarly Red.

**2. Signal Red (`#ff0000`)**
Used for extreme emphasis or grammatical highlights (bright red). You can explicitly use this color by wrapping Devanāgarī text with the `:sig[...]` syntax:
```markdown
:sig[⟪लम्बोदर⟫ ⟪नमस्⟫ ⟪तुभ्यं⟫]
```
Note that `:sig[...]` cannot span multiple lines. Wrap each line individually.

## 6. Editor Shortcuts

- **Save**: `Ctrl + S` (Windows) / `Cmd + S` (Mac).
- Saving automatically triggers the Silent Auto-Repair for tables.

## 7. Custom Syntax Extensions (`markdown-it-extensible`)

All custom block containers and inline directives are powered by the official [`markdown-it-extensible`](https://www.npmjs.com/package/markdown-it-extensible) npm package.

### Syntax Quick Reference:
* **Block Containers (`:::` / `::::`)**:
  - `::: grammar-box` & `::: grammar-box2`: Highlighted grammar rule boxes.
  - `::: indent`: Running text paragraph indentation container.
  - `::: note-box`: Informational callout box.
  - `::: deleteme-box`: Scholarly sources / metadata container (hidden in frontend view).
  - `::: media`: Scholarly image container block.
  - `::: no-header`: Table wrapper to hide empty table headers.
  - `::: compact`, `::: center`, `::: metrik-schema`, `::: laut-table`, `::: important`
* **Inline Directives**:
  - `⟪...⟫` or `《...》`: Sanskrit/Devanāgarī scholarly brackets.
  - `:sig[...]`: Signal Red (`#ff0000`) emphasis for Devanāgarī text.
  - `:br` or `[[br]]`: Line breaks inside table cells or captions.
  - `:indent` or `[[indent]]`: Inline indentation block.

### NPM Registry & Documentation Links:
* **NPM Package**: [`markdown-it-extensible`](https://www.npmjs.com/package/markdown-it-extensible)
* **GitHub Repository**: [`marcodem/markdown-it-extensible`](https://github.com/marcodem/markdown-it-extensible)
* **NPM Registry API Endpoint**: [`https://registry.npmjs.org/markdown-it-extensible/latest`](https://registry.npmjs.org/markdown-it-extensible/latest)

<div id="npm-doc-widget" style="margin-top: 1.5rem; padding: 1rem 1.25rem; background: var(--vp-c-bg-soft, #f1eee7); border-radius: 8px; border: 1px solid var(--color-slate, #48626e);">
  <strong style="font-size: 1.05rem;">📦 NPM Live Package Status (`markdown-it-extensible`)</strong>
  <div id="npm-doc-info" style="margin-top: 0.75rem; font-size: 0.9rem;">
    <button onclick="window.fetchNpmDocs()" style="background: var(--color-slate, #48626e); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500;">Abfragen der neuesten NPM-Dokumentation & Metadaten</button>
  </div>
</div>
