"""Collection counters always follow the canonical catalog publication statuses."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import build_root_site


HTML = """<!doctype html><html lang="en"><body>
<dl class="collection-stats">
  <div><dt>Total books</dt><dd>99</dd></div>
  <div><dt>Available now</dt><dd>99</dd></div>
  <div><dt>Coming Soon</dt><dd>99</dd></div>
</dl>
<h2 id="available-heading">Available now <span>99</span></h2>
<h2 id="upcoming-heading">Coming Soon <span>99</span></h2>
</body></html>"""


class CollectionStatsTests(unittest.TestCase):
    def test_counts_update_on_new_publication(self):
        with tempfile.TemporaryDirectory() as temp:
            site = Path(temp)
            (site / "collections").mkdir()
            page = site / "collections" / "little-christmas-wonders.html"
            page.write_text(HTML, encoding="utf-8")
            books = [
                {"id": "first", "seriesSlug": "little-christmas-wonders", "status": "published"},
                {"id": "second", "seriesSlug": "little-christmas-wonders", "status": "coming_soon"},
                {"id": "other", "seriesSlug": "another-series", "status": "published"},
            ]

            with patch.object(build_root_site, "DEST", site):
                (site / "catalog.json").write_text(json.dumps(books), encoding="utf-8")
                build_root_site.prerender_collection_counts()
                first_html = page.read_text(encoding="utf-8")
                self.assertIn("<dt>Total books</dt><dd>2</dd>", first_html)
                self.assertIn("<dt>Available now</dt><dd>1</dd>", first_html)
                self.assertIn("<dt>Coming Soon</dt><dd>1</dd>", first_html)
                self.assertIn('id="available-heading">Available now <span>1</span>', first_html)
                self.assertIn('id="upcoming-heading">Coming Soon <span>1</span>', first_html)

                books[1]["status"] = "published"
                (site / "catalog.json").write_text(json.dumps(books), encoding="utf-8")
                build_root_site.prerender_collection_counts()
                updated_html = page.read_text(encoding="utf-8")
                self.assertIn("<dt>Total books</dt><dd>2</dd>", updated_html)
                self.assertIn("<dt>Available now</dt><dd>2</dd>", updated_html)
                self.assertIn("<dt>Coming Soon</dt><dd>0</dd>", updated_html)
                self.assertIn('id="available-heading">Available now <span>2</span>', updated_html)
                self.assertIn('id="upcoming-heading">Coming Soon <span>0</span>', updated_html)


if __name__ == "__main__":
    unittest.main()
