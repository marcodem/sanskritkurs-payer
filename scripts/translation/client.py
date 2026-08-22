"""
LLM Client, API communication, TPS performance monitoring, auto-restart triggers, and Lingua language detection.
"""

import os
import sys
import time
import json
import urllib.request
import urllib.parse
import subprocess
from .config import API_URL, MODEL, LANG_NAMES
from .protector import (
    protect_devanagari, restore_devanagari,
    protect_iast_lines, restore_iast_lines,
    protect_br, restore_br,
    protect_structure, restore_structure
)

try:
    from lingua import Language, LanguageDetectorBuilder
    _LINGUA_DETECTOR = LanguageDetectorBuilder.from_all_languages().with_low_accuracy_mode().build()
except Exception:
    _LINGUA_DETECTOR = None

def run_nyquist_check(target_lang, source_text, translated_text):
    if target_lang not in ['cop', 'am', 'zu']:
        return True, ""
    
    import re
    sys.stdout.write(f"[{target_lang}] Running Nyquist Check (Semantic Round-Trip)...\n")
    sys.stdout.flush()
    
    prompt = f"Translate the following {target_lang} text into English. Output ONLY the English translation without any notes or formatting:\n\n{translated_text}"
    data = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 8192
    }
    
    try:
        from .lock import touch_nyx_lock_heartbeat
        touch_nyx_lock_heartbeat()
        req = urllib.request.Request(
            API_URL,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Authorization': 'Bearer local'}
        )
        with urllib.request.urlopen(req, timeout=300) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            if 'error' in res_data:
                return False, f"Nyquist Check Failed (API Error: {res_data['error']})"
            back_text = res_data['choices'][0]['message']['content']
            
            def get_keywords(t):
                t = t.replace(":br", " ")
                t = re.sub(r'⟪.*?⟫', ' ', t)
                return set(re.findall(r'\b\w{5,}\b', t.lower()))
            
            src_words = get_keywords(source_text)
            back_words = get_keywords(back_text)
            
            if not src_words:
                return True, ""
                
            intersection = src_words.intersection(back_words)
            ratio = len(intersection) / len(src_words)
            
            if ratio < 0.15:
                return False, f"Nyquist Test Failed (Semantic Match: {ratio*100:.1f}%)"
            else:
                sys.stdout.write(f"[{target_lang}] Nyquist Check Passed (Semantic Match: {ratio*100:.1f}%)\n")
                sys.stdout.flush()
                return True, ""
    except Exception as e:
        return False, f"Nyquist Check Exception: {str(e)}"

