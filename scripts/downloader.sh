#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://www.payer.de/sanskritkurs"
TARGET_DIR="sanskritkurs"

mkdir -p "$TARGET_DIR"

echo "Lade Sanskritkurs-Dateien nach ./$TARGET_DIR ..."

# Hilfsfunktion: curl mit sinnvoller Fehlerbehandlung
fetch_file() {
  local url="$1"
  local out="$2"

  echo "  -> $out"
  # -f: Fehler bei HTTP != 2xx, -S: Fehler anzeigen, -L: Redirects folgen
  # -o: Zieldatei
  if ! curl -fsSL "$url" -o "$out"; then
    echo "     WARNUNG: Download fehlgeschlagen: $url" >&2
  fi
}

########################
# Schriftübungen 01–11 #
########################
echo "Schriftübungen (schrift01.htm – schrift11.htm):"

for i in $(seq -w 1 11); do
  file="schrift${i}.htm"
  url="${BASE_URL}/${file}"
  out="${TARGET_DIR}/${file}"
  fetch_file "$url" "$out"
done

########################
# Lektionen 01–61      #
########################
echo "Lektionen (lektion01.htm – lektion61.htm):"

for i in $(seq -w 1 61); do
  file="lektion${i}.htm"
  url="${BASE_URL}/${file}"
  out="${TARGET_DIR}/${file}"
  fetch_file "$url" "$out"
done

##########################################
# (Optional) Übungs-Lösungen uebung01... #
##########################################
echo "Optionale Übungs-Lösungen (uebung01.htm – uebung60.htm):"

for i in $(seq -w 1 60); do
  file="uebung${i}.htm"
  url="${BASE_URL}/${file}"
  out="${TARGET_DIR}/${file}"
  fetch_file "$url" "$out"
done

echo "Fertig. Dateien liegen in ./$TARGET_DIR"
