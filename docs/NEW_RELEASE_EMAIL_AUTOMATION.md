# Emma Bellori Books — automatic new-book email announcements

This is separate from the Free Activity Club Welcome Flow. It uses the same
Klaviyo marketing list (ID Rv2JJy) but creates a campaign only for newly
published catalog entries.

## Current state and launch policy

- catalog.json is the single source of truth. A published book must have
  an actual Amazon.com link, valid cover, and dedicated books/ID.html page.
- growth/release-email-state.json was initialized from the 11 titles
  already published on 2026-11-04. Existing books will not be reannounced.
- A successful draft is written to the ledger, preventing duplicate drafts.
  Repeated changes to metadata or cover do not count as new releases.
- One daily run combines all newly published books (max 6 per email).
  With two releases on Sunday, Monday morning normally produces one email.
- The workflow also supports manual preview and draft creation. Existing
  welcome emails and their delays are not changed.
- The default is draft-only. Automated sending is disabled.

## Enable draft creation (one manual action, no key in source code)

Create a new Klaviyo private API key with minimum scopes:
- campaigns:read, campaigns:write
- templates:read, templates:write

In GitHub, go to EmmaBellori/EmmaBellori.github.io → Settings → Secrets and
variables → Actions → New repository secret. Add:

- Secret name: KLAVIYO_PRIVATE_API_KEY
- Value: the private Klaviyo API key (never share it in chats or commits).

The account already has sender Emma Bellori Books /
emmabelloribooks@outlook.com. No list, flow, or contact data needs changing.

Once the key is present, GitHub Actions creates a draft email campaign for
the newly published books it detects. The new draft appears in Klaviyo Campaigns
and will never send without an additional action.

## Preview safely before making changes

Open GitHub → Actions → New book release emails → Run workflow:

- Mode: preview
- Preview IDs: reindeer,cute-animals-bold-easy
- Run workflow

Download artifact new-book-release-newsletter. It contains HTML, plaintext,
and a manifest. This does not create a Klaviyo campaign and does not advance
the release ledger. Preview IDs can only be used in preview mode.

For ordinary new releases, no action is needed: the workflow runs every day
at 09:20 UTC (10:20 CET / 11:20 CEST), after the GitHub Pages publication.
GitHub Actions scheduled runs can be delayed; this is not a realtime trigger.

## Review each campaign

The automated campaign features:
- The official Emma Bellori logo and original book covers.
- Each book's title, description, collection and a link to its published site page.
- UTM tags: source klaviyo, medium email, campaign new_book_release,
  content = canonical book ID.
- Klaviyo unsubscribe token and the account's mailing address.
- The existing Free Activity Club list, with Klaviyo consent/suppression
  filtering and Smart Sending.

Review the Klaviyo draft, preview mobile and desktop, and send from Klaviyo
manually only once you are satisfied with subject, recipient estimate and content.

## Optional fully automatic sending — keep disabled until validated

The script has an intentionally separate safeguard:
- Repo variable RELEASE_EMAIL_MODE must be send and
- Repo variable RELEASE_EMAIL_ALLOW_SEND must equal YES_I_APPROVE.

Without both, no automated send job can be requested.
Do not enable these variables until a new release draft has been created and
end-to-end delivery has been confirmed. This configuration is intentionally
manual and requires an explicit decision.

## Troubleshooting

- No new titles: workflow exits successfully without generating a campaign.
- Missing secret: workflow produces a preview artifact; the ledger does not
  change. This is not a sent or created Klaviyo draft.
- Site detail page or cover not yet live: workflow fails without advancing
  the ledger; daily retries after deployment.
- API key missing scopes: request fails and prints HTTP error status.
- Klaviyo API partial success: reruns look for the deterministic campaign name
  before attempting a new campaign, helping avoid duplicates.
- The daily run groups max 6 new titles; remaining unannounced titles are
  processed in subsequent runs.
- Do not manually edit announced_ids except after verifying which titles
  were actually drafted/sent.

### API reference

Klaviyo revision 2026-04-15; endpoints POST /api/campaigns/,
POST /api/templates/, POST /api/campaign-message-assign-template/;
sending requires a separate POST /api/campaign-send-jobs/ with the dual
safeguard above.

## Source files

- scripts/release_email_campaign.py — detection, HTML + text, Klaviyo API.
- growth/release-email-state.json — baseline, idempotency ledger, campaign IDs.
- .github/workflows/new-release-email.yml — daily automation and preview.
- tests/test_release_email.py — no-network unit tests.
