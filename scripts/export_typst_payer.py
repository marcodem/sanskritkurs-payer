#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TYPST_PREAMBLE = r"""
#set page(
  paper: "a4",
  margin: (x: 15mm, y: 20mm),
  header: align(right)[
    #text(size: 8.5pt, fill: rgb("#48626e"), font: "Noto Sans")[Sanskritkurs Payer (Typst Rendering Engine) • Release v1.7.0]
  ],
  footer: [
    #set align(center)
    #set text(size: 8.5pt, fill: rgb("#48626e"), font: "Noto Sans")
    #counter(page).display("1 / 1", both: true)
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
#let dev(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#b22222"), weight: "semibold")[#body]
#let sig(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#d32f2f"), weight: "bold")[#body]
#let iast(body) = text(font: "Noto Serif", fill: rgb("#03192e"), weight: "semibold")[#body]

#let grammarbox(body) = block(
  fill: rgb("#f8fafc"),
  stroke: (left: 4pt + rgb("#03192e")),
  inset: (x: 12pt, y: 10pt),
  radius: (right: 4pt),
  margin: (y: 0.8em),
  width: 100%,
  body
)

#let indentbox(body) = block(
  inset: (left: 1.5em),
  margin: (y: 0.6em),
  width: 100%,
  body
)

#let centerbox(body) = align(center)[#block(width: 100%, body)]

#show heading.where(level: 1): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.5em),
  margin: (top: 1.2em, bottom: 0.5em),
  text(font: "Noto Serif", size: 16pt, weight: "bold", fill: rgb("#03192e"))[#it.body]
)

#show heading.where(level: 2): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.4em),
  margin: (top: 0.8em, bottom: 0.4em),
  text(font: "Noto Serif", size: 13pt, weight: "bold", fill: rgb("#241500"))[#it.body]
)

#show heading.where(level: 3): it => block(
  width: 100%,
  stroke: (top: 0.5pt + rgb("#cbd5e1")),
  inset: (top: 0.3em),
  margin: (top: 0.6em, bottom: 0.3em),
  text(font: "Noto Serif", size: 11pt, weight: "bold", fill: rgb("#48626e"))[#it.body]
)
"""

def parse_markdown_to_typst(md_content: str, lesson_num: int) -> str:
    lines = md_content.splitlines()
    out = []
    
    container_stack = []
    
    for line in lines:
        # Skip YAML frontmatter
        if line.startswith("---") or line.startswith("title:") or line.startswith("subtitle:") or line.startswith("lesson_id:") or line.startswith("category:") or line.startswith("status:") or line.startswith("last_reconstructed:"):
            continue

        # Convert brackets ⟪...⟫ to Typst functions #dev[...] or #iast[...]
        def replace_brackets(m):
            val = m.group(1)
            if re.search(r'[\u0900-\u097F]', val):
                return f"#dev[{val}]"
            else:
                return f"#iast[{val}]"

        line = re.sub(r'⟪([^⟫]+)⟫', replace_brackets, line)
        
        # Convert :sig[...] or sig[...] to #sig[...]
        line = re.sub(r' signature:?\[([^\]]+)\]|:sig\[([^\]]+)\]|sig\[([^\]]+)\]', lambda m: f"#sig[{m.group(1) or m.group(2) or m.group(3)}]", line)

        # Convert standalone Devanagari words to #dev[...]
        def wrap_devanagari_words(m):
            val = m.group(0)
            return f"#dev[{val}]"
        
        # Container start/end
        c_match = re.match(r'^:{3,}\s*(\w+)?', line.strip())
        if c_match:
            c_name = c_match.group(1)
            if c_name:
                container_stack.append(c_name)
                if c_name == 'grammar-box':
                    out.append('#grammarbox[')
                elif c_name == 'center':
                    out.append('#centerbox[')
                elif c_name == 'indent':
                    out.append('#indentbox[')
                elif c_name == 'media':
                    out.append('#align(center)[')
            else:
                if container_stack:
                    closing = container_stack.pop()
                    out.append(']')
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

        # Images
        img_match = re.search(r'!\[(.*?)\]\(/images/([^)]+)\)', line)
        if img_match:
            alt, img_file = img_match.groups()
            img_path = ROOT / "docs" / "public" / "images" / img_file
            if img_path.exists():
                line = f'#image("{img_path}", width: 28%)'

        # Devanagari standalone text line conversion
        if re.search(r'[\u0900-\u097F]', line) and not line.startswith('#'):
            # Wrap unwrapped Devanagari text
            line = re.sub(r'([\u0900-\u097F\u0966-\u096F\u0901-\u0903\s॥|]+)', lambda m: f"#dev[{m.group(0).strip()}]" if m.group(0).strip() and not m.group(0).strip().startswith('#') else m.group(0), line)

        out.append(line)

    # Close any open containers
    while container_stack:
        container_stack.pop()
        out.append(']')

    return "\n".join(out)

def main():
    sample_lessons = ["lektion01.md", "lektion15.md"]
    typst_body = TYPST_PREAMBLE + "\n\n"

    for fname in sample_lessons:
        fpath = ROOT / "docs" / "lektionen" / fname
        if fpath.exists():
            num = int(re.search(r'\d+', fname).group(0))
            raw_md = fpath.read_text(encoding="utf-8")
            typst_body += parse_markdown_to_typst(raw_md, num) + "\n#pagebreak()\n\n"

    output_typ = ROOT / "dist_exports" / "sample_typst_payer.typ"
    output_pdf = ROOT / "dist_exports" / "Sanskritkurs_Payer_Typst_Sample.pdf"
    output_typ.write_text(typst_body, encoding="utf-8")
    print(f"Generated {output_typ}")

if __name__ == "__main__":
    main()
