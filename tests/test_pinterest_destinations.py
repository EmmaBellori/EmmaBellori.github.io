"""Guard Pinterest campaign links against broken or untracked destinations."""
import json
import unittest
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parents[1]


class PinterestDestinationsTests(unittest.TestCase):
    def test_every_campaign_url_is_real_and_tagged(self):
        campaign = json.loads((ROOT / "growth" / "pinterest-amplification.json").read_text(encoding="utf-8"))
        generated = {
            item["slug"]
            for item in json.loads((ROOT / "growth" / "guides.json").read_text(encoding="utf-8"))
        }
        known = generated | {p.stem for p in (ROOT / "guides").glob("*.html")}
        pins = campaign["pins"]
        self.assertEqual(len(pins), 14)
        seen_utm = set()
        for pin in pins:
            with self.subTest(slot=pin["slot"]):
                url = urlparse(pin["url"])
                expected = "/guides/" + pin["slug"] + ".html"
                self.assertEqual(url.scheme, "https")
                self.assertEqual(url.hostname, "emmabellori.github.io")
                self.assertEqual(url.path, expected)
                self.assertIn(pin["slug"], known, "Pin points to a missing guide")
                params = parse_qs(url.query)
                self.assertEqual(params.get("utm_source"), ["pinterest"])
                self.assertEqual(params.get("utm_medium"), ["organic"])
                self.assertTrue(params.get("utm_campaign"))
                token = params.get("utm_content", [""])[0]
                self.assertTrue(token)
                self.assertNotIn(token, seen_utm, "Duplicate UTM attribution token")
                seen_utm.add(token)
                self.assertTrue(pin["title"].strip())
                self.assertTrue(pin["alt"].strip())
                self.assertTrue(pin["creative_brief"].strip())


if __name__ == "__main__":
    unittest.main()
