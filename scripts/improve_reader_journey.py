#!/usr/bin/env python3
"""Build Emma Bellori's reader-first pages from the published canonical catalog.

Run AFTER build_root_site.py and generate_growth_guides.py. All copy, links and
availability are derived from catalog.json or known free site pages. Future
published books use exactly the same layout without manual page edits.
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_site"
SITE = "https://emmabellori.github.io/"
OVERRIDES = {"door-teapot": "the-door-inside-the-teapot"}
AGE = {
    "Big Feelings, Real Problems": "4–8",
    "Little Christmas Wonders": "4–8",
    "Tiny Doors, Big Adventures": "6–9",
    "Small Town, Many Hands": "5–8",
    "Little Steps, Big Discoveries": "3–6",
    "Junior Detectives": "6–9",
    "My First Sports Adventures": "5–8",
    "My First Earth Adventures": "5–8",
    "Kawaii Coloring & Activities": "4–10",
    "Little Money, Smart Choices": "5–8",
    "More Books by Emma Bellori": "4–9",
}
SERIES_HELP = {
    "Big Feelings, Real Problems": (
        "A starting point for conversations about emotions, confidence and relationships.",
        "Try talking about a feeling or experience from the story together.",
    ),
    "Little Christmas Wonders": (
        "A gentle way to make room for a seasonal story and a shared reading moment.",
        "After reading, ask which small moment felt most meaningful.",
    ),
    "My First Sports Adventures": (
        "An accessible introduction to a sport and the joy of giving something new a try.",
        "Talk about teamwork, patience and what it feels like to learn.",
    ),
    "Kawaii Coloring & Activities": (
        "A relaxed opportunity for coloring, creativity and screen-free time.",
        "Choose a page together and enjoy creating at your own pace.",
    ),
    "Junior Detectives": (
        "A chance to encourage questions, careful noticing and curiosity about the world.",
        "Try observing a tiny detail outdoors or at home.",
    ),
    "Tiny Doors, Big Adventures": (
        "A playful starting point for imagination and storytelling.",
        "Invent a small imaginary doorway and wonder what might be beyond it.",
    ),
}
GUIDE_BY_ID = {
    "mistakes": ("Help kids learn from mistakes", "help-kids-learn-from-mistakes.html"),
    "play": ("Help a child feel included", "help-child-feel-left-out.html"),
    "mad": ("Practice handling losing", "help-kids-handle-losing.html"),
    "i-cant-sleep-without-you": ("Find gentle bedtime steps", "help-kids-sleep-independently.html"),
    "reindeer": ("Learning at your own pace", "help-kids-learn-at-their-own-pace.html"),
    "my-first-ice-hockey-adventure": ("Teaching good sportsmanship", "teach-kids-good-sportsmanship.html"),
    "snowman": ("Screen-free Christmas activities", "screen-free-christmas-activities-for-kids.html"),
    "christmas-wish": ("Screen-free Christmas activities", "screen-free-christmas-activities-for-kids.html"),
    "gingerbread-house": ("Screen-free Christmas activities", "screen-free-christmas-activities-for-kids.html"),
    "little-star-missed-christmas": ("Screen-free Christmas activities", "screen-free-christmas-activities-for-kids.html"),
    "christmas": ("Screen-free Christmas activities", "screen-free-christmas-activities-for-kids.html"),
    "halloween": ("Screen-free Halloween activities", "screen-free-halloween-activities-for-kids.html"),
    "bugs": ("Screen-free bug detective activities", "screen-free-bug-detective-activities-for-kids.html"),
    "cute-animals-bold-easy": ("Screen-free animal activities", "screen-free-animal-activities-for-kids.html"),
    "door-teapot": ("Screen-free imagination activities", "screen-free-imagination-activities-for-kids.html"),
}
TOPIC_BY_SERIES = {
    "Big Feelings, Real Problems": "feelings",
    "Little Christmas Wonders": "feelings creative",
    "My First Sports Adventures": "discovery",
    "Junior Detectives": "discovery",
    "My First Earth Adventures": "discovery",
    "Tiny Doors, Big Adventures": "discovery creative",
    "Small Town, Many Hands": "feelings discovery",
    "Kawaii Coloring & Activities": "creative",
    "Little Steps, Big Discoveries": "discovery creative",
    "Little Money, Smart Choices": "discovery",
    "More Books by Emma Bellori": "discovery",
}
PREVIEW_MANIFESTS = (
    "book-previews.json",
    "book-previews-batch-32.json",
    "book-previews-little-money.json",
    "book-previews-missing.json",
)


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def text_for(book: dict) -> str:
    description = str(book.get("description") or "").strip()
    if description.lower().startswith("now available"):
        return str(book.get("theme") or book.get("series") or "").strip()
    return description or str(book.get("theme") or "")


def age_range(book: dict) -> str:
    return str(book.get("ageRange") or AGE.get(book.get("series"), "4–9")).replace("Ages ", "")


def age_bounds(book: dict) -> tuple[int, int]:
    nums = re.findall(r"\d+", age_range(book))
    if len(nums) < 2:
        return 4, 9
    return int(nums[0]), int(nums[1])


def relative_page(book: dict) -> str:
    return "books/" + OVERRIDES.get(book["id"], book["id"]) + ".html"


def is_product(book: dict) -> bool:
    return str(book.get("amazonUrl") or "").startswith("https://www.amazon.com/dp/")


def load_previews() -> dict[str, list[dict]]:
    previews: dict[str, list[dict]] = {}
    for filename in PREVIEW_MANIFESTS:
        path = DEST / filename
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            for book_id, images in data.items():
                if not isinstance(images, list):
                    continue
                previews[book_id] = [
                    {"src": image, "alt": f"Interior preview of {book_id}"}
                    if isinstance(image, str) else image
                    for image in images if isinstance(image, (str, dict))
                ][:3]
    return previews


def finder_card(book: dict) -> str:
    low, high = age_bounds(book)
    slug = relative_page(book)
    cover = str(book.get("cover") or "")
    format_text = str(book.get("format") or "").replace(" Edition", "")
    topic = TOPIC_BY_SERIES.get(str(book.get("series") or ""), "discovery")
    tags = " ".join([
        str(book.get("title") or ""), str(book.get("series") or ""),
        str(book.get("theme") or ""), str(book.get("description") or ""),
        topic, str(low), str(high)
    ])
    if not is_product(book):
        raise ValueError(f"Published book missing Amazon product link: {book['id']}")
    if not (DEST / slug).is_file():
        raise ValueError(f"Published book missing landing page: {slug}")
    return (
        f'<article class="eb-finder-card" data-eb-finder-card data-topics="{esc(topic)}" '
        f'data-age-from="{low}" data-age-to="{high}" data-search="{esc(tags)}">'
        f'<a href="{esc(slug)}" aria-label="Discover {esc(book["title"])}">'
        f'<img src="{esc(cover)}" alt="Cover of {esc(book["title"])} by Emma Bellori" '
        f'loading="lazy" decoding="async" width="240" height="340"></a>'
        f'<p class="eb-book-meta">Ages {esc(age_range(book))}'
        + (f' · {esc(format_text)}' if format_text else '') + '</p>'
        f'<h2><a href="{esc(slug)}">{esc(book["title"])}</a></h2>'
        f'<p>{esc(text_for(book))}</p><div class="eb-finder-actions">'
        f'<a class="eb-btn" href="{esc(slug)}" data-placement="finder_book_detail">Book details →</a>'
        f'<a class="eb-text-link" href="{esc(book["amazonUrl"])}" '
        f'data-placement="finder_amazon" data-book-id="{esc(book["id"])}" '
        f'target="_blank" rel="noopener noreferrer sponsored">Amazon ↗</a>'
        '</div></article>'
    )


def hydrate_finder(books: list[dict]) -> int:
    path = DEST / "find-a-book.html"
    if not path.is_file():
        raise RuntimeError("Missing find-a-book.html source")
    page = path.read_text(encoding="utf-8")
    marker = "<!-- BOOK_FINDER_CARDS: replaced at deployment from published catalog.json entries -->"
    if page.count(marker) != 1:
        raise ValueError("Finder placeholder missing or duplicated")
    items = [book for book in books if book.get("status") == "published"]
    items.sort(key=lambda book: (str(book.get("publishedOn") or ""), books.index(book)), reverse=True)
    page = page.replace(marker, "\n".join(finder_card(book) for book in items))
    path.write_text(page, encoding="utf-8")
    return len(items)


def preview_section(book: dict, previews: dict[str, list[dict]]) -> tuple[str, int]:
    thumbs: list[str] = []
    for index, image in enumerate(previews.get(book["id"], [])):
        if not isinstance(image, dict):
            continue
        src = str(image.get("src") or "").strip()
        if not re.fullmatch(r"images/[A-Za-z0-9_./-]+\.(?:jpe?g|png|webp)", src, re.I) or ".." in src:
            continue
        if not (DEST / src).is_file():
            continue
        alt = str(image.get("alt") or f"Inside {book['title']}")
        thumbs.append(
            f'<a class="eb-inside-thumb" href="../{esc(src)}" target="_blank" '
            f'rel="noopener" data-eb-preview-index="{index}" '
            f'aria-label="View interior preview {index+1} of {esc(book["title"])}">'
            f'<img src="../{esc(src)}" alt="{esc(alt)}" loading="lazy" '
            f'decoding="async" width="220" height="300"></a>'
        )
    if not thumbs:
        return "", 0
    return (
        '<section class="eb-inside-preview" id="inside-the-book" aria-labelledby="eb-look-title">'
        '<p class="eb-eyebrow">LOOK INSIDE</p><h2 id="eb-look-title">See a few pages inside</h2>'
        '<p>These are real interior previews, not generic illustrations. '
        'Select any page to enlarge it before choosing the book.</p>'
        f'<div class="eb-inside-grid">{"".join(thumbs)}</div></section>'
    ), len(thumbs)


def benefit_section(book: dict) -> str:
    series = str(book.get("series") or "")
    why, prompt = SERIES_HELP.get(series, (
        "An inviting story or activity to explore with your child.",
        "Ask what stood out and let your child guide the next conversation.",
    ))
    theme = str(book.get("theme") or "Curiosity and imagination")
    format_text = str(book.get("format") or "").replace(" Edition", "") or "See Amazon"
    guide = GUIDE_BY_ID.get(book["id"])
    guide_link = ""
    if guide and (DEST / "guides" / guide[1]).is_file():
        guide_link = f'<a href="../guides/{esc(guide[1])}" data-placement="book_related_guide">Read a free related guide →</a>'
    return (
        '<section class="eb-reader-benefits related-section" aria-labelledby="eb-why-book">'
        '<p class="eb-eyebrow">AT A GLANCE</p>'
        '<h2 id="eb-why-book">Could this be your next family read?</h2>'
        f'<p>{esc(why)}</p>'
        '<div class="eb-benefits-grid">'
        f'<div><h3>Explore the theme</h3><p>{esc(theme)}</p></div>'
        f'<div><h3>Suggested ages</h3><p>Ages {esc(age_range(book))} · Flexible guidance</p></div>'
        f'<div><h3>Available edition</h3><p>{esc(format_text)} · Current details on Amazon</p></div>'
        '</div>'
        f'<p><strong>Try it together:</strong> {esc(prompt)}</p>'
        f'<div class="eb-reader-links">{guide_link}'
        '<a href="../free-activity.html" data-placement="book_free_activity">Try a free printable activity →</a></div>'
        '</section>'
    )


def final_cta(book: dict) -> str:
    return (
        '<section class="eb-book-final" aria-labelledby="eb-next-book">'
        '<p class="eb-eyebrow">READY TO EXPLORE?</p>'
        '<h2 id="eb-next-book">Discover this book on Amazon</h2>'
        '<p>Browse the official listing for current edition details, price, '
        'availability and delivery options. Your purchase is completed on Amazon.</p>'
        '<div class="eb-reader-links">'
        f'<a class="eb-btn" href="{esc(book["amazonUrl"])}" '
        f'data-book-id="{esc(book["id"])}" data-placement="book_final_amazon" '
        f'target="_blank" rel="noopener noreferrer sponsored">View on Amazon ↗</a>'
        '<a href="../find-a-book.html" data-placement="book_back_finder">Compare with other books →</a>'
        '</div></section>'
    )


def enrich_details(books: list[dict], previews: dict[str, list[dict]]) -> tuple[int, int]:
    enhanced = 0
    with_previews = 0
    for book in books:
        if book.get("status") != "published":
            continue
        page = DEST / relative_page(book)
        if not page.is_file():
            raise ValueError(f"Missing published book page: {page}")
        text = page.read_text(encoding="utf-8")
        if 'class="eb-reader-benefits related-section"' in text:
            continue
        gallery, count = preview_section(book, previews)
        if count:
            with_previews += 1
        hero_end = re.search(r"</section>\s*(?=<section|</main>)", text[text.find('<section class="detail-hero"'):])
        hero_start = text.find('<section class="detail-hero"')
        if hero_start < 0 or hero_end is None:
            raise ValueError(f"Missing book detail hero: {page.name}")
        insertion = hero_start + hero_end.end()
        text = text[:insertion] + gallery + benefit_section(book) + text[insertion:]
        end = text.find("</main>")
        if end < 0:
            raise ValueError(f"Missing main element: {page.name}")
        text = text[:end] + final_cta(book) + text[end:]
        if count:
            # All book pages already include a primary Amazon CTA. Add a useful
            # non-Amazon, no-JS-friendly link to the real preview pages.
            pattern = r'(<a\b[^>]*class="[^"]*\bprimary-book-cta\b[^"]*"[^>]*>.*?</a>)'
            text, changed = re.subn(
                pattern,
                r'\1<a class="eb-text-link eb-look-jump" href="#inside-the-book" '
                r'data-placement="book_look_inside">Look inside: '
                + str(count) + ' real pages ↓</a>',
                text, count=1, flags=re.S,
            )
            if changed != 1:
                raise ValueError(f"Primary CTA not found on published page {page.name}")
        page.write_text(text, encoding="utf-8")
        enhanced += 1
    return enhanced, with_previews


def enhance_guides() -> int:
    count = 0
    for page in (DEST / "guides").glob("*.html"):
        text = page.read_text(encoding="utf-8")
        if "data-eb-related-books" in text:
            continue
        slug = page.stem
        if slug == "index":
            url = "../find-a-book.html"
        elif any(token in slug for token in ("mistake", "left-out", "losing", "angry", "sleep", "pace")):
            url = "../find-a-book.html?topic=feelings"
        elif any(token in slug for token in ("animal", "bug", "sportsmanship")):
            url = "../find-a-book.html?topic=discovery"
        else:
            url = "../find-a-book.html?topic=creative"
        section = (
            '<section class="eb-guide-next" data-eb-related-books="true">'
            '<p class="eb-eyebrow">CONTINUE THE DISCOVERY</p>'
            '<h2>Find a story to explore this topic together</h2>'
            '<p>The guide is free. If a story could help you continue the conversation, '
            'browse books currently available by age and topic.</p>'
            f'<div class="eb-reader-links"><a class="eb-btn" href="{esc(url)}" '
            'data-placement="guide_book_finder">Find a related book →</a>'
            '<a href="../free-activity.html" data-placement="guide_free_sheet">Try a free family play sheet →</a>'
            '</div></section>'
        )
        if "</main>" not in text:
            continue
        text = text.replace("</main>", section + "</main>", 1)
        page.write_text(text, encoding="utf-8")
        count += 1
    return count


def add_preferred_favicons_and_style() -> int:
    count = 0
    for page in DEST.rglob("*.html"):
        if "emma-bellori-books" in page.relative_to(DEST).parts:
            continue
        text = page.read_text(encoding="utf-8")
        if '<meta name="robots" content="noindex' in text or "Page moved" in text:
            continue
        relative = page.relative_to(DEST)
        prefix = "../" * (len(relative.parts) - 1)
        if 'href="' + prefix + 'reader-journey.css' not in text and "</head>" in text:
            text = text.replace("</head>", f'<link rel="stylesheet" href="{prefix}reader-journey.css?v=1"></head>', 1)
        # Keep the original illustrated favicon.png as the only browser icon.
        # Do not add a competing icon to pages that already reference it.
        text = re.sub(
            r'<link\b[^>]*\bhref=["\\'][^"\\']*favicon\.svg["\\'][^>]*>\s*',
            '', text, flags=re.IGNORECASE
        )
        if not re.search(r'<link\b[^>]*\bhref=["\\'][^"\\']*favicon\.png["\\']', text, flags=re.IGNORECASE) and "</head>" in text:
            text = text.replace("</head>", f'<link rel="icon" href="{prefix}favicon.png" type="image/png"></head>', 1)
        if 'src="' + prefix + 'reader-journey.js' not in text and "</body>" in text:
            text = text.replace("</body>", f'<script defer src="{prefix}reader-journey.js?v=1"></script></body>', 1)
        page.write_text(text, encoding="utf-8")
        count += 1
    return count


def update_sitemap() -> None:
    sitemap = DEST / "sitemap.xml"
    ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
    ET.register_namespace("", ns)
    tree = ET.parse(sitemap)
    root = tree.getroot()
    urls = {
        el.text for el in root.findall(f".//{{{ns}}}loc")
        if el.text
    }
    for relative in ("about.html", "find-a-book.html", "free-activity.html"):
        url = SITE + relative
        if url in urls:
            continue
        entry = ET.SubElement(root, f"{{{ns}}}url")
        ET.SubElement(entry, f"{{{ns}}}loc").text = url
    tree.write(sitemap, encoding="utf-8", xml_declaration=True)


def main() -> None:
    books = json.loads((DEST / "catalog.json").read_text(encoding="utf-8"))
    if not isinstance(books, list):
        raise ValueError("Invalid catalog.json")
    ready = hydrate_finder(books)
    details, previews = enrich_details(books, load_previews())
    guides = enhance_guides()
    pages = add_preferred_favicons_and_style()
    update_sitemap()
    print(
        f"Reader journey: {ready} finder titles, {details} enhanced book pages "
        f"({previews} with real interior samples), {guides} guides, "
        f"{pages} pages with accessible shared styles."
    )


if __name__ == "__main__":
    main()
