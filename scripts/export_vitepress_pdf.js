const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const MarkdownIt = require('markdown-it');
const container = require('markdown-it-container');
const { PDFDocument, PDFName, PDFString, PDFHexString, PDFNumber } = require('pdf-lib');

const ROOT = path.join(__dirname, '..');
const EXPORT_DIR = path.join(ROOT, 'dist_exports');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const VERSION = PKG.version || '1.7.0';

// Setup MarkdownIt with VitePress-compatible container extensions
const md = new MarkdownIt({ html: true, linkify: true, breaks: false });
['grammar-box', 'note-box', 'media', 'indent', 'deleteme-box', 'center', 'no-header', 'laut-table', 'table-box', 'tip', 'warning', 'important', 'caution', 'details'].forEach(c => {
  md.use(container, c);
});
md.use(container, 'any', {
  validate: function(params) { return true; },
  render: function (tokens, idx) {
    const m = tokens[idx].info.trim().match(/^(\S+)\s*(.*)$/);
    if (tokens[idx].nesting === 1) {
      const cls = m ? m[1] : '';
      return `<div class="custom-block ${cls}">\n`;
    } else {
      return '</div>\n';
    }
  }
});

// Custom inline replacements for Base64 images, Signalrot, and Sanskrit Devanāgarī
function renderMarkdownContent(rawMarkdown, lessonNum) {
  let body = rawMarkdown.replace(/^---[\s\S]*?---\s*/, '');

  // Convert :br to <br> for multi-line table cell inputs
  body = body.replace(/:br/g, '<br>');

  // Unescape HTML entities &gt; and &lt; for blockquotes and angle brackets
  body = body.replace(/^&gt;\s*/gm, '> ');
  body = body.replace(/^&gt;$/gm, '>');
  body = body.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  // Convert Signalrot :sig[...] or sig[...] -> <span class="sig">...</span> (#d32f2f)
  body = body.replace(/:?sig\[([^\]]+)\]/g, '<span class="sig">$1</span>');

  // Single-pass replacement: bracketed ⟪...⟫ (Devanāgarī red / IAST black) and unbracketed Devanāgarī
  body = body.replace(/⟪([^⟫]+)⟫|([\u0900-\u097F\u0966-\u096F\u0901-\u0903]+)/g, (match, bracketed, unbracketed) => {
    if (bracketed !== undefined) {
      if (/[\u0900-\u097F]/.test(bracketed)) {
        return `<span class="sanskrit-dev">${bracketed}</span>`;
      } else {
        return `<span class="sanskrit-iast">${bracketed}</span>`;
      }
    }
    if (unbracketed !== undefined) {
      return `<span class="sanskrit-dev">${unbracketed}</span>`;
    }
    return match;
  });

  let renderedHtml = md.render(body);

  if (typeof lessonNum === 'number') {
    let subIdx = 0;
    renderedHtml = renderedHtml.replace(/<h2([^>]*)>/g, (match, attrs) => {
      return `<h2 id="lektion-${lessonNum}-sub-${subIdx++}"${attrs}>`;
    });
    let h3Idx = 0;
    renderedHtml = renderedHtml.replace(/<h3([^>]*)>/g, (match, attrs) => {
      return `<h3 id="lektion-${lessonNum}-h3-${h3Idx++}"${attrs}>`;
    });
  }

  // Convert image paths (/images/xyz.webp) to self-contained Base64 Data URIs so Playwright & Pandoc render 100% of images reliably
  const publicImgDir = path.join(ROOT, 'docs', 'public', 'images');
  renderedHtml = renderedHtml.replace(/(?:src=["']\/images\/([^"']+)["']|!\[(.*?)\]\(\/images\/([^)]+)\))/g, (match, srcFile, alt, mdFile) => {
    const filename = srcFile || mdFile;
    if (!filename) return match;
    const absPath = path.join(publicImgDir, filename);
    if (fs.existsSync(absPath)) {
      const ext = path.extname(filename).toLowerCase().replace('.', '');
      const mime = ext === 'webp' ? 'image/webp' : (ext === 'png' ? 'image/png' : 'image/jpeg');
      const base64 = fs.readFileSync(absPath).toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;
      if (srcFile) {
        return `src="${dataUri}"`;
      } else {
        return `<img src="${dataUri}" alt="${alt || ''}" style="max-width: 38%; height: auto; display: block; margin: 6px auto 4px auto; border-radius: 4px;" />`;
      }
    }
    return match;
  });

  // Rewrite /licenses#lektXXXX or /licenses links to internal PDF anchors (#lektXXXX or #licenses)
  renderedHtml = renderedHtml.replace(/href=["']\/licenses#([^"']+)["']/g, 'href="#$1"');
  renderedHtml = renderedHtml.replace(/href=["']\/licenses["']/g, 'href="#licenses"');

  return renderedHtml;
}

// Helper to format titles for Table of Contents: strip raw ⟪ ⟫ brackets and render Devanāgarī in Scholarly Red
function formatTocTitle(text) {
  if (!text) return '';
  return text.replace(/⟪([^⟫]+)⟫|([\u0900-\u097F\u0966-\u096F\u0901-\u0903]+)/g, (match, bracketed, unbracketed) => {
    if (bracketed !== undefined) {
      if (/[\u0900-\u097F]/.test(bracketed)) {
        return `<span class="sanskrit-dev">${bracketed}</span>`;
      } else {
        return `<span class="sanskrit-iast">${bracketed}</span>`;
      }
    }
    if (unbracketed !== undefined) {
      return `<span class="sanskrit-dev">${unbracketed}</span>`;
    }
    return match;
  });
}

// Single Source of Truth: Import official project CSS directly from VitePress theme
const customCssPath = path.join(ROOT, 'docs', '.vitepress', 'theme', 'custom.css');
const projectCustomCss = fs.existsSync(customCssPath) ? fs.readFileSync(customCssPath, 'utf-8') : '';

const COMMON_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&display=swap');

/* 1. Official Project Web CSS (Single Source of Truth) */
${projectCustomCss}

/* 2. Print & Publication PDF Overrides for A4 Page Layout */
* {
  box-sizing: border-box;
}

body, html, .vp-doc {
  background-color: #ffffff !important; /* Pure Paper White */
  color: #03192e !important;
  font-family: "Source Serif 4", Georgia, serif !important;
  font-size: 13.5px !important;
  line-height: 1.36 !important;
  margin: 0;
  padding: 0;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  hyphens: auto !important;
  -webkit-hyphens: auto !important;
  text-align: justify !important;
  text-justify: inter-word !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

p, li, div, section, blockquote, article, .grammar-box, .custom-block, .indent {
  font-size: 13.5px !important;
  line-height: 1.36 !important;
  margin-bottom: 0.35rem !important;
}

/* Force block display, static position, and unconstrained height for single-pass multi-page PDF rendering */
html, body, .vp-doc, .VPDoc, .VPContent, main, section, article, div {
  display: block !important;
  position: static !important;
  float: none !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
}

h1, h2, h3, h4 {
  font-family: "Source Serif 4", serif !important;
  color: #03192e !important;
  page-break-after: avoid !important;
  break-after: avoid !important;
  text-align: left !important;
  hyphens: manual !important;
}

h1 {
  font-size: 22px !important;
  border-top: 1px solid #cbd5e1;
  padding-top: 0.5rem !important;
  margin-top: 1.0rem !important;
  margin-bottom: 0.4rem !important;
  page-break-before: always !important;
  break-before: page !important;
}

h2 {
  font-size: 17.5px !important;
  font-weight: 600;
  color: #241500 !important;
  border-top: 1px solid #cbd5e1;
  padding-top: 0.4rem !important;
  margin-top: 0.8rem !important;
  margin-bottom: 0.35rem !important;
  page-break-after: avoid !important;
  break-after: avoid !important;
}

h3 {
  font-size: 15px !important;
  font-weight: 600;
  color: #48626e !important;
  border-top: 1px solid #cbd5e1;
  padding-top: 0.3rem !important;
  margin-top: 0.6rem !important;
  margin-bottom: 0.25rem !important;
  page-break-after: avoid !important;
  break-after: avoid !important;
}

table {
  width: 100% !important;
  border-collapse: collapse !important;
  margin: 0.6rem 0 !important;
  border: 1px solid #94a3b8 !important;
  border-radius: 4px;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

th, td {
  padding: 4px 7px !important;
  border: 1px solid #94a3b8 !important;
  font-size: 12.5px !important;
  line-height: 1.3 !important;
}

th {
  background-color: #f1f5f9 !important;
  font-family: "Inter", sans-serif !important;
  font-weight: 600 !important;
  color: #03192e !important;
}

tr:nth-child(even) {
  background-color: #f8fafc !important;
}

.grammar-box, .custom-block.grammar-box, blockquote {
  background-color: #f8fafc !important;
  border-left: 4px solid #03192e !important;
  padding: 0.5rem 0.75rem !important;
  margin: 0.5rem 0 !important;
  border-radius: 0 4px 4px 0 !important;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  font-size: 13.5px !important;
  line-height: 1.36 !important;
}

.note-box, .custom-block.note-box {
  background-color: #f1eee7 !important;
  border-left: 4px solid #48626e !important;
  padding: 0.5rem 0.75rem !important;
  margin: 0.5rem 0 !important;
  border-radius: 0 4px 4px 0 !important;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  font-size: 13.5px !important;
  line-height: 1.36 !important;
}

.deleteme-box, .custom-block.deleteme-box {
  background-color: #fcf9f2 !important;
  border: 1px dashed #cbd5e1 !important;
  padding: 0.5rem 0.75rem !important;
  margin: 0.5rem 0 !important;
  font-size: 12.5px !important;
}

p:has(+ blockquote), p:has(+ .grammar-box), p:has(+ .note-box), p:has(+ .center), p:has(+ .media), p:has(+ .indent), p:has(+ table), p:has(+ .custom-block) {
  page-break-after: avoid !important;
  break-after: avoid !important;
}

.indent, .custom-block.indent {
  margin-left: 1.8rem !important;
  padding-left: 0.8rem !important;
  border-left: 2px solid #e2e8f0 !important;
  white-space: pre-wrap !important;
  font-size: 14.5px !important;
}

/* Center Container (Prayers, Verses in L1, etc.) */
.center, .custom-block.center {
  width: 100% !important;
  text-align: center !important;
  margin: 0.25rem 0 !important;
  display: block !important;
  clear: both !important;
  white-space: pre-line !important;
  page-break-after: avoid !important;
  break-after: avoid !important;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

.center p, .custom-block.center p {
  text-align: center !important;
  white-space: pre-line !important;
  font-size: 13.5px !important;
  line-height: 1.25 !important;
  margin: 0 auto 0.15rem auto !important;
}

.center .sig, .custom-block.center .sig {
  font-size: 15.5px !important;
  line-height: 1.18 !important;
  display: block !important;
  text-align: center !important;
  margin-top: 0 !important;
  margin-bottom: 0.04rem !important;
  white-space: normal !important;
}

.center .sanskrit-dev, .custom-block.center .sanskrit-dev {
  font-size: 16.5px !important;
  line-height: 1.18 !important;
  font-family: "Sanskrit2003", "Noto Sans Devanagari", serif !important;
}

.media, .custom-block.media {
  display: block !important;
  text-align: center !important;
  margin: 0.25rem auto !important;
  clear: both !important;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  page-break-before: avoid !important;
  break-before: avoid !important;
  width: 100% !important;
}

.media img, .custom-block.media img {
  display: block !important;
  max-width: 28% !important;
  max-height: 160px !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  margin: 0 auto 2px auto !important;
  border-radius: 4px;
}

.media p, .custom-block.media p {
  display: block !important;
  text-align: center !important;
  font-size: 10.5px !important;
  color: #48626e !important;
  margin: 2px auto 0 auto !important;
  line-height: 1.2 !important;
  width: 100% !important;
}

.sig {
  color: #d32f2f !important; /* Signalrot */
  font-weight: bold !important;
  font-style: normal !important;
  font-size: 16px !important;
}

.sanskrit-dev {
  color: #b22222 !important; /* Scholarly Red for Devanāgarī */
  font-style: normal !important;
  font-size: 17px !important; /* Reduced from 19px for cleaner fit */
  font-weight: 600 !important;
  font-family: "Sanskrit2003", "Noto Sans Devanagari", serif !important;
}

.sanskrit-iast {
  color: #03192e !important; /* Black for IAST Transliteration */
  font-style: normal !important;
  font-size: 16px !important;
  font-weight: 600 !important;
}
`;

function buildPageHtml(title, bodyContent, docLang = 'de') {
  return `<!DOCTYPE html>
<html lang="${docLang}">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>${COMMON_CSS}</style>
</head>
<body class="vp-doc">
  ${bodyContent}
</body>
</html>`;
}

async function exportVitePressMedia(lang = 'de') {
  console.log(`📄 Generating pixel-perfect PDF & EPUB for [${lang}] (Version v${VERSION}) directly from Markdown sources...`);
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  const lektionenDir = lang === 'de'
    ? path.join(ROOT, 'docs', 'lektionen')
    : path.join(ROOT, 'docs', lang, 'lektionen');

  if (!fs.existsSync(lektionenDir)) {
    console.log(`⚠️ Lektionen directory not found at: ${lektionenDir}`);
    return;
  }

  const files = fs.readdirSync(lektionenDir)
    .filter(f => f.startsWith('lektion') && f.endsWith('.md'))
    .sort((a, b) => {
      const na = parseInt((a.match(/\d+/) || [0])[0], 10);
      const nb = parseInt((b.match(/\d+/) || [0])[0], 10);
      return na - nb;
    });

  console.log(`Processing ${files.length} authentic Markdown lesson files...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage({ viewport: { width: 1200, height: 1600 } });

  const mergedPdfDoc = await PDFDocument.create();

  // 1. Title Page (Cover)
  const coverHtml = buildPageHtml('Title Page', `
    <div style="padding: 120px 40px 60px; text-align: center;">
      <h1 style="font-size: 46px !important; color: #03192e; margin-bottom: 16px; border: none; padding: 0;">Sanskritkurs Payer</h1>
      <h2 style="font-size: 26px !important; color: #48626e; margin-bottom: 35px; border: none; padding: 0;">Ein vollständiger Lehrgang von Prof. Alois Payer</h2>
      <div style="font-size: 18px; font-weight: bold; color: #241500; margin-bottom: 50px;">Sprachversion: ${lang.toUpperCase()} &bull; Version v${VERSION}</div>
      <hr style="margin: 50px 0; border: 0; border-top: 2px solid #48626e;">
    </div>
  `);
  await page.setContent(coverHtml, { waitUntil: 'load' });
  const coverPdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
  const coverDoc = await PDFDocument.load(coverPdfBuffer);
  const coverPages = await mergedPdfDoc.copyPages(coverDoc, coverDoc.getPageIndices());
  coverPages.forEach(p => mergedPdfDoc.addPage(p));

  // 2. Page 2: Impressum & Legal Copyright Notice
  const impressumHtml = buildPageHtml('Impressum', `
    <div style="padding: 40px 20px;">
      <div style="max-width: 700px; margin: 0 auto; font-size: 16px; line-height: 1.8; border: 1px solid #48626e; padding: 40px; border-radius: 8px; background: #f8fafc;">
        <h3 style="font-size: 24px !important; color: #241500; margin-top: 0; border: none; padding: 0;">Impressum &amp; Urheberrechtshinweis / Copyright Notice</h3>
        <ul style="line-height: 1.8;">
          <li><strong>Originalautor:</strong> Prof. Alois Payer (Tüpfli's Global Village Library)</li>
          <li><strong>Herausgeber &amp; Digitalisierung:</strong> Sanskritkurs Payer Project (GitHub)</li>
          <li><strong>Version:</strong> Release v${VERSION}</li>
          <li><strong>Webmaster &amp; Kontakt:</strong> webmaster@birchville.org</li>
          <li><strong>Lektorat &amp; Mitarbeit:</strong> onboarding@birchville.org</li>
          <li><strong>Open-Source Editor:</strong> https://github.com/marcodem/zentauri</li>
          <li><strong>Lizenz &amp; Quellen:</strong> Vollständiges Quellen- &amp; Lizenzverzeichnis im Anhang am Ende dieses Dokuments</li>
          <li><strong>Dokument-Typ:</strong> Offizielles Release-Artefakt (Sanskritkurs Payer Project)</li>
        </ul>
      </div>
    </div>
  `);
  await page.setContent(impressumHtml, { waitUntil: 'load' });
  const impressumPdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
  const impressumDoc = await PDFDocument.load(impressumPdfBuffer);
  const impressumPages = await mergedPdfDoc.copyPages(impressumDoc, impressumDoc.getPageIndices());
  impressumPages.forEach(p => mergedPdfDoc.addPage(p));

  // Structured bookmark tree
  const topLevelBookmarks = [];
  topLevelBookmarks.push({ title: 'Titelblatt', pageIndex: 0, children: [] });
  topLevelBookmarks.push({ title: 'Impressum & Rechtliches', pageIndex: 1, children: [] });

  // Pre-process lesson metadata and TOC items
  const lessonsData = [];
  const tocItemsList = [];

  for (const filename of files) {
    const filePath = path.join(lektionenDir, filename);
    const rawMarkdown = fs.readFileSync(filePath, 'utf-8');
    const lessonNum = parseInt((filename.match(/\d+/) || [0])[0], 10);

    let displayTitle = `Lektion ${lessonNum}`;
    const subMatch = rawMarkdown.match(/^subtitle:\s*["']?([^"'\n]+)["']?/m);
    if (subMatch && subMatch[1].trim()) {
      displayTitle = `Lektion ${lessonNum}: ${subMatch[1].trim()}`;
    }

    const headingMatches = [...rawMarkdown.matchAll(/^(##|###)\s+(.+)$/gm)];
    const subHeadings = [];
    const children = [];
    let currentH2 = null;

    for (const m of headingMatches) {
      const level = m[1].length;
      const cleanText = m[2].replace(/[*_#]/g, '').trim();
      if (!cleanText || cleanText.length > 80 || cleanText.toLowerCase().includes('inhaltsverzeichnis') || cleanText.toLowerCase().includes('payer')) {
        continue;
      }

      if (level === 2) {
        subHeadings.push(cleanText);
        currentH2 = {
          title: cleanText.replace(/⟪([^⟫]+)⟫/g, '$1').replace(/\s{2,}/g, ' ').trim(),
          pageIndex: 0,
          children: []
        };
        children.push(currentH2);
      } else if (level === 3) {
        const h3Node = {
          title: cleanText.replace(/⟪([^⟫]+)⟫/g, '$1').replace(/\s{2,}/g, ' ').trim(),
          pageIndex: 0,
          children: []
        };
        if (currentH2) {
          currentH2.children.push(h3Node);
        } else {
          children.push(h3Node);
        }
      }
    }

    const htmlContent = renderMarkdownContent(rawMarkdown, lessonNum);
    lessonsData.push({ lessonNum, displayTitle, subHeadings, htmlContent, rawMarkdown, children });

    let subListHtml = '';
    if (subHeadings.length > 0) {
      subListHtml = `<ul style="margin: 3px 0 10px 15px; padding-left: 10px; font-size: 13px; color: #48626e; list-style-type: disc;">` +
        subHeadings.slice(0, 4).map((sh, sidx) => `<li><a href="#lektion-${lessonNum}-sub-${sidx}" style="color: #48626e; text-decoration: none;">${formatTocTitle(sh)}</a></li>`).join('') +
        `</ul>`;
    }

    tocItemsList.push(`<li style="margin-bottom: 10px; page-break-inside: avoid;">
      <a href="#lektion-${lessonNum}" style="color: #03192e; font-weight: bold; font-size: 14px; text-decoration: none;">${formatTocTitle(displayTitle)}</a>
      ${subListHtml}
    </li>\n`);
  }

  const tocPage1Items = tocItemsList.slice(0, 20).join('');
  const tocPage2Items = tocItemsList.slice(20, 40).join('');
  const tocPage3Items = tocItemsList.slice(40).join('');

  // 3. Table of Contents Pages (3 distinct A4 pages to guarantee exact column alignment)
  const tocHtml = buildPageHtml('Inhaltsverzeichnis', `
    <style>
      .toc-page { page-break-after: always; height: 100%; box-sizing: border-box; padding: 10px; }
      .toc-grid { column-count: 2; column-gap: 35px; font-size: 13.5px; line-height: 1.5; list-style: none; padding-left: 0; margin: 0; }
    </style>
    <div class="toc-page">
      <h2 style="font-size: 24px !important; color: #03192e; border-bottom: 2px solid #03192e; padding-bottom: 6px; margin: 0 0 20px 0;">Inhaltsverzeichnis (Lektionen 1 – 20)</h2>
      <ol class="toc-grid">${tocPage1Items}</ol>
    </div>
    <div class="toc-page">
      <h2 style="font-size: 24px !important; color: #03192e; border-bottom: 2px solid #03192e; padding-bottom: 6px; margin: 0 0 20px 0;">Inhaltsverzeichnis (Lektionen 21 – 40)</h2>
      <ol class="toc-grid">${tocPage2Items}</ol>
    </div>
    <div class="toc-page" style="page-break-after: avoid;">
      <h2 style="font-size: 24px !important; color: #03192e; border-bottom: 2px solid #03192e; padding-bottom: 6px; margin: 0 0 20px 0;">Inhaltsverzeichnis (Lektionen 41 – 61)</h2>
      <ol class="toc-grid">${tocPage3Items}</ol>
    </div>
  `);
  await page.setContent(tocHtml, { waitUntil: 'load' });
  const tocPdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
  const tocDoc = await PDFDocument.load(tocPdfBuffer);
  const tocPages = await mergedPdfDoc.copyPages(tocDoc, tocDoc.getPageIndices());
  tocPages.forEach(p => mergedPdfDoc.addPage(p));
  topLevelBookmarks.push({ title: 'Inhaltsverzeichnis', pageIndex: 2, children: [] });

  // 4. Render each lesson into PDF, record EXACT start page index, and merge into master PDF
  let fullEpubBodyHtml = coverHtml + impressumHtml + tocHtml;

  for (const item of lessonsData) {
    const startPageIndex = mergedPdfDoc.getPageCount();
    item.startPageIndex = startPageIndex;
    const cleanBookmarkTitle = item.displayTitle.replace(/⟪([^⟫]+)⟫/g, '$1').replace(/\s{2,}/g, ' ').trim();

    const wrappedContent = `<div id="lektion-${item.lessonNum}" class="lesson-container">${item.htmlContent}</div>`;
    const lessonPageHtml = buildPageHtml(item.displayTitle, wrappedContent);
    fullEpubBodyHtml += `<div id="lektion-${item.lessonNum}" class="lesson-break" style="page-break-before: always;">${item.htmlContent}</div>`;

    await page.setViewportSize({ width: 794, height: 1123 });
    await page.emulateMedia({ media: 'print' });
    await page.setContent(lessonPageHtml, { waitUntil: 'load' });

    // Measure exact page offset of each h2 and h3 heading inside this lesson
    const headingOffsets = await page.evaluate(() => {
      const res = [];
      const nodes = document.querySelectorAll('h2[id], h3[id]');
      nodes.forEach(node => {
        const rect = node.getBoundingClientRect();
        res.push({
          id: node.id,
          top: rect.top
        });
      });
      return res;
    });

    const lessonPdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size: 10px; font-family: sans-serif; width: 100%; text-align: right; padding-right: 15mm; color: #48626e;">Sanskritkurs Payer (${lang.toUpperCase()}) &bull; Release v${VERSION}</div>`,
      footerTemplate: `<div style="font-size: 10px; font-family: sans-serif; width: 100%; text-align: center; color: #48626e;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
    });

    const lessonDoc = await PDFDocument.load(lessonPdfBuffer);
    const lessonPageCount = lessonDoc.getPageCount();

    const children = (item.children || []).map((ch, idx) => {
      const h2Offset = headingOffsets.find(h => h.id === `lektion-${item.lessonNum}-sub-${idx}`);
      const pageOffset = h2Offset ? Math.max(0, Math.floor(h2Offset.top / 1123)) : 0;
      const h2PageIndex = Math.min(startPageIndex + pageOffset, startPageIndex + lessonPageCount - 1);

      return {
        title: ch.title,
        pageIndex: h2PageIndex,
        children: (ch.children || []).map((h3, h3idx) => {
          const h3Offset = headingOffsets.find(h => h.id === `lektion-${item.lessonNum}-h3-${h3idx}`);
          const h3PageOffset = h3Offset ? Math.max(0, Math.floor(h3Offset.top / 1123)) : 0;
          const h3PageIndex = Math.min(startPageIndex + h3PageOffset, startPageIndex + lessonPageCount - 1);
          return {
            title: h3.title,
            pageIndex: h3PageIndex
          };
        })
      };
    });

    topLevelBookmarks.push({
      title: cleanBookmarkTitle,
      pageIndex: startPageIndex,
      children: children
    });

    const copiedPages = await mergedPdfDoc.copyPages(lessonDoc, lessonDoc.getPageIndices());
    copiedPages.forEach(p => mergedPdfDoc.addPage(p));
  }

  // 4b. Render licenses.md as Appendix Sektion "Anhang: Quellen- & Lizenzverzeichnis"
  const licPath = lang === 'de' ? path.join(ROOT, 'docs', 'licenses.md') : path.join(ROOT, 'docs', lang, 'licenses.md');
  if (fs.existsSync(licPath)) {
    const licRaw = fs.readFileSync(licPath, 'utf-8');
    const licStartPageIndex = mergedPdfDoc.getPageCount();
    topLevelBookmarks.push({ title: 'Anhang: Quellen- & Lizenzverzeichnis', pageIndex: licStartPageIndex, children: [] });

    const licHtmlContent = renderMarkdownContent(licRaw, 'licenses');
    const licWrapped = `<div id="licenses" class="lesson-container">${licHtmlContent}</div>`;
    const licPageHtml = buildPageHtml('Quellen- & Lizenzverzeichnis', licWrapped);
    fullEpubBodyHtml += `<div id="licenses" class="lesson-break" style="page-break-before: always;">${licHtmlContent}</div>`;

    await page.setContent(licPageHtml, { waitUntil: 'load' });
    const licPdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size: 10px; font-family: sans-serif; width: 100%; text-align: right; padding-right: 15mm; color: #48626e;">Sanskritkurs Payer (${lang.toUpperCase()}) &bull; Release v${VERSION}</div>`,
      footerTemplate: `<div style="font-size: 10px; font-family: sans-serif; width: 100%; text-align: center; color: #48626e;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
    });

    const licDoc = await PDFDocument.load(licPdfBuffer);
    const copiedPages = await mergedPdfDoc.copyPages(licDoc, licDoc.getPageIndices());
    copiedPages.forEach(p => mergedPdfDoc.addPage(p));
  }

  // 5. Inject 100% Accurate PDF Sidebar Bookmarks and TOC Link Annotations
  const pdfContext = mergedPdfDoc.context;
  const pageRefs = mergedPdfDoc.getPages().map(p => p.ref);

  // Build a lookup map of lessonNum -> startPageIndex
  const lessonToPageIndex = {};
  const hrefToTargetPage = {};

  for (const item of lessonsData) {
    hrefToTargetPage[`#lektion-${item.lessonNum}`] = item.startPageIndex;
    (item.children || []).forEach((ch, idx) => {
      hrefToTargetPage[`#lektion-${item.lessonNum}-sub-${idx}`] = ch.pageIndex;
    });
  }

  // Inject exact clickable PDF Link Annotations on TOC pages using Playwright DOM bounding boxes
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.emulateMedia({ media: 'print' });
  await page.setContent(tocHtml, { waitUntil: 'load' });

  const tocLinkBoxes = await page.evaluate(() => {
    const res = [];
    const pages = document.querySelectorAll('.toc-page');
    pages.forEach((pageEl, tocPageIndex) => {
      const pageRect = pageEl.getBoundingClientRect();
      const links = pageEl.querySelectorAll('a[href^="#lektion-"]');
      links.forEach(a => {
        const rect = a.getBoundingClientRect();
        const href = a.getAttribute('href');
        res.push({
          href: href,
          tocPageIndex: tocPageIndex,
          relLeft: rect.left - pageRect.left,
          relTop: rect.top - pageRect.top,
          width: rect.width,
          height: rect.height,
          pageWidth: pageRect.width || 764,
          pageHeight: pageRect.height || 1083
        });
      });
    });
    return res;
  });

  await browser.close();

  // Group annotations by TOC page (TOC pages start at PDF pageIndex 2)
  const pageAnnotsMap = {};

  for (const box of tocLinkBoxes) {
    const targetPageIndex = hrefToTargetPage[box.href];
    if (typeof targetPageIndex !== 'number') continue;

    const actualPdfPageIndex = 2 + box.tocPageIndex; // TOC pages start at index 2 (after Cover=0, Impressum=1)
    if (actualPdfPageIndex >= mergedPdfDoc.getPageCount()) continue;

    // Convert CSS px inside .toc-page to PDF pt (595.28 x 841.89 pt with 15mm=42.52pt left and 20mm=56.69pt top margins)
    const printAreaWidth = 595.28 - (2 * 42.52); // 510.24 pt
    const printAreaHeight = 841.89 - (2 * 56.69); // 728.51 pt

    const pdfX = 42.52 + (box.relLeft * (printAreaWidth / box.pageWidth));
    const pdfY = 841.89 - 56.69 - (box.relTop * (printAreaHeight / box.pageHeight)) - (box.height * (printAreaHeight / box.pageHeight));
    const pdfW = Math.max(box.width * (printAreaWidth / box.pageWidth), 50);
    const pdfH = Math.max(box.height * (printAreaHeight / box.pageHeight), 10);

    const linkAnnot = pdfContext.obj({
      Type: PDFName.of('Annot'),
      Subtype: PDFName.of('Link'),
      Rect: [pdfX, pdfY, pdfX + pdfW, pdfY + pdfH],
      Dest: [pageRefs[targetPageIndex], PDFName.of('Fit')],
      Border: [0, 0, 0],
    });
    const annotRef = pdfContext.nextRef();
    pdfContext.assign(annotRef, linkAnnot);

    if (!pageAnnotsMap[actualPdfPageIndex]) {
      pageAnnotsMap[actualPdfPageIndex] = [];
    }
    pageAnnotsMap[actualPdfPageIndex].push(annotRef);
  }

  // Assign annotation arrays to corresponding PDF pages
  for (const [pIdxStr, annots] of Object.entries(pageAnnotsMap)) {
    const pIdx = parseInt(pIdxStr, 10);
    const pdfPage = mergedPdfDoc.getPage(pIdx);
    if (pdfPage && annots.length > 0) {
      pdfPage.node.set(PDFName.of('Annots'), pdfContext.obj(annots));
    }
  }

  const outlineDictRef = pdfContext.nextRef();

  function buildOutlineNodes(nodes, parentRef) {
    const refs = nodes.map(() => pdfContext.nextRef());
    let countInSubtree = nodes.length;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeRef = refs[i];
      const validPage = (typeof node.pageIndex === 'number' && node.pageIndex >= 0)
        ? Math.min(node.pageIndex, pageRefs.length - 1)
        : 0;
      const pageRef = pageRefs[validPage];

      const dict = pdfContext.obj({
        Title: PDFHexString.fromText(node.title),
        Parent: parentRef,
        Dest: [pageRef, PDFName.of('Fit')],
      });

      if (i > 0) dict.set(PDFName.of('Prev'), refs[i - 1]);
      if (i < nodes.length - 1) dict.set(PDFName.of('Next'), refs[i + 1]);

      if (node.children && node.children.length > 0) {
        const sub = buildOutlineNodes(node.children, nodeRef);
        countInSubtree += sub.totalCount;
        dict.set(PDFName.of('First'), sub.firstRef);
        dict.set(PDFName.of('Last'), sub.lastRef);
        dict.set(PDFName.of('Count'), PDFNumber.of(node.children.length));
      }

      pdfContext.assign(nodeRef, dict);
    }

    return { firstRef: refs[0], lastRef: refs[refs.length - 1], totalCount: countInSubtree };
  }

  const { firstRef, lastRef, totalCount } = buildOutlineNodes(topLevelBookmarks, outlineDictRef);

  const outlineDict = pdfContext.obj({
    Type: PDFName.of('Outlines'),
    First: firstRef,
    Last: lastRef,
    Count: PDFNumber.of(totalCount),
  });
  pdfContext.assign(outlineDictRef, outlineDict);
  mergedPdfDoc.catalog.set(PDFName.of('Outlines'), outlineDictRef);

  const finalPdfPath = path.join(EXPORT_DIR, `Sanskritkurs_Payer_${lang.toUpperCase()}.pdf`);
  const finalPdfBytes = await mergedPdfDoc.save();
  fs.writeFileSync(finalPdfPath, finalPdfBytes);
  console.log(`✅ Saved publication-grade PDF (${mergedPdfDoc.getPageCount()} pages) with ${totalCount} exact expanded sidebar bookmarks: ${finalPdfPath}`);

  // 6. EPUB Export via Pandoc
  const tmpEpubHtmlPath = path.join(EXPORT_DIR, `temp_epub_${lang}.html`);
  fs.writeFileSync(tmpEpubHtmlPath, fullEpubBodyHtml, 'utf-8');
  const epubPath = path.join(EXPORT_DIR, `Sanskritkurs_Payer_${lang.toUpperCase()}.epub`);
  try {
    execSync(`pandoc "${tmpEpubHtmlPath}" -o "${epubPath}" --toc --metadata title="Sanskritkurs Payer (${lang.toUpperCase()})" --metadata author="Alois Payer" --metadata version="v${VERSION}"`, { stdio: 'inherit' });
    console.log(`✅ Saved EPUB: ${epubPath}`);
  } catch (err) {
    console.log(`⚠️ EPUB conversion warning: ${err.message}`);
  }
}

const targetLang = process.argv[2] || 'de';
exportVitePressMedia(targetLang);
