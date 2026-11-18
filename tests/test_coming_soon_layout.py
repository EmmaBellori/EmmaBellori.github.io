"""Keep the homepage Coming Soon layout separate from published collections.

These tests inspect the actual pre-rendered Pages output and the progressive-
enhancement CSS/JS. The page is still subject to visual QA across viewports.
"""
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_site"


class ComingSoonLayoutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (OUT / "index.html").is_file():
            raise RuntimeError("Build the site before testing Coming Soon")

    def test_homepage_uses_one_compact_coming_soon_carousel(self):
        books = json.loads((OUT / "catalog.json").read_text(encoding="utf-8"))
        upcoming = [book for book in books if book.get("status") == "coming_soon"]
        self.assertGreater(len(upcoming), 1)
        page = (OUT / "index.html").read_text(encoding="utf-8")
        app = (OUT / "app.js").read_text(encoding="utf-8")
        self.assertIn('id="upcoming-series-catalog"', page)
        portion = page.split('id="upcoming-series-catalog"', 1)[1].split(
            'id="parenting-guides"', 1
        )[0]
        # Only one upcoming book is server-rendered: the page stays short and
        # remains useful to crawlers and visitors without JavaScript.
        self.assertEqual(portion.count('class="upcoming-single-card"'), 1)
        self.assertEqual(portion.count('class="home-card-status">Coming Soon</span>'), 1)
        self.assertEqual(portion.count("upcoming-single-collection"), 1)
        # Prominent, accessible previous/next buttons browse individual titles.
        self.assertIn('data-carousel-direction="-1"', page)
        self.assertIn('data-carousel-direction="1"', page)
        self.assertIn("Previous upcoming book", page)
        self.assertIn("Next upcoming book", page)
        self.assertIn("upcomingCarouselIndex", app)
        self.assertIn("renderUpcomingCarousel()", app)
        self.assertIn("upcomingCarouselIndex+=Number(button.dataset.carouselDirection)||1", app)
        self.assertIn("const items=upcoming.slice()", app)
        self.assertIn("data-vote-id", app)

    def test_scoped_responsive_styles_prevent_old_narrow_column_layout(self):
        css = (OUT / "coming-soon-layout.css").read_text(encoding="utf-8")
        html = (OUT / "index.html").read_text(encoding="utf-8")
        self.assertIn('href="coming-soon-layout.css?v=1"', html)
        self.assertIn("#coming-soon .home-series-heading", css)
        self.assertIn("flex-direction:column!important", css)
        self.assertIn("grid-template-columns:none!important", css)
        self.assertIn("grid-template-columns:repeat(2,minmax(0,1fr))", css)
        self.assertIn("@media(max-width:980px)", css)
        self.assertIn("@media(max-width:620px)", css)
        self.assertIn("@media(max-width:410px)", css)
        self.assertIn("content:none!important", css)
        self.assertIn("word-break:normal", css)
        self.assertIn(":focus-visible", css)

    def test_decorative_cover_stacks_skipped_only_for_coming_soon(self):
        js = (OUT / "homepage-refinements.js").read_text(encoding="utf-8")
        self.assertIn("section.closest('#coming-soon')", js)
        self.assertIn("heading.querySelector('.eb-series-cover-stack')?.remove()", js)
        self.assertIn("heading.prepend(stack)", js)

    def test_book_preview_and_votes_not_removed(self):
        app = (OUT / "app.js").read_text(encoding="utf-8")
        preview = (OUT / "book-preview.js").read_text(encoding="utf-8")
        self.assertIn("data-vote-id", app)
        self.assertIn("showModal()", app)
        self.assertIn("addCardCarousels(entries)", preview)
        self.assertIn("eb-cover-arrow", preview)


if __name__ == "__main__":
    unittest.main()
