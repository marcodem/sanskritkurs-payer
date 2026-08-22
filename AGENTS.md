# Payer Project Guidelines

> [!IMPORTANT]
> Non-German content: follow `TRANSLATION_GUIDE.md`. Public metatext/commits MUST be English.

## 1. Visuals & Layout
- **Colors & Type**: `newsreader` (serif) for body, `inter` (sans) for UI. Primary `#03192e`, Background `#fcf9f2`.
- **Sanskrit/Devanāgarī Rules**: NO italics (`*...*`). NO red for Latin text. Use signal red (`sig[...]`) and `⟪...⟫` ONLY for Devanāgarī. NO parentheses for Devanāgarī in tables. 
- **Layout**: 12-column grid. Lesson numbers absolute (`60.1.`). Localized titles (`# Lesson X`). NO raw HTML (`scripts/purge_html.py`).
- **Lists & Tables**: Sub-entries in `::: indent` without bullets. Multi-line table cells use `:br` on one line.
- **Images & Metadata**: Wrap in `::: media`. 1-line caption. Metadata under `### Quellen` inside `::: deleteme-box`.

## 2. Grammar-Box Boundaries
- Mirror HTML indent. NO `>` blockquotes for tables/examples.
- Direct speech & Examples stay OUTSIDE `grammar-box` (examples in `::: indent`). 
- Fragmented rules get separate boxes. Nested boxes increment colons (`:::: grammar-box`).

## 3. Translation Pipeline
- **TOTALBREMSE**: `docs/lektionen/*.md` and 100% completed languages are read-only.
- **Queue/Status Truth**: Exclusively use `get_translation_queue` in `scripts/translation_qa.py`. Never duplicate QA/status logic.
- **Chunking/LLM**: `MAX_CHUNK`=1500 chars. YAML translated in 1 pass. `ERROR:` strings strictly forbidden in TM.
- **Execution**: 100% local via `http://nyx.local:8000` (max 1 process). Absolute paths REQUIRED for daemons/subprocess. 
- **Resumption**: New languages build from scratch. System restarts resume without `-f`.
- **Fallbacks**: Rm fallback is DE. Sonnet 5 is the Stufe 4 model fallback.
- **Stufe 5 Manöver**: On translation deadlocks, autonomously run `scratch/llm_fix_tms.py` to purge TM residues, then `lan_translate.py --force`.

## 4. Agent Behavior & Operations
- **Communication**: ZERO fluff, praise, or storytelling. Maximum technical brevity. NO LaTeX math (use raw Unicode e.g. `=>`, `≈`).
- **Reports**: Cronjobs must trigger `generate_report.py` and output an aligned markdown table showing ALL languages, timestamp, and progress delta.
- **Verification Gate**: QA/Audit scripts are READ-ONLY. Code changes MUST pass `python3 -m py_compile` and a live test run (Exit 0) before reporting done. 
- **Release**: User command `release vX.Y.Z` triggers full cycle: commit (`X.Y.Z (build)`), tag, push, `gh release create`.

<!-- GSD Configuration -->
# Instructions for GSD
- Treat `gsd-...` as command invocations from `.github/skills/gsd-*`.
- Spawn subagents from `.github/agents`. Do not apply workflows without request.
- Always offer `ask_user` loop after a GSD command finishes.
