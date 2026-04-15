# Research Summary: Interaction, Layout & i18n (v1.1)

## 1. Interaction: Interactive Quiz Modules
- **Selected Library**: `@matinfo/vitepress-plugin-quiz`
- **Why**: Specialized for VitePress, clean Markdown syntax (`:::quiz`), supports hydration safe interactivity.
- **Key Features**: Single/Multiple Choice, immediate feedback, persistence.

## 2. Layout: Wide-Mode Toggle
- **Implementation**: Custom Vue component in the `nav-bar-content-after` slot of the default theme.
- **State Management**: `ref` + `localStorage` for persistence.
- **Styling**: Toggles a `.vp-wide-mode` class on the root element, overriding `--vp-layout-max-width` and `--vp-content-width`.

## 3. i18n: Multi-language Support
- **Structure**: Root `/` for German, sub-directory `/en/` for English.
- **Configuration**: Native `locales` setting in `config.mjs` for separate sidebars, navbars, and metadata.
- **Switching**: Automatic language selector in the VitePress navbar.

## 4. Technical Constraints
- **Client-Side Only**: Layout persistence must run in `onMounted` to avoid SSR mismatches.
- **Dependency**: Requires `npm install vitepress-plugin-quiz`.
