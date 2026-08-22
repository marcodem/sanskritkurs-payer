const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EXPORT_DIR = path.join(ROOT, 'dist_exports');

const TYPST_HEADER = `#set page(
  paper: "a4",
  margin: (x: 15mm, y: 20mm),
  header: align(right)[
    #text(size: 8.5pt, fill: rgb("#48626e"), font: "Noto Sans")[Sanskritkurs Payer (Typst Publishing Engine) • Release v1.7.0]
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

// Scholarly Synthesis Design System Tokens
#let dev(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#b22222"), weight: "bold")[#body]
#let sig(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#d32f2f"), weight: "bold")[#body]
#let iast(body) = text(font: "Noto Serif", fill: rgb("#03192e"), weight: "medium")[#body]

#let grammarbox(body) = block(
  fill: rgb("#f8fafc"),
  stroke: (left: 4pt + rgb("#03192e")),
  inset: (x: 12pt, y: 10pt),
  radius: (right: 4pt),
  width: 100%,
  body
)

#let indentbox(body) = block(
  inset: (left: 1.5em),
  width: 100%,
  body
)

#let centerbox(body) = align(center)[#block(width: 100%, body)]

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
`;

function convertMarkdownToTypst(rawMarkdown) {
  let text = rawMarkdown.replace(/^---[\s\S]*?---/, '').trim();

  // Headings
  text = text.replace(/^# (.*)$/gm, '= $1');
  text = text.replace(/^## (.*)$/gm, '== $1');
  text = text.replace(/^### (.*)$/gm, '=== $1');

  // Convert list items starting with * to -
  text = text.replace(/^\*\s+/gm, '- ');

  // Convert ::: center ... :::
  text = text.replace(/:::\s*center\s*([\s\S]*?):::/g, (match, inner) => {
    return '\n#centerbox[\n' + inner.trim() + '\n]\n';
  });

  // Convert ::: grammar-box ... :::
  text = text.replace(/:::\s*grammar-box\s*([\s\S]*?):::/g, (match, inner) => {
    return '\n#grammarbox[\n' + inner.trim() + '\n]\n';
  });

  // Convert ::: indent ... :::
  text = text.replace(/:::\s*indent\s*([\s\S]*?):::/g, (match, inner) => {
    return '\n#indentbox[\n' + inner.trim() + '\n]\n';
  });

  // Convert ::: media ... :::
  text = text.replace(/:::\s*media\s*([\s\S]*?):::/g, (match, inner) => {
    return '\n#centerbox[\n' + inner.trim() + '\n]\n';
  });

  // Convert images ![](/images/xyz.webp)
  text = text.replace(/!\[(.*?)\]\(\/images\/([^)]+)\)/g, (match, alt, imgFile) => {
    return `#image("/docs/public/images/${imgFile}", width: 28%)`;
  });

  // Convert brackets ⟪...⟫
  text = text.replace(/⟪([^⟫]+)⟫/g, (match, val) => {
    if (/[\u0900-\u097F]/.test(val)) {
      return `#dev[${val}]`;
    } else {
      return `#iast[${val}]`;
    }
  });

  // Convert sig[...]
  text = text.replace(/(?::sig|sig)\[([^\]]+)\]/g, '#sig[$1]');

  // Convert standalone Devanagari words (only if not already wrapped in #dev or #sig)
  text = text.replace(/#dev\[[^\]]+\]|#sig\[[^\]]+\]|([\u0900-\u097F\u0966-\u096F\u0901-\u0903]+)/g, (match, unwrapped) => {
    if (unwrapped) {
      return `#dev[${unwrapped}]`;
    }
    return match;
  });

  // Convert Markdown links [text](url) -> #link("url")[text]
  text = text.replace(/\[([^\]]+)\]\(\/licenses#([^)]+)\)/g, '#link("#$2")[$1]');
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '#link("$2")[$1]');

  // Clean bold syntax **bold** -> *bold*
  text = text.replace(/\*\*([^*]+)\*\*/g, '*$1*');

  return text;
}

function main() {
  const samples = ['lektion01.md', 'lektion15.md'];
  let typstContent = TYPST_HEADER + "\n\n";

  for (const fname of samples) {
    const fpath = path.join(ROOT, 'docs', 'lektionen', fname);
    if (fs.existsSync(fpath)) {
      const raw = fs.readFileSync(fpath, 'utf-8');
      typstContent += convertMarkdownToTypst(raw) + "\n#pagebreak()\n\n";
    }
  }

  const typPath = path.join(EXPORT_DIR, 'sample_typst_direct.typ');
  fs.writeFileSync(typPath, typstContent, 'utf-8');
  console.log("Wrote sample_typst_direct.typ successfully.");
}

main();
