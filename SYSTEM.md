# System Architecture & Academic Boilerplate

This document outlines the underlying architecture of this project. While currently populated with the **Alois Payer Sanskrit Course**, this repository is structurally designed as a **highly generic, reusable Academic Course Framework** built on top of [VitePress](https://vitepress.dev/).

## 🧩 1. The Architecture: Decoupling Content from Engine

The system is strictly divided into two distinct layers. This decoupling allows the underlying engine to be entirely agnostic to the subject matter it hosts.

### A. The Content Layer (Payer-Specific)
These components are exclusively tailored to the current Sanskrit course and can be safely deleted or replaced without breaking the platform:
- **`docs/lektionen/*.md`**: The actual course material written in Markdown.
- **`scripts/convert.js`**: A one-time data ingestion script used to algorithmically scrape, clean, and convert Alois Payer's 2008 HTML files into modern Markdown.
- **`docs/.vitepress/config.mjs`**: The configuration file that defines the course title ("Sanskritkurs") and hardcodes the sidebar navigation links.

### B. The Engine Layer (The Universal Boilerplate)
This is the valuable, reusable machinery that powers the website:
- **Smart Accordion Sidebar (`.vitepress/theme/index.mjs`)**: A custom-engineered mechanism that overrides standard Vue.js behaviors to create a buttery-smooth, auto-closing accordion navigation. It ensures only the active lesson folder remains open, removing clutter for students.
- **Scholarly Typography (`.vitepress/theme/custom.css`)**: A meticulously balanced academic UI design. It enforces high-contrast reading, optimized line heights for long-form text, and leverages scholarly fonts (like "Source Serif 4" and "Inter") to flawlessly render complex diacritics and scientific notations.
- **High-Speed Static Pipeline**: The pre-configured Node ecosystem (`package.json`) that processes local development (`npm run docs:dev`) and compiles the static production build (`npm run docs:build`) for serverless deployment.

## ✨ 2. Rich Markdown Capabilities (Vue.js Integration)

Because VitePress uses Vue-powered Markdown, the content files are not limited to static text. The platform natively supports advanced, interactive course features:
- **Vue Component Injection**: You can write or import custom interactive widgets (e.g., `<Tooltip text="Definition">`, `<QuizWidget>`, or `<AudioPlayer>`) and inject them directly into the Markdown files as if they were HTML tags.
- **Custom Containers**: Built-in VitePress block alerts (e.g., `::: tip`, `::: warning`) for highlighting rules or grammar exceptions instantly.
- **Raw HTML & CSS**: Complete freedom to drop `<span class="highlight">` elements anywhere inside the Markdown for absolute layout control.

## 🚀 3. Reusability: Creating a New Course

Because of this architectural separation, transforming this repository into a completely different course (e.g., "Advanced Mathematics" or "Photography Basics") takes less than 5 minutes:

1. **Mark as Template**: In your GitHub Repository Settings, check the box **"Template repository"**. This allows you to stamp out completely fresh, independent clones of this engine on GitHub.
2. **Clear Content**: Delete all `.md` files inside `docs/lektionen/` and delete the `scripts/` folder.
3. **Rebrand Configuration**: Open `docs/.vitepress/config.mjs` and change the project title and navigation links.
4. **Write**: Start typing your new content into fresh Markdown files.

The new project will inherit the exact same intelligent sidebar, academic styling, and lightning-fast deployment pipeline without any further setup.
