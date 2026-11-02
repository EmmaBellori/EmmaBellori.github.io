# Emma Bellori Books — Growth KPI Playbook

## North-star path
Search / Pinterest → useful guide → related book page → Amazon click → purchase on Amazon.

Because Amazon purchases happen outside this website, the site can measure outbound commercial intent precisely, but it cannot attribute every Amazon order back to an individual GA4 session.

## Primary measurements

### Google Search Console
Track by landing page and query:
- impressions
- clicks
- CTR
- average position

### GA4
Track:
- sessions by channel and landing page
- engaged sessions / engagement rate
- `amazon_click_context`
- `newsletter_signup`
- Payhip product CTA events where present

### Amazon-side signals
Review separately:
- orders / royalties
- bestseller rank and category movement
- review count and rating
- Kindle / paperback performance by title

## Evaluation loop

1. **Discover** — wait for a page or Pin to earn meaningful impressions rather than judging from a handful of views.
2. **Improve CTR** — when a page receives repeated impressions but weak clicks, test a clearer title and description before creating more pages on the same intent.
3. **Improve commercial bridge** — when a guide earns visits but few Amazon clicks, strengthen the related-story section, internal links and CTA relevance rather than adding aggressive sales copy.
4. **Expand winners** — when a cluster repeatedly attracts qualified visits and Amazon clicks, add adjacent search intents and Pinterest creative variants.
5. **Retire or merge overlap** — if two pages target essentially the same intent and neither gains traction, consolidate rather than producing more near-duplicates.

## Practical heuristic thresholds
These are decision aids, not universal SEO rules.

- **50+ search impressions, position 8–30:** improve snippet, intro and internal linking; the page is close enough to deserve optimization.
- **100+ impressions with CTR below ~2%:** review title/meta against the actual queries generating impressions.
- **A guide with sustained Amazon-click rate above ~3%:** candidate for cluster expansion because its traffic is showing commercial relevance.
- **Pinterest creative that generates site clicks:** make 3–5 materially different variants pointing to the same proven landing page before inventing a new topic.
- **Newsletter signup source that repeatedly converts visitors:** give that content family more visibility and create a matching welcome resource.

## Weekly operating review
Compare the latest 7 days with the prior 7 days:
1. GSC impressions and clicks by guide cluster.
2. Organic Search and Organic Social sessions.
3. `amazon_click_context` by `source_page`, `book_id`, `placement`, and UTM campaign.
4. `newsletter_signup` by source page and campaign.
5. Amazon orders and royalties by promoted title.

The expansion decision should be based on the combination of traffic quality and commercial intent, not pageviews alone.
