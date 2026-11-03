# Free Activity Club — consent UX setup

Status: Website copy and branded confirmation page are implemented in this branch. Klaviyo consent-page edits require manual use of the Klaviyo web editor; the connected API does not expose consent pages.

**Only edit list:** Emma Bellori Free Activity Club (ID `Rv2JJy`). Keep **double opt-in enabled**. Do not change the Welcome Flow or its three emails.

## In Klaviyo

Go to **Audience > Growth tools > Customize subscribe and preference pages > For a specific list**, select **Emma Bellori Free Activity Club**, then choose **Unlink and customize** if the list still uses default pages. Edit and publish each relevant stage.

### A. Email confirmation (double opt-in transactional message)

**Subject:** One quick click to join the Free Activity Club

**Preview:** Confirm your email to get free family guides and gentle activity ideas.

**Eyebrow:** EMMA BELLORI BOOKS · FREE ACTIVITY CLUB

**Heading:** You're almost in!

**Body:**
> Thanks for joining the Emma Bellori Free Activity Club.
>
> Please confirm your email address to complete your subscription. After that, you'll receive a warm welcome and occasional free guides, activity ideas and updates from Emma Bellori Books.

**Button label:** Confirm my subscription

**Supporting text:** Just one click. If you didn't sign up, you can safely ignore this email.

**Design:** no individual book cover; use brand logo only (existing asset: https://emmabellori.github.io/images/emma-bellori-logo.webp). Off-white background `#FFFAF5`, ink `#233E43`, soft sage `#DBE8DC`, fine borders `#E7DDD2`. Headings Georgia/serif, body system sans. One prominent dark-ink button, at least 44 px high. Centre-align on mobile, body 16 px or larger.

**Critical:** Do NOT replace/delete Klaviyo's **actual opt-in confirmation button action** with a regular URL. Preserve the built-in confirmation link/action and change only the visible label, style and surrounding content.

### B. Pre-confirmation page (if Klaviyo's subscribe page is used)

**Eyebrow:** FREE ACTIVITY CLUB

**Heading:** One more step and you're in

**Body:** Check your inbox for an email from Emma Bellori Books. Open it and tap **Confirm my subscription** to finish signing up. You'll then receive your welcome email.

**Support note:** Can't find it? Check Spam or Promotions.

**Optional secondary link:** Browse free family guides: https://emmabellori.github.io/guides/

This custom website's main signup form already has an inline, accessible version of this state after submission. Do not add a second Klaviyo signup form to that page.

### C. Subscribe success page (after clicking the opt-in button)

**Eyebrow:** FREE ACTIVITY CLUB

**Heading:** You're in!

**Body:** Thanks for confirming your email. Your welcome message will arrive soon. Until then, explore free ideas about feelings, friendship, learning and everyday family moments.

**Primary button:** Explore free family guides

**Primary link:** https://emmabellori.github.io/guides/

**Secondary button:** Browse the books

**Secondary link:** https://emmabellori.github.io/#books

**Small footer:** You'll receive occasional family ideas and updates. No daily emails. Unsubscribe whenever you like.

**Best UX option:** If the Klaviyo success-page editor for this account offers **redirect to URL**, use:

https://emmabellori.github.io/free-activity-club/confirmed.html

This URL is an on-brand, responsive, noindex thank-you page already authored in the site source. Use the redirect only if Klaviyo's UI explicitly supports it; otherwise apply the copy/buttons in Klaviyo's hosted success page. The subscription must be finalized by Klaviyo BEFORE redirecting; do not redirect from the email button to this page directly.

**Remove:** the cover image of *Nobody Wants to Play With Me!*; do not replace it with another individual book cover.

### D. Preferences and unsubscribe pages

Keep clear preference/unsubscribe controls. Avoid repurposing confirmation screens to market a book. Add contact email `emmabelloribooks@outlook.com` and a privacy link to https://emmabellori.github.io/privacy.html as supported by the editor.

## Test after publishing

1. On an incognito browser, go to https://emmabellori.github.io/ and submit **a new test address** with actual consent.
2. After submission, verify that the on-site panel says **Check your inbox** and shows the correct email, guidance, and free-guides link.
3. Open Klaviyo confirmation email on a phone. Verify branding, subject, button visibility, and that the built-in confirmation link still works.
4. After confirming, verify the **You're in!** page/redirect and the guides CTA.
5. Verify the contact appears in `Rv2JJy` as subscribed, enters the live Welcome Flow, and that Welcome email arrives.
6. Check responsive layout at 320 and 390 px and keyboard focus states.

## What is already done on the website

- `activity-club.js`: short, empathetic signup copy and accessible post-submit success state; no intrusive redirect, preserved Turnstile, consent, Supabase/Klaviyo calls, and analytics.
- `free-activity-club/confirmed.html`: branded, responsive, noindex success page, existing Emma Bellori logo, and CTAs to guides/books.
- This document: copy, styles and safe Klaviyo settings, in English for the target USA/UK/CA audience.

Do not change list opt-in to single opt-in; verified double opt-in remains the safest path here.
