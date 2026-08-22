const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EXPORT_DIR = path.join(ROOT, 'dist_exports');

const TYPST_PREAMBLE = `#set page(
  paper: "a4",
  margin: (x: 18mm, y: 20mm),
  header: align(right)[
    #text(size: 8.5pt, fill: rgb("#48626e"), font: "Noto Sans")[Sanskritkurs Payer • Release v1.7.0]
  ],
  footer: [
    #set align(center)
    #set text(size: 8.5pt, fill: rgb("#48626e"), font: "Noto Sans")
    #context counter(page).display("1 / 1", both: true)
  ]
)

#set text(
  font: ("Noto Serif", "Georgia", "serif"),
  size: 10pt,
  lang: "de",
  hyphenate: true,
  fill: rgb("#03192e")
)

#set par(
  justify: true,
  leading: 0.55em,
  spacing: 0.7em
)

// Scholarly Synthesis Design System Tokens
#let dev(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#b22222"), weight: "medium")[#body]
#let sig(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#d32f2f"), weight: "bold")[#body]
#let iast(body) = text(font: "Noto Serif", fill: rgb("#03192e"), weight: "medium")[#body]

#let grammarbox(body) = block(
  fill: rgb("#f8fafc"),
  stroke: (left: 3.5pt + rgb("#03192e")),
  inset: (x: 12pt, y: 10pt),
  radius: (right: 3pt),
  width: 100%,
  body
)

#let indentbox(body) = block(
  inset: (left: 1.5em),
  width: 100%,
  body
)

#show heading.where(level: 1): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.5em, bottom: 0.3em),
  text(font: "Noto Serif", size: 15pt, weight: "bold", fill: rgb("#03192e"))[#it.body]
)

#show heading.where(level: 2): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.4em, bottom: 0.2em),
  text(font: "Noto Serif", size: 12.5pt, weight: "bold", fill: rgb("#241500"))[#it.body]
)

#show heading.where(level: 3): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.3em, bottom: 0.2em),
  text(font: "Noto Serif", size: 10.5pt, weight: "bold", fill: rgb("#48626e"))[#it.body]
)
`;

function processMarkdown(rawMd) {
  let lines = rawMd.replace(/^---[\s\S]*?---/, '').trim().split('\n');
  let out = [];

  let inCenter = false;
  let inGrammarBox = false;
  let inMedia = false;
  let inIndent = false;

  for (let line of lines) {
    let trimmed = line.trim();

    // Container handling
    if (trimmed.startsWith('::: center')) {
      inCenter = true;
      out.push('#align(center)[');
      continue;
    } else if (trimmed.startsWith('::: grammar-box')) {
      inGrammarBox = true;
      out.push('#grammarbox[');
      continue;
    } else if (trimmed.startsWith('::: media')) {
      inMedia = true;
      out.push('#align(center)[');
      continue;
    } else if (trimmed.startsWith('::: indent')) {
      inIndent = true;
      out.push('#indentbox[');
      continue;
    } else if (trimmed === ':::') {
      if (inCenter || inGrammarBox || inMedia || inIndent) {
        inCenter = false;
        inGrammarBox = false;
        inMedia = false;
        inIndent = false;
        out.push(']');
      }
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      out.push(`= ${trimmed.slice(2).trim()}`);
      continue;
    } else if (trimmed.startsWith('## ')) {
      out.push(`== ${trimmed.slice(3).trim()}`);
      continue;
    } else if (trimmed.startsWith('### ')) {
      out.push(`=== ${trimmed.slice(4).trim()}`);
      continue;
    }

    // Images
    let imgMatch = trimmed.match(/!\[(.*?)\]\(\/images\/([^)]+)\)/);
    if (imgMatch) {
      out.push(`#image("/docs/public/images/${imgMatch[2]}", width: 35%)`);
      continue;
    }

    // Replace ⟪...⟫
    trimmed = trimmed.replace(/⟪([^⟫]+)⟫/g, (m, val) => {
      if (/[\u0900-\u097F]/.test(val)) {
        return `#dev[${val}]`;
      } else {
        return `#iast[${val}]`;
      }
    });

    // Replace :sig[...] or sig[...]
    trimmed = trimmed.replace(/(?::sig|sig)\[([^\]]+)\]/g, '#sig[$1]');

    // Replace unwrapped Devanagari
    trimmed = trimmed.replace(/([\u0900-\u097F\u0966-\u096F\u0901-\u0903]+)/g, '#dev[$1]');

    // Replace double #dev[#dev[...]]
    trimmed = trimmed.replace(/#dev\[#dev\[([^\]]+)\]\]/g, '#dev[$1]');

    // Replace links [Details](/licenses#lekt0102) -> (Bildquelle: Details)
    trimmed = trimmed.replace(/\(Bildquelle:\s*\[Details\]\([^)]+\)\)/g, '(Bildquelle: Details)');
    trimmed = trimmed.replace(/\[Details\]\(\/licenses#([^)]+)\)/g, 'Details');

    // Bold **text** -> *text*
    trimmed = trimmed.replace(/\*\*([^*]+)\*\*/g, '*$1*');

    // Bullet list * item -> - item
    if (trimmed.startsWith('* ')) {
      trimmed = '- ' + trimmed.slice(2);
    }

    // If inside verse center block, append \ to force line breaks in Typst
    if (inCenter && trimmed.length > 0) {
      if (!trimmed.endsWith('\\') && !trimmed.startsWith('=') && !trimmed.startsWith(':::')) {
        trimmed += ' \\';
      }
    }

    out.push(trimmed);
  }

  return out.join('\n');
}

function main() {
  const fpath = path.join(ROOT, 'docs', 'lektionen', 'lektion01.md');
  const raw = fs.readFileSync(fpath, 'utf-8');

  let typContent = TYPST_PREAMBLE + '\n\n' + processMarkdown(raw);

  const typPath = path.join(EXPORT_DIR, 'sample_typst_fixed.typ');
  fs.writeFileSync(typPath, typContent, 'utf-8');
  console.log("Wrote sample_typst_fixed.typ successfully.");
}

main();
