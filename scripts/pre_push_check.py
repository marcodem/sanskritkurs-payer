#!/usr/bin/env python3
"""
pre_push_check.py — Qualitätsprüfung vor git push

Zwei Scope-Modi:
  --scope=diff  (Standard) Nur Dateien die seit origin/main geändert wurden
  --scope=all   Alle Markdown-Dateien im Projekt

Checks:
  GLOBAL  (immer):    YAML-Frontmatter, Build-Gate
  SCOPED  (auf diff): Zero-HTML, Platzhalter, Fremdzeichen in falschen Sprachen,
                       Bildunterschriften-Format, Lizenzen-Vollständigkeit

Gibt Exit-Code 0 bei Erfolg, 1 bei Fehlern zurück.

Usage:
  python3 scripts/pre_push_check.py              # scope=diff, kein build
  python3 scripts/pre_push_check.py --build      # inkl. npm run docs:build
  python3 scripts/pre_push_check.py --scope=all  # alle Files
  python3 scripts/pre_push_check.py --fix        # reparierbare Fehler automatisch fixen
  python3 scripts/pre_push_check.py --strict     # bricht ab wenn docs/ oder scripts/ uncommitted changes haben
"""

import os, re, sys, subprocess, unicodedata
from pathlib import Path

ROOT = Path(__file__).parent.parent

# ── Konfiguration ─────────────────────────────────────────────────────────────

# Sprachen mit lateinischer Schrift → Kyrillisch wäre Fehler
LATIN_LANGS  = {'en', 'it', 'es', 'fr', 'la', 'rm', 'ro', 'de'}
# Sprachen mit kyrillischer Schrift
CYRILLIC_LANGS = {'bg', 'ru', 'uk'}
# Sprachen mit Indic-Schrift
INDIC_LANGS  = {'hi', 'ta', 'pa'}

# Sprach-Präfix → erwartete Schriftsysteme
LANG_SCRIPTS = {
    **{l: 'latin'    for l in LATIN_LANGS},
    **{l: 'cyrillic' for l in CYRILLIC_LANGS},
    **{l: 'indic'    for l in INDIC_LANGS},
}

# Platzhalter die auf fehlgeschlagene Übersetzung hinweisen
PLACEHOLDER_PATTERNS = [
    r'DEVA_\d+',          # Devanāgarī-Platzhalter aus lan_translate.py
    r'\bTODO\b',
    r'\bPLACEHOLDER\b',
    r'⟨DEVA_\d+⟩',
    r'<!--\s*TODO:\s*Fallback\s*translation\s*-->',
]

# Fremde Grammatik-Begriffe in Nicht-DE Dateien
FORBIDDEN_FOREIGN_GRAMMAR_TERMS = [
    r'\bMaskulinum\b', r'\bFemininum\b', r'\bIndikativ Präsens\b', r'\bImperfekt\b',
    r'\bWortbildung\b', r'\bAuslautendes\b', r'\bStammvokal\b', r'\bPassivsatz\b'
]

# ── Pipeline-Logik-Invarianten-Prüfung ──────────────────────────────────────────

def check_pipeline_logic_invariants():
    """Wahrt die System-Invarianten der Übersetzungspipeline gegen versehentliche Code-Regressions."""
    errors = []
    
    # 1. Prüfe run_all_translations.sh auf unerwünschtes --force
    runner_script = ROOT / "scripts" / "run_all_translations.sh"
    if runner_script.exists():
        text = runner_script.read_text(encoding="utf-8", errors="ignore")
        if "--force" in text:
            errors.append("run_all_translations.sh enthält verbietenes '--force' Flag! Dies hebelt den TM-Cache aus.")
    
    # 2. Prüfe generate_report.py Import-Integrität
    try:
        sys.path.insert(0, str(ROOT / "scripts"))
        from generate_report import get_top_unfinished_language, get_language_status, get_translation_queue
        top_lang = get_top_unfinished_language()
        if not top_lang:
            errors.append("get_top_unfinished_language() lieferte leeres Ergebnis zurück.")
    except Exception as e:
        errors.append(f"Integritätsfehler in generate_report.py: {e}")

    # 3. Prüfe Lock-Auto-Clearing in lock.py
    try:
        from translation.lock import acquire_nyx_lock, touch_nyx_lock_heartbeat
    except Exception as e:
        errors.append(f"Integritätsfehler in lock.py: {e}")

    return errors

