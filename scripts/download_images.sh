#!/usr/bin/env bash
set -euo pipefail

BASE="http://www.payer.de/sanskritkurs"
DIR="sanskritkurs"

cd "$DIR"

echo "Extrahiere Bild-Referenzen aus ./*.htm …"

# Alle src="...": Werte ziehen, auf Bild-Endungen filtern, sortieren, deduplizieren
imgs=$(
  grep -RhoE 'src="[^"]+"' ./*.htm \
  | sed -E 's/^src="|"$//g' \
  | sed -E 's/[?#].*$//g' \
  | grep -Evi '^(https?:|data:|mailto:|javascript:|#)' \
  | grep -Ei '\.(jpg|jpeg|png|gif|svg)$' \
  | sort -u
)

echo "Gefundene Bilder: $(echo "$imgs" | wc -l | tr -d ' ')"

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  mkdir -p "$(dirname "$f")"
  if [[ -f "$f" ]]; then
    echo "Überspringe (existiert): $f"
    continue
  fi
  echo "Lade $f"
  curl -fsSL "$BASE/$f" -o "$f" || echo "WARN: konnte nicht laden: $BASE/$f" >&2
done <<< "$imgs"

echo "Fertig."
