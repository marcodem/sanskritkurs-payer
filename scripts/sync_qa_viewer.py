#!/usr/bin/env python3
import os
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
CONFIG_MJS = ROOT / 'docs/.vitepress/config.mjs'
CUSTOM_CSS = ROOT / 'docs/.vitepress/theme/custom.css'
QA_VIEWER = ROOT / 'docs/public/qa_viewer.html'

def get_locales_from_config():
    lang_mjs = ROOT / 'docs/.vitepress/languages.mjs'
    if lang_mjs.exists():
        txt = lang_mjs.read_text(encoding='utf-8')
        m = re.search(r'export const ACTIVE_LOCALES = \[(.*?)\];', txt, re.DOTALL)
        if m:
            raw = m.group(1)
            return re.findall(r"'([a-zA-Z0-9_-]+)'", raw)
    return []

LANG_NAMES = {
    'de': 'Deutsch (DE)',
    'en': 'English (EN)',
    'it': 'Italiano (IT)',
    'ru': 'Русский (RU)',
    'uk': 'Українська (UK)',
    'hi': 'हिन्दी (HI)',
    'fr': 'Français (FR)',
    'es': 'Español (ES)',
    'ta': 'தமிழ் (TA)',
    'pa': 'ਪੰਜਾਬੀ (PA)',
    'ro': 'Română (RO)',
    'id': 'Bahasa Indonesia (ID)',
    'he': 'עברית (HE)',
    'zh-CN': 'Simplified Chinese (ZH-CN)',
    'th': 'Thai (TH)',
    'la': 'Latin (LA)',
    'rm': 'Romansh Grischun (RM)',
    'bg': 'Bulgarian (BG)',
    'ar': 'Arabic (AR)',
    'arc': 'Aramaic (ARC)',
    'grc': 'Ancient Greek (GRC)',
    'el': 'Modern Greek (EL)',
    'fa': 'Persian (FA)',
    'akk': 'Akkadian (AKK)',
    'cop': 'Coptic (COP)',
    'fi': 'Suomi (FI)',
    'hu': 'Magyar (HU)',
    'zh': 'Traditional Chinese (ZH)',
    'nl': 'Nederlands (NL)',
    'am': 'Amharic (AM)',
    'af': 'Afrikaans (AF)',
    'lt': 'Lietuvių (LT)',
    'sh': 'Srpsko-hrvatski (SH)',
    'sq': 'Shqip (SQ)',
    'pt': 'Português (PT)',
}

def generate_options(locales, default_lang='de'):
    lines = []
    
    # HTML Option
    if default_lang == 'html':
        lines.append('                <option value="qa/lektion01.html" selected>Original HTML</option>')
    else:
        lines.append('                <option value="qa/lektion01.html">Original HTML</option>')

    for l in locales:
        val_lang = 'zh-CN' if l == 'zhCN' else l
        name = LANG_NAMES.get(val_lang, val_lang.upper())
        val = 'lektionen/lektion01' if val_lang == 'de' else f'{val_lang}/lektionen/lektion01'
        selected = ' selected' if l == default_lang else ''
        lines.append(f'                <option value="{val}"{selected}>{name}</option>')
        
    return '\n'.join(lines)

def sync_snippets(content):
    if not CUSTOM_CSS.exists():
        return content
    css_text = CUSTOM_CSS.read_text(encoding='utf-8')
    
    # Extract container block names defined in custom.css (.vp-doc .<name> or .custom-block.<name>)
    found_classes = set(re.findall(r'\.vp-doc\s+\.([\w-]+)\b', css_text))
    found_classes.update(re.findall(r'\.custom-block\.([\w-]+)\b', css_text))
    
    ignore_set = {'sanskrit-dev', 'hi-dev', 'signalrot', 'vp-doc', 'vp-code', 'vp-adaptive-theme', 'info', 'tip', 'warning', 'danger', 'details'}
    candidate_containers = [c for c in found_classes if c not in ignore_set and not c.startswith('vp-')]
    
    missing_containers = [c for c in candidate_containers if f'::: {c}' not in content]
    if missing_containers:
        print(f"[*] Snippet-Synchronisation: Neue Container in custom.css gefunden -> {missing_containers}")
        new_snippet_rows = []
        for c in sorted(missing_containers):
            new_snippet_rows.append(
                f'            <div class="syn-row" onclick="insertSnippet(\'\\n::: {c}\\n\', \'\\n:::\')" '
                f'style="border-left: 4px solid #64748b; padding-left: 6px;"><code>::: {c}</code>'
                f'<span class="syn-desc" data-syn-d="{c[:3]}">{c}</span></div>'
            )
        inject_block = '\n'.join(new_snippet_rows) + '\n'
        content = content.replace('<!-- END_CONTAINER_SNIPPETS -->', inject_block + '            <!-- END_CONTAINER_SNIPPETS -->')
        print(f"[*] {len(missing_containers)} neue Snippet-Buttons automatisch in QA Viewer eingefügt.")
        
    return content

def sync_qa_viewer():
    locales = get_locales_from_config()
    if not locales:
        print("allLocales nicht gefunden.")
        return False
        
    content = QA_VIEWER.read_text(encoding='utf-8')
    
    # Left dropdown (default DE)
    left_opts = generate_options(locales, default_lang='de')
    content = re.sub(
        r'(<select id="left-lang"[^>]*>\n).*?(</select>)',
        r'\g<1>' + left_opts + r'\n            \g<2>',
        content,
        flags=re.DOTALL
    )
    
    # Right dropdown (default HTML)
    right_opts = generate_options(locales, default_lang='html')
    content = re.sub(
        r'(<select id="right-lang"[^>]*>\n).*?(</select>)',
        r'\g<1>' + right_opts + r'\n            \g<2>',
        content,
        flags=re.DOTALL
    )
    
    # Snippet Cheatsheet Auto-Sync
    content = sync_snippets(content)
    
    QA_VIEWER.write_text(content, encoding='utf-8')
    print("QA Viewer Dropdowns & Snippet-Cheatsheet synchronisiert.")
    return True

if __name__ == '__main__':
    sync_qa_viewer()