# HTML-Tags die in Markdown nicht erlaubt sind (Zero-HTML Policy)
# Erlaubte Inline-Tags: 'img', 'a' und Kommentare '!--'
_HTML_ALLOWED = frozenset([
    'img', 'a', '!--', '/!--',
])
# Zero-HTML Policy: Alle Block- und Formatierungs-Tags die wir NICHT in .md haben wollen:
_HTML_BLOCK_TAGS = re.compile(
    r'<(?:/?)(?:'
    r'div|p|table|thead|tbody|tr|th|td|ul|ol|li|dl|dt|dd|'
    r'blockquote|pre|h[1-6]|section|article|aside|header|footer|nav|main|'
    r'figure|figcaption|details|summary|form|input|button|select|option|'
    r'iframe|script|style|link|meta|head|body|html|'
    r'font|center|b|i|u|tt|strike|'
    r'br|hr|strong|span|code|em|mark|sub|sup|s|del'
    r')(?:\s[^>]*)?>',
    re.IGNORECASE
)

# ── Hilfsfunktionen ────────────────────────────────────────────────────────────

from translation.session_manager import is_language_completed

def get_finished_languages():
    """Dynamically determine finished languages (136/136 clean files, 0 fallbacks)."""
    finished = {'de'}
    docs_dir = ROOT / "docs"
    for p in docs_dir.iterdir():
        if p.is_dir() and p.name not in ('.vitepress', 'public', 'de'):
            if is_language_completed(p.name):
                finished.add(p.name)
    return finished

FINISHED_LANGS = get_finished_languages()

def get_diff_files():
    """Gibt Liste der seit origin/main geänderten .md-Dateien zurück."""
    try:
        result = subprocess.run(
            ['git', 'diff', '--name-only', '--diff-filter=ACM', 'origin/main..HEAD'],
            capture_output=True, text=True, cwd=ROOT
        )
        files = [
            ROOT / f for f in result.stdout.strip().split('\n')
            if f.endswith('.md') and lang_from_path(ROOT / f) in FINISHED_LANGS
        ]
        return [f for f in files if f.exists()]
    except Exception as e:
        print(f"  ⚠ git diff fehlgeschlagen: {e}")
        return []

def get_all_md_files():
    """Alle .md-Dateien in docs/ ausser docs/lektionen/ (DE ist immutable)."""
    files = []
    for lang_dir in (ROOT / 'docs').iterdir():
        if not lang_dir.is_dir() or lang_dir.name in ('.vitepress', 'public', 'qa', 'lektionen'):
            continue
        for f in lang_dir.rglob('*.md'):
            files.append(f)
    return files

def lang_from_path(path: Path) -> str:
    """Extrahiert Sprachkürzel aus Pfad: docs/ta/lektionen/... → 'ta'"""
    try:
        rel = path.relative_to(ROOT / 'docs')
        parts = rel.parts
        if parts[0] == 'lektionen':
            return 'de'
        return parts[0] if len(parts) > 1 else 'de'
    except ValueError:
        return 'de'

def check_config_files_in_diff():
    """Warnt wenn Config-Dateien im Diff sind → manuelle Review empfohlen."""
    result = subprocess.run(
        ['git', 'diff', '--name-only', 'origin/main..HEAD'],
        capture_output=True, text=True, cwd=ROOT
    )
    config_files = [f for f in result.stdout.strip().split('\n')
                    if any(f.endswith(ext) for ext in ['.mjs', '.css', '.vue', '.ts'])
                    and '.vitepress' in f]
    return config_files

def check_dirty_worktree():
    """Prüft ob in docs/ oder scripts/ uncommitted Änderungen vorliegen, die den Push-Test verfälschen könnten."""
    result = subprocess.run(
        ['git', 'status', '--porcelain', 'docs', 'scripts', 'package.json'],
        capture_output=True, text=True, cwd=ROOT
    )
    if result.stdout.strip():
        return result.stdout.strip().split('\n')
    return []

# ── Checks ────────────────────────────────────────────────────────────────────

