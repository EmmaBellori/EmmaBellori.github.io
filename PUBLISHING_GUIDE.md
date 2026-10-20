# Emma Bellori Books — Publishing workflow

## Canonical catalog and published pages
Edit **[catalog.json](catalog.json)** for catalog status, Amazon URL and book metadata. It remains the canonical source for the homepage and live collection synchronization. Do **not** edit `books.js` or `coming-soon.js`: they are legacy files, no longer loaded by the homepage.

Published books also use a dedicated static page under `books/` so they have a clean, indexable URL. The normal filename is the book `id` plus `.html` (for example `mad` → `books/mad.html`). The existing `door-teapot` title is the only legacy filename exception: `books/the-door-inside-the-teapot.html`.

### Publish an existing Coming Soon book
Before switching the catalog status, create the book's static SEO page under:

```text
books/BOOK-ID.html
```

Use an existing published book page as the template. Give the page its own title, meta description, canonical URL, Open Graph metadata, Book structured data, cover, Amazon link, related guide/collection links and related-book links. Keep the book `id` unchanged.

Then find the object with its existing `id` in `catalog.json`. Change:

```json
"status": "coming_soon"
```

to:

```json
"status": "published",
"amazonUrl": "https://www.amazon.com/dp/REAL_ASIN",
"format": "Paperback",
"theme": "Short subtitle",
"description": "A short description for readers."
```

Do not copy these placeholder values into a real listing. Use the real Amazon URL and actual format. If the other fields already exist, edit their values rather than duplicating keys.

**Minimum required catalog edits:** `status` and `amazonUrl`. The format, theme, and description are recommended for quality. Keep `id`, `series`, `seriesSlug` and `cover` unchanged to preserve identity and the original cover. Click **Commit changes**.

After GitHub Pages refreshes:
- The title moves automatically into the published section of its collection and displays **View on Amazon**.
- Homepage search, Start Here/Latest, collection synchronization and related-book links route published titles to their clean `books/...html` page.
- Old `book.html?id=...` links for a published title redirect to its canonical static page.
- Its heart disappears.
- Turnstile remains configured and needs no change.
- The Supabase vote function checks the published catalog on every submission and refuses votes for published titles.
- The database keeps historical preference events privately.

### Add an upcoming title
Copy an existing `coming_soon` object, assign a **new unique** lowercase `id`, set the correct `series` and `seriesSlug`, `title`, and a valid `cover` path, and upload the original cover image to the repository. The shared `book.html?id=BOOK-ID` page remains the detail page while the title is Coming Soon. The database accepts the new title automatically after its first verified vote. For a new series, choose a unique lowercase hyphenated `seriesSlug` and optionally add `seriesDescription`.

### Add an interior preview (2–3 images)
The website is ready to show interior samples for both **Available now** and **Coming Soon** titles. The preview is optional: if a book has no preview images yet, no empty placeholder or button is shown.

1. Create/upload the images under:

```text
images/previews/BOOK-ID/01.jpg
images/previews/BOOK-ID/02.jpg
images/previews/BOOK-ID/03.jpg
```

Use the book's existing `id` exactly. JPG or WebP are recommended. Keep each image reasonably compressed for fast loading and make sure the page is readable on mobile.

2. In that book's object inside `catalog.json`, add:

```json
"previewImages": [
  {
    "src": "images/previews/BOOK-ID/01.jpg",
    "alt": "Interior preview page 1 of BOOK TITLE"
  },
  {
    "src": "images/previews/BOOK-ID/02.jpg",
    "alt": "Interior preview page 2 of BOOK TITLE"
  },
  {
    "src": "images/previews/BOOK-ID/03.jpg",
    "alt": "Interior preview page 3 of BOOK TITLE"
  }
]
```

Two or three images are recommended. The site intentionally uses at most the first **3** entries.

Once `previewImages` is present:
- homepage book cards automatically gain a **Preview inside** control;
- collection cards automatically gain the same control, including Coming Soon titles;
- clicking it opens a large, keyboard-friendly gallery with previous/next navigation and thumbnails;
- published book detail pages also show the 2–3 interior pages directly in an **Inside the book** section, and each image can be enlarged;
- the same preview data can be used by static published pages and shared Coming Soon detail pages.

For a static published page, make sure the page's HTML includes the preview component expected by the current site template. For Coming Soon titles, upload the images and update the title's `previewImages` field in `catalog.json`.

### Remove a title
Prefer changing its status only when it is actually published. Do not reuse book IDs. For a canceled title, coordinate removal separately; old preferences remain in the private database.

### Read voting statistics (private)
Open [Supabase SQL Editor](https://supabase.com/dashboard/project/hsrmqwneuadoomqakzfs/sql/new) and run:

```sql
select series_id, book_id, active_preferences, historical_supporters, total_selection_events
from public.private_preference_report
order by series_id, active_preferences desc, historical_supporters desc;
```

- **active_preferences**: visitors currently selecting the title.
- **historical_supporters**: unique pseudonymous visitor IDs that have ever selected it (including after changing their preference).
- **total_selection_events**: number of first selections and changes to that title.

These are different metrics. For a published title, active preferences may later decline as visitors choose a different title in the same series. Historical supporters are retained. Counts are never public.

### Important safeguards
- Never upload Turnstile secret keys or Supabase service-role keys to GitHub.
- Only publish once the Amazon listing is live. An Amazon URL is required for published entries.
- Create and verify the static `books/BOOK-ID.html` page before changing the catalog status to `published`.
- The site and voting service read the public catalog; GitHub Pages/CDN deployment can take a few minutes.
- A book's `id` must never change once it has received votes.
- Do not change the `seriesSlug` of a book with recorded preferences.
