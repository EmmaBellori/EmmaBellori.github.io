#!/usr/bin/env python3
"""Inject the consent-aware conversion tracking module into deployed HTML pages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_site"
TAG = '<script defer src="/conversion-tracking.js"></script>'


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
    print(f"Injected conversion tracking into {changed} deployed HTML pages.")


if __name__ == "__main__":
    main()
