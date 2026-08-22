#!/usr/bin/env python3
"""
Retroactive Nyquist (Semantic Round-Trip) Checker for completed translation languages.
Iterates over all chunks in a language's Translation Memory, evaluates them,
and optionally deletes failed chunks and target files to trigger re-translation.
"""

import sys
import os
import re
import json
import urllib.request
import argparse
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts.translation.config import API_URL, MODEL, LANG_NAMES
from scripts.translation.chunker import hash_chunk, chunk_content
from scripts.translation.file_processor import load_tm, save_tm
from scripts.translation_qa import get_translation_queue_files

def nyquist_check(target_lang, source_text, translated_text):
    prompt = f"Translate the following {target_lang} text into English. Output ONLY the English translation without any notes or formatting:\n\n{translated_text}"
    data = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 8192
    }
    
    try:
        req = urllib.request.Request(
            API_URL,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Authorization': 'Bearer local'}
        )
        with urllib.request.urlopen(req, timeout=300) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            if 'error' in res_data:
                return False, f"API Error: {res_data['error']}"
            back_text = res_data['choices'][0]['message']['content']
            
            def get_keywords(t):
                return set(re.findall(r'\b[a-zA-Z]{5,}\b', t.lower()))
            
            src_words = get_keywords(source_text)
            back_words = get_keywords(back_text)
            
            if not src_words:
                return True, ""
                
            intersection = src_words.intersection(back_words)
            ratio = len(intersection) / len(src_words)
            
            if ratio < 0.15:
                return False, f"Match: {ratio*100:.1f}%"
            else:
                return True, f"Match: {ratio*100:.1f}%"
    except Exception as e:
        return False, f"Exception: {str(e)}"

def split_frontmatter(content):
    parts = content.split('---')
    if len(parts) >= 3 and content.startswith('---'):
        return parts[1], '---'.join(parts[2:])
    return "", content

def main():
    parser = argparse.ArgumentParser(description="Retroactive Nyquist Check for a specific language.")
    parser.add_argument("--lang", required=True, help="Target language code (e.g. el, pt, zu)")
    parser.add_argument("--fix", action="store_true", help="Delete failed chunks from TM and delete target MD file")
    args = parser.parse_args()

    lang = args.lang
    if lang not in LANG_NAMES and lang != 'de':
        print(f"Error: Unknown language {lang}")
        sys.exit(1)

    print(f"Loading TM for {lang}...")
    tm = load_tm(lang)
    if not tm:
        print(f"TM for {lang} is empty or doesn't exist.")
        sys.exit(0)

    # Use "en" just to get the source file paths
    pairs = get_translation_queue_files("en")
    
    total_checked = 0
    total_failed = 0
    modified = False

    for src_path, _ in pairs:
        if not src_path.exists():
            continue
            
        real_tgt_path = ROOT / "docs" / lang / src_path.relative_to(ROOT / "docs")
        
        with open(src_path, "r", encoding="utf-8") as f:
            src_content = f.read()
            
        _, body = split_frontmatter(src_content)
        chunks = chunk_content(body)
        
        file_failed = False
        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue
                
            h = hash_chunk(chunk)
            if h in tm and not tm[h].startswith("ERROR:"):
                translated_text = tm[h]
                total_checked += 1
                
                print(f"[{lang}] Checking {src_path.name} chunk {i+1}/{len(chunks)}...", end="", flush=True)
                passed, reason = nyquist_check(lang, chunk, translated_text)
                
                if passed:
                    print(f" [PASS] ({reason})")
                else:
                    print(f" [FAIL] ({reason})")
                    total_failed += 1
                    file_failed = True
                    if args.fix:
                        del tm[h]
                        modified = True
                        
        if file_failed and args.fix:
            if real_tgt_path.exists():
                print(f"[{lang}] Deleting target file {real_tgt_path.name} to trigger re-translation...")
                real_tgt_path.unlink()
                
    if modified and args.fix:
        print("Saving modified TM...")
        save_tm(lang, tm)
        
    print("\n--- Summary ---")
    print(f"Total chunks checked: {total_checked}")
    print(f"Total failed: {total_failed}")
    if args.fix:
        print("Fix mode was ON. Failed chunks were removed from TM.")

if __name__ == "__main__":
    main()
