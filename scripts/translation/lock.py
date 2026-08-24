"""
Process lock management to enforce single-process execution on nyx.local with stale lock auto-clearing.
"""

import os
import sys
import time
import datetime
import fcntl
import signal
from .config import LOCK_FILE_PATH, STALE_LOCK_SEC

_nyx_lock_file = None

def is_pid_running(pid):
    """Check if process PID is running."""
    if pid <= 0:
        return False
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False

def acquire_nyx_lock():
    global _nyx_lock_file

    # Try non-destructive lock check
    try:
        fd = os.open(LOCK_FILE_PATH, os.O_RDWR | os.O_CREAT, 0o666)
        _nyx_lock_file = os.fdopen(fd, "r+")
        fcntl.flock(_nyx_lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        # Lock acquired cleanly: truncate and write PID & heartbeat
        _nyx_lock_file.seek(0)
        _nyx_lock_file.truncate()
        _nyx_lock_file.write(f"PID: {os.getpid()}\nTime: {datetime.datetime.now()}\n")
        _nyx_lock_file.flush()
        return
    except (IOError, OSError):
        # Lock is held by another process: check age of lock without truncating mtime
        lock_pid = 0
        age_sec = 0
        try:
            mtime = os.path.getmtime(LOCK_FILE_PATH)
            age_sec = time.time() - mtime
            with open(LOCK_FILE_PATH, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if line.startswith("PID:"):
                        lock_pid = int(line.split(":")[1].strip())
                        break
        except Exception:
            pass

        # If holding process is dead OR lock mtime age > STALE_LOCK_SEC, force kill holding process
        if (lock_pid > 0 and not is_pid_running(lock_pid)) or age_sec > STALE_LOCK_SEC:
            sys.stdout.write(f"[!] Auto-Clearing Stale Lock File (PID {lock_pid}, Age {age_sec:.0f}s > {STALE_LOCK_SEC}s)...\n")
            sys.stdout.flush()
            if lock_pid > 0 and is_pid_running(lock_pid):
                try:
                    os.kill(lock_pid, signal.SIGKILL)
                except Exception:
                    pass

            # Retry lock acquisition with short backoff while OS releases lock during process teardown
            for retry in range(5):
                time.sleep(1.0)
                try:
                    fcntl.flock(_nyx_lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    _nyx_lock_file.seek(0)
                    _nyx_lock_file.truncate(0)
                    _nyx_lock_file.write(f"PID: {os.getpid()}\nTime: {datetime.datetime.now()}\n")
                    _nyx_lock_file.flush()
                    return
                except Exception:
                    pass

        sys.stderr.write(f"\n[!] FATAL LOCK ERROR: Another active translation process (PID {lock_pid}) is running and holding {LOCK_FILE_PATH}.\n")
        sys.stderr.write(f"[!] Single-process rule enforced: Exiting process PID {os.getpid()} immediately.\n\n")
        sys.exit(42)

def touch_nyx_lock_heartbeat():
    """Touch lock file mtime to maintain active heartbeat."""
    global _nyx_lock_file
    if _nyx_lock_file and not _nyx_lock_file.closed:
        try:
            _nyx_lock_file.seek(0)
            _nyx_lock_file.truncate(0)
            _nyx_lock_file.write(f"PID: {os.getpid()}\nTime: {datetime.datetime.now()}\n")
            _nyx_lock_file.flush()
            os.utime(LOCK_FILE_PATH, None)
        except Exception:
            pass

