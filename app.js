
const books = window.EMMA_BOOKS || [];
const grid = document.querySelector('#book-grid');
const empty = document.querySelector('#empty');
const search = document.querySelector('#search');

const authorUrl = 'https://www.amazon.com/author/emmabellori';

let filter = 'all';

const labels = {
  feelings: 'Big Feelings',
  activity: 'Color & Create',
  explorers: 'Little Explorers',
  adult: 'Adult Coloring',
  friendship: 'Friendship'
};

// Protect text displayed inside HTML.
const escapeHTML = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

// Normalize book format labels.
function formatLabel(value) {
  const text = String(value ?? '')
    .replace(/\bedition\b/gi, '')
    .trim();

  const hasKindle = /kindle/i.test(text);
  const hasPaperback = /paperback/i.test(text);

  if (hasKindle && hasPaperback) {
    return 'Kindle + Paperback';
  }

  if (hasKindle) {
    return 'Kindle';
  }

  if (hasPaperback) {
    return 'Paperback';
  }

  return text;
}

// Render a book cover or a placeholder.
function cover(b) {
  return b.cover
    ? `<img loading="lazy"
            src="${escapeHTML(b.cover)}"
            alt="Cover of ${escapeHTML(b.title)}">`
    : `<div class="cover-placeholder ${escapeHTML(b.category)}">
         <span class="cover-star">✦</span>
         <strong>${escapeHTML(b.title)}</strong>
         <small>Emma Bellori</small>
       </div>`;
}

// Render the book catalog.
function render() {
  const q = search.value.trim().toLowerCase();

  const filtered = books.filter(b =>
    (
      filter === 'all' ||
      b.category === filter ||
      (
        filter === 'friendship' &&
        /friend|belong|connection/i.test(
          [b.theme, b.description, b.title].join(' ')
        )
      )
    ) &&
    [b.title, b.theme, b.description, b.format]
      .join(' ')
      .toLowerCase()
      .includes(q)
  );

  grid.innerHTML = filtered.map(b => {
    const cta = 'Explore this book →';
    const bookPage = `books/${escapeHTML(b.id)}.html`;

    return `
      <article class="book-card">

        <a class="cover-frame cover-link"
           href="${bookPage}"
           aria-label="Discover ${escapeHTML(b.title)}">
          ${cover(b)}
        </a>

        <div class="book-meta">
          <span>${escapeHTML(labels[b.category] || b.category)}</span>
          <span>${escapeHTML(formatLabel(b.format))}</span>
        </div>

        <h3>
          <a class="book-title-link" href="${bookPage}">
            ${escapeHTML(b.title)}
          </a>
        </h3>

        <p class="book-theme">
          ${escapeHTML(b.theme)}
        </p>

        <p class="book-description">
          ${escapeHTML(b.description)}
        </p>

        <div class="book-bottom">
          <a class="amazon-cta"
             href="${bookPage}"
             aria-label="${escapeHTML(cta + ' — ' + b.title)}">
            ${cta}
          </a>
        </div>

      </article>
    `;
  }).join('');

  empty.hidden = filtered.length > 0;

  const results = document.querySelector('#results-count');

  if (results) {
    results.textContent = filtered.length === 1
      ? 'Showing 1 book'
      : `Showing ${filtered.length} books`;
  }

  document.querySelectorAll('[data-filter]').forEach(el => {
    const active = el.dataset.filter === filter;

    el.classList.toggle('active', active);
    el.setAttribute('aria-pressed', String(active));
  });
}

// Handle collection filters.
document.querySelectorAll('[data-filter]').forEach(el => {
  el.addEventListener('click', () => {
    filter = el.dataset.filter;

    render();

    document.querySelector('#books').scrollIntoView({
      behavior: window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches ? 'auto' : 'smooth'
    });
  });
});

// Handle book search.
search.addEventListener('input', render);

// Update copyright year.
document.querySelector('#year').textContent =
  new Date().getFullYear();

// Initial catalog rendering.
render();
