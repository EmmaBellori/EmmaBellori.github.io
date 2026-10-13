const books=window.EMMA_BOOKS||[];const grid=document.querySelector('#book-grid');const empty=document.querySelector('#empty');const search=document.querySelector('#search');const authorUrl='https://www.amazon.com/author/emmabellori';let filter='all';const labels={feelings:'Big Feelings',activity:'Color & Create',explorers:'Little Explorers',adult:'Adult Coloring'};const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function cover(b){return b.cover?`<img loading="lazy" src="${escapeHTML(b.cover)}" alt="Cover of ${escapeHTML(b.title)}">`:`<div class="cover-placeholder ${escapeHTML(b.category)}"><span class="cover-star">✦</span><strong>${escapeHTML(b.title)}</strong><small>Emma Bellori</small></div>`}function render(){
 const q=search.value.trim().toLowerCase();
 const filtered=books.filter(b=>(filter==='all'||b.category===filter)&&[b.title,b.theme,b.description,b.format].join(' ').toLowerCase().includes(q));
 grid.innerHTML=filtered.map(b=>{
  const url=b.amazonUrl||authorUrl;
  const cta='Explore this book →';
  return `<article class="book-card"><div class="cover-frame">${cover(b)}</div><div class="book-meta"><span>${escapeHTML(labels[b.category]||b.category)}</span><span>${escapeHTML(b.format)}</span></div><h3>${escapeHTML(b.title)}</h3><p class="book-theme">${escapeHTML(b.theme)}</p><p class="book-description">${escapeHTML(b.description)}</p><div class="book-bottom"><a class="amazon-cta" href="books/${escapeHTML(b.id)}.html" aria-label="${escapeHTML(cta+' — '+b.title)}">${cta}</a></div></article>`;
 }).join('');
 empty.hidden=filtered.length>0;
 document.querySelectorAll('[data-filter]').forEach(el=>el.classList.toggle('active',el.dataset.filter===filter));
}
document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>{filter=el.dataset.filter;render();document.querySelector('#books').scrollIntoView({behavior:'smooth'})}));search.addEventListener('input',render);document.querySelector('#year').textContent=new Date().getFullYear();render();
