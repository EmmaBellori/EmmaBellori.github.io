# Interior book previews

Store 2–3 sample interior images for each title in a folder named with the book's existing `id` from `catalog.json`.

Recommended structure:

```text
images/previews/mistakes/01.jpg
images/previews/mistakes/02.jpg
images/previews/mistakes/03.jpg
```

Then add a `previewImages` array to the matching book in `catalog.json`.

Example:

```json
"previewImages": [
  {"src":"images/previews/mistakes/01.jpg","alt":"Interior preview page 1 of I Hate Making Mistakes"},
  {"src":"images/previews/mistakes/02.jpg","alt":"Interior preview page 2 of I Hate Making Mistakes"},
  {"src":"images/previews/mistakes/03.jpg","alt":"Interior preview page 3 of I Hate Making Mistakes"}
]
```

The site automatically detects this data. No page-specific HTML changes are needed. If `previewImages` is absent or empty, no preview control is displayed.
