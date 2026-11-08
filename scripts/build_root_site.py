#!/usr/bin/env python3
"""Build the Emma Bellori Books GitHub Pages site for the account root.

The source repository historically publishes as a project site at
https://emmabellori.github.io/emma-bellori-books/.

When the repository is renamed to EmmaBellori.github.io, this build:
1. copies the static site to _site;
2. rewrites absolute SEO/site URLs to https://emmabellori.github.io/;
3. pre-renders the homepage catalog from catalog.json for crawlers and no-JS visitors;
4. generates legacy redirect pages for URLs listed in sitemap.xml;
5. generates a 404 fallback that redirects old /emma-bellori-books/ paths.
"""

from __future__ import annotations

import html
import json
import shutil
import re
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_site"

OLD_ROOT = "https://emmabellori.github.io/emma-bellori-books/"
OLD_ROOT_NO_SLASH = OLD_ROOT.rstrip("/")
NEW_ROOT = "https://emmabellori.github.io/"
NEW_ROOT_NO_SLASH = NEW_ROOT.rstrip("/")
OLD_PATH_PREFIX = "/emma-bellori-books/"

TEXT_EXTENSIONS = {
    ".html", ".htm", ".js", ".json", ".xml", ".txt", ".md", ".css", ".yml", ".yaml"
}
EXCLUDED_TOP_LEVEL = {".git", ".github", "_site"}
PUBLISHED_DETAIL_OVERRIDES = {"door-teapot": "the-door-inside-the-teapot"}


def legacy_urls_from_sitemap() -> list[tuple[str, str]]:
    sitemap = ROOT / "sitemap.xml"
    if not sitemap.exists():
        return [("", NEW_ROOT)]

    tree = ET.parse(sitemap)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    redirects: list[tuple[str, str]] = []

    for loc in tree.findall("sm:url/sm:loc", ns):
        if not loc.text:
            continue
        url = loc.text.strip()
        if not url.startswith(OLD_ROOT):
            continue
        relative = url[len(OLD_ROOT):]
        target = NEW_ROOT + relative
        redirects.append((relative, target))

    if not any(relative == "" for relative, _ in redirects):
        redirects.insert(0, ("", NEW_ROOT))
    return redirects


def copy_source() -> None:
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir(parents=True)

    for item in ROOT.iterdir():
        if item.name in EXCLUDED_TOP_LEVEL:
            continue
        target = DEST / item.name
        if item.is_dir():
            shutil.copytree(item, target)
        else:
            shutil.copy2(item, target)

    # Build tooling should not be part of the public site artifact.
    shutil.rmtree(DEST / "scripts", ignore_errors=True)


def rewrite_absolute_urls() -> None:
    for path in DEST.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        updated = text.replace(OLD_ROOT, NEW_ROOT).replace(OLD_ROOT_NO_SLASH, NEW_ROOT_NO_SLASH)
        if updated != text:
            path.write_text(updated, encoding="utf-8")


def _esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def _book_detail_href(book: dict) -> str:
    book_id = str(book.get("id") or "").strip()
    if book.get("status") == "published":
        slug = PUBLISHED_DETAIL_OVERRIDES.get(book_id, book_id)
        return f"books/{slug}.html"
    return f"book.html?id={book_id}"


def _format_label(value: object) -> str:
    label = str(value or "").replace("Edition", "").strip()
    lower = label.lower()
    has_kindle = "kindle" in lower
    has_paperback = "paperback" in lower
    if has_kindle and has_paperback:
        return "Kindle + Paperback"
    if has_kindle:
        return "Kindle"
    if has_paperback:
        return "Paperback"
    return label or "Book"


def _cover_html(book: dict) -> str:
    title = _esc(book.get("title"))
    cover = str(book.get("cover") or "").strip()
    if cover:
        return (
            f'<img loading="lazy" decoding="async" src="{_esc(cover)}" '
            f'alt="Cover of {title}">'
        )
    return f'<div class="cover-placeholder"><strong>{title}</strong></div>'


def _published_card(book: dict) -> str:
    detail = _book_detail_href(book)
    title = _esc(book.get("title"))
    theme = str(book.get("theme") or "").strip()
    amazon_url = _esc(book.get("amazonUrl"))
    book_id = _esc(book.get("id"))
    theme_html = f'<p class="home-book-theme">{_esc(theme)}</p>' if theme else ""
    amazon_html = ""
    if amazon_url:
        amazon_html = (
            f'<a class="home-card-amazon" href="{amazon_url}" target="_blank" '
            f'rel="noopener noreferrer sponsored" data-book-id="{book_id}" '
            f'aria-label="View {title} on Amazon (opens in new tab)">View on Amazon ↗</a>'
        )

    return (
        f'<article class="home-book-card" data-book-id="{book_id}">'
        f'<a class="home-cover-wrap" href="{_esc(detail)}" aria-label="Discover {title}">'
        f'{_cover_html(book)}</a>'
        f'<div class="home-card-meta"><span>Available now</span>'
        f'<span>{_esc(_format_label(book.get("format")))}</span></div>'
        f'<h3><a href="{_esc(detail)}">{title}</a></h3>{theme_html}'
        f'<div class="home-card-actions">{amazon_html}'
        f'<a class="home-card-details" href="{_esc(detail)}">Book details →</a></div>'
        f'</article>'
    )