def translate_text(text, target_lang):
    lang_name = LANG_NAMES.get(target_lang, target_lang)
    _mark_skt = (target_lang == 'hi')
    protected, deva_registry = protect_devanagari(text)
    protected, iast_registry = protect_iast_lines(protected)
    protected = protect_br(protected)
    protected, struct_registry = protect_structure(protected)
    heading_mappings = {
        'en': "e.g. '# Lesson N'",
        'tr': "e.g. '# Ders N'",
        'es': "e.g. '# Lección N'",
        'it': "e.g. '# Lezione N'",
        'fr': "e.g. '# Leçon N'",
        'hi': "e.g. '# पाठ N'",
        'ru': "e.g. '# Урок N'",
        'uk': "e.g. '# Урок N'",
        'bg': "e.g. '# Урок N'",
        'ta': "e.g. '# பாடம் N'",
        'pa': "e.g. '# ਪਾਠ N'",
        'la': "e.g. '# Lectio N'",
        'rm': "e.g. '# Lecziun N'",
        'ro': "e.g. '# Lecție N'",
        'he': "e.g. '# שיעור N'",
        'id': "e.g. '# Pelajaran N'",
        'zh-CN': "e.g. '# 第N课'",
        'zh': "e.g. '# 第N課'",
        'ar': "e.g. '# الدرس N'",
        'arc': "e.g. '# ܡܠܦܢܘܬܐ N'",
        'th': "e.g. '# บทที่ N'",
        'el': "e.g. '# Μάθημα N'",
        'grc': "e.g. '# Μάθημα N'",
        'fa': "e.g. '# درس N'",
        'cop': "e.g. '# ⲙⲁⲑⲏⲙⲁ N'",
        'fi': "e.g. '# Oppitunti N'",
        'hu': "e.g. '# Lecke N'",
        'nl': "e.g. '# Les N'",
        'pt': "e.g. '# Lição N'",
        'vi': "e.g. '# Bài N'",
        'zu': "e.g. '# Isifundo N'",
        'af': "e.g. '# Les N'",
        'lt': "e.g. '# Pamoka N'",
        'sh': "e.g. '# Lekcija N'",
        'sq': "e.g. '# Mësimi N'",
        'akk': "e.g. '# Limmadum N'",
        'am': "e.g. '# ትምህርት N'",
    }
    target_example = heading_mappings.get(target_lang, "")
    if target_example:
        target_example = f" ({target_example})"
    system = (
        f"You are a scholarly translator. Translate ALL German text in this Sanskrit-education markdown to {lang_name}. "
        "Rules: "
        "(1) Translate every German word — including captions, image descriptions, verse translations, and prose. "
        "(2) Preserve unchanged: Markdown syntax, IAST transliterations, YAML frontmatter keys, HTML comments, ⟨DEVA_N⟩ placeholders, ⟨IAST_L_N⟩ placeholders, ⟨BR⟩ placeholders, and ⟨STRUCT_N⟩ placeholders. "
        f"(3) Translate '# Lektion N' headings to the target-language equivalent{target_example}. "
        "(4) NEVER add TODO comments, fallback markers, or any annotations of your own. If unsure how to translate a word or sentence into the target language, translate it into English as a fallback (NEVER leave it in German). "
        "(5) Keep the scholarly editorial tone throughout. "
        "(6) CRITICAL: Preserve the exact line count of the source. Every source line must appear as exactly one output line. NEVER delete, merge, or collapse lines. "
        "(6a) CRITICAL: Each non-empty line of the input is prefixed with a bracketed identifier like [L0], [L1], [L2]... You MUST preserve these identifiers exactly at the start of each translated line. Do not translate, modify, or remove them. "
        "(7) CRITICAL: Copy every ⟨DEVA_N⟩ and ⟨IAST_L_N⟩ placeholder character-for-character. They are replaced with Devanāgarī and IAST text after translation — do NOT interpret, transliterate, or remove them. "
        "(7a) CRITICAL: Lines consisting ONLY of ⟨DEVA_N⟩ tokens (and spaces/punctuation like ।  ॥) are Sanskrit verse lines. Copy every token on that line verbatim. NEVER transliterate Sanskrit verses into the target script — the placeholders will be restored to Devanāgarī automatically. "
        "(7b) CRITICAL: Preserve ALL Markdown image syntax exactly: ![alt](/path/to/image.jpg) — never drop the parentheses around the image path. "
        "(8) Numbered exercise sentences (e.g. '3. Śūdras erlangen...', '4. Die Kṣatriyas...') MUST be translated to the target language even when they begin with Sanskrit proper nouns in IAST notation. The IAST proper noun is preserved as-is; only the surrounding German words are translated."
    )
    best_result = None
    best_missing: list = list(deva_registry.keys())
    is_fallback = False

    max_ph_retries = 1
    for ph_attempt in range(max_ph_retries):
        current_api_url = API_URL
        current_model = MODEL
        is_fallback = False

        temps = [0.1, 0.3, 0.5, 0.7]
        penalties = [1.15, 1.20, 1.25, 1.30]
        temperature = temps[min(ph_attempt, len(temps)-1)]
        repetition_penalty = penalties[min(ph_attempt, len(penalties)-1)]

        # Prepare indexed prompt
        source_lines = protected.split('\n')
        indexed_lines = []
        for idx, l in enumerate(source_lines):
            if l.strip():
                indexed_lines.append(f"[L{idx}] {l}")
            else:
                indexed_lines.append(l)
        indexed_protected = '\n'.join(indexed_lines)

        user_prompt = indexed_protected
        if ph_attempt > 0 and 'qc_reason' in locals():
            if is_fallback:
                sys.stdout.write(f"\n[{target_lang}] FALLBACK TRIGGERED: Switching to OpenRouter ({current_model}) for this chunk due to persistent QC failures.\n")
                sys.stdout.flush()
            user_prompt = f"CRITICAL CORRECTION REQUIRED:\nYour previous translation failed Quality Control for this reason: {qc_reason}\n\nYou MUST fix this error. If you failed to translate sentences, translate EVERY single word now. If you dropped lines, preserve line count strictly. Translate the following text:\n\n{indexed_protected}"

        data = {
            "model": current_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "max_tokens": 8192,
            "repetition_penalty": repetition_penalty
        }

        max_retries = 5
        got_response = False
        for attempt in range(max_retries):
            try:
                from .lock import touch_nyx_lock_heartbeat
                touch_nyx_lock_heartbeat()

                start_time = time.time()
                curl_cmd = ['curl', '-s', '-X', 'POST', current_api_url, '-H', 'Content-Type: application/json']
                api_key = 'local'
                curl_cmd.extend(['-H', f"Authorization: Bearer {api_key}"])
                curl_cmd.extend(['-d', json.dumps(data), '--connect-timeout', '15', '--max-time', '900', '--keepalive-time', '15'])

                _proc = subprocess.run(
                    curl_cmd,
                    capture_output=True, text=True, timeout=905
                )
                end_time = time.time()
                if _proc.returncode != 0:
                    raise OSError(f"curl exit {_proc.returncode}: {_proc.stderr[:200]}")
                res_data = json.loads(_proc.stdout)
                if 'error' in res_data:
                    raise RuntimeError(f"API Error: {res_data['error']}")
                raw_result = res_data['choices'][0]['message']['content']
                got_response = True

                # Parse and restore lines based on prefixes
                import re
                result_lines = raw_result.split('\n')
                restored_lines = [None] * len(source_lines)
                unmatched_lines = []
                for r_line in result_lines:
                    m = re.match(r'^\s*\[?[LЛlл]?\s*(\d+)\s*\]?[\s:\.\-]*\s*(.*)$', r_line, re.IGNORECASE)
                    if m:
                        idx = int(m.group(1))
                        content = m.group(2)
                        if 0 <= idx < len(source_lines):
                            restored_lines[idx] = content
                        else:
                            unmatched_lines.append(r_line)
                    else:
                        if r_line.strip():
                            unmatched_lines.append(r_line)

                unmatched_idx = 0
                line_dropped = False
                for idx, src_l in enumerate(source_lines):
                    if src_l.strip():
                        if restored_lines[idx] is None:
                            if unmatched_idx < len(unmatched_lines):
                                clean_line = re.sub(r'^\s*\[?[LЛlл]?\s*\d+\s*\]?[\s:\.\-]*\s*', '', unmatched_lines[unmatched_idx], flags=re.IGNORECASE)
                                restored_lines[idx] = clean_line
                                unmatched_idx += 1
                            else:
                                line_dropped = True
                                restored_lines[idx] = src_l
                    else:
                        restored_lines[idx] = ''

                result = '\n'.join(restored_lines)
                got_response = True

                # Performance Monitoring (Log speed, rely on connection timeout/death for restarts)
                if 'usage' in res_data and 'completion_tokens' in res_data['usage']:
                    comp_tokens = res_data['usage']['completion_tokens']
                    elapsed = end_time - start_time
                    if elapsed > 0:
                        tps = comp_tokens / elapsed
                        ts = time.strftime('%H:%M:%S')
                        sys.stdout.write(f"[{ts}]      [Speed: {tps:.1f} t/s | {comp_tokens} tokens in {elapsed:.1f}s]\n")
                        sys.stdout.flush()

                # QUALITY CONTROL (QC)
                source_lines = protected.split('\n')
                result_lines = result.split('\n')
                qc_failed = False
                qc_reason = ""

                if line_dropped:
                    qc_failed = True
                    qc_reason = "Line dropped by LLM (missing prefix line restoration)"

                if not qc_failed and len([l for l in source_lines if l.strip()]) != len([l for l in result_lines if l.strip()]):
                    qc_failed = True
                    qc_reason = f"Line count mismatch (Expected non-empty: {len([l for l in source_lines if l.strip()])}, Got: {len([l for l in result_lines if l.strip()])})"
                elif not qc_failed:
                    missing_struct = [k for k in struct_registry if k not in result]
                    if missing_struct:
                        qc_failed = True
                        qc_reason = f"Missing structure placeholders: {len(missing_struct)} dropped"

                if not qc_failed and target_lang != 'de':
                    if 'scripts' not in sys.path:
                        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                    try:
                        from translation_qa import COMMON_DE_WORDS
                        import re
                        words = set(re.findall(r'\b[a-zäöüß]+\b', result.lower()))
                        de_hits = words.intersection(COMMON_DE_WORDS)
                        src_words = set(re.findall(r'\b[a-zäöüß]+\b', protected.lower()))
                        shared_hits = de_hits.intersection(src_words)
                        if len(shared_hits) >= 2:
                            qc_failed = True
                            qc_reason = f"Untranslated German detected ({len(shared_hits)} common marker words found)"
                    except Exception as e:
                        pass

                if not qc_failed and target_lang not in ('de', 'en'):
                    safe_english_words = ['the', 'is', 'to', 'and', 'that', 'of', 'for', 'this', 'are', 'with']
                    en_pattern = re.compile(r'\b(' + '|'.join(safe_english_words) + r')\b', re.IGNORECASE)
                    en_result_count = len(en_pattern.findall(result))
                    if en_result_count >= 3:
                        en_source_count = len(en_pattern.findall(protected))
                        if en_result_count > en_source_count + 2:
                            qc_failed = True
                            qc_reason = f"English fallback leak detected ({en_result_count} English marker words found)"
                
                if not qc_failed:
                    nyq_passed, nyq_reason = run_nyquist_check(target_lang, protected, result)
                    if not nyq_passed:
                        qc_failed = True
                        qc_reason = nyq_reason

                if qc_failed and os.environ.get("PAYER_BOOTSTRAP_TM") != "1":
                    if ph_attempt < max_ph_retries - 1:
                        sys.stdout.write(f"[{target_lang}] QC failed: {qc_reason} — retrying ({ph_attempt + 2}/{max_ph_retries}, T={temperature})...\n")
                        sys.stdout.flush()
                        break
                    else:
                        sys.stdout.write(f"[{target_lang}] [!] Local QC REJECTED: {qc_reason} on final attempt {ph_attempt + 1}.\n")
                        sys.stdout.flush()
                        
                        from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL, OPENROUTER_MODEL
                        if not OPENROUTER_API_KEY:
                            sys.stdout.write(f"[{target_lang}] [!] OPENROUTER_API_KEY not set. Refusing un-QC'd output.\n")
                            sys.stdout.flush()
                            return f"ERROR: Quality Control Failed - {qc_reason}", ph_attempt
                            
                        # Stufe 2: OpenRouter Fallback
                        sys.stdout.write(f"[{target_lang}] [Stufe 2] Invoking OpenRouter Fallback API ({OPENROUTER_MODEL})...\n")
                        sys.stdout.flush()
                        
                        gem_qc_reason = "API request failed or timed out"
                        for gemini_attempt in range(2):
                            gem_temp = 0.3 if gemini_attempt == 0 else 0.5
                            data_gem = {
                                "model": OPENROUTER_MODEL,
                                "messages": [
                                    {"role": "system", "content": system},
                                    {"role": "user", "content": indexed_protected}
                                ],
                                "temperature": gem_temp
                            }
                            req = urllib.request.Request(
                                OPENROUTER_API_URL,
                                data=json.dumps(data_gem).encode('utf-8'),
                                headers={
                                    'Content-Type': 'application/json',
                                    'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                                    'HTTP-Referer': 'http://localhost:8000'
                                }
                            )
                            try:
                                with urllib.request.urlopen(req, timeout=120) as response:
                                    res_data_gem = json.loads(response.read().decode('utf-8'))
                                    gemini_result = res_data_gem['choices'][0]['message']['content']
                            except Exception as e:
                                sys.stdout.write(f"[{target_lang}] OpenRouter API Error: {e}\n")
                                sys.stdout.flush()
                                gem_qc_reason = f"API Error: {e}"
                                continue
                            
                            # Do a quick structural check on Gemini result
                            import re
                            gemini_lines = gemini_result.split('\n')
                            gem_restored_lines = [None] * len(source_lines)
                            gem_unmatched_lines = []
                            for r_line in gemini_lines:
                                m = re.match(r'^\s*\[?[LЛlл]?\s*(\d+)\s*\]?[\s:\.\-]*\s*(.*)$', r_line, re.IGNORECASE)
                                if m:
                                    idx = int(m.group(1))
                                    content = m.group(2)
                                    if 0 <= idx < len(source_lines):
                                        gem_restored_lines[idx] = content
                                    else:
                                        gem_unmatched_lines.append(r_line)
                                else:
                                    if r_line.strip():
                                        gem_unmatched_lines.append(r_line)

                            gem_unmatched_idx = 0
                            gem_line_dropped = False
                            for idx, src_l in enumerate(source_lines):
                                if src_l.strip():
                                    if gem_restored_lines[idx] is None:
                                        if gem_unmatched_idx < len(gem_unmatched_lines):
                                            clean_line = re.sub(r'^\s*\[?[LЛlл]?\s*\d+\s*\]?[\s:\.\-]*\s*', '', gem_unmatched_lines[gem_unmatched_idx], flags=re.IGNORECASE)
                                            gem_restored_lines[idx] = clean_line
                                            gem_unmatched_idx += 1
                                        else:
                                            gem_line_dropped = True
                                            gem_restored_lines[idx] = src_l
                                else:
                                    gem_restored_lines[idx] = ''

                            gem_result_str = '\n'.join(gem_restored_lines)
                            
                            gem_qc_failed = False
                            gem_qc_reason = ""
                            if gem_line_dropped:
                                gem_qc_failed = True
                                gem_qc_reason = "Line dropped by LLM (missing prefix line restoration)"
                            if not gem_qc_failed and len([l for l in source_lines if l.strip()]) != len([l for l in gem_result_str.split('\n') if l.strip()]):
                                gem_qc_failed = True
                                gem_qc_reason = "Line count mismatch"
                            elif not gem_qc_failed:
                                gem_missing_struct = [k for k in struct_registry if k not in gem_result_str]
                                if gem_missing_struct:
                                    gem_qc_failed = True
                                    gem_qc_reason = f"Missing structure: {len(gem_missing_struct)} dropped"
                            
                            # Also check DE/EN words...
                            if not gem_qc_failed and target_lang != 'de':
                                if 'scripts' not in sys.path:
                                    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                                try:
                                    from translation_qa import COMMON_DE_WORDS
                                    import re
                                    ger_pattern = re.compile(r'\b(' + '|'.join(COMMON_DE_WORDS) + r')\b', re.IGNORECASE)
                                    ger_result_count = len(ger_pattern.findall(gem_result_str))
                                    if ger_result_count >= 3:
                                        ger_source_count = len(ger_pattern.findall(protected))
                                        if ger_result_count >= (ger_source_count * 0.2):
                                            gem_qc_failed = True
                                            gem_qc_reason = "German leak"
                                except Exception:
                                    pass
                                        
                            if not gem_qc_failed and target_lang not in ('de', 'en'):
                                import re
                                safe_english_words = ['the', 'is', 'to', 'and', 'that', 'of', 'for', 'this', 'are', 'with']
                                en_pattern = re.compile(r'\b(' + '|'.join(safe_english_words) + r')\b', re.IGNORECASE)
                                en_result_count = len(en_pattern.findall(gem_result_str))
                                if en_result_count >= 3:
                                    en_source_count = len(en_pattern.findall(protected))
                                    if en_result_count > en_source_count + 2:
                                        gem_qc_failed = True
                                        gem_qc_reason = "English leak"
                                        
                            if not gem_qc_failed:
                                nyq_passed, nyq_reason = run_nyquist_check(target_lang, protected, gem_result_str)
                                if not nyq_passed:
                                    gem_qc_failed = True
                                    gem_qc_reason = nyq_reason

                            if not gem_qc_failed:
                                gem_missing_deva = [k for k in deva_registry if k not in gem_result_str]
                                if not gem_missing_deva:
                                    sys.stdout.write(f"[{target_lang}] [Stufe 2] Gemini success!\n")
                                    sys.stdout.flush()
                                    result = gem_result_str
                                    result = restore_devanagari(result, deva_registry, _mark_skt)
                                    result = restore_iast_lines(result, iast_registry)
                                    result = restore_br(result)
                                    result = restore_structure(result, struct_registry)
                                    return result, ph_attempt
                                else:
                                    sys.stdout.write(f"[{target_lang}] [Stufe 2] Gemini dropped {len(gem_missing_deva)} Devanagari placeholders. Retrying...\n")
                                    sys.stdout.flush()
                            else:
                                sys.stdout.write(f"[{target_lang}] [Stufe 2] Gemini QC failed ({gem_qc_reason}). Retrying...\n")
                                sys.stdout.flush()
                                
                        # Stufe 3: DeepL Fallback
                        sys.stdout.write(f"[{target_lang}] [Stufe 3] Invoking DeepL Fallback API...\n")
                        sys.stdout.flush()
                        
                        from .config import DEEPL_API_KEY, DEEPL_API_URL
                        deepl_lang_map = {
                            "zh-CN": "ZH-HANS",
                            "zh": "ZH-HANT",
                            "sh": "HR", 
                            "pt": "PT-PT", 
                            "en": "EN-US"
                        }
                        deepl_unsupported = {"rm", "cop", "grc", "akk", "arc", "gez", "am"}
                        deepl_qc_failed = False
                        deepl_qc_reason = ""
                        
                        if target_lang in deepl_unsupported:
                            sys.stdout.write(f"[{target_lang}] [Stufe 3] Language {target_lang} not supported by DeepL. Skipping to Stufe 4.\n")
                            sys.stdout.flush()
                            deepl_qc_failed = True
                            deepl_qc_reason = "Unsupported language"
                        else:
                            target_deepl = deepl_lang_map.get(target_lang, target_lang.upper())
                        
                            
                            data_deepl = urllib.parse.urlencode({
                                "text": protected,
                                "target_lang": target_deepl,
                                "preserve_formatting": "1",
                                "tag_handling": "xml"
                            }).encode('utf-8')
                            
                            req_deepl = urllib.request.Request(
                                DEEPL_API_URL,
                                data=data_deepl,
                                headers={
                                    'Authorization': f'DeepL-Auth-Key {DEEPL_API_KEY}',
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                }
                            )
                            
                            try:
                                with urllib.request.urlopen(req_deepl, timeout=60) as response:
                                    res_data_deepl = json.loads(response.read().decode('utf-8'))
                                    deepl_result_str = res_data_deepl['translations'][0]['text']
                            except Exception as e:
                                sys.stdout.write(f"[{target_lang}] DeepL API Error: {e}\n")
                                sys.stdout.flush()
                                deepl_qc_failed = True
                                deepl_qc_reason = f"API Error: {e}"
                        
                        if not deepl_qc_failed:
                            if len([l for l in source_lines if l.strip()]) != len([l for l in deepl_result_str.split('\n') if l.strip()]):
                                deepl_qc_failed = True
                                deepl_qc_reason = "Line count mismatch in DeepL output"
                                
                            if not deepl_qc_failed:
                                deepl_missing_struct = [k for k in struct_registry if k not in deepl_result_str]
                                if deepl_missing_struct:
                                    deepl_qc_failed = True
                                    deepl_qc_reason = f"Missing structure: {len(deepl_missing_struct)} dropped"
                                
                        if not deepl_qc_failed:
                            deepl_missing_deva = [k for k in deva_registry if k not in deepl_result_str]
                        if not deepl_qc_failed:
                            sys.stdout.write(f"[{target_lang}] [Stufe 3] DeepL success!\n")
                            sys.stdout.flush()
                            result = deepl_result_str
                            result = restore_devanagari(result, deva_registry, _mark_skt)
                            result = restore_iast_lines(result, iast_registry)
                            result = restore_br(result)
                            result = restore_structure(result, struct_registry)
                            return result, ph_attempt
                        else:
                            sys.stdout.write(f"[{target_lang}] [Stufe 3] DeepL QC failed ({deepl_qc_reason}). Escalating to Stufe 4...\n")
                            sys.stdout.flush()
                            
                        # Stufe 4: Claude Fallback
                        from .config import ANTHROPIC_API_KEY, ANTHROPIC_API_URL, ANTHROPIC_MODEL
                        if not ANTHROPIC_API_KEY:
                            return f"ERROR: Quality Control Failed (Stufe 3 failed, Stufe 4 skipped due to missing API key) - {deepl_qc_reason}", ph_attempt
                            
                        sys.stdout.write(f"[{target_lang}] [Stufe 4] Invoking Sonnet 5 Fallback...\n")
                        sys.stdout.flush()
                        
                        system_claude = (
                            system + 
                            "\n\nCRITICAL INSTRUCTION: You are the final fallback tier. "
                            "Previous translations failed because they left German words untranslated or dropped placeholders. "
                            "You MUST translate literally every single German word to the target language, no exceptions. "
                            "If you don't know a word, translate it to English. Never leave German words in the output. "
                            "Maintain exact line counts and placeholders."
                        )
                        
                        data_claude = {
                            "model": ANTHROPIC_MODEL,
                            "max_tokens": 8192,
                            "system": system_claude,
                            "messages": [
                                {"role": "user", "content": indexed_protected}
                            ]
                        }
                        
                        req_claude = urllib.request.Request(
                            ANTHROPIC_API_URL,
                            data=json.dumps(data_claude).encode('utf-8'),
                            headers={
                                'x-api-key': ANTHROPIC_API_KEY,
                                'anthropic-version': '2023-06-01',
                                'Content-Type': 'application/json'
                            }
                        )
                        
                        claude_qc_reason = ""
                        try:
                            with urllib.request.urlopen(req_claude, timeout=120) as response:
                                res_data_claude = json.loads(response.read().decode('utf-8'))
                                claude_result_str = next((block['text'] for block in res_data_claude.get('content', []) if block.get('type') == 'text'), "")
                        except Exception as e:
                            sys.stdout.write(f"[{target_lang}] Claude API Error: {e} | Raw: {res_data_claude}\n")
                            sys.stdout.flush()
                            return f"ERROR: Quality Control Failed (Stufe 4 API Error) - {e}", ph_attempt
                            
                        # Quick Claude struct check
                        claude_qc_failed = False
                        import re
                        claude_lines = claude_result_str.split('\n')
                        c_restored_lines = [None] * len(source_lines)
                        c_unmatched = []
                        for r_line in claude_lines:
                            m = re.match(r'^\s*\[?[LЛlл]?\s*(\d+)\s*\]?[\s:\.\-]*\s*(.*)$', r_line, re.IGNORECASE)
                            if m:
                                idx = int(m.group(1))
                                if 0 <= idx < len(source_lines):
                                    c_restored_lines[idx] = m.group(2)
                                else:
                                    c_unmatched.append(r_line)
                            else:
                                if r_line.strip(): c_unmatched.append(r_line)
                                
                        c_unmatched_idx = 0
                        for idx, src_l in enumerate(source_lines):
                            if src_l.strip():
                                if c_restored_lines[idx] is None:
                                    if c_unmatched_idx < len(c_unmatched):
                                        c_restored_lines[idx] = re.sub(r'^\s*\[?[LЛlл]?\s*\d+\s*\]?[\s:\.\-]*\s*', '', c_unmatched[c_unmatched_idx], flags=re.IGNORECASE)
                                        c_unmatched_idx += 1
                                    else:
                                        c_restored_lines[idx] = src_l
                            else:
                                c_restored_lines[idx] = ''
                                
                        c_res = '\n'.join(c_restored_lines)
                        if len([l for l in source_lines if l.strip()]) != len([l for l in c_res.split('\n') if l.strip()]):
                            claude_qc_failed = True
                            claude_qc_reason = "Line count mismatch in Claude output"
                            
                        if not claude_qc_failed:
                            c_missing_struct = [k for k in struct_registry if k not in c_res]
                            if c_missing_struct:
                                claude_qc_failed = True
                                claude_qc_reason = f"Missing structure: {len(c_missing_struct)} dropped"
                                
                        if not claude_qc_failed:
                            nyq_passed, nyq_reason = run_nyquist_check(target_lang, protected, c_res)
                            if not nyq_passed:
                                claude_qc_failed = True
                                claude_qc_reason = nyq_reason
                                
                        if not claude_qc_failed:
                            c_missing_deva = [k for k in deva_registry if k not in c_res]
                            if not c_missing_deva:
                                sys.stdout.write(f"[{target_lang}] [Stufe 4] Claude success!\n")
                                sys.stdout.flush()
                                result = c_res
                                result = restore_devanagari(result, deva_registry, _mark_skt)
                                result = restore_iast_lines(result, iast_registry)
                                result = restore_br(result)
                                result = restore_structure(result, struct_registry)
                                return result, ph_attempt
                            else:
                                claude_qc_failed = True
                                claude_qc_reason = f"Dropped {len(c_missing_deva)} Devanagari placeholders"
                                
                        sys.stdout.write(f"[{target_lang}] [Stufe 4] Claude QC failed ({claude_qc_reason}). Final Failure.\n")
                        sys.stdout.flush()
                        return f"ERROR: Quality Control Failed (Stufe 4) - {claude_qc_reason}", ph_attempt

                missing = [k for k in deva_registry if k not in result]
                if len(missing) < len(best_missing):
                    best_result = result
                    best_missing = missing
                if not missing:
                    result = restore_devanagari(result, deva_registry, _mark_skt)
                    result = restore_iast_lines(result, iast_registry)
                    result = restore_br(result)
                    result = restore_structure(result, struct_registry)
                    return result, ph_attempt

                if ph_attempt < max_ph_retries - 1:
                    sys.stdout.write(
                        f"[{target_lang}] Placeholder drop ({len(missing)}): "
                        f"{missing[:3]}{'…' if len(missing) > 3 else ''} "
                        f"— retrying ({ph_attempt + 2}/{max_ph_retries}, T={temperature})...\n"
                    )
                    sys.stdout.flush()
                break
            except Exception as e:
                err_str = str(e)
                wait_time = (2 ** attempt) * 5

                err_lower = err_str.lower()
                is_local = 'localhost' in current_api_url or '127.0.0.1' in current_api_url or 'nyx.local' in current_api_url
                if is_local and ("exit 28" in err_str or "timeout" in err_lower or "500" in err_str or "exit 7" in err_str or "exit 56" in err_str or "exit 52" in err_str or "refused" in err_lower or "choices" in err_lower):
                    ts = time.strftime('%H:%M:%S')
                    sys.stdout.write(f"\n[{ts}] [{target_lang}] Temporary connection issue ({err_str}). Retrying HTTP request in {wait_time}s...\n")
                    sys.stdout.flush()

                if "prefill_memory_exceeded" in err_str or "prefill_memory_exceeded" in err_lower:
                    sys.stdout.write(f"\n[!] oMLX Prefill Memory Guard error: {err_str}\nSkipping immediately to next fallback tier...\n")
                    sys.stdout.flush()
                    break

                if "API Error" in err_str:
                    if "'code': 404" in err_str or "'code': 400" in err_str:
                        sys.stdout.write(f"\n[!] API Error 400/404 (Bad Request/Model not found): {err_str}\nSkipping to next fallback tier...\n")
                        sys.stdout.flush()
                        break
                    if "'code': 402" in err_str or "'code': 401" in err_str:
                        sys.stdout.write(f"\n[FATAL] Unrecoverable Auth/Credit API Error encountered: {err_str}\nAborting translation completely.\n")
                        sys.stdout.flush()
                        sys.exit(1)

                msg = f"[{time.strftime('%H:%M:%S')}] [{target_lang}] Connection failed (attempt {attempt+1}/{max_retries}): {err_str}. Retrying in {wait_time}s...\n"
                sys.stdout.write(msg)
                sys.stdout.flush()
                time.sleep(wait_time)

        if not got_response:
            if ph_attempt < max_ph_retries - 1:
                sys.stdout.write(f"[{target_lang}] WARNING: API failed. Escalating to next fallback tier (attempt {ph_attempt + 2})...\n")
                sys.stdout.flush()
                continue
            sys.stdout.write(f"[{target_lang}] FATAL: Maximum inner connection retries reached and no more fallback tiers available.\n")
            sys.stdout.flush()
            return f"ERROR: Failed to translate after {max_retries} attempts.", ph_attempt

    sys.stdout.write(
        f"[{target_lang}] WARNING: LLM dropped {len(best_missing)} Devanāgarī "
        f"placeholder(s) after {max_ph_retries} attempts: "
        f"{best_missing[:5]}{'…' if len(best_missing) > 5 else ''}\n"
    )
    sys.stdout.flush()
    if best_result is None:
        best_result = protected
    result = restore_devanagari(best_result, deva_registry, _mark_skt)
    result = restore_iast_lines(result, iast_registry)
    result = restore_br(result)
    result = restore_structure(result, struct_registry)
    return result, max_ph_retries - 1
