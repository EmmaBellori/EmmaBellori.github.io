import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock


MODULE = Path(__file__).resolve().parents[1] / "scripts" / "release_email_campaign.py"
spec = importlib.util.spec_from_file_location("release_email_campaign", MODULE)
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleaseEmailTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / "images").mkdir()
        (self.root / "books").mkdir()
        (self.root / "images" / "new.jpg").write_bytes(b"test")
        (self.root / "books" / "new.html").write_text("<html></html>")
        self.patcher = mock.patch.object(release, "ROOT", self.root)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)
        self.book = {
            "id": "new",
            "title": "A new little story",
            "status": "published",
            "cover": "images/new.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0EXAMPLE",
            "description": "An original story for curious readers.",
            "series": "Little Steps",
        }

    def test_only_new_published_books_trigger(self):
        old = dict(self.book, id="old")
        upcoming = dict(self.book, id="soon", status="coming_soon")
        chosen = release.eligible([old, upcoming, self.book], {"announced_ids": ["old"]})
        self.assertEqual([item["id"] for item in chosen], ["new"])

    def test_missing_cover_or_static_page_prevents_announcement(self):
        bad = dict(self.book, cover="images/no.jpg")
        self.assertEqual(release.eligible([bad], {"announced_ids": []}), [])
        (self.root / "books" / "new.html").unlink()
        self.assertEqual(release.eligible([self.book], {"announced_ids": []}), [])

    def test_email_has_branded_layout_utm_and_unsubscribe(self):
        subject, preheader, markup, plain = release.render_email([self.book])
        self.assertIn("A new book", subject)
        self.assertIn("A new little story", markup)
        self.assertIn("utm_campaign=new_book_release", markup)
        self.assertIn("utm_content=new", markup)
        self.assertIn("emma-bellori-logo.webp", markup)
        self.assertIn("align=\"center\"", markup)
        self.assertIn("{% unsubscribe 'Unsubscribe' %}", markup)
        self.assertIn("{{ organization.full_address }}", markup)
        self.assertIn("A new little story", plain)
        self.assertIn("new little story", preheader)

    def test_batch_is_deterministic_and_limited(self):
        examples = [dict(self.book, id="new%d" % i) for i in range(7)]
        for b in examples:
            (self.root / "books" / (b["id"] + ".html")).write_text("ok")
        batch = release.eligible(examples, {"announced_ids": []})
        self.assertEqual(len(batch), 6)
        self.assertEqual(
            release.campaign_key(batch),
            release.campaign_key(list(reversed(batch))),
        )

    def test_special_detail_path(self):
        self.assertEqual(release.detail_path({"id": "door-teapot"}),
                         "books/the-door-inside-the-teapot.html")


if __name__ == "__main__":
    unittest.main()
