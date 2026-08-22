#set page(
  paper: "a4",
  margin: (x: 15mm, y: 20mm),
  header: align(right)[
    #text(size: 8.5pt, fill: rgb("#48626e"), font: "Noto Sans")[Sanskritkurs Payer (Typst Publishing Engine) • Release v1.7.0]
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
#let dev(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#b22222"), weight: "medium")[#body]
#let sig(body) = text(font: ("Noto Serif Devanagari", "Noto Sans Devanagari"), fill: rgb("#d32f2f"), weight: "bold")[#body]
#let iast(body) = text(font: "Noto Serif", fill: rgb("#03192e"), weight: "medium")[#body]

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
