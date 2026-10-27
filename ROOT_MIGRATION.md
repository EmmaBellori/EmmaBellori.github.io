# Emma Bellori Books — migration to `emmabellori.github.io`

This branch prepares the current project-site repository to become the account-level GitHub Pages site.

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

## Safe cutover order

1. Merge the technical SEO PR first.
2. Merge this migration PR second.
3. In GitHub repository **Settings → General**, rename `emma-bellori-books` to `EmmaBellori.github.io`.
4. In **Settings → Pages**, set **Source** to **GitHub Actions**.
5. Open **Actions → Deploy root GitHub Pages → Run workflow**.
6. Verify:
   - `https://emmabellori.github.io/`
   - `https://emmabellori.github.io/sitemap.xml`
   - one book page at the new root path
   - the old homepage `/emma-bellori-books/`
   - one old book URL under `/emma-bellori-books/books/...`
7. In Google Search Console, add/verify the root URL-prefix property if needed, submit `https://emmabellori.github.io/sitemap.xml`, and request indexing for the new homepage and priority pages.

## Rollback

Before the repository is renamed, this workflow is inert because of the repository-name guard. If the cutover needs to be reversed after rename, rename the repository back and restore the previous Pages publishing source.
