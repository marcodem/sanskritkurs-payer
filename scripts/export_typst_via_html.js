const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ html: true });

const ROOT = path.join(__dirname, '..');
const EXPORT_DIR = path.join(ROOT, 'dist_exports');

function renderMarkdownContent(rawMarkdown) {
  let body = rawMarkdown.replace(/^---[\s\S]*?---/, '').trim();

  // Convert brackets ⟪...⟫
  body = body.replace(/⟪([^⟫]+)⟫/g, (match, val) => {
    if (/[\u0900-\u097F]/.test(val)) {
      return `<span class="sanskrit-dev">${val}</span>`;
    } else {
      return `<span class="sanskrit-iast">${val}</span>`;
    }
  });

  // Convert sig[...]
  body = body.replace(/(?::sig|sig)\[([^\]]+)\]/g, '<span class="sig">$1</span>');

  let html = md.render(body);

  // Replace /images/ paths
  html = html.replace(/\/images\/([^\s"'()]+)/g, '/docs/public/images/$1');

  return html;
}

function main() {
  const samples = ['lektion01.md', 'lektion15.md'];
  let combinedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>`;

  for (const fname of samples) {
    const fpath = path.join(ROOT, 'docs', 'lektionen', fname);
    if (fs.existsSync(fpath)) {
      const raw = fs.readFileSync(fpath, 'utf-8');
      combinedHtml += `<div class="lesson">${renderMarkdownContent(raw)}</div><hr/>`;
    }
  }
  combinedHtml += `</body></html>`;

  const htmlPath = path.join(EXPORT_DIR, 'sample_typst_input.html');
  fs.writeFileSync(htmlPath, combinedHtml, 'utf-8');

  // Convert HTML to Typst using Pandoc
  const typPath = path.join(EXPORT_DIR, 'sample_typst_converted.typ');
  execSync(`pandoc "${htmlPath}" -f html -t typst -o "${typPath}"`);

  let typContent = fs.readFileSync(typPath, 'utf-8');

  // Inject Typst preamble styling
  const typstPreamble = `#set page(
  paper: "a4",
  margin: (x: 15mm, y: 20mm),
  header: align(right)[
    #text(size: 8.5pt, fill: rgb("#48626e"), font: "Noto Sans")[Sanskritkurs Payer (Typst Layout Engine) • Release v1.7.0]
  ],
  footer: [
    #set align(center)
    #set text(size: 8.5pt, fill: rgb("#48626e"), font: "Noto Sans")
    #context counter(page).display("1 / 1", both: true)
  ]
)

#set text(
  font: ("Noto Serif", "Georgia", "serif"),
  size: 10.2pt,
  lang: "de",
  hyphenate: true,
  fill: rgb("#03192e")
)

#set par(
  justify: true,
  leading: 0.58em,
  spacing: 0.75em
)

#show heading.where(level: 1): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.5em, bottom: 0.3em),
  text(font: "Noto Serif", size: 16pt, weight: "bold", fill: rgb("#03192e"))[#it.body]
)

#show heading.where(level: 2): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.4em, bottom: 0.2em),
  text(font: "Noto Serif", size: 13pt, weight: "bold", fill: rgb("#241500"))[#it.body]
)

#show heading.where(level: 3): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.3em, bottom: 0.2em),
  text(font: "Noto Serif", size: 11pt, weight: "bold", fill: rgb("#48626e"))[#it.body]
)

// Scholarly Synthesis Styling
#let dev(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#b22222"), weight: "medium")[#body]
#let sig(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#d32f2f"), weight: "bold")[#body]
#let iast(body) = text(font: "Noto Serif", fill: rgb("#03192e"), weight: "medium")[#body]
#let blockquote(body) = block(fill: rgb("#f8fafc"), stroke: (left: 4pt + rgb("#03192e")), inset: (x: 12pt, y: 10pt), radius: (right: 4pt), width: 100%, body)
#let horizontalrule = line(length: 100%, stroke: 0.5pt + rgb("#cbd5e1"))

`;

  // Custom replacements for HTML span classes converted to Typst
  typContent = typContent.replace(/#\[([^\n\]]+)\]\{\.sanskrit-dev\}/g, '#dev[$1]');
  typContent = typContent.replace(/#\[([^\n\]]+)\]\{\.sig\}/g, '#sig[$1]');
  typContent = typContent.replace(/#\[([^\n\]]+)\]\{\.sanskrit-iast\}/g, '#iast[$1]');
  typContent = typContent.replace(/#\[([^\n\]]+)\]\{\.center\}/g, '#align(center)[$1]');
  typContent = typContent.replace(/#\[([^\n\]]+)\]\{\.grammar-box\}/g, '#block(fill: rgb("#f8fafc"), stroke: (left: 4pt + rgb("#03192e")), inset: 10pt)[$1]');

  fs.writeFileSync(typPath, typstPreamble + typContent, 'utf-8');
  console.log("Wrote typst file successfully.");
}

main();
