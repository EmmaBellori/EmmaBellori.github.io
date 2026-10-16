# Emma Bellori Books — Publishing workflow

## One file to update
Edit **[catalog.json](catalog.json)** in GitHub (pencil icon). This is the canonical source for the homepage. Do **not** edit `books.js` or `coming-soon.js`: they are legacy files, no longer loaded by the homepage.

### Publish an existing Coming Soon book
Find the object with its existing `id`. Change:

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

**Minimum required edits:** `status` and `amazonUrl`. The format, theme, and description are recommended for quality. Keep `id`, `series`, `seriesSlug` and `cover` unchanged to preserve identity and the original cover. Click **Commit changes**.

After GitHub Pages refreshes:
- The title moves automatically into the published section of its collection, and displays **View on Amazon**.
- Its heart disappears; its detail link uses the shared `book.html?id=...` page.
- Turnstile remains configured and needs no change.
- The Supabase vote function checks the published catalog on every submission and refuses votes for published titles.
- The database keeps historical preference events privately.

### Add an upcoming title
Copy an existing `coming_soon` object, assign a **new unique** lowercase `id`, set the correct `series` and `seriesSlug`, `title`, and a valid `cover` path, and upload the original cover image to the repository. The database accepts the new title automatically after its first verified vote. For a new series, choose a unique lowercase hyphenated `seriesSlug` and optionally add `seriesDescription`.

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
- The site and voting service read the public catalog; GitHub Pages/CDN deployment can take a few minutes.
- The six original book pages remain unchanged.
- A book's `id` must never change once it has received votes.
- Do not change the `seriesSlug` of a book with recorded preferences.
