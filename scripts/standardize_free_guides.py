#!/usr/bin/env python3
"""Apply one consistent end-of-guide and related-guide card pattern to every free guide.

Runs against the built _site so it covers both hand-authored guides and pages
generated from growth/guides.json without overwriting their editorial content.
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_site"
GUIDES = DEST / "guides"
DATA = ROOT / "growth" / "guides.json"

# Curated cross-links for the original editorial guides. Each page receives
# three useful next reads; companion-book and printable sections remain intact.
RELATED = {
    "child-gets-angry-after-losing": ["help-kids-handle-losing", "teach-kids-good-sportsmanship", "games-to-practice-losing-gracefully"],
    "games-to-practice-losing-gracefully": ["help-kids-handle-losing", "child-gets-angry-after-losing", "teach-kids-good-sportsmanship"],
    "help-child-feel-left-out": ["help-kids-learn-at-their-own-pace", "help-kids-sleep-independently", "help-kids-learn-from-mistakes"],
    "help-kids-handle-losing": ["child-gets-angry-after-losing", "teach-kids-good-sportsmanship", "games-to-practice-losing-gracefully"],
    "help-kids-learn-at-their-own-pace": ["help-child-feel-left-out", "help-kids-learn-from-mistakes", "help-kids-sleep-independently"],
    "help-kids-learn-from-mistakes": ["help-kids-learn-at-their-own-pace", "help-child-feel-left-out", "help-kids-handle-losing"],
    "help-kids-sleep-independently": ["help-child-feel-left-out", "help-kids-learn-at-their-own-pace", "help-kids-learn-from-mistakes"],
    "screen-free-animal-activities-for-kids": ["screen-free-imagination-activities-for-kids", "screen-free-bug-detective-activities-for-kids", "screen-free-christmas-activities-for-kids"],
    "screen-free-bug-detective-activities-for-kids": ["screen-free-animal-activities-for-kids", "screen-free-imagination-activities-for-kids", "screen-free-halloween-activities-for-kids"],
    "screen-free-christmas-activities-for-kids": ["screen-free-halloween-activities-for-kids", "screen-free-imagination-activities-for-kids", "screen-free-animal-activities-for-kids"],
    "screen-free-halloween-activities-for-kids": ["screen-free-christmas-activities-for-kids", "screen-free-imagination-activities-for-kids", "screen-free-animal-activities-for-kids"],
    "screen-free-imagination-activities-for-kids": ["screen-free-bug-detective-activities-for-kids", "screen-free-animal-activities-for-kids", "screen-free-christmas-activities-for-kids"],
    "teach-kids-good-sportsmanship": ["help-kids-handle-losing", "child-gets-angry-after-losing", "games-to-practice-losing-gracefully"],
}

def plain_title(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"<h1\b[^>]*>(.*?)</h1>", text, flags=re.I | re.S)
    if match:
        return html.unescape(re.sub(r"<[^>]+>", "", match.group(1))).strip()
    return path.stem.replace("-", " ").title()

def related_for(path: Path, generated: dict[str, dict], all_items: list[dict]) -> list[tuple[str, str]]:
    slug = path.stem
    if slug in RELATED:
        candidates = RELATED[slug]
        return [(s, plain_title(GUIDES / f"{s}.html")) for s in candidates if (GUIDES / f"{s}.html").exists()][:3]

    item = generated.get(slug)
    if not item:
        return []
    # For generated cluster articles, lead back to their editorial hub and
    # then offer two sibling reads from the same topic cluster.
    hub = item.get("hub", "")
    candidates: list[tuple[str, str]] = []
    hub_path = GUIDES / hub
    if hub_path.exists():
        candidates.append((Path(hub).stem, plain_title(hub_path)))
    siblings = [x for x in all_items if x.get("cluster") == item.get("cluster") and x.get("slug") != slug]
    for sibling in siblings:
        if len(candidates) >= 3:
            break
        candidates.append((sibling["slug"], sibling["title"]))
    # Keep exactly three cards where possible; fill from other clusters only
    # if a small cluster does not provide enough sibling pages.
    for other in all_items:
        if len(candidates) >= 3:
            break
        if other.get("slug") != slug and all(other["slug"] != x[0] for x in candidates):
            candidates.append((other["slug"], other["title"]))
    return candidates[:3]

def main() -> None:
    if not GUIDES.exists():
        raise SystemExit("Built guides directory not found")
    items = json.loads(DATA.read_text(encoding="utf-8"))
    generated = {x["slug"]: x for x in items}
    pages = sorted(p for p in GUIDES.glob("*.html") if p.name != "index.html")
    changed = 0
    for path in pages:
        text = path.read_text(encoding="utf-8")
        if "</main>" not in text:
            continue
        # Remove legacy link-only sections; preserve all companion-book,
        # printable, activity and external-reference sections.
        text = re.sub(
            r'<section\b[^>]*>\s*<h2\b[^>]*>\s*(?:More ideas for families|More free family guides)\s*</h2>[\s\S]*?</section>',
            "",
            text,
            flags=re.I,
        )
        # Replace any earlier version of the standardized block idempotently.
        text = re.sub(r'<div class="guide-end-marker"[^>]*>[\s\S]*?</section>\s*', "", text, flags=re.I)
        text = re.sub(r'<section class="related-guides"[^>]*>[\s\S]*?</section>\s*', "", text, flags=re.I)

        cards = related_for(path, generated, items)
        if not cards:
            continue
        links = "".join(
            f'<a class="related-guide-link" href="{html.escape(slug, quote=True)}.html">{html.escape(title)}</a>'
            for slug, title in cards
        )
        block = (
            '<div class="guide-end-marker" role="separator" aria-label="End of this guide">End of this guide</div>'
            '<section class="related-guides" aria-labelledby="related-guides-title">'
            '<h2 id="related-guides-title">Explore this topic further</h2>'
            '<p class="related-intro">If you would like to keep exploring, these free guides cover other everyday challenges and activities for children.</p>'
            f'<nav class="related-guide-list" aria-label="Related family guides">{links}</nav>'
            '</section>'
        )
        text = text.replace("</main>", block + "</main>", 1)

        # Load the shared presentation layer on every free-guide page.
        if "guide-related.css" not in text:
            href = "guide-related.css"
            link = f'<link rel="stylesheet" href="{href}">'
            text = re.sub(r"</head>", link + "</head>", text, count=1, flags=re.I)
        path.write_text(text, encoding="utf-8")
        changed += 1
    print(f"Standardized the ending and related-guide cards on {changed} free guides.")

if __name__ == "__main__":
    main()
