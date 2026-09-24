#!/usr/bin/env python3
"""
ia_upload_slow.py: upload the Solidarity items to the Internet Archive one at a time, slowly.

    cd ~/solidarity_archive
    python3 ~/ecraw4d.github.io/ecraw4d.github.io/tools/solidarity/ia_upload_slow.py ia_issues.csv

Why: uploading hundreds of new items back to back makes the Internet Archive's spam filter
refuse them ("Please reduce your request rate ... appears to be spam"). This script:
  * skips items that are already complete on the Internet Archive,
  * uploads one item, then waits (default 3 minutes) before the next,
  * when the Internet Archive pushes back, waits 30 minutes and tries the same item again,
  * stops after 3 refusals in a row, so you can email info@archive.org (see UPLOAD_GUIDE.md).

Safe to stop (Ctrl+C) and re-run any time. Uses the same `ia` login as before.
Options:  --pause 180   seconds between items      --backoff 1800   seconds after a refusal
"""
import argparse, csv, subprocess, sys, tempfile, time
from pathlib import Path


def ia(*args):
    return subprocess.run(["ia", *args], capture_output=True, text=True)


def on_archive(identifier):
    """File names already uploaded to this item (empty set if the item doesn't exist)."""
    r = ia("list", identifier)
    return set(r.stdout.split()) if r.returncode == 0 else set()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spreadsheet")
    ap.add_argument("--pause", type=int, default=180)
    ap.add_argument("--backoff", type=int, default=1800)
    a = ap.parse_args()

    rows = list(csv.DictReader(open(a.spreadsheet, newline="")))
    fields = list(rows[0].keys())
    items = {}
    for r in rows:
        items.setdefault(r["identifier"], []).append(r)

    todo = []
    print(f"Checking {len(items)} items on the Internet Archive (takes a few minutes)...", flush=True)
    # one search finds which items exist at all, so only those need a per-item file check
    existing = set(ia("search", "identifier:iww-solidarity-*", "--itemlist").stdout.split())
    print(f"  {len(existing)} items exist on the Internet Archive so far", flush=True)
    for i, (ident, group) in enumerate(items.items(), 1):
        need = {Path(r["file"]).name for r in group}
        if ident not in existing or not need <= on_archive(ident):
            todo.append(ident)
        if i % 25 == 0:
            print(f"  checked {i}/{len(items)}", flush=True)
    print(f"{len(items) - len(todo)} already complete, {len(todo)} to upload.\n")

    refusals = 0
    for n, ident in enumerate(todo, 1):
        while True:
            with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, newline="") as fh:
                w = csv.DictWriter(fh, fieldnames=fields)
                w.writeheader(); w.writerows(items[ident])
            r = ia("upload", f"--spreadsheet={fh.name}", "--checksum", "--retries", "5", "--sleep", "60")
            Path(fh.name).unlink()
            out = r.stdout + r.stderr
            if "reduce your request rate" in out or "appears to be spam" in out or "global_limit" in out:
                refusals += 1
                if refusals >= 3:
                    sys.exit(f"\nStopped at {ident}: the Internet Archive refused 3 times in a row.\n"
                             "Email info@archive.org (see UPLOAD_GUIDE.md), then run this again later.")
                print(f"[{n}/{len(todo)}] {ident}: refused, waiting {a.backoff // 60} min and retrying", flush=True)
                time.sleep(a.backoff)
                continue
            if r.returncode != 0 or "error" in out.lower():
                print(f"[{n}/{len(todo)}] {ident}: FAILED\n{out[-500:]}", flush=True)
            else:
                print(f"[{n}/{len(todo)}] {ident}: uploaded", flush=True)
            refusals = 0
            break
        time.sleep(a.pause)
    print("\nAll done. Re-run once more later to confirm everything is complete.")


if __name__ == "__main__":
    main()