def check_yaml_frontmatter(files):
    """Prüft ob YAML-Frontmatter korrekt geparst werden kann."""
    errors = []
    for path in files:
        content = path.read_text(encoding='utf-8', errors='replace')
        if not content.startswith('---'):
            continue
        end = content.find('\n---\n', 4)
        if end == -1:
            errors.append((path, 'Frontmatter nicht geschlossen'))
            continue
        fm = content[4:end]
        
        for i, line in enumerate(fm.split('\n'), 1):
            line_str = line.strip()
            if not line_str or line_str.startswith('#'):
                continue
            if ':' not in line_str:
                errors.append((path, f'Frontmatter Zeile {i}: Kein Doppelpunkt gefunden in: {line_str[:60]}'))
                continue
            
            parts = line_str.split(':', 1)
            key = parts[0].strip()
            val = parts[1].strip()
            
            if not val:
                continue
            
            # Fall A: Wert fängt mit " an
            if val.startswith('"'):
                if not val.endswith('"') or len(val) < 2:
                    errors.append((path, f'Frontmatter Zeile {i} ({key}): Zitierter String (mit ") ist am Ende ungeschlossen oder fehlerhaft: {val[:60]}'))
                    continue
                inner = val[1:-1]
                inner_escaped_clean = inner.replace('\\"', '')
                if '"' in inner_escaped_clean:
                    errors.append((path, f'Frontmatter Zeile {i} ({key}): Zitierter String enthält unmaskierte Anführungszeichen in der Mitte: {val[:60]}'))
                    
            # Fall B: Wert fängt mit ' an
            elif val.startswith("'"):
                if not val.endswith("'") or len(val) < 2:
                    errors.append((path, f'Frontmatter Zeile {i} ({key}): Zitierter String (mit \') ist am Ende ungeschlossen oder fehlerhaft: {val[:60]}'))
                    continue
                inner = val[1:-1]
                inner_escaped_clean = inner.replace("\\'", '')
                if "'" in inner_escaped_clean:
                    errors.append((path, f'Frontmatter Zeile {i} ({key}): Zitierter String enthält unmaskierte einfache Anführungszeichen in der Mitte: {val[:60]}'))
                    
            # Fall C: Unzitierter Wert
            else:
                if '"' in val or "'" in val:
                    errors.append((path, f'Frontmatter Zeile {i} ({key}): Unzitierter Wert enthält Anführungszeichen. String sollte komplett in einfache Anführungszeichen \'...\' gesetzt werden: {val[:60]}'))
                    continue
                if ': ' in val:
                    errors.append((path, f'Frontmatter Zeile {i} ({key}): Unzitierter Wert enthält ": ". String sollte komplett in einfache Anführungszeichen \'...\' gesetzt werden: {val[:60]}'))
                    continue
                if val[0] in ('{', '}', '[', ']', '|', '>', '#', '-', '&', '*', '?'):
                    if val.startswith('[') and val.endswith(']'):
                        continue
                    errors.append((path, f'Frontmatter Zeile {i} ({key}): Unzitierter Wert beginnt mit YAML-Steuerzeichen "{val[0]}". String sollte komplett in einfache Anführungszeichen \'...\' gesetzt werden: {val[:60]}'))
                    continue
    return errors

def check_index_frontmatter_structural(fix=False):
    """Prüft alle index.md Dateien auf gültige englische YAML-Strukturschlüssel und korrekte Sprachpräfixe."""
    errors = []
    valid_keys = {'hero', 'name', 'text', 'tagline', 'actions', 'theme', 'link', 'features', 'title', 'details', 'layout'}
    for index_path in (ROOT / 'docs').glob('**/index.md'):
        if '.vitepress' in index_path.parts:
            continue
        content = index_path.read_text(encoding='utf-8', errors='replace')
        if not content.startswith('---'):
            continue
        parts = content.split('---', 2)
        if len(parts) < 3:
            continue
        fm = parts[1]
        code = index_path.parent.name

        file_invalid_keys = []
        for line in fm.splitlines():
            trimmed = line.strip()
            if not trimmed or trimmed.startswith('layout:'):
                continue
            clean = trimmed[1:].strip() if trimmed.startswith('-') else trimmed
            match = re.match(r'^([^:\s]+):', clean)
            if match:
                key = match.group(1).strip()
                if key not in valid_keys:
                    file_invalid_keys.append(key)

        missing_locale_prefix = False
        if code not in ('docs', 'lektionen', 'index.md'):
            if 'link: /lektionen/lektion01' in fm or 'link: /grammatik' in fm:
                missing_locale_prefix = True

        if file_invalid_keys or missing_locale_prefix:
            if fix:
                sys.path.insert(0, str(ROOT / "scripts"))
                from translation.file_processor import fix_home_links
                repaired = fix_home_links(content, code)
                index_path.write_text(repaired, encoding='utf-8')
                errors.append((index_path, f"[AUTO-FIXED] Ungültige YAML-Schlüssel ({file_invalid_keys}) oder Links repariert"))
            else:
                msg_parts = []
                if file_invalid_keys:
                    msg_parts.append(f"Ungültige/Übersetzte YAML-Schlüssel: {file_invalid_keys}")
                if missing_locale_prefix:
                    msg_parts.append("Fehlendes Sprach-Präfix in link:")
                errors.append((index_path, " | ".join(msg_parts)))

    return errors

def check_zero_html(files):
    """Prüft auf rohes HTML (Zero-HTML-Policy).
    Matcht nur bekannte Block-/Struktur-HTML-Tags — keine linguistischen
    Anmerkungen wie <person> oder <she, it>.
    """
    errors = []
    for path in files:
        if 'lektionen' not in str(path):
            continue
        content = path.read_text(encoding='utf-8', errors='replace')
        matches = _HTML_BLOCK_TAGS.findall(content)
        if matches:
            # Nur die äußeren Matches für die Anzeige rekonstruieren
            display = _HTML_BLOCK_TAGS.findall(content)
            errors.append((path, f'{len(display)} HTML-Tag(s): {[f"<{t}>" for t in display[:3]]}'))
    return errors

