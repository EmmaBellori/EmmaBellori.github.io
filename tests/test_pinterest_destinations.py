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

    def test_payhip_pilot_links_open_existing_kit_sections(self):
        plan = json.loads(
            (ROOT / "growth" / "pinterest-payhip-outbound-pilot.json").read_text(encoding="utf-8")
        )
        hub = (ROOT / "printables.html").read_text(encoding="utf-8")
        self.assertEqual(len(plan["pins"]), 6)
        observed = set()
        for pin in plan["pins"]:
            with self.subTest(id=pin["id"]):
                url = urlparse(pin["url"])
                self.assertEqual(url.scheme, "https")
                self.assertEqual(url.hostname, "emmabellori.github.io")
                self.assertEqual(url.path, "/printables.html")
                self.assertEqual(url.fragment, pin["id"])
                self.assertIn('id="' + pin["id"] + '"', hub)
                params = parse_qs(url.query)
                self.assertEqual(params.get("utm_source"), ["pinterest"])
                self.assertEqual(params.get("utm_medium"), ["organic"])
                self.assertEqual(params.get("utm_campaign"), ["payhip_pilot_nov2026"])
                self.assertEqual(params.get("utm_content"), [pin["id"]])
                self.assertNotIn(pin["id"], observed)
                observed.add(pin["id"])
                self.assertEqual(pin["status"], "creative_needed_not_scheduled")
                self.assertTrue(pin["title"] and pin["description"] and pin["alt"] and pin["brief"])


if __name__ == "__main__":
    unittest.main()
