# Emma Bellori Books — migration to `emmabellori.github.io`

This repository is now the account-level GitHub Pages site.

## Target

- Old URL: `https://emmabellori.github.io/emma-bellori-books/`
- New URL: `https://emmabellori.github.io/`

## What the migration build does

The custom Pages workflow runs only when the repository name is exactly `EmmaBellori/EmmaBellori.github.io`.

At build time it:

1. copies the current static site into `_site`;
2. rewrites `https://emmabellori.github.io/emma-bellori-books/` to `https://emmabellori.github.io/` in HTML, JSON-LD, XML, JavaScript, CSS and other text assets;
3. publishes a root sitemap and root `robots.txt`;
4. creates legacy pages under `/emma-bellori-books/` for every URL currently listed in `sitemap.xml`;
5. gives each legacy page an immediate redirect and canonical to the equivalent root URL;
6. adds a 404 fallback that strips the old `/emma-bellori-books/` prefix for uncatalogued legacy URLs.

## Cutover status

- Technical SEO PR merged.
- Root migration PR merged.
- Repository renamed to `EmmaBellori.github.io`.
- Post-rename deployment trigger committed on 2026-10-27.

## Post-cutover verification

Verify:
- `https://emmabellori.github.io/`
- `https://emmabellori.github.io/sitemap.xml`
- one book page at the new root path
- the old homepage `/emma-bellori-books/`
- one old book URL under `/emma-bellori-books/books/...`

Then in Google Search Console, submit `https://emmabellori.github.io/sitemap.xml` and request indexing for the homepage and priority pages.

## Rollback

If the cutover needs to be reversed, restore the previous repository name and Pages publishing source, then revert the migration deployment configuration.
