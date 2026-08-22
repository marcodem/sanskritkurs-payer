#!/usr/bin/env python3
"""
CLI entry point for the Sanskritkurs Payer Translation Pipeline.
Delegates heavy translation orchestration to the `translation` module.
"""

import sys
import os
import time
import glob
import re
import subprocess

from translation.config import (
    BASE_DIR, SOURCE_DIR, LANGUAGES, LANG_NAMES, LESSONS, MODEL, API_URL,
    SONNET_MODEL, SONNET_API_URL
)
from translation.lock import acquire_nyx_lock
from translation.file_processor import (
    translate_file, translate_main_pages, sync_missing_master_files,
    fix_lesson_links, fix_home_links, chunk_content, load_tm, save_tm, hash_chunk
)
from translation.session_manager import clear_force_session, is_language_completed
from translation.quality_control import (
    scan_german_residues, sonnet_patch_residues, log_failure
)
from translation import config, client

def parse_lesson_args(args):
    """Parse lesson number arguments. Returns (lesson_nums, translate_all)."""
    if not args or args[0] == "all":
        return LESSONS, True
    nums = []
    for a in args:
        if "-" in a and not a.startswith("-"):
            parts = a.split("-", 1)
            try:
                start, end = int(parts[0]), int(parts[1])
                nums.extend(range(start, end + 1))
            except ValueError:
                print(f"Warning: ignoring invalid range '{a}'")
        else:
            try:
                nums.append(int(a))
            except ValueError:
                print(f"Warning: ignoring non-numeric argument '{a}'")
    return nums, False

def parse_lang_args(args):
    """Extract --lang/-l, --force/-f, --pages/-p, --api, --model options from args."""
    languages = []
    force = False
    pages_only = False
    api_url = None
    model_id = None
    remaining = []
    i = 0
    while i < len(args):
        if args[i] in ("--lang", "-l") and i + 1 < len(args):
            codes = [c.strip() for c in args[i + 1].split(",")]
            invalid = [c for c in codes if c not in LANGUAGES]
            if invalid:
                print(f"Error: unknown language code(s): {', '.join(invalid)}")
                print(f"Valid codes: {', '.join(LANGUAGES)}")
                sys.exit(1)
            languages = codes
            i += 2
        elif args[i] == "--api" and i + 1 < len(args):
            api_url = args[i + 1]
            i += 2
        elif args[i] == "--model" and i + 1 < len(args):
            model_id = args[i + 1]
            i += 2
        elif args[i] in ("--force", "-f"):
            force = True
            i += 1
        elif args[i] in ("--pages", "-p"):
            pages_only = True
            i += 1
        else:
            remaining.append(args[i])
            i += 1
    return languages, force, pages_only, api_url, model_id, remaining

def _fmt_elapsed(seconds):
    m, s = divmod(int(seconds), 60)
    return f"{m}m {s}s" if m else f"{s}s"