def check_placeholders(files):
    """Findet nicht-ersetzte Übersetzungs-Platzhalter."""
    errors = []
    combined = re.compile('|'.join(PLACEHOLDER_PATTERNS))
    for path in files:
        content = path.read_text(encoding='utf-8', errors='replace')
        # Ignoriere Code-Spans (`...`) und Code-Blöcke um False Positives zu vermeiden
        stripped = re.sub(r'`[^`]+`', '', content)
        stripped = re.sub(r'```.*?```', '', stripped, flags=re.DOTALL)
        matches = combined.findall(stripped)
        if matches:
            errors.append((path, f'Platzhalter: {list(set(matches))[:5]}'))
    return errors

def check_escaped_vue_components(files):
    """Findet fälschlicherweise HTML-escapte Vue-Komponenten wie &lt;PayerTopicIndex /&gt;."""
    errors = []
    vue_re = re.compile(r'&lt;Payer[A-Za-z]+')
    for path in files:
        content = path.read_text(encoding='utf-8', errors='replace')
        if vue_re.search(content):
            errors.append((path, 'Vue-Komponente HTML-escapt (z.B. &lt;PayerTopicIndex /&gt;)'))
    return errors

def check_foreign_chars(files):
    """Findet Zeichen falscher Schriftsysteme (z.B. Chinesisch in Tamil)."""
    CJK_RE = re.compile(r'[一-鿿㐀-䶿]')
    errors = []
    for path in files:
        if not str(path).startswith(str(ROOT / "docs")):
            continue
        lang = lang_from_path(path)
        expected = LANG_SCRIPTS.get(lang, 'latin')
        content = path.read_text(encoding='utf-8', errors='replace')

        # CJK in Nicht-CJK-Sprachen (ausser wenn es legitime Eigennamen sind)
        cjk = CJK_RE.findall(content)
        if cjk and not lang.startswith('zh'):
            # lektion50 und licenses.md haben legitimerweise CJK (Everest, Lisu)
            if 'lektion50' not in str(path) and 'licenses' not in path.name:
                errors.append((path, f'CJK-Zeichen: {"".join(set(cjk))[:10]}'))

        # Kyrillisch in Latin-Sprachen
        if expected == 'latin':
            cyrillic = [c for c in content if 'CYRILLIC' in unicodedata.name(c, '')]
            if cyrillic:
                errors.append((path, f'Kyrillisch in {lang}: {"".join(set(cyrillic))[:10]}'))
    return errors

def check_image_captions(files):
    """Prüft Bildunterschriften-Format: Abb.: Text [[br]] Bildquelle: [Details](...)"""
    errors = []
    # Erlaubte Formate
    good_caption = re.compile(
        r'^Abb\.: .+(\[\[br\]\]|\n).*Bildquelle:',
        re.MULTILINE
    )
    bad_font = re.compile(r'<font[^>]*>', re.IGNORECASE)
    for path in files:
        if 'lektionen' not in str(path):
            continue
        content = path.read_text(encoding='utf-8', errors='replace')
        # Legacy <font> Tags bei Bildunterschriften
        if bad_font.search(content):
            errors.append((path, 'Legacy <font>-Tag in Bildunterschrift'))
    return errors

