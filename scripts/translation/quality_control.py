"""
Quality control, residue scanning, local auto-healing, and failure logging.
"""

import os
import re
import sys
import json
import datetime
from .config import LANG_NAMES, SONNET_API_URL, SONNET_MODEL
from .terms import DE_RESIDUE_REGEX as _DE_RESIDUE_PATTERNS

FAILURE_LOG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "docs", "qa", "translation_failures.md"
)

try:
    from langdetect import detect as _lang_detect
except ImportError:
    _lang_detect = None

def scan_german_residues(content: str, target_lang: str = None) -> list:
    if os.environ.get("PAYER_BOOTSTRAP_TM") == "1": return []
    """Scan translated content for remaining German terms or sentences.

    Returns a list of (line_index, line_text) tuples where residues were found.
    Ignores lines inside ::: deleteme-box containers and YAML frontmatter.
    """
    # Languages where German prose is explicitly allowed as fallback
    if target_lang in {'rm', 'la', 'grc', 'el', 'cop', 'af'}:
        return []

    flagged = []
    in_frontmatter = False
    in_deleteme = False
    frontmatter_count = 0

    for i, line in enumerate(content.split('\n')):
        stripped = line.strip()

        # Track YAML frontmatter (first --- block)
        if stripped == '---' and frontmatter_count < 2:
            frontmatter_count += 1
            in_frontmatter = (frontmatter_count == 1)
            continue
        if in_frontmatter:
            continue

        # Track ::: deleteme-box containers (spans to EOF at bottom of lesson)
        if '::: deleteme-box' in stripped or ':::deleteme-box' in stripped:
            in_deleteme = True
        if in_deleteme:
            continue

        # Skip lines that are purely Devanāgarī, IAST, or URLs
        if not stripped or stripped.startswith('http') or stripped.startswith('<!--'):
            continue

        # Skip lines in grammar-box headers / structural markers
        if stripped.startswith(':::') or stripped == '---':
            continue

        # Strip markdown link target URLs and HTTP URLs to avoid matching structural paths like /lektionen/
        clean_line = re.sub(r'\]\(/[^)]+\)', ']', line)
        clean_line = re.sub(r'https?://[^\s)]+', '', clean_line)

        # 1. Regex pattern match
        m = _DE_RESIDUE_PATTERNS.search(clean_line)
        if m:
            flagged.append((i, line))
            continue

        # 2. Morphological Language ID (for target languages other than German)
        if target_lang and target_lang != 'de' and _lang_detect:
            # Skip markdown table rows and citation lines with German publisher/author names
            if stripped.startswith('|') or any(cit in stripped for cit in ["Kielhorn", "Dümmler", "Berlin", "Stenzler", "Monier-Williams", "Solomons", "Image source:"]):
                continue
            # Skip if line contains non-Latin scripts (Cyrillic, Devanagari, Arabic, Hebrew, Amharic, Coptic, Chinese, etc.)
            if any(ord(ch) > 0x024F for ch in stripped):
                continue

            # Strip Devanāgarī tags, IAST brackets, URLs, markdown formatting for clean lang detection
            clean_line = re.sub(r'⟪[^⟫]+⟫|sig\[[^\]]+\]|!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|[\#\*\_`]', '', stripped).strip()
            if len(clean_line) > 35:
                try:
                    detected_lang = _lang_detect(clean_line)
                    if detected_lang == 'de':
                        flagged.append((i, line))
                except Exception:
                    pass

    return flagged

