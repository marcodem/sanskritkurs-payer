#!/usr/bin/env python3
import os
import re
import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TYPST_HEADER = r"""
#set page(
  paper: "a4",
  margin: (x: 15mm, y: 20mm),
  header: align(right)[
    #text(size: 8pt, fill: rgb("#48626e"), font: "Noto Sans")[Sanskritkurs Payer (Typst Layout-Probe) • Release v1.7.0]
  ],
  footer: [
    #set align(center)
    #set text(size: 8pt, fill: rgb("#48626e"), font: "Noto Sans")
    #counter(page).display("1 / 1", both: true)
  ]
)

#set text(
  font: ("Noto Serif", "Georgia", "serif"),
  size: 10.5pt,
  lang: "de",
  hyphenate: true,
  fill: rgb("#03192e")
)

#set par(
  justify: true,
  leading: 0.6em,
  spacing: 0.8em
)

// Styling rules
#show heading.where(level: 1): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.6em),
  margin: (top: 1.2em, bottom: 0.6em),
  text(font: "Noto Serif", size: 16pt, weight: "bold", fill: rgb("#03192e"))[#it.body]
)

#show heading.where(level: 2): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.4em),
  margin: (top: 0.9em, bottom: 0.4em),
  text(font: "Noto Serif", size: 13pt, weight: "bold", fill: rgb("#241500"))[#it.body]
)

#show heading.where(level: 3): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.3em),
  margin: (top: 0.7em, bottom: 0.3em),
  text(font: "Noto Serif", size: 11pt, weight: "bold", fill: rgb("#48626e"))[#it.body]
)

// Helper functions for Devanagari, IAST and Grammar Boxes
#let dev(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#b22222"), weight: "medium")[#body]
#let sig(body) = text(fill: rgb("#d32f2f"), weight: "bold")[#body]
#let iast(body) = text(font: "Noto Serif", fill: rgb("#03192e"), weight: "medium")[#body]

#let gbox(body) = block(
  fill: rgb("#f8fafc"),
  stroke: (left: 3.5pt + rgb("#03192e")),
  inset: (x: 10pt, y: 8pt),
  radius: (right: 4pt),
  margin: (y: 0.6em),
  width: 100%,
  body
)
"""

def md_to_typst(md_content: str) -> str:
  lines = md_content.splitlines()
  out = []
  in_grammar_box = False
  grammar_box_lines = []

  for line in lines:
    # Handle YAML frontmatter
    if line.startswith("---") or line.startswith("title:") or line.startswith("subtitle:"):
      continue

    # Container handling
    if line.strip().startswith("::: grammar-box") or line.strip().startswith(":::: grammar-box"):
      in_grammar_box = True
      grammar_box_lines = []
      continue
    elif line.strip().startswith(":::") or line.strip().startswith("::::"):
      if in_grammar_box:
        in_grammar_box = False
        content = "\n".join(grammar_box_lines)
        out.append(f"#gbox[\n{content}\n]")
      continue

    if in_grammar_box:
      grammar_box_lines.append(line)
      continue

    # Headings
    if line.startswith("# "):
      out.append(f"= {line[2:].strip()}")
      continue
    elif line.startswith("## "):
      out.append(f"== {line[3:].strip()}")
      continue
    elif line.startswith("### "):
      out.append(f"=== {line[4:].strip()}")
      continue

    # Convert Markdown bold **text** to Typst strong *text*
    line = re.sub(r'\*\*([^*]+)\*\*', r'*\1*', line)

    # Convert brackets ⟪...⟫ to Typst functions #dev[...] or #iast[...]
    def replace_brackets(m):
      val = m.group(1)
      if re.search(r'[\u0900-\u097F]', val):
        return f"#dev[{val}]"
      else:
        return f"#iast[{val}]"

    line = re.sub(r'⟪([^⟫]+)⟫', replace_brackets, line)

    # Convert sig[...] to #sig[...]
    line = re.sub(r'sig\[([^\]]+)\]', r'#sig[\1]', line)

    # Images
    img_match = re.search(r'!\[(.*?)\]\(/images/([^)]+)\)', line)
    if img_match:
      alt, img_file = img_match.groups()
      img_path = ROOT / "docs" / "public" / "images" / img_file
      if img_path.exists():
        line = f'#align(center)[#image("{img_path}", width: 32%)]'

    out.append(line)

  return "\n".join(out)


def main():
  sample_lessons = ["lektion01.md", "lektion15.md"]
  typst_body = TYPST_HEADER + "\n\n"

  for fname in sample_lessons:
    fpath = ROOT / "docs" / "lektionen" / fname
    if fpath.exists():
      raw_md = fpath.read_text(encoding="utf-8")
      typst_body += md_to_typst(raw_md) + "\n#pagebreak()\n\n"

  output_typ = ROOT / "dist_exports" / "sample_typst.typ"
  output_pdf = ROOT / "dist_exports" / "Sanskritkurs_Payer_Typst_Sample.pdf"
  output_typ.write_text(typst_body, encoding="utf-8")

  print(f"Wrote {output_typ}")

if __name__ == "__main__":
  main()