def check_html_arrow_entities(files, fix=False):
    """Findet -&gt; (HTML-Entity als Pfeil) das → sein sollte, &gt; als Blockquote-Marker, und rohe bibliographische &lt;/&gt;-Entities."""
    errors = []
    arrow_re  = re.compile(r'-&gt;')
    bq_re     = re.compile(r'^&gt;', re.MULTILINE)
    larrow_re = re.compile(r'&lt;-')
    bib_re    = re.compile(r'\\?&lt;\s*\d{4}')
    de_phrases_re = re.compile(r'\b(Auslautendes|Satzende|wird es zu|Materialien zum Sanskrit)\b', re.IGNORECASE)
    
    for path in files:
        content = path.read_text(encoding='utf-8', errors='replace')
        lang = lang_from_path(path)
        
        # Code-Spans und Code-Blöcke ausschliessen
        stripped = re.sub(r'```.*?```', '', content, flags=re.DOTALL)
        stripped = re.sub(r'`[^`\n]+`', '', stripped)
        hits = []
        if arrow_re.search(stripped):
            hits.append('-&gt; (sollte → sein)')
        if bq_re.search(stripped):
            hits.append('&gt; am Zeilenbeginn (sollte > sein)')
        if larrow_re.search(stripped):
            hits.append('&lt;- (sollte ← sein)')
        if bib_re.search(stripped):
            hits.append('Bibliographisches &lt;...&gt; (sollte Klammer sein)')
            
        if lang != 'de':
            de_hits = de_phrases_re.findall(stripped)
            if de_hits:
                hits.append(f'Deutsche Grammatik-Phrasen in {lang}: {set(de_hits)}')
                
        if hits:
            if fix:
                fixed = content
                fixed = arrow_re.sub('→', fixed)
                fixed = bq_re.sub('>', fixed)
                fixed = larrow_re.sub('←', fixed)
                fixed = re.sub(r'\\?&lt;\s*(\d{4})\s*[\u2013-]\s*(\d{4})?\s*\\?&gt;', lambda m: f'({m.group(1)}\u2013{m.group(2)})' if m.group(2) else f'({m.group(1)}\u2013)', fixed)
                fixed = re.sub(r'\\?&lt;\s*(\d{4})\s*\\?&gt;', r'(\1)', fixed)
                path.write_text(fixed, encoding='utf-8')
                errors.append((path, f'Automatisch repariert / erkannt: {hits}'))
            else:
                errors.append((path, f'HTML-Entity / DE-Rest: {hits}'))
    return errors

def check_untranslated_german_copies():
    """Prüft ob in Zielsprachen 1:1 unübersetzte deutsche Kopien existieren."""
    errors = []
    docs = ROOT / 'docs'
    de_files = {f.relative_to(docs): f.read_text(encoding='utf-8', errors='replace').strip() for f in docs.glob('*.md')}
    de_files.update({f.relative_to(docs): f.read_text(encoding='utf-8', errors='replace').strip() for f in (docs / 'lektionen').glob('*.md')})

    lang_mjs = ROOT / 'docs/.vitepress/languages.mjs'
    if not lang_mjs.exists():
        return errors
    txt = lang_mjs.read_text(encoding='utf-8')
    m = re.search(r'export const DEFAULT_LOCALES = \[(.*?)\];', txt, re.DOTALL)
    if not m:
        return errors
    finished_langs = get_finished_languages() - {'de'}

    for lang in finished_langs:
        lang_dir = docs / lang
        if not lang_dir.exists(): continue
        for md_file in lang_dir.glob('**/*.md'):
            if 'licenses' in md_file.name or 'qa' in str(md_file): continue
            rel = md_file.relative_to(lang_dir)
            if rel in de_files:
                target_txt = md_file.read_text(encoding='utf-8', errors='replace').strip()
                if target_txt == de_files[rel]:
                    errors.append((md_file, f"Unübersetzte 1:1 deutsche Kopie in Sprache '{lang}' ({rel})"))
    return errors

def check_licenses(files):
    """Prüft ob alle lektXXYY-Bild-IDs in licenses.md vorhanden sind."""
    errors = []
    licenses_de = (ROOT / 'docs/licenses.md')
    if not licenses_de.exists():
        return [('licenses.md', 'Datei nicht gefunden')]

    licenses_content = licenses_de.read_text(encoding='utf-8', errors='replace')
    id_re = re.compile(r'lekt\d{4}')
    defined_ids = set(id_re.findall(licenses_content))

    for path in files:
        if 'lektionen' not in str(path) or lang_from_path(path) != 'de':
            continue  # Nur DE-Quelldateien prüfen
        content = path.read_text(encoding='utf-8', errors='replace')
        used_ids = set(id_re.findall(content))
        missing = used_ids - defined_ids
        if missing:
            errors.append((path, f'IDs fehlen in licenses.md: {sorted(missing)}'))
    return errors

def check_release_version():
    """Prüft ob die Version aus package.json in docs/index.md, docs/release-notes.md oder docs/settings.md eingetragen ist."""
    import json
    pkg_path = ROOT / 'package.json'
    if not pkg_path.exists():
        return None
    try:
        pkg_data = json.loads(pkg_path.read_text('utf-8'))
        version = pkg_data.get('version', '')
        if not version: return None
        
        parts = version.split('.')
        if len(parts) >= 2:
            short_v = f"{parts[0]}.{parts[1]}"
            found = False
            for path in [ROOT / 'docs/index.md', ROOT / 'docs/release-notes.md', ROOT / 'docs/settings.md']:
                if path.exists():
                    txt = path.read_text('utf-8')
                    if f"Version {version}" in txt or f"v{version}" in txt:
                        found = True
                        break
            if not found:
                return f"Version {version} fehlt in docs/index.md / release-notes.md (Release Notes nicht nachgetragen!)"
    except Exception as e:
        return f"Fehler beim Version-Check: {e}"
    return None