def sonnet_patch_residues(content: str, flagged_lines: list, target_lang: str) -> str:
    """Send ONLY the flagged lines (with context) to local Qwen model for targeted patching.

    Returns the full content with residues replaced.
    Runs 100% locally on nyx.local:8000 (0 cost).
    """
    api_key = "local"

    lang_name = LANG_NAMES.get(target_lang, target_lang)
    lines = content.split('\n')
    flagged_indices = {i for i, _ in flagged_lines}

    # Build a context window: flagged lines ± 2 lines of context
    context_indices = set()
    for i in flagged_indices:
        for j in range(max(0, i - 2), min(len(lines), i + 3)):
            context_indices.add(j)

    # Format the snippet with line markers
    snippet_lines = []
    for i in sorted(context_indices):
        marker = ">>" if i in flagged_indices else "  "
        snippet_lines.append(f"[L{i}]{marker} {lines[i]}")
    snippet = '\n'.join(snippet_lines)

    system = (
        f"You are a scholarly translator fixing German residues in a {lang_name} Sanskrit-education text. "
        "Lines marked with >> contain German words that were not translated. "
        "Rules: "
        "(1) Translate ONLY the German words on lines marked >>. "
        "(2) Preserve all Markdown syntax, IAST, Devanāgarī (⟪...⟫), and container syntax exactly. "
        "(3) Return ONLY the corrected lines in the format [LN] corrected_text — one per line. "
        "(4) Do NOT return context lines (without >>). "
        "(5) Keep the scholarly editorial tone."
    )
    data = {
        "model": SONNET_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": snippet}
        ],
        "temperature": 0.1,
        "max_tokens": 2048,
    }

    import subprocess as _sp
    curl_cmd = [
        'curl', '-s', '-X', 'POST', SONNET_API_URL,
        '-H', 'Content-Type: application/json',
        '-H', f'Authorization: Bearer {api_key}',
        '-H', 'HTTP-Referer: https://sanskritkurs-payer.ch',
        '-d', json.dumps(data), '--max-time', '120'
    ]

    try:
        proc = _sp.run(curl_cmd, capture_output=True, text=True, timeout=125)
        if proc.returncode != 0:
            raise OSError(f"curl exit {proc.returncode}: {proc.stderr[:200]}")
        res = json.loads(proc.stdout)
        if 'error' in res:
            raise RuntimeError(f"API Error: {res['error']}")
        patched_text = res['choices'][0]['message']['content']
        if not patched_text:
            raise ValueError("Empty or null content returned from OpenRouter choices.")
    except Exception as e:
        err_str = str(e)
        if "API Error" in err_str and ("'code': 402" in err_str or "'code': 404" in err_str or "'code': 401" in err_str):
            sys.stdout.write(f"\n[FATAL] Unrecoverable OpenRouter API Error in patcher: {err_str}\nAborting immediately.\n")
            sys.stdout.flush()
            sys.exit(1)
        sys.stdout.write(f"  [!] SONNET FALLBACK API error: {e}\n")
        sys.stdout.flush()
        return content

    # Parse response and apply corrections
    patched_lines = list(lines)
    for resp_line in patched_text.split('\n'):
        m = re.match(r'^\s*\[?[LЛlл]?\s*(\d+)\s*\]?(?:>>)?[\s:\.\-]*\s*(.*)$', resp_line.strip(), re.IGNORECASE)
        if m:
            idx = int(m.group(1))
            corrected = m.group(2)
            if 0 <= idx < len(patched_lines):
                patched_lines[idx] = corrected

    return '\n'.join(patched_lines)

def log_failure(
    lang: str,
    filename: str,
    failure_code: str,
    flagged_lines: list,
    note: str = ""
) -> None:
    """Append a structured entry to docs/qa/translation_failures.md."""
    os.makedirs(os.path.dirname(FAILURE_LOG_PATH), exist_ok=True)

    if not os.path.exists(FAILURE_LOG_PATH):
        with open(FAILURE_LOG_PATH, 'w', encoding='utf-8') as f:
            f.write("# Translation Failure Log\n\n")
            f.write("Automatically generated. Do not edit manually.\n\n")
            f.write("| Timestamp | Language | File | Code | Lines | Note |\n")
            f.write("|-----------|----------|------|------|-------|------|\n")

    ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    lines_str = ",".join(str(i) for i, _ in flagged_lines[:5])
    if len(flagged_lines) > 5:
        lines_str += f" (+{len(flagged_lines)-5} more)"

    with open(FAILURE_LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(f"| {ts} | {lang} | {filename} | {failure_code} | {lines_str} | {note} |\n")
