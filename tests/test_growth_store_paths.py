"""Regression tests for useful guide-to-store paths and consent-aware attribution."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("growth_guides", ROOT / "scripts" / "generate_growth_guides.py")
growth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(growth)


class StoreDiscoveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.items = json.loads((ROOT / "growth" / "guides.json").read_text(encoding="utf-8"))
        cls.published = {
            book["id"]: book for book in
            json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
            if book.get("status") == "published"
        }

    def test_all_acquisition_guides_offer_matching_book_and_kit(self):
        for item in self.items:
            with self.subTest(slug=item["slug"]):
                self.assertIn(item["book_id"], growth.PRINTABLES_BY_BOOK)
                output = growth.page_html(item, self.published)
                self.assertIn("Optional purchases. The guide and its activities are free.", output)
                self.assertIn("utm_campaign=growth_guide", output)
                self.assertIn("utm_content=" + item["slug"], output)
                self.assertIn('data-placement="growth_guide_companion"', output)
                self.assertIn('data-book-id="' + item["book_id"] + '"', output)
                self.assertIn(self.published[item["book_id"]]["amazonUrl"], output)

    def test_store_ids_and_payhip_urls_match_hub(self):
        hub = (ROOT / "printables.html").read_text(encoding="utf-8")
        for book_id, (kit_id, _, payhip_url) in growth.PRINTABLES_BY_BOOK.items():
            with self.subTest(book_id=book_id):
                self.assertIn('data-product-id="' + kit_id + '"', hub)
                self.assertIn(payhip_url + "?", hub)

    def test_no_purchase_prompts_for_unpublished_books(self):
        item = self.items[0].copy()
        item["book_id"] = "upcoming"
        output = growth.page_html(item, self.published)
        self.assertNotIn('data-placement="growth_guide_companion"', output)
        self.assertNotIn("payhip.com/b/", output)

    def test_category_shortcuts_point_to_real_ids(self):
        hub = (ROOT / "printables.html").read_text(encoding="utf-8")
        for _, (kit_id, _, _) in growth.PRINTABLES_BY_BOOK.items():
            self.assertIn('href="#' + kit_id + '"', hub)
            self.assertIn('id="' + kit_id + '"', hub)

    def test_context_tracking_requires_consent_aware_adapter(self):
        source = (ROOT / "conversion-tracking.js").read_text(encoding="utf-8")
        # One canonical event name per outbound destination; the same
        # payload still preserves placement, source page and UTM attribution.
        self.assertIn("window.ebTrack('payhip_click'", source)
        self.assertIn("window.ebTrack('amazon_click'", source)
        self.assertNotIn("window.ebTrack('amazon_click_context'", source)
        self.assertIn("typeof window.ebTrack!=='function'", source)
        self.assertIn("utm_source:", source)
        self.assertIn("utm_content:", source)


if __name__ == "__main__":
    unittest.main()
