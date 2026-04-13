# Sanskritkurs Payer (VitePress Migration)

This repository contains the migrated and modernized version of the original Sanskrit course by Alois Payer. The content has been algorithmically parsed, cleaned of legacy HTML clutter, and reconstructed into a modern, lightning-fast static documentation site using [VitePress](https://vitepress.dev/).

## 🚀 Setup & Development

When cloning this repository to a new machine, you will notice that dependency folders (like `node_modules`) are missing. This is intentional to ensure cross-platform compatibility and keep the repository clean.

To initialize the project and start working locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/marcodem/sanskritkurs-payer.git
   cd sanskritkurs-payer
   ```

2. **Install Node dependencies:**
   This will download all required VitePress build files matching your current operating system.
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run docs:dev
   ```
   *The interactive course will now be hosted locally, usually at `http://localhost:5173`. Any changes made to the Markdown files will be instantly updated in your browser.*

## 📦 Deployment (Hosting on a Web Server)

To deploy the course to a live web server (such as Apache, Nginx, or any static hosting provider), you do not need to run Node.js on your server. VitePress pre-renders all content into flat, static files.

1. **Build the production files:**
   ```bash
   npm run docs:build
   ```

2. **Locate the output directory:**
   Once the build completes, VitePress generates a distribution folder located at `docs/.vitepress/dist`.

3. **Deploy to production:**
   Simply copy the **contents** of the `docs/.vitepress/dist` folder to the public root directory (e.g., `htdocs` or `public_html`) of your web server. The site is completely static, extremely secure, and requires no database.
