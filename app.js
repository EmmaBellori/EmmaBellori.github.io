/* One editorial bookshelf: published titles first, then Coming Soon within each series. */
const published=window.EMMA_BOOKS||[];
const upcoming=(window.EMMA_COMING_SOON||[]).filter(b=>!published.some(p=>p.id===b.id)).map(b=>({...b,status:'coming_soon'}));
const seriesOrder=[
 ['Big Feelings, Real Problems','Stories about emotions, confidence and growing up.'],
 ['Little Christmas Wonders','Heartwarming stories filled with holiday magic.'],
 ['Tiny Doors, Big Adventures','Imaginative journeys into extraordinary worlds.'],
 ['Small Town, Many Hands','Stories of community, kindness and everyday work.'],
 ['Little Steps, Big Discoveries','Playful first learning experiences at home.'],
 ['Junior Detectives','Curiosity, science and discovery for young explorers.'],
 ['Kawaii Coloring & Activities','Cheerful coloring books and creative activities.'],
 ['More Books by Emma Bellori','Explore more standalone stories and discoveries.']
];
const publishedSeries=b=>b.category==='feelings'?'Big Feelings, Real Problems':b.category==='activity'?'Kawaii Coloring & Activities':'More Books by Emma Bellori';
const books=[...published.map(b=>({...b,series:b.series||publishedSeries(b)})),...upcoming];
const catalog=document.querySelector('#series-catalog'),search=document.querySelector('#search'),empty=document.querySelector('#empty');
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function formatLabel(value){const s=String(value??'').replace(/\bedition\b/gi,'');const k=/kindle/i.test(s),p=/paperback/i.test(s);return k&&p?'Kindle + Paperback':k?'Kindle':p?'Paperback':s.trim();}
function cover(b){return b.cover?'<img loading="lazy" decoding="async" src="'+escapeHTML(b.cover)+'" alt="Cover of '+escapeHTML(b.title)+'">':'<div class="cover-placeholder"><strong>'+escapeHTML(b.title)+'</strong></div>';}
function bookCard(b){
 if(b.status==='coming_soon')return '<article class="book-card book-card-upcoming"><div class="cover-frame upcoming-cover-frame">'+cover(b)+'</div><div class="book-meta"><span>'+escapeHTML(b.series)+'</span></div><span class="upcoming-status">Coming Soon</span><h3>'+escapeHTML(b.title)+'</h3><p class="book-description">More details will be announced soon.</p></article>';
 const age=b.ageRange?'<span class="book-age">Ages '+escapeHTML(String(b.ageRange).replace(/^ages?\s*/i,''))+'</span>':'';
 return '<article class="book-card"><a class="cover-frame cover-link" href="books/'+escapeHTML(b.id)+'.html" aria-label="Discover '+escapeHTML(b.title)+'">'+cover(b)+'</a><div class="book-meta"><span>Available now</span><span>'+escapeHTML(formatLabel(b.format))+'</span></div>'+age+'<h3><a class="book-title-link" href="books/'+escapeHTML(b.id)+'.html">'+escapeHTML(b.title)+'</a></h3><p class="book-theme">'+escapeHTML(b.theme)+'</p><p class="book-description">'+escapeHTML(b.description)+'</p><div class="book-bottom"><a class="amazon-cta" href="'+escapeHTML(b.amazonUrl)+'" target="_blank" rel="noopener noreferrer sponsored" data-book-id="'+escapeHTML(b.id)+'" aria-label="View '+escapeHTML(b.title)+' on Amazon (opens in new tab)">View on Amazon ↗</a><a class="book-details-link" href="books/'+escapeHTML(b.id)+'.html" aria-label="Details for '+escapeHTML(b.title)+'">Book details →</a></div></article>';
}
function render(){
 const q=search.value.trim().toLocaleLowerCase();
 const filtered=books.filter(b=>[b.title,b.series,b.theme,b.description,b.format,b.ageRange||'',...(b.topics||[])].join(' ').toLocaleLowerCase().includes(q));
 const groups=seriesOrder.map(([name,description])=>({name,description,items:filtered.filter(b=>b.series===name)})).filter(g=>g.items.length);
 catalog.innerHTML=groups.map((g,i)=>'<section class="series-section" aria-labelledby="series-title-'+i+'"><div class="series-heading"><div><p class="eyebrow">EMMA BELLORI COLLECTION</p><h3 id="series-title-'+i+'">'+escapeHTML(g.name)+'</h3><p>'+escapeHTML(g.description)+'</p></div><span class="series-count">'+g.items.length+' '+(g.items.length===1?'book':'books')+'</span></div><div class="book-grid">'+g.items.map(bookCard).join('')+'</div></section>').join('');
 empty.hidden=filtered.length>0;
 const count=document.querySelector('#results-count');if(count)count.textContent=filtered.length===1?'Showing 1 book': 'Showing '+filtered.length+' books across '+groups.length+' collections';
}
let searchDebounce;
search.addEventListener('input',()=>{render();clearTimeout(searchDebounce);searchDebounce=setTimeout(()=>{if(search.value.trim()&&typeof window.ebTrack==='function')window.ebTrack('catalog_search',{search_term:search.value.trim().slice(0,80)});},700);});
document.querySelector('#year').textContent=new Date().getFullYear();
render();