def main():
    args = sys.argv[1:]
    if not args:
        print("Usage: python3 scripts/lan_translate.py --lang CODE[,CODE...] [-f] [-p] <all | lesson_num | start-end | num1 num2 ...>")
        print("Options:")
        print("  --lang/-l CODE[,CODE...]  (REQUIRED) translate only the given language(s)")
        print("  --force/-f                skip mtime check and always retranslate")
        print("  --pages/-p                translate only site-level pages (index, grammatik, impressum…)")
        print("Examples:")
        print("  python3 scripts/lan_translate.py --lang he all")
        print("  python3 scripts/lan_translate.py --lang he 28")
        print("  python3 scripts/lan_translate.py --lang it,es 28-32")
        print("  python3 scripts/lan_translate.py --lang it,es 28 29 30")
        print("  python3 scripts/lan_translate.py -l en -f 10")
        print("  python3 scripts/lan_translate.py --lang la --pages")
        sys.exit(1)

    active_languages, force, pages_only, new_api, new_model, remaining_args = parse_lang_args(args)

    if new_api:
        config.API_URL = new_api
        client.API_URL = new_api
    if new_model:
        config.MODEL = new_model
        client.MODEL = new_model

    if not active_languages:
        print("Error: You must explicitly specify languages using --lang/-l (e.g., --lang he).")
        sys.exit(1)

    if pages_only:
        print(f"Starting translation process using {config.MODEL} at {config.API_URL}...")
        print(f"Language filter: {', '.join(active_languages)}")
        print("Pages-only mode: translating site-level pages only.")
        for lang in active_languages:
            lang_start = time.time()
            print(f"[{lang}] Start: {time.strftime('%H:%M:%S')}")
            translate_main_pages(lang, force=force)
            elapsed = time.time() - lang_start
            print(f"[{lang}] End:   {time.strftime('%H:%M:%S')} — {_fmt_elapsed(elapsed)}")
        return

    lesson_nums, translate_all = parse_lesson_args(remaining_args)

    print(f"Starting translation process using {config.MODEL} at {config.API_URL}...")
    print(f"Language filter: {', '.join(active_languages)}")
    if force:
        print("Force mode: mtime check disabled.")
    for lang in active_languages:
        if force:
            clear_force_session(lang)
        lang_start = time.time()
        print(f"[{lang}] Start: {time.strftime('%H:%M:%S')}")
        sync_missing_master_files(lang)
        # Main pages first
        translate_main_pages(lang, force=force)

        lesson_dir = os.path.join(BASE_DIR, lang, "lektionen")
        os.makedirs(lesson_dir, exist_ok=True)

        # Lessons
        for l_num in lesson_nums:
            filename = f"lektion{l_num:02d}.md"
            source_path = os.path.join(SOURCE_DIR, filename)
            if not os.path.exists(source_path):
                print(f"Source not found: {source_path}")
                continue
            post = lambda t, l=lang: fix_lesson_links(t, l)
            translate_file(source_path, os.path.join(lesson_dir, filename), lang, post_process=post, force=force)

        if translate_all:
            # Scripts & Exercises
            for filename in sorted(os.listdir(SOURCE_DIR)):
                if not (filename.startswith('schrift') or filename.startswith('uebung')):
                    continue
                if not filename.endswith('.md'):
                    continue
                source_path = os.path.join(SOURCE_DIR, filename)
                translate_file(source_path, os.path.join(lesson_dir, filename), lang, force=force)

            # Special files in lektionen/
            for filename in ("wortliste.md", "inhaltsverzeichnis.md", "index.md"):
                src = os.path.join(SOURCE_DIR, filename)
                if os.path.exists(src):
                    def make_post_process(fname):
                        if fname == "inhaltsverzeichnis.md":
                            def post(t, *args):
                                return re.sub(r'(\d+)\\(\d+)\.(\d+)', r'\1\2\\.\3', t)
                            return post
                        return None
                    translate_file(src, os.path.join(lesson_dir, filename), lang, post_process=make_post_process(filename), force=force)

        # Automatic QA Check
        try:
            qa_remnants_script = os.path.join(os.path.dirname(__file__), "qa_german_remnants.py")
            subprocess.run([sys.executable, qa_remnants_script, "--lang", lang], check=False)
        except Exception as e:
            print(f"[{lang}] Warning: QA-Remnants Prüfung fehlgeschlagen: {e}")

        # Automatic Glossary generation
        try:
            glossar_script = os.path.join(os.path.dirname(__file__), "gen_glossar.py")
            subprocess.run([sys.executable, glossar_script, "--lang", lang], check=False)
        except Exception as e:
            print(f"[{lang}] Warning: Glossar-Generierung fehlgeschlagen: {e}")

        elapsed = time.time() - lang_start
        print(f"[{lang}] End:   {time.strftime('%H:%M:%S')} — {_fmt_elapsed(elapsed)}")

        lang_p = os.path.join(BASE_DIR, lang)
        if os.path.exists(lang_p):
            written_files = len([f for f in glob.glob(os.path.join(lang_p, "**/*.md"), recursive=True) if "qa_viewer" not in f and "deleteme" not in f])
        if is_language_completed(lang):
            clear_force_session(lang)
            # Automatic Vector Index Generation
            try:
                vec_script = os.path.join(os.path.dirname(__file__), "build_vector_index.py")
                subprocess.run([sys.executable, vec_script, "--lang", lang], check=False)
            except Exception as e:
                print(f"[{lang}] Warning: Vektorindex-Erstellung fehlgeschlagen: {e}")

            print(f"[{lang}] 🎉 ERFOLG: Sprache '{LANG_NAMES.get(lang, lang)}' ({lang}) 100% sauber abgeschlossen (140/140 Dateien).")

if __name__ == "__main__":
    if not os.environ.get("BYPASS_LOCK"):
        acquire_nyx_lock()
    main()