def check_qa_viewer_dropdowns():
    """Prüft ob die Dropdowns im QA Viewer identisch sind und exakt allLocales aus config.mjs entsprechen."""
    qa_viewer = ROOT / 'docs/public/qa_viewer.html'
    config_mjs = ROOT / 'docs/.vitepress/languages.mjs'
    
    if not qa_viewer.exists() or not config_mjs.exists():
        return "qa_viewer.html oder languages.mjs nicht gefunden"
        
    content_config = config_mjs.read_text(encoding='utf-8')
    match = re.search(r'export const ACTIVE_LOCALES = \[(.*?)\];', content_config, re.DOTALL)
    if not match:
        return "ACTIVE_LOCALES Array in languages.mjs nicht gefunden"
    
    locales_str = match.group(1).replace('\n', '').replace(' ', '').replace("'", "").replace('"', '')
    active_locales = set(locales_str.split(','))
    
    expected_values = {"qa/lektion01.html"}
    for l in active_locales:
        if l == 'de':
            expected_values.add("lektionen/lektion01")
        elif l == 'zhCN':
            expected_values.add("zh-CN/lektionen/lektion01")
        elif l:
            expected_values.add(f"{l}/lektionen/lektion01")

    content_qa = qa_viewer.read_text(encoding='utf-8')
    
    left_match = re.search(r'<select id="left-lang"[^>]*>(.*?)</select>', content_qa, re.DOTALL)
    right_match = re.search(r'<select id="right-lang"[^>]*>(.*?)</select>', content_qa, re.DOTALL)
    
    if not left_match or not right_match:
        return "Dropdowns #left-lang oder #right-lang nicht in qa_viewer.html gefunden"
        
    def get_options(html_block):
        return set(re.findall(r'<option value="([^"]+)"', html_block))
        
    left_opts = get_options(left_match.group(1))
    right_opts = get_options(right_match.group(1))
    
    errors = []
    if left_opts != right_opts:
        diff = left_opts.symmetric_difference(right_opts)
        errors.append(f"Links und rechts sind asynchron! Differenz: {diff}")
        
    missing = expected_values - left_opts
    extra = left_opts - expected_values
    
    if missing:
        errors.append(f"Fehlende aktive Sprachen im Dropdown: {missing}")
    if extra:
        errors.append(f"Inaktive/Überflüssige Sprachen im Dropdown: {extra}")
        
    return "\n     ".join(errors) if errors else None

def check_container_syntax(files, fix=False):
    """Prüft die Container-Syntax (::::) mithilfe von syntax_repair."""
    # lazy import um zyklische imports zu vermeiden
    sys.path.insert(0, str(ROOT / 'scripts'))
    try:
        import syntax_repair
    except ImportError:
        try:
            from translation import protector as syntax_repair
        except ImportError:
            return []
        
    errors = []
    for path in files:
        if path.suffix != '.md':
            continue
        # Reparatur-Routine aufrufen
        ct = syntax_repair.repair_containers(path, fix=fix)
        if ct:
            if fix:
                errors.append((path, f"Automatisch repariert: {len(ct)} Container-Fehler"))
            else:
                # Nur eine Übersicht statt aller Details (sonst zu lang im Push-Log)
                errors.append((path, f"Container-Syntax-Fehler ({len(ct)} ungeschlossene/falsche ::-Tags). Tipp: --fix"))
    return errors

