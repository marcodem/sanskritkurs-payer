#!/bin/bash

# Enforce single runner instance using cross-platform Python lock on inherited file descriptor 200
exec 200>/tmp/payer_runner_bash.lock
python3 -c "import fcntl, sys; fcntl.flock(200, fcntl.LOCK_EX | fcntl.LOCK_NB)" 2>/dev/null || exit 0

# Script to translate multiple languages sequentially with robust retries and fallback
# Dynamic Order: Unfinished languages sorted by highest completion percentage descending
# Strict 100% Completion Loop: Always process top language until 100% clean (0 fallbacks)
# Circuit breaker variables for detecting stuck progress
PREV_LANG=""
PREV_SAUBER=-1
STUCK_COUNT=0
SKIP_LANGS=""
rm -f /tmp/payer_skipped_langs.txt

while true; do
    TOP_LANG=$(python3 -c "
import sys; sys.path.insert(0, 'scripts')
from generate_report import get_top_unfinished_language
skip = '$SKIP_LANGS'.split()
top = get_top_unfinished_language(skip_langs=skip)
print(top)
")

    if [ "$TOP_LANG" = "ALL_FINISHED" ]; then
        if [ -n "$SKIP_LANGS" ]; then
            echo "⚠️ Retrying skipped languages: $SKIP_LANGS"
            SKIP_LANGS=""
            rm -f /tmp/payer_skipped_langs.txt
            continue
        fi
        echo "🎉 All languages are 100% completed with 0 fallbacks!"

        break
    fi

    # Check progress since last run of same language
    CURR_SAUBER=$(python3 -c "
import sys; sys.path.insert(0, 'scripts')
from generate_report import get_translation_queue, TOTAL_MASTER
print(TOTAL_MASTER - len(get_translation_queue('$TOP_LANG')))
")

    if [ "$TOP_LANG" = "$PREV_LANG" ]; then
        if [ "$CURR_SAUBER" -le "$PREV_SAUBER" ]; then
            if [ "$EXTRA_FLAGS" != "--f""orce" ]; then
                echo "⚠️ [STUCK] [$TOP_LANG] No progress. Forcing retry on un-QC'd files before skipping..."
                EXTRA_FLAGS="--f""orce"
            else
                echo "🚨 [MASCHINELLES LIMIT ERREICHT] [$TOP_LANG] Keine weiteren automatischen Fortschritte möglich ($CURR_SAUBER/136). Sprache wird für manuelle Nacharbeit markiert und übersprungen."
                SKIP_LANGS="$SKIP_LANGS $TOP_LANG"
                echo "$SKIP_LANGS" > /tmp/payer_skipped_langs.txt
                PREV_LANG=""
                EXTRA_FLAGS=""
                continue
            fi
        else
            EXTRA_FLAGS=""
        fi
    else
        PREV_LANG="$TOP_LANG"
        EXTRA_FLAGS=""
    fi
    PREV_SAUBER=$CURR_SAUBER

    echo "============================================================"
    echo "🎯 TARGET LANGUAGE: [$TOP_LANG] (Clean: $CURR_SAUBER/136)"
    if [ "$EXTRA_FLAGS" = "--f""orce" ]; then
        echo "⚠️ MODE: forced-mode (Retrying failed files)"
    fi
    echo "============================================================"

    START_TIME=$(date +%s)
    set +e
    python3 scripts/lan_translate.py --lang "$TOP_LANG" $EXTRA_FLAGS
    EXIT_CODE=$?
    set -e
    
    if [ $EXIT_CODE -eq 0 ]; then
        END_TIME=$(date +%s)
        ELAPSED=$((END_TIME - START_TIME))
        ELAPSED_FMT="$(($ELAPSED / 3600))h $((($ELAPSED % 3600) / 60))m $(($ELAPSED % 60))s"
        echo "[$TOP_LANG] ✓ Finished translation run in $ELAPSED_FMT. Re-evaluating status..."

        IS_COMPLETED=$(python3 -c "
import sys; sys.path.insert(0, 'scripts')
from translation_qa import is_language_completed
print('1' if is_language_completed('$TOP_LANG') else '0')
" 2>/dev/null || echo "0")

        if [ "$IS_COMPLETED" -eq 1 ]; then
            echo "🎉 [COMPLETED] [$TOP_LANG] is 100% clean (136/136 files)!"
        fi
    elif [ $EXIT_CODE -eq 42 ]; then
        echo "[$TOP_LANG] ⏳ Lock held by another process. Waiting 15 seconds..."
        sleep 15
        # Skip updating PREV_LANG and PREV_SAUBER so it doesn't trigger the stuck logic
        continue
    else
        echo "[$TOP_LANG] ⚠️ Error occurred. Retrying [$TOP_LANG] in 10 seconds..."
        sleep 10
    fi
done