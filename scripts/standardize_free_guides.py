#!/usr/bin/env python3
"""Make every free guide follow the complete 'How to Help Kids Learn From Mistakes' layout."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_site"
GUIDES = DEST / "guides"
DATA = ROOT / "growth" / "guides.json"
CATALOG = ROOT / "catalog.json"

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

# Explicit, topic-matched books for the hand-written guides.
BOOK_BY_GUIDE = {
    "child-gets-angry-after-losing": "mad",
    "games-to-practice-losing-gracefully": "mad",
    "help-child-feel-left-out": "play",
    "help-kids-handle-losing": "mad",
    "help-kids-learn-at-their-own-pace": "reindeer",
    "help-kids-learn-from-mistakes": "mistakes",
    "help-kids-sleep-independently": "i-cant-sleep-without-you",
    "screen-free-animal-activities-for-kids": "cute-animals-bold-easy",
    "screen-free-bug-detective-activities-for-kids": "bugs",
    "screen-free-christmas-activities-for-kids": "christmas",
    "screen-free-halloween-activities-for-kids": "halloween",
    "screen-free-imagination-activities-for-kids": "door-teapot",
    "teach-kids-good-sportsmanship": "mad",
}

def plain_title(path: Path) -> str:
    source = path.read_text(encoding="utf-8")
    match = re.search(r"<h1\\b[^>]*>(.*?)</h1>", source, flags=re.I | re.S)
    return html.unescape(re.sub(r"<[^>]+>", "", match.group(1))).strip() if match else path.stem.replace("-", " ").title()

def related_for(path: Path, generated: dict[str, dict], all_items: list[dict]) -> list[tuple[str, str]]:
    slug = path.stem
    if slug in RELATED:
        return [(s, plain_title(GUIDES / f"{s}.html")) for s in RELATED[slug] if (GUIDES / f"{s}.html").exists()][:3]
    item = generated.get(slug)
    if not item:
        return []
    candidates: list[tuple[str, str]] = []
    hub = item.get("hub", "")
    hub_path = GUIDES / hub
    if hub_path.exists():
        candidates.append((Path(hub).stem, plain_title(hub_path)))
    siblings = [x for x in all_items if x.get("cluster") == item.get("cluster") and x.get("slug") != slug]
    for sibling in siblings:
        if len(candidates) >= 3:
            break
        candidates.append((sibling["slug"], sibling["title"]))
    for other in all_items:
        if len(candidates) >= 3:
            break
        if other.get("slug") != slug and all(other["slug"] != x[0] for x in candidates):
            candidates.append((other["slug"], other["title"]))
    return candidates[:3]

def book_card(book: dict) -> str:
    title = html.escape(book["title"])
    cover = html.escape("../" + book["cover"], quote=True)
    url = html.escape(book["amazonUrl"], quote=True)
    description = html.escape(book.get("theme") or book.get("description") or "A story to explore this topic together.")
    book_id = html.escape(book["id"], quote=True)
    return (
        '<aside class="book-recommendation" aria-label="Related children\'s book">'
        f'<img src="{cover}" alt="Cover of {title} by Emma Bellori" width="400" height="600">'
        '<div><p class="book-kicker">A story to explore together</p>'
        f'<h2>{title}</h2><p>{description}</p>'
        f'<a class="amazon-cta" href="{url}" data-book-id="{book_id}" '
        'data-placement="guide_companion_amazon_top" target="_blank" '
        'rel="noopener noreferrer sponsored">See the book on Amazon ↗</a></div></aside>'
    )

def remove_legacy_ctas(source: str) -> str:
    # Remove old bottom-of-article product/story panels and their multiple-button rows.
    source = re.sub(
        r'<section\\b[^>]*>(?:(?!</section>).)*?(?:class=["\'][^"\']*guide-links|Explore a related story|Discover the story behind the activities|Start with a story|printable activity kits|playful way to practice losing)(?:(?!</section>).)*?</section>',
        "",
        source, flags=re.I | re.S,
    )
    source = re.sub(r'<section\\b[^>]*>\\s*<h2\\b[^>]*>\\s*(?:More ideas for families|More free family guides)\\s*</h2>[\\s\\S]*?</section>', "", source, flags=re.I)
    source = re.sub(r'<div class=["\']guide-links["\'][^>]*>[\\s\\S]*?</div>', "", source, flags=re.I)
    source = re.sub(r'<section class=["\']guide-extra guide-companion["\'][^>]*>[\\s\\S]*?</section>', "", source, flags=re.I)
    return source

def main() -> None:
    if not GUIDES.exists():
        raise SystemExit("Built guides directory not found")
    items = json.loads(DATA.read_text(encoding="utf-8"))
    generated = {x["slug"]: x for x in items}
    books = {x["id"]: x for x in json.loads(CATALOG.read_text(encoding="utf-8"))
             if x.get("status") == "published" and x.get("amazonUrl", "").startswith("https://www.amazon.com/dp/")}
    pages = sorted(p for p in GUIDES.glob("*.html") if p.name != "index.html")
    changed = 0
    for path in pages:
        source = path.read_text(encoding="utf-8")
        if "</main>" not in source:
            continue
        source = remove_legacy_ctas(source)
        # Replace prior standardized ending to make the build repeatable.
        source = re.sub(r'<div class=["\']guide-end-marker["\'][^>]*>[\\s\\S]*?</section>\\s*', "", source, flags=re.I)
        source = re.sub(r'<section class=["\']related-guides["\'][^>]*>[\\s\\S]*?</section>\\s*', "", source, flags=re.I)

        slug = path.stem
        item = generated.get(slug, {})
        book_id = BOOK_BY_GUIDE.get(slug) or item.get("book_id")
        book = books.get(book_id)
        if book and not re.search(r'<aside class=["\']book-recommendation["\']', source, flags=re.I):
            card = book_card(book)
            meta = re.search(r'(<p\\b[^>]*class=["\'][^"\']*guide-meta[^"\']*["\'][^>]*>[\\s\\S]*?</p>)', source, flags=re.I)
            if meta:
                source = source[:meta.end()] + "\\n\\n    " + card + source[meta.end():]
            else:
                source = source.replace("</main>", card + "</main>", 1)

        cards = related_for(path, generated, items)
        if cards:
            links = "".join(
                f'<a class="related-guide-link" href="{html.escape(slug, quote=True)}.html">{html.escape(title)}</a>'
                for slug, title in cards
            )
            block = (
                '<div class="guide-end-marker" role="separator" aria-label="End of this guide">End of this guide</div>'
                '<section class="related-guides" aria-labelledby="related-guides-title">'
                '<h2 id="related-guides-title">Explore this topic further</h2>'
                '<p class="related-intro">If you would like to keep exploring, these free guides cover other everyday challenges children may experience.</p>'
                f'<nav class="related-guide-list" aria-label="Related family guides">{links}</nav></section>'
            )
            source = source.replace("</main>", block + '\\n  </main>', 1)

        # One simple text link after the cards, matching the reference guide.
        if not re.search(r'class=["\']guide-footer-links["\']', source):
            source = source.replace("</main>", '<p class="guide-footer-links"><a href="../index.html#parenting-guides">Browse all free family guides</a></p></main>', 1)

        # Load shared styles last so the reference layout is identical on every page.
        if "guide-related.css" in source:
            source = re.sub(r'<link[^>]+href=["\'](?:\\./)?guide-related\\.css["\'][^>]*>', "", source, flags=re.I)
        source = re.sub(r"</head>", '<link rel="stylesheet" href="guide-related.css"></head>', source, count=1, flags=re.I)
        path.write_text(source, encoding="utf-8")
        changed += 1
    print(f"Applied the complete reference layout to {changed} free guides.")

if __name__ == "__main__":
    main()