def _upcoming_card(book: dict) -> str:
    detail = _book_detail_href(book)
    title = _esc(book.get("title"))
    book_id = _esc(book.get("id"))
    return (
        f'<article class="home-book-card" data-book-id="{book_id}">'
        f'<a class="home-cover-wrap" href="{_esc(detail)}" aria-label="Discover {title}">'
        f'{_cover_html(book)}</a>'
        f'<span class="home-card-status">Coming Soon</span>'
        f'<h3><a href="{_esc(detail)}">{title}</a></h3>'
        f'<div class="home-card-actions eb-coming-soon-only">'
        f'<a class="home-card-details" href="{_esc(detail)}">Book details →</a></div>'
        f'</article>'
    )


def _home_card(book: dict) -> str:
    return _published_card(book) if book.get("status") == "published" else _upcoming_card(book)


def prerender_homepage_catalog() -> None:
    """Seed the homepage with real links/content before client-side rendering.

    app.js still replaces these containers after catalog.json loads in the browser.
    The pre-rendered HTML gives search crawlers and no-JS visitors a useful,
    crawlable catalog instead of empty containers.
    """
    index_path = DEST / "index.html"
    catalog_path = DEST / "catalog.json"
    if not index_path.exists() or not catalog_path.exists():
        print("Homepage pre-render skipped: index.html or catalog.json is missing.")
        return

    try:
        books = json.loads(catalog_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        print(f"Homepage pre-render skipped: catalog could not be read ({exc}).")
        return
    if not isinstance(books, list):
        print("Homepage pre-render skipped: catalog.json is not a list.")
        return

    indexed_books: list[dict] = []
    for index, item in enumerate(books):
        if isinstance(item, dict) and item.get("id") and item.get("title"):
            copy = dict(item)
            copy["_catalogIndex"] = index
            indexed_books.append(copy)

    published = [book for book in indexed_books if book.get("status") == "published"]
    start_here = [
        book for book in published if book.get("series") == "Big Feelings, Real Problems"
    ][:3]
    latest = sorted(
        published, key=lambda book: book.get("_catalogIndex", 0), reverse=True
    )[:6]

    # Keep first-seen collection order; show published titles first in each preview.
    groups: dict[str, list[dict]] = {}
    for book in indexed_books:
        series = str(book.get("series") or "More Books by Emma Bellori")
        groups.setdefault(series, []).append(book)

    series_sections: list[str] = []
    for series, items in groups.items():
        available = [book for book in items if book.get("status") == "published"]
        upcoming = [book for book in items if book.get("status") != "published"]
        preview = (available + upcoming)[:3]
        if not preview:
            continue
        series_slug = str(items[0].get("seriesSlug") or "").strip()
        collection_link = (
            f'<a class="home-explore-collection" href="collections/{_esc(series_slug)}.html" '
            f'aria-label="Explore {_esc(series)} collection">Explore collection →</a>'
            if series_slug
            else ""
        )
        series_sections.append(
            f'<section class="home-series-preview" data-series-name="{_esc(series)}">'
            f'<div class="home-series-heading"><div class="home-series-copy">'
            f'<p class="eyebrow">EMMA BELLORI COLLECTION</p>'
            f'<h3>{_esc(series)}</h3>'
            f'<p>Explore stories and activities in this Emma Bellori collection.</p>'
            f'</div><div class="home-series-actions">'
            f'<span class="home-series-count">{len(items)} {"book" if len(items) == 1 else "books"}</span>'
            f'{collection_link}</div></div>'
            f'<div class="home-book-grid">{"".join(_home_card(book) for book in preview)}</div>'
            f'</section>'
        )

    replacements = {
        '<div id="start-here-grid" class="home-book-grid" aria-live="polite"></div>':
            '<div id="start-here-grid" class="home-book-grid" aria-live="polite">'
            + "".join(_published_card(book) for book in start_here)
            + "</div>",
        '<div id="latest-grid" class="home-book-grid" aria-live="polite"></div>':
            '<div id="latest-grid" class="home-book-grid" aria-live="polite">'
            + "".join(_published_card(book) for book in latest)
            + "</div>",
        '<div id="series-catalog" class="home-series-catalog"></div>':
            '<div id="series-catalog" class="home-series-catalog">'
            + "".join(series_sections)
            + "</div>",
    }

    text = index_path.read_text(encoding="utf-8")
    changed = False
    for needle, replacement in replacements.items():
        if needle in text:
            text = text.replace(needle, replacement, 1)
            changed = True
        else:
            print(f"Homepage pre-render warning: expected placeholder not found: {needle[:60]}")

    if changed:
        index_path.write_text(text, encoding="utf-8")
        print(
            f"Pre-rendered homepage with {len(start_here)} start-here books, "
            f"{len(latest)} latest books and {len(series_sections)} collection previews."
        )


def prerender_collection_counts() -> None:
    """Keep each collection's visible counters in sync with catalog.json at deploy.

    The client-side collection-vote.js additionally reconciles the actual book
    cards after loading the catalog, including newly published or added books.
    """
    catalog_path = DEST / "catalog.json"
    collection_dir = DEST / "collections"
    if not catalog_path.is_file() or not collection_dir.is_dir():
        return

    books = json.loads(catalog_path.read_text(encoding="utf-8"))
    if not isinstance(books, list):
        raise ValueError("catalog.json must be an array")

    counts: dict[str, dict[str, int]] = {}
    for book in books:
        if not isinstance(book, dict):
            continue
        slug = book.get("seriesSlug")
        status = book.get("status")
        if not isinstance(slug, str) or status not in ("published", "coming_soon"):
            continue
        tally = counts.setdefault(slug, {"total": 0, "published": 0, "upcoming": 0})
        tally["total"] += 1
        tally["published" if status == "published" else "upcoming"] += 1

    patterns = (
        (r"(<dt>Total books</dt>\s*<dd>)\d+(</dd>)", "total"),
        (r"(<dt>Available now</dt>\s*<dd>)\d+(</dd>)", "published"),
        (r"(<dt>Coming Soon</dt>\s*<dd>)\d+(</dd>)", "upcoming"),
        (r'(<h2 id="available-heading">Available now <span>)\d+(</span>)', "published"),
        (r'(<h2 id="upcoming-heading">Coming Soon <span>)\d+(</span>)', "upcoming"),
    )
    for page in collection_dir.glob("*.html"):
        tally = counts.get(page.stem)
        if not tally:
            continue
        markup = page.read_text(encoding="utf-8")
        updated = markup
        for pattern, key in patterns:
            updated = re.sub(
                pattern, lambda match: match.group(1) + str(tally[key]) + match.group(2),
                updated, count=1
            )
        if updated != markup:
            page.write_text(updated, encoding="utf-8")
    print(f"Synced collection counters for {len(counts)} series from catalog.json")


def redirect_document(target: str) -> str:
    escaped_target = html.escape(target, quote=True)
    js_target = json.dumps(target)
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
  <title>Emma Bellori Books — Page moved</title>
  <meta name=\"robots\" content=\"noindex,follow\">
  <link rel=\"canonical\" href=\"{escaped_target}\">
  <meta http-equiv=\"refresh\" content=\"0; url={escaped_target}\">
  <script>window.location.replace({js_target} + window.location.search + window.location.hash);</script>
</head>
<body>
  <p>This page has moved to <a href=\"{escaped_target}\">{escaped_target}</a>.</p>
</body>
</html>
"""


def generate_legacy_redirects(redirects: list[tuple[str, str]]) -> None:
    legacy_root = DEST / "emma-bellori-books"
    legacy_root.mkdir(parents=True, exist_ok=True)

    for relative, target in redirects:
        if not relative:
            redirect_path = legacy_root / "index.html"
        else:
            redirect_path = legacy_root / relative
            if relative.endswith("/"):
                redirect_path = redirect_path / "index.html"
        redirect_path.parent.mkdir(parents=True, exist_ok=True)
        redirect_path.write_text(redirect_document(target), encoding="utf-8")


def generate_404() -> None:
    content = """<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
  <title>Page not found | Emma Bellori Books</title>
  <meta name=\"robots\" content=\"noindex,follow\">
  <script>
  (function () {
    var prefix = '/emma-bellori-books/';
    if (window.location.pathname.indexOf(prefix) === 0) {
      var nextPath = '/' + window.location.pathname.slice(prefix.length);
      window.location.replace(nextPath + window.location.search + window.location.hash);
    }
  }());
  </script>
</head>
<body>
  <main>
    <h1>Page not found</h1>
    <p>The page may have moved. Visit <a href=\"/\">Emma Bellori Books</a>.</p>
  </main>
</body>
</html>
"""
    (DEST / "404.html").write_text(content, encoding="utf-8")


def ensure_root_metadata_files() -> None:
    robots = DEST / "robots.txt"
    robots.write_text(
        "User-agent: *\nAllow: /\nSitemap: https://emmabellori.github.io/sitemap.xml\n",
        encoding="utf-8",
    )


def main() -> None:
    redirects = legacy_urls_from_sitemap()
    copy_source()
    rewrite_absolute_urls()
    prerender_homepage_catalog()
    prerender_collection_counts()
    generate_legacy_redirects(redirects)
    generate_404()
    ensure_root_metadata_files()
    print(f"Built root site at {DEST} with {len(redirects)} legacy redirects.")


if __name__ == "__main__":
    main()
