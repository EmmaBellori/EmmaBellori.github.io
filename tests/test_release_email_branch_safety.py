"""Guard against newsletter automation bypassing protected main."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "new-release-email.yml"
LEDGER = ROOT / "growth" / "release-email-state.json"
BRANCH = "automation/release-email-state"


class EmailLedgerBranchSafetyTests(unittest.TestCase):
    def test_newsletter_reads_and_writes_only_isolated_ledger_branch(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        restore = text.index("Load announcement ledger from separate automation branch")
        build = text.index("Build preview or Klaviyo campaign")
        save = text.index("Save announcement ledger to isolated branch")
        self.assertLess(restore, build)
        self.assertLess(build, save)
        self.assertIn(
            f"git show refs/remotes/origin/{BRANCH}:growth/release-email-state.json",
            text,
        )
        self.assertIn(f"HEAD:refs/heads/{BRANCH}", text)
        self.assertNotIn("git push\n", text)
        self.assertNotIn("HEAD:refs/heads/main", text)

    def test_initial_ledger_will_be_valid(self):
        import json

        data = json.loads(LEDGER.read_text(encoding="utf-8"))
        self.assertIsInstance(data.get("announced_ids"), list)
        self.assertEqual(len(data["announced_ids"]), len(set(data["announced_ids"])))


if __name__ == "__main__":
    unittest.main()
