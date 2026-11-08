"""Regression checks for published catalog titles, collections and sitemap."""
import json
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from xml.etree import ElementTree as ET

from scripts import build_root_site


ROOT = Path(__file__).resolve().parents[1]
NEW_RELEASES = {
    "snowman": ("little-christmas-wonders", "B0HQW67MJ1"),
    "my-first-ice-hockey-adventure": ("my-first-sports-adventures", "B0HQW9H64W"),
}


class PublicationSyncTests(unittest.TestCase):
    def test_new_release_catalog_and_static_pages(self):
        books = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
        items = {book["id"]: book for book in books}
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        for book_id, (series_slug, asin) in NEW_RELEASES.items():
            book = items[book_id]
            self.assertEqual(book["status"], "published")
            self.assertEqual(book["publishedOn"], "2026-11-08")
            self.assertEqual(book["amazonUrl"], f"https://www.amazon.com/dp/{asin}")
            self.assertEqual(book["seriesSlug"], series_slug)
            self.assertTrue((ROOT / book["cover"]).is_file(), book_id)
            detail = ROOT / "books" / f"{book_id}.html"
            self.assertTrue(detail.is_file(), book_id)
            html = detail.read_text(encoding="utf-8")
            self.assertIn(f"data-book-id=\"{book_id}\"", html)
            self.assertIn(book["amazonUrl"], html)
            self.assertIn(f"/books/{book_id}.html", html)
            self.assertIn('type="application/ld+json"', html)
            self.assertIn(f"books/{book_id}.html", sitemap)

    def test_collection_cards_and_counters(self):
        books = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
        for slug, (published_count, upcoming_count) in {
            "little-christmas-wonders": (5, 0),
            "my-first-sports-adventures": (1, 15),
        }.items():
            html = (ROOT / "collections" / f"{slug}.html").read_text(encoding="utf-8")
            series = [book for book in books if book.get("seriesSlug") == slug]
            self.assertEqual(len(series), published_count + upcoming_count)
            self.assertEqual(sum(book["status"] == "published" for book in series), published_count)
            self.assertEqual(sum(book["status"] == "coming_soon" for book in series), upcoming_count)
            self.assertIn(f"<dt>Available now</dt><dd>{published_count}</dd>", html)
            self.assertIn(f"<dt>Coming Soon</dt><dd>{upcoming_count}</dd>", html)
            self.assertEqual(html.count('class="collection-book is-published"'), published_count)
            self.assertEqual(html.count('class="collection-book is-upcoming"'), upcoming_count)
        for book_id in NEW_RELEASES:
            slug, _ = NEW_RELEASES[book_id]
            html = (ROOT / "collections" / f"{slug}.html").read_text(encoding="utf-8")
            self.assertIn(f"../books/{book_id}.html", html)
            self.assertNotIn(f'data-vote-id="{book_id}"', html)

    def test_sitemap_builder_adds_published_urls(self):
        ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
        with tempfile.TemporaryDirectory() as temp:
            site = Path(temp)
            (site / "books").mkdir()
            (site / "collections").mkdir()
            (site / "books" / "sample.html").write_text("<h1>Book</h1>", encoding="utf-8")
            (site / "collections" / "example.html").write_text("<h1>Collection</h1>", encoding="utf-8")
            (site / "sitemap.xml").write_text(
                f'<urlset xmlns="{ns}"><url><loc>https://emmabellori.github.io/</loc></url></urlset>',
                encoding="utf-8"
            )
            catalog = [{"id": "sample", "status": "published", "seriesSlug": "example", "publishedOn": "2026-11-08"}]
            (site / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
            with patch.object(build_root_site, "DEST", site):
                build_root_site.sync_published_sitemap()
            tree = ET.parse(site / "sitemap.xml")
            urls = {
                el.find(f"{{{ns}}}loc").text: el.find(f"{{{ns}}}lastmod")
                for el in tree.findall(f"{{{ns}}}url")
            }
            self.assertEqual(urls["https://emmabellori.github.io/books/sample.html"].text, "2026-11-08")
            self.assertEqual(urls["https://emmabellori.github.io/collections/example.html"].text, "2026-11-08")

    def test_homepage_prerender_prioritizes_release_date(self):
        with tempfile.TemporaryDirectory() as temp:
            site = Path(temp)
            index = (
                '<div id="start-here-grid" class="home-book-grid" aria-live="polite"></div>'
                '<div id="latest-grid" class="home-book-grid" aria-live="polite"></div>'
                '<div id="series-catalog" class="home-series-catalog"></div>'
            )
            (site / "index.html").write_text(index, encoding="utf-8")
            books = [
                {"id": "old", "title": "Old book", "series": "Sample", "seriesSlug": "sample",
                 "status": "published", "amazonUrl": "https://www.amazon.com/dp/OLD"},
                {"id": "new-1", "title": "New one", "series": "Sample", "seriesSlug": "sample",
                 "status": "published", "publishedOn": "2026-11-08",
                 "amazonUrl": "https://www.amazon.com/dp/NEW1"},
                {"id": "new-2", "title": "New two", "series": "Sample", "seriesSlug": "sample",
                 "status": "published", "publishedOn": "2026-11-08",
                 "amazonUrl": "https://www.amazon.com/dp/NEW2"},
            ]
            (site / "catalog.json").write_text(json.dumps(books), encoding="utf-8")
            with patch.object(build_root_site, "DEST", site):
                build_root_site.prerender_homepage_catalog()
            rendered = (site / "index.html").read_text(encoding="utf-8")
            latest = rendered.split('id="latest-grid"', 1)[1].split('id="series-catalog"', 1)[0]
            self.assertLess(latest.index('data-book-id="new-2"'), latest.index('data-book-id="new-1"'))
            self.assertLess(latest.index('data-book-id="new-1"'), latest.index('data-book-id="old"'))


if __name__ == "__main__":
    unittest.main()
