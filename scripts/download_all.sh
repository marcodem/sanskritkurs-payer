#!/usr/bin/env bash
set -euo pipefail

BASE="http://www.payer.de/sanskritkurs"
DIR="${1:-sanskritkurs}"

: "${WITH_UEBUNG:=1}"     # 1 = uebung01..60 auch laden, 0 = überspringen
: "${WITH_IMAGES:=1}"     # 1 = <img src=...> Assets nachladen
: "${WITH_CSS:=1}"        # 1 = CSS downloaden
: "${WITH_CSS_URLS:=1}"   # 1 = url(...) Assets aus CSS nachladen
: "${RETRY:=5}"
: "${RETRY_DELAY:=1}"

mkdir -p "$DIR"

curl_get() {
  local url="$1"
  local out="$2"
  local tmp="${out}.part"

  mkdir -p "$(dirname "$out")"

  echo "GET  $out"
  if ! curl -fsSL \
      --retry "$RETRY" --retry-delay "$RETRY_DELAY" --retry-all-errors \
      "$url" -o "$tmp"
  then
    echo "WARN: fehlgeschlagen: $url" >&2
    rm -f "$tmp" || true
    return 0
  fi

  mv -f "$tmp" "$out"
}

download_html() {
  echo "== HTML downloaden nach ./$DIR =="

  for i in $(seq -w 1 11); do
    curl_get "$BASE/schrift${i}.htm" "$DIR/schrift${i}.htm"
  done

  for i in $(seq -w 1 61); do
    curl_get "$BASE/lektion${i}.htm" "$DIR/lektion${i}.htm"
  done

  if [[ "$WITH_UEBUNG" == "1" ]]; then
    for i in $(seq -w 1 60); do
      curl_get "$BASE/uebung${i}.htm" "$DIR/uebung${i}.htm"
    done
  else
    echo "== Übungslösungen übersprungen (WITH_UEBUNG=0) =="
  fi
}

extract_img_srcs() {
  # Liest HTML-Dateien unter $DIR und extrahiert relative Bild-src
  grep -RhoE 'src="[^"]+"' "$DIR"/*.htm 2>/dev/null \
    | sed -E 's/^src="|"$//g' \
    | sed -E 's/[?#].*$//g' \
    | grep -Evi '^(https?:|data:|mailto:|javascript:|#)' \
    | grep -Ei '\.(jpg|jpeg|png|gif|svg)$' \
    | sort -u
}

download_images_from_html() {
  [[ "$WITH_IMAGES" == "1" ]] || { echo "== HTML-Bilder übersprungen (WITH_IMAGES=0) =="; return 0; }

  echo "== Bilder aus HTML (<img src=...>) laden =="

  local imgs
  imgs="$(extract_img_srcs || true)"

  local count
  count="$(echo "$imgs" | sed '/^$/d' | wc -l | tr -d ' ')"
  echo "Gefundene HTML-Bilder: $count"

  [[ "$count" == "0" ]] && return 0

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    [[ -f "$DIR/$f" ]] && { echo "SKIP $DIR/$f (existiert)"; continue; }
    curl_get "$BASE/$f" "$DIR/$f"
  done <<< "$imgs"
}

extract_css_hrefs() {
  # extrahiert href="...css" aus HTML, nur relative Pfade
  grep -RhoE 'href="[^"]+"' "$DIR"/*.htm 2>/dev/null \
    | sed -E 's/^href="|"$//g' \
    | sed -E 's/[?#].*$//g' \
    | grep -Evi '^(https?:|data:|mailto:|javascript:|#)' \
    | grep -Ei '\.css$' \
    | sort -u
}

download_css_from_html() {
  [[ "$WITH_CSS" == "1" ]] || { echo "== CSS übersprungen (WITH_CSS=0) =="; return 0; }

  echo "== CSS aus HTML (<link href=...css>) laden =="

  local css
  css="$(extract_css_hrefs || true)"

  local count
  count="$(echo "$css" | sed '/^$/d' | wc -l | tr -d ' ')"
  echo "Gefundene CSS-Dateien: $count"

  [[ "$count" == "0" ]] && return 0

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    [[ -f "$DIR/$f" ]] && { echo "SKIP $DIR/$f (existiert)"; continue; }
    curl_get "$BASE/$f" "$DIR/$f"
  done <<< "$css"
}

css_dirname() {
  # portable dirname-Logik für Pfade ohne Slash
  local p="$1"
  if [[ "$p" == */* ]]; then
    echo "${p%/*}"
  else
    echo "."
  fi
}

normalize_css_url() {
  # Entfernt Quotes, Whitespace, Fragments/Queries; ignoriert data: und absolute URLs
  local u="$1"
  u="${u//\"/}"
  u="${u//\'/}"
  u="$(echo "$u" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
  u="$(echo "$u" | sed -E 's/[?#].*$//g')"
  echo "$u"
}

extract_urls_from_css_file() {
  # Gibt pro Zeile die rohen url(...) Inhalte aus, ohne url( ) Hülle
  # Filtert data: und absolute(s) http(s)
  local cssfile="$1"
  grep -Eoi 'url\\([^)]*\\)' "$cssfile" \
    | sed -E 's/^url\\(|\\)$//g' \
    | tr -d '\r' \
    | sed -E 's/^[[:space:]]+|[[:space:]]+$//g' \
    | grep -Evi '^(data:|https?:|#|$)' \
    || true
}

download_assets_from_css() {
  [[ "$WITH_CSS_URLS" == "1" ]] || { echo "== CSS url(...) Assets übersprungen (WITH_CSS_URLS=0) =="; return 0; }

  echo "== Assets aus CSS url(...) laden =="

  shopt -s nullglob
  local css_files=("$DIR"/*.css "$DIR"/*/*.css "$DIR"/*/*/*.css)
  shopt -u nullglob

  if [[ "${#css_files[@]}" -eq 0 ]]; then
    echo "Keine lokalen CSS-Dateien gefunden (nichts zu tun)."
    return 0
  fi

  local total=0

  for csspath in "${css_files[@]}"; do
    # cssrel: Pfad relativ zu $DIR (z.B. "style/main.css")
    local cssrel="${csspath#"$DIR/"}"
    local cssbase
    cssbase="$(css_dirname "$cssrel")"

    # Extrahiere url(...) Einträge
    while IFS= read -r raw; do
      local u
      u="$(normalize_css_url "$raw")"
      [[ -z "$u" ]] && continue

      # url(...) kann relativ zur CSS liegen
      # Zielpfad lokal: $DIR/<cssbase>/<u> (mit Aufräumen von ./)
      local rel_out
      if [[ "$cssbase" == "." ]]; then
        rel_out="$u"
      else
        rel_out="$cssbase/$u"
      fi

      # Normalisiere ./ im Pfad (ohne realpath-Abhängigkeit)
      rel_out="$(echo "$rel_out" | sed -E 's#(^|/)\./#/#g')"

      # Nichts tun, wenn bereits vorhanden
      if [[ -f "$DIR/$rel_out" ]]; then
        continue
      fi

      total=$((total + 1))
      curl_get "$BASE/$rel_out" "$DIR/$rel_out"
    done < <(extract_urls_from_css_file "$csspath")
  done

  echo "CSS-Assets versucht zu laden: $total"
}

download_html
download_images_from_html
download_css_from_html
download_assets_from_css

echo "Fertig. Achtung: Inhaltsverzeichnis separat per Browser herunterladen."
