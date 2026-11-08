# Reader-first website — Emma Bellori Books

This PR keeps the original branding, GitHub Pages, catalog.json, Supabase voting, Klaviyo double opt-in, consent settings, security scanner and Amazon/Payhip destinations.

## Seven completed improvements

1. **Product pages:** The deploy pipeline enhances every published book page with suggested ages, actual published format, a themed family reading prompt, three actual interior preview images, related family guide and a second Amazon link. The interior samples work as normal image links without JavaScript; with JavaScript they use the existing enlargement dialog.
2. **Homepage and discovery:** The hero helps parents find a book. A new book-finder page offers filtering by age, feelings and interests. Search suggestions cover topics and published books appear before upcoming titles.
3. **Coming Soon:** Homepage collection previews emphasize published titles; upcoming releases and original voting remain available in a separate lower section. Both no-JavaScript and interactive renderers follow the same model.
4. **Free Activity Club:** A truly free five-minute printable family play sheet is available without an email address, purchase or registration, and is linked from the signup area. The browser now records newsletter_signup_requested, which describes a confirmation request—not a verified subscription.
5. **Trust:** A dedicated About page explains editorial intent, Amazon and Payhip destinations, contact, age guidance, privacy and the difference between available and future titles.
6. **SEO and guide paths:** Related reading options were added to the free guides. The finder, About and free activity pages have canonical URLs and sitemap entries. Published book links are rendered into static HTML.
7. **Performance and accessibility:** A lightweight SVG favicon, reduced non-book JSON fetching, progressive-enhanced images, visible focus, semantic filters, status updates and print/reduced-motion styles are added.

## Ongoing publishing

Follow PUBLISHING_GUIDE.md. Publication still requires the real static book page, original cover and verified Amazon ASIN. Update canonical catalog.json, including status, amazonUrl, format, publishedOn, theme and description. Every new release then appears automatically in the discovery page and gets the shared details layout on deployment. Add or adjust editorial theme guidance in scripts/improve_reader_journey.py; never invent scenes, page counts, reviews or unsupported claims.

## Build and checks

After scripts/build_root_site.py and scripts/generate_growth_guides.py, the Pages workflow runs scripts/improve_reader_journey.py, before privacy, conversion, activity club and site security injection. The dedicated reader-journey CI recreates the deployed Pages output, validates all published book pages and image previews, checks structured links and SEO, and runs the existing collection and release tests.

## Reporting

- amazon_click and payhip_click are canonical outbound click events with placement and source/UTM context, sent only after analytics consent. They do not prove purchases.
- book_finder_filter measures filter engagement and returned matches.
- reader_journey_click measures internal links.
- newsletter_signup_requested measures a double-opt-in **request**. Confirmed subscriptions must be measured through Klaviyo, not inferred from a browser action.
- Amazon KDP and Payhip sales must be read from the respective platforms.

## Manual checks outside GitHub code

- Verify the root Search Console property at https://emmabellori.github.io/ and root sitemap at https://emmabellori.github.io/sitemap.xml; the connected Windsor.ai property still represents the older /emma-bellori-books/ path.
- Test the site after merging on mobile, desktop, keyboard and assistive technology. Run PageSpeed Insights to measure LCP, INP and CLS; this PR does not assert a Lighthouse performance score.
- Review Klaviyo confirmed-subscription metrics, site-to-Amazon clicks and actual KDP sales over comparable time windows.
