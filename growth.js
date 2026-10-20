document.addEventListener('DOMContentLoaded',()=>{
 const grid=document.querySelector('#start-here-grid');
 if(!grid)return;
 const priorityIds=['mad','mistakes','i-cant-sleep-without-you'];
 const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const formatLabel=value=>{const s=String(value??'').replace(/\bedition\b/gi,'');const k=/kindle/i.test(s),p=/paperback/i.test(s);return k&&p?'Kindle + Paperback':k?'Kindle':p?'Paperback':s.trim();};
 const legacy=new Set(['mistakes','play','bugs','mad','christmas','halloween']);
 const detailHref=b=>legacy.has(b.id)?'books/'+encodeURIComponent(b.id)+'.html':'book.html?id='+encodeURIComponent(b.id);
 fetch('catalog.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(entries=>{
  if(!Array.isArray(entries))throw Error();
  const chosen=priorityIds.map(id=>entries.find(b=>b.id===id&&b.status==='published')).filter(Boolean);
  grid.innerHTML=chosen.map(b=>{
   const detail=detailHref(b);
   return '<article class="home-book-card" data-book-id="'+escapeHTML(b.id)+'">'+
    '<a class="home-cover-wrap" href="'+detail+'" aria-label="Discover '+escapeHTML(b.title)+'">'+
    (b.cover?'<img loading="lazy" decoding="async" src="'+escapeHTML(b.cover)+'" alt="Cover of '+escapeHTML(b.title)+'">':'')+'</a>'+
    '<div class="home-card-meta"><span>Available now</span><span>'+escapeHTML(formatLabel(b.format))+'</span></div>'+
    '<h3><a href="'+detail+'">'+escapeHTML(b.title)+'</a></h3>'+
    (b.theme?'<p class="home-book-theme">'+escapeHTML(b.theme)+'</p>':'')+
    '<div class="home-card-actions"><a class="home-card-amazon" href="'+escapeHTML(b.amazonUrl)+'" target="_blank" rel="noopener noreferrer sponsored" data-book-id="'+escapeHTML(b.id)+'">View on Amazon ↗</a><a class="home-card-details" href="'+detail+'">Book details →</a></div>'+
   '</article>';
  }).join('');
 }).catch(()=>{document.querySelector('#start-here').hidden=true;});
});