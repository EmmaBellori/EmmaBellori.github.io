# Emma Bellori Books — starter website

## What is included
- Responsive English homepage with a searchable, filterable six-book catalog.
- Collection sections for children's feelings, activities, exploration and future adult coloring books.
- Individual book details in accessible pop-up panels.
- Link to the verified Emma Bellori Amazon author page.
- No subscription, tracking cookies, forms or paid dependencies.

## Important before publishing
1. **Replace placeholder covers.** Add your original cover images to `assets/` (e.g. `assets/halloween-kawaii.webp`) and put the path in the matching `cover` property in `books.js`. Do not use the screenshot `catalog-reference.png` as product photography; it is only a visual reference and may be removed.
2. **Add individual Amazon product links.** Find each product's actual Amazon.com URL and paste it into `amazonUrl`. Until set, buttons explicitly point to the author page instead. Do not invent ASINs.
3. **Review descriptions and prices.** Initial prices were read from your screenshot and may change. Descriptions are short promotional drafts, not verified product specifications.
4. **Contact information.** The Contact section deliberately has no fake email. Add a real contact address when ready. Add an appropriate privacy page if you add analytics, newsletter or other data collection.
5. **Logo and images.** Current header is typographic. You can replace it with your own author branding.

## Free GitHub Pages deployment
1. Create a free GitHub account at github.com.
2. Create a new **public** repository, e.g. `emma-bellori-books`.
3. Upload `index.html`, `style.css`, `app.js`, `books.js`, and `assets/` into the repository root.
4. Open **Settings → Pages** and select **Deploy from a branch**, branch **main**, folder **/(root)**. Save.
5. GitHub will show a public address such as `https://YOUR-USERNAME.github.io/emma-bellori-books/`. The actual URL depends on your account name. Wait for deployment and test on mobile.
6. Optional: purchase a custom domain later and configure it in GitHub Pages and your domain DNS settings. HTTPS should be enabled.

## Add two books per week (about 10–20 minutes for the site once assets are ready)
1. Prepare two web-sized original cover images in WebP or JPEG, ideally portrait ratio and compressed for fast loading.
2. Open `books.js` on GitHub and click Edit.
3. Duplicate a book object, change `id` (unique), `title`, `category` (`feelings`, `activity`, `explorers`, or `adult`), `format`, `price`, `theme`, `description`, `cover`, and `amazonUrl`.
4. Upload the two covers to `assets/` and commit your changes. GitHub Pages automatically redeploys.
5. Test category filters, search, book details and Amazon product links.
6. Create 3–5 distinct Pinterest pins per new book. Link to the most relevant site section or, in a future iteration, a dedicated book URL.

## Suggested 20-minute weekly checklist
- Monday: add first title and cover; check links.
- Thursday: add second title and cover; check links.
- Friday: publish or schedule original Pinterest content; record outgoing clicks and KDP sales separately.

## Limitations and next steps
- This starter uses one page and a modal per book, **not SEO-indexable individual product pages**. When the catalog grows or organic Google search becomes a priority, generate static pages for each book with unique URLs and metadata.
- This is a static website. Updating `books.js` requires editing one simple file, not using an admin panel.
- The Amazon author link is verified as user-provided; individual product URLs have not been independently verified.
- Check current GitHub Pages terms and any relevant privacy/legal requirements before launch.
