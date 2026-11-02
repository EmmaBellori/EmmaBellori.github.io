#!/usr/bin/env python3
"""Add Free Activity Club privacy information to the deployed privacy page."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "_site" / "privacy.html"


def main() -> None:
    if not PATH.exists():
        return
    text = PATH.read_text(encoding="utf-8")
    if "FREE ACTIVITY CLUB" not in text:
        block = '''
        <article class="privacy-card wide">
          <p class="eyebrow">FREE ACTIVITY CLUB</p>
          <h2>Optional mailing list</h2>
          <p>If you choose to join the Emma Bellori Free Activity Club, the site stores the email address you submit together with the date and version of your consent. It may also store the page where you subscribed and campaign information such as UTM source, medium and campaign so Emma Bellori Books can understand which free resources lead to voluntary signups.</p>
          <p>Mailing-list records are stored in Supabase and are not publicly readable from the website. Cloudflare Turnstile is used to reduce automated abuse; technical network information may be processed for verification and rate limiting, but raw IP addresses are not stored in the mailing-list record.</p>
          <p>After the site records your request, your email address is sent to Klaviyo, the email-delivery provider used by Emma Bellori Books. The Free Activity Club list uses double opt-in: Klaviyo sends a confirmation message and marketing emails begin only after you confirm the subscription. Klaviyo also provides the unsubscribe controls included in marketing emails.</p>
          <p>The mailing list is separate from optional Google Analytics: you can subscribe even if you reject analytics. The email address is used for Emma Bellori Books communications such as free family resources, new guides and occasional book updates, and is not sold to advertisers.</p>
          <p>You may unsubscribe using the link in any Klaviyo email or request that your mailing-list record be unsubscribed or deleted by contacting <a href="mailto:emmabelloribooks@outlook.com">emmabelloribooks@outlook.com</a>.</p>
          <p>Provider information: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase privacy information ↗</a> · <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare privacy policy ↗</a> · <a href="https://www.klaviyo.com/legal/privacy" target="_blank" rel="noopener noreferrer">Klaviyo privacy notice ↗</a></p>
        </article>
'''
        marker = '        <article class="privacy-card">\n          <p class="eyebrow">HOSTING</p>'
        if marker in text:
            text = text.replace(marker, block + '\n' + marker, 1)
    else:
        text = text.replace(
            "When a dedicated email-delivery provider is connected, its unsubscribe controls and privacy terms will also apply to messages it sends.",
            "Klaviyo is the email-delivery provider for the Free Activity Club. The list uses double opt-in, so Klaviyo sends a confirmation message and marketing emails begin only after you confirm. Klaviyo's unsubscribe controls and privacy terms apply to messages it sends."
        )
        if "Klaviyo privacy notice" not in text:
            text = text.replace(
                "Cloudflare privacy policy ↗</a>",
                "Cloudflare privacy policy ↗</a> · <a href=\"https://www.klaviyo.com/legal/privacy\" target=\"_blank\" rel=\"noopener noreferrer\">Klaviyo privacy notice ↗</a>"
            )
    text = text.replace(
        "Google Analytics is optional. Amazon purchases happen on Amazon. Upcoming-book preferences use a pseudonymous visitor identifier. Privacy questions can be sent directly to Emma Bellori Books.",
        "Google Analytics is optional. Amazon purchases happen on Amazon. Upcoming-book preferences use a pseudonymous visitor identifier. Free Activity Club signup is optional and uses Supabase for the signup record and Klaviyo for double-opt-in email delivery. Privacy questions can be sent directly to Emma Bellori Books."
    )
    text = text.replace("Last updated: 21 October 2026.", "Last updated: 2 November 2026.")
    PATH.write_text(text, encoding="utf-8")
    print("Updated deployed privacy page for Free Activity Club and Klaviyo.")


if __name__ == "__main__":
    main()
