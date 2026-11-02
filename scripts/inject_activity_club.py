#!/usr/bin/env python3
"""Inject the Free Activity Club client into deployed HTML pages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_site"
TAG = '<script defer src="/activity-club.js"></script>'


def main() -> None:
    changed = 0
    for path in DEST.rglob("*.html"):
        rel = path.relative_to(DEST)
        if rel.parts and rel.parts[0] == "emma-bellori-books":
            continue
        text = path.read_text(encoding="utf-8")
        if TAG in text or "</body>" not in text:
            continue
        path.write_text(text.replace("</body>", f"  {TAG}\n</body>", 1), encoding="utf-8")
        changed += 1
    print(f"Injected Activity Club client into {changed} deployed HTML pages.")


if __name__ == "__main__":
    main()
