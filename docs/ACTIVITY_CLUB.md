# Emma Bellori Free Activity Club

## Current state
The website can collect voluntary mailing-list signups securely through the existing Emma Bellori Supabase project.

### Website
`activity-club.js` displays the signup block on:
- the homepage
- free guide pages, including generated growth guides

### Server
Supabase Edge Function: `join-activity-club`

Stored fields:
- email address
- active/unsubscribed status
- consent version and timestamp
- signup source page / page type
- UTM source, medium and campaign when available

### Abuse prevention
- Cloudflare Turnstile validation
- per-email and pseudonymized network rate limiting
- raw IP address is not stored in the subscriber record

### Access control
The subscriber table has RLS enabled and direct anonymous/authenticated access revoked. Browser clients cannot read the subscriber list; writes occur through the server-side Edge Function using the service role.

## Email delivery
The website collection layer is independent of an email-delivery provider. A dedicated provider should be connected before recurring newsletters or automated welcome emails are enabled. Once connected, synchronize active subscribers to that provider and ensure each delivered marketing email includes the provider's unsubscribe mechanism.