# ── Hauptprogramm ──────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    scope = 'diff'
    run_build = False
    fix_mode = False
    strict_mode = False

    for a in args:
        if a == '--scope=all':   scope = 'all'
        if a == '--scope=diff':  scope = 'diff'
        if a == '--build':       run_build = True
        if a == '--fix':         fix_mode = True
        if a == '--strict':      strict_mode = True

    print(f"\n{'='*60}")
    print(f"  Pre-Push Check  |  scope={scope}  |  build={'ja' if run_build else 'nein'}  |  strict={'ja' if strict_mode else 'nein'}")
    print(f"{'='*60}\n")

    # ── 0. Strict Mode Check ─────────────────────────────────────────────────
    if strict_mode:
        dirty_files = check_dirty_worktree()
        if dirty_files:
            print("[0/0] Strict Mode: Dirty Worktree Check...")
            print("  ❌ Es gibt uncommitted Änderungen in docs/, scripts/ oder package.json!")
            print("     Der Pre-Push-Check testet Ihre *lokalen Dateien*, nicht den aktuellen Push-Commit.")
            print("     Bitte committen oder stashen Sie diese Änderungen vor dem Push.")
            for line in dirty_files[:5]:
                print(f"       {line}")
            if len(dirty_files) > 5:
                print(f"       ... und {len(dirty_files)-5} weitere.")
            print("\n  ❌ Push blockiert wegen uncommitted Änderungen.\n")
            sys.exit(1)

    total_errors = 0

    # ── 1. Config-Dateien Warnung ────────────────────────────────────────────
    config_files = check_config_files_in_diff()
    if config_files:
        print(f"⚠  Config-Dateien im Diff ({len(config_files)}):")
        for f in config_files:
            print(f"   {f}")
        print("   → Manuelle Sichtprüfung aller Sprachversionen empfohlen\n")

    # ── 2. Dateien ermitteln ─────────────────────────────────────────────────
    if scope == 'diff':
        files = get_diff_files()
        print(f"📋 Scope: {len(files)} geänderte .md-Dateien seit origin/main")
    else:
        files = get_all_md_files()
        print(f"📋 Scope: alle {len(files)} .md-Dateien")

    if not files:
        print("   (keine .md-Dateien im Scope)\n")

    # ── 3. YAML-Frontmatter (alle Files im Scope) ────────────────────────────
    print("\n[1/6] YAML-Frontmatter...")
    errs = check_yaml_frontmatter(files)
    if errs:
        for path, msg in errs:
            print(f"  ❌ {path.relative_to(ROOT)}: {msg}")
        total_errors += len(errs)
    else:
        print(f"  ✓ {len(files)} Dateien geprüft — OK")

    # ── 3b. index.md Frontmatter & Links (global über alle Sprach-Startseiten)
    print("\n[1b] index.md Frontmatter & Sprachpräfix-Links...")
    errs = check_index_frontmatter_structural(fix=fix_mode)
    if errs:
        for path, msg in errs:
            icon = '✓' if fix_mode else '❌'
            print(f"  {icon} {path.relative_to(ROOT)}: {msg}")
        if not fix_mode:
            total_errors += len(errs)
    else:
        print(f"  ✓ Alle Startseiten (index.md) geparst und geprüft — OK")

    # ── 4. Zero-HTML ─────────────────────────────────────────────────────────
    print("\n[2/6] Zero-HTML (kein rohes HTML in .md)...")
    errs = check_zero_html(files)
    if errs:
        for path, msg in errs:
            print(f"  ❌ {path.relative_to(ROOT)}: {msg}")
        total_errors += len(errs)
    else:
        print(f"  ✓ OK")

    # ── 4b. Escapte Vue-Komponenten ──────────────────────────────────────────
    print("\n[2b] Escapte Vue-Komponenten (&lt;Payer...&gt;)...")
    errs = check_escaped_vue_components(files)
    if errs:
        for path, msg in errs:
            print(f"  ❌ {path.relative_to(ROOT)}: {msg}")
        total_errors += len(errs)
    else:
        print(f"  ✓ OK")

    # ── 4c. HTML-Entities als Pfeile ────────────────────────────────────────
    print("\n[2c] HTML-Entities als Pfeile (-&gt; statt →)...")
    errs = check_html_arrow_entities(files, fix=fix_mode)
    if errs:
        for path, msg in errs:
            icon = '✓' if fix_mode else '❌'
            print(f"  {icon} {path.relative_to(ROOT)}: {msg}")
        if not fix_mode:
            total_errors += len(errs)
    else:
        print(f"  ✓ OK")

    # ── 5. Platzhalter ───────────────────────────────────────────────────────
    print("\n[3/6] Übersetzungs-Platzhalter (DEVA_, TODO, ...)...")
    errs = check_placeholders(files)
    if errs:
        for path, msg in errs:
            print(f"  ❌ {path.relative_to(ROOT)}: {msg}")
        total_errors += len(errs)
    else:
        print(f"  ✓ OK")

    # ── 5b. Unübersetzte 1:1 deutsche Kopien ──────────────────────────────────
    print("\n[3b] Unübersetzte 1:1 deutsche Kopien in fertigen Sprachen...")
    errs = check_untranslated_german_copies()
    if errs:
        for path, msg in errs:
            print(f"  ❌ {path.relative_to(ROOT)}: {msg}")
        total_errors += len(errs)
    else:
        print(f"  ✓ OK")

    # ── 6. Fremdzeichen ──────────────────────────────────────────────────────
    print("\n[4/6] Fremdzeichen (CJK, Kyrillisch in falschen Sprachen)...")
    errs = check_foreign_chars(files)
    if errs:
        for path, msg in errs:
            print(f"  ❌ {path.relative_to(ROOT)}: {msg}")
        total_errors += len(errs)
    else:
        print(f"  ✓ OK")

    # ── 7. Bildunterschriften ────────────────────────────────────────────────
    print("\n[5/6] Bildunterschriften-Format...")
    errs = check_image_captions(files)
    if errs:
        for path, msg in errs:
            print(f"  ⚠ {path.relative_to(ROOT)}: {msg}")
        # Nur Warning, kein hard error
    else:
        print(f"  ✓ OK")

    # ── 7b. Fehlende licenses.md ────────────────────────────────────────────
    print("\n[5b] Fehlende licenses.md pro Sprache...")
    LANGS = ['en','it','es','fr','hi','bg','ru','uk','ta','pa','la','rm','ro']
    missing_lic = [l for l in LANGS if (ROOT / 'docs' / l).exists() and not (ROOT / 'docs' / l / 'licenses.md').exists()]
    if missing_lic:
        print(f"  ❌ licenses.md fehlt für: {missing_lic}")
        total_errors += len(missing_lic)
    else:
        existing_langs = [l for l in LANGS if (ROOT / 'docs' / l).exists()]
        print(f"  ✓ OK — alle {len(existing_langs)} existierenden Sprachen haben licenses.md")

    # ── 5c. qa_viewer Dropdown-Vollständigkeit ──────────────────────────────
    print("\n[5c] qa_viewer.html — Dropdown Parität und Aktualität...")
    qa_err = check_qa_viewer_dropdowns()
    if qa_err:
        if fix_mode:
            subprocess.run(['python3', 'scripts/sync_qa_viewer.py'], cwd=ROOT)
            print("  ✓ Automatisch repariert: Dropdowns synchronisiert")
        else:
            print(f"  ❌ {qa_err}")
            print("     → Bitte docs/public/qa_viewer.html an docs/.vitepress/config.mjs (allLocales) angleichen")
            total_errors += 1
    else:
        print("  ✓ OK — Dropdowns sind synchron und entsprechen allLocales")

    # ── 5d. Container-Syntax (::: öffner/schließer) ─────────────────────────
    print("\n[5d] Container-Syntax (::::) prüfen...")
    errs = check_container_syntax(files, fix=fix_mode)
    if errs:
        for path, msg in errs:
            icon = '✓' if fix_mode else '❌'
            p = Path(path)
            rel_p = p.relative_to(ROOT) if p.is_absolute() and p.is_relative_to(ROOT) else p
            print(f"  {icon} {rel_p}: {msg}")
        if not fix_mode:
            total_errors += len(errs)
    else:
        print(f"  ✓ OK")

    # ── 5e. Pipeline-Logik-Invarianten ──────────────────────────────────────
    print("\n[5e] Pipeline-Logik-Invarianten (TM-Cache & Skript-Integrität)...")
    p_errs = check_pipeline_logic_invariants()
    if p_errs:
        for msg in p_errs:
            print(f"  ❌ {msg}")
        total_errors += len(p_errs)
    else:
        print("  ✓ OK — TM-Cache, Skripte und Lock-Invarianten sind intakt")

    # ── 8. Lizenzen (nur bei --scope=all oder wenn DE-Dateien im Diff) ───────
    de_files = [f for f in files if lang_from_path(f) == 'de']
    if de_files or scope == 'all':
        print("\n[6/6] Lizenzen-Vollständigkeit (licenses.md)...")
        errs = check_licenses(files if scope == 'all' else de_files)
        if errs:
            for path, msg in errs:
                print(f"  ⚠ {path if isinstance(path, str) else path.relative_to(ROOT)}: {msg}")
        else:
            print(f"  ✓ OK")
    else:
        print("\n[6/6] Lizenzen — übersprungen (keine DE-Dateien im Diff)")

    # ── 9. Build-Gate ────────────────────────────────────────────────────────
    if run_build:
        print("\n[Build] npm run docs:build...")
        result = subprocess.run(
            ['npm', 'run', 'docs:build'],
            capture_output=True, text=True, cwd=ROOT
        )
        if result.returncode != 0:
            print(f"  ❌ Build FEHLGESCHLAGEN:")
            print(result.stderr[-1000:])
            total_errors += 1
        else:
            print(f"  ✓ Build OK")

    # ── 10. Release-Version in index.md ──────────────────────────────────────
    print("\n[7/7] Release-Version in docs/index.md prüfen...")
    ver_err = check_release_version()
    if ver_err:
        print(f"  ❌ {ver_err}")
        total_errors += 1
    else:
        print(f"  ✓ OK")

    # ── Zusammenfassung ──────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    if total_errors == 0:
        print(f"  ✅ Alle Checks bestanden — bereit zum Push")
    else:
        print(f"  ❌ {total_errors} Fehler gefunden — Push blockiert")
        print(f"     Tipp: python3 scripts/pre_push_check.py --fix  (wo möglich)")
    print(f"{'='*60}\n")

    sys.exit(0 if total_errors == 0 else 1)


if __name__ == '__main__':
    main()
