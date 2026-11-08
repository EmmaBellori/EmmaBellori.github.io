"""Regression checks for all seven reader-first site improvements.

CI builds _site before this suite: pages are checked as visitors/crawlers
receive them, rather than relying on raw unprocessed source templates.
"""
import json
import re
import unittest
from pathlib import Path
from xml.etree import ElementTree as ET

from scripts import improve_reader_journey as growth

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"


class ReaderJourneyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not SITE.is_dir():
            raise RuntimeError("Build _site first: scripts/build_root_site.py, "
                               "scripts/generate_growth_guides.py, "
                               "scripts/improve_reader_journey.py")
        cls.catalog = json.loads((SITE / "catalog.json").read_text(encoding="utf-8"))
        cls.published = [b for b in cls.catalog if b.get("status") == "published"]
        cls.pending = [b for b in cls.catalog if b.get("status") == "coming_soon"]

    def page(self, relative):
        return (SITE / relative).read_text(encoding="utf-8")

    def test_finder_shows_every_available_book_but_no_upcoming_items(self):
        markup = self.page("find-a-book.html")
        self.assertEqual(markup.count('data-eb-finder-card'), len(self.published))
        self.assertNotIn("BOOK_FINDER_CARDS:", markup)
        for book in self.published:
            self.assertIn(growth.relative_page(book), markup)
            self.assertIn(book["amazonUrl"].replace("&", "&amp;"), markup)
            self.assertIn('data-eb-book-finder', markup)
        for book in self.pending:
            self.assertNotIn(f'data-book-id="{book["id"]}"', markup)
        self.assertIn('name="topic"', markup)
        self.assertIn('name="age"', markup)
        self.assertIn('aria-live="polite"', markup)

    def test_each_published_detail_has_genuine_preview_and_relevant_cta(self):
        for book in self.published:
            with self.subTest(book=book["id"]):
                markup = self.page(growth.relative_page(book))
                self.assertIn('class="eb-reader-benefits related-section"', markup)
                self.assertIn('id="inside-the-book"', markup)
                self.assertEqual(markup.count('data-eb-preview-index'), 3)
                self.assertIn('data-placement="book_final_amazon"', markup)
                self.assertIn('href="../free-activity.html"', markup)
                self.assertIn(book["amazonUrl"].replace("&", "&amp;"), markup)
                self.assertIn('href="../favicon.svg"', markup)
                self.assertIn('href="../reader-journey.css?v=1"', markup)
                self.assertNotIn("Only $", markup)

    def test_homepage_prioritizes_published_and_separates_coming_soon(self):
        html = self.page("index.html")
        self.assertIn('href="find-a-book.html"', html)
        self.assertIn('class="eb-discovery-grid"', html)
        self.assertIn('id="coming-soon"', html)
        self.assertIn('id="upcoming-series-catalog"', html)
        present = html.split('id="series-catalog"', 1)[1].split('id="coming-soon"', 1)[0]
        self.assertIn('class="home-card-meta"', present)
        self.assertNotIn('class="home-card-status">Coming Soon', present)
        upcoming = html.split('id="upcoming-series-catalog"', 1)[1].split('id="parenting-guides"', 1)[0]
        self.assertIn('Coming Soon', upcoming)

    def test_about_and_free_printable_work_without_subscribing(self):
        about = self.page("about.html")
        self.assertIn("Frequently asked questions", about)
        self.assertIn("Amazon", about)
        self.assertIn("Payhip", about)
        self.assertIn('href="mailto:emmabelloribooks@outlook.com"', about)
        printable = self.page("free-activity.html")
        self.assertIn("data-eb-print", printable)
        self.assertIn("No account, purchase or email address needed", printable)
        self.assertIn("Three little moments", printable)

    def test_guides_guide_readers_to_current_books(self):
        guides = list((SITE / "guides").glob("*.html"))
        self.assertGreaterEqual(len(guides), 10)
        for path in guides:
            with self.subTest(path=path.name):
                text = path.read_text(encoding="utf-8")
                self.assertIn('data-eb-related-books="true"', text)
                self.assertIn('href="../free-activity.html"', text)
                self.assertIn('href="../favicon.svg"', text)

    def test_new_pages_in_sitemap_and_have_canonicals(self):
        ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
        root = ET.parse(SITE / "sitemap.xml").getroot()
        urls = {e.text for e in root.findall(f".//{{{ns}}}loc") if e.text}
        for relative in ("about.html", "find-a-book.html", "free-activity.html"):
            with self.subTest(relative=relative):
                absolute = "https://emmabellori.github.io/" + relative
                self.assertIn(absolute, urls)
                self.assertIn('<link rel="canonical" href="'+absolute+'"',
                              self.page(relative))
        for book in self.published:
            self.assertIn("https://emmabellori.github.io/"+growth.relative_page(book), urls)

    def test_conversion_events_not_double_counted_by_two_listeners(self):
        analytics = (SITE / "analytics-consent.js").read_text(encoding="utf-8")
        commerce = (SITE / "conversion-tracking.js").read_text(encoding="utf-8")
        club = (SITE / "activity-club.js").read_text(encoding="utf-8")
        self.assertNotIn("window.gtag('event','amazon_click'", analytics)
        self.assertEqual(commerce.count("window.ebTrack('amazon_click',payload)"), 1)
        self.assertIn("window.ebTrack('payhip_click',", commerce)
        self.assertIn("newsletter_signup_requested", club)
        self.assertNotIn("window.ebTrack('newsletter_signup',", club)

    def test_performance_fallbacks_and_accessibility_basics(self):
        html = self.page("index.html")
        css = (SITE / "reader-journey.css").read_text(encoding="utf-8")
        self.assertIn('loading="eager" decoding="async" fetchpriority="high"', html)
        self.assertIn('prefers-reduced-motion', css)
        self.assertIn('@media print', css)
        self.assertIn(':focus-visible', css)
        self.assertTrue((SITE / "favicon.svg").is_file())
        self.assertLess((SITE / "favicon.svg").stat().st_size, 10240)


if __name__ == "__main__":
    unittest.main()
