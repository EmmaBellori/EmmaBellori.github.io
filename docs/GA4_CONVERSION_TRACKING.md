# GA4 conversion tracking — Emma Bellori Books

The deployed site emits two Amazon click events after analytics consent:

- `amazon_click` — legacy compatibility event
- `amazon_click_context` — enriched attribution event used for growth analysis

## `amazon_click_context` parameters

- `book_id`
- `page_type` (`homepage`, `guide`, `book`, `collection`, `privacy`)
- `source_page`
- `placement`
- `collection`
- `link_host`
- `link_type`
- `landing_path`
- `referrer_host`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`

UTM attribution is captured on entry and stored only in `sessionStorage`, so it follows the visitor across pages during the same browser session without creating an extra persistent identifier.

## GA4 recommended custom dimensions

Register the following event-scoped custom dimensions first:

1. `book_id`
2. `page_type`
3. `source_page`
4. `placement`
5. `collection`
6. `utm_source`
7. `utm_medium`
8. `utm_campaign`

Use `amazon_click_context` as the primary outbound-commerce event for comparing SEO pages and Pinterest campaigns.
