# Emma Bellori Books — Security hardening checklist

This is a GitHub Pages site with Supabase Edge Functions and automated GitHub Actions. These controls are layered; none guarantees a breach-proof website.

## Protections implemented in this repository

- GitHub Actions are referenced by immutable, verified full commit SHAs, not mutable version tags.
- The Pages build job has read-only repository access. The separate deployment job alone receives `pages: write` and `id-token: write`.
- The new `scripts/harden_site.py` checks for high-confidence leaked credentials, private-key artifacts and insecure HTTP links; deployment stops when it detects a match.
- After generating the site, the build adds limited Content Security Policy directives (`object-src 'none'`, `base-uri 'self'`, `upgrade-insecure-requests`) plus a referrer policy to HTML pages. These directives **do not implement a strict script-src policy**, block clickjacking, or provide HTTP response headers. They are compatible with the existing GA4, Cloudflare Turnstile and Klaviyo code paths.
- Security checks run on pull requests, main pushes and on a weekly schedule, with no secret access.
- Frontend HTML attribute escaping has been corrected.

## Highest-priority account settings (owner action needed)

1. **GitHub account:** enable passkey or strong two-factor authentication, store recovery codes safely, review logged-in sessions, third-party OAuth grants, personal access tokens and repository collaborators.
2. **Repository settings > Security:** enable/verify secret-scanning alerts and push protection. Enable CodeQL default code scanning if available, plus Dependabot security alerts and updates. Review any existing alerts and rotate *actual* leaked credentials instead of simply deleting a commit.
3. **Repository settings > Rules > Rulesets:** protect `main` against force pushes and deletion; require passing status checks. There were no active rulesets visible when reviewed on November 8, 2026. Branch protection via the protected-branches API was not readable by the connected GitHub integration.
4. **Before requiring all changes through PRs:** note that `.github/workflows/new-release-email.yml` currently commits `growth/release-email-state.json` directly to `main` after scheduled newsletter processing. A strict PR-only ruleset could break this ledger and cause repeated announcements. Move that ledger to a separate approved storage/branch workflow, or configure an appropriate narrowly scoped exemption, before enabling a strict PR-only rule. Do not simply disable the release email automation.
5. **GitHub Actions > General:** allow only required actions, require approval for untrusted contributors, and prefer read-only default token permissions. Keep permissions narrowly scoped per job.
6. **Settings > Pages:** verify Enforce HTTPS. Do not accept passwords or credit-card data directly on GitHub Pages.

## Backend and public forms

- `submit-book-preference` and `join-activity-club` are intentionally public Supabase Edge Functions (`verify_jwt=false`). Their code verifies the Cloudflare Turnstile token and hostname, checks request size/origin and performs rate limiting. A public endpoint can still be probed; an Origin check alone is **not** authentication.
- The security advisor reports six `rls_enabled_no_policy` informational findings. Their tables have RLS enabled with no browser-facing policies, which is generally a deny-by-default configuration and not evidence of a data exposure. Keep direct public access closed unless a carefully reviewed policy is needed.
- Never put `SUPABASE_SERVICE_ROLE_KEY`, Turnstile secret keys or Klaviyo private API keys in HTML, client JS, repository files or generated site artifacts. Keep them in correctly scoped secrets and rotate any that may have leaked.
- Continue monitoring Supabase Function logs, account notifications, quotas and unusual submission spikes. Client-side rate limits are not security boundaries; backend verification must remain enabled.

## Optional next level: custom domain and edge protection

The `emmabellori.github.io` hostname is operated by GitHub; you cannot simply change its server-side HTTP response headers or place it behind a third-party WAF using only this repository.

For stronger controls, use an owned custom domain with a properly configured Cloudflare proxy / supported static hosting. Then configure and verify real **HTTP response** security headers (including `frame-ancestors`, `X-Content-Type-Options` and a strict tested `script-src` CSP), WAF managed rules, rate limiting where supported and DNS/account protections. Preserve the existing GA4 consent, Supabase requests and Turnstile functionality. Test in report-only mode before enforcing any full CSP.

If the old `github.io` URL remains publicly reachable, edge filtering on the custom domain does **not** shield the old hostname; plan canonical redirects and communication accordingly.

## Incident response

If an unauthorized commit or site change occurs, revoke affected tokens, rotate actual exposed keys, disable suspect workflow runs, restore a known-good commit, examine audit/Actions logs, check Supabase and Klaviyo integrations, then redeploy. Check backup/recovery procedures periodically.

Review after major site, email-flow or backend changes and whenever GitHub/Supabase report a security alert.
