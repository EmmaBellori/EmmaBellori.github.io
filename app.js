/* One editorial bookshelf: published titles first, then Coming Soon within each series. */
let published=[],upcoming=[],books=[];
let seriesOrder=[
 ['Big Feelings, Real Problems','Stories about emotions, confidence and growing up.'],
 ['Little Christmas Wonders','Heartwarming stories filled with holiday magic.'],
 ['Tiny Doors, Big Adventures','Imaginative journeys into extraordinary worlds.'],
 ['Small Town, Many Hands','Stories of community, kindness and everyday work.'],
 ['Little Steps, Big Discoveries','Playful first learning experiences at home.'],
 ['Junior Detectives','Curiosity, science and discovery for young explorers.'],
 ['My First Sports Adventures','Fun first introductions to sports, teamwork and trying something new.'],
 ['My First Earth Adventures','Discover how our planet’s landscapes form and change through friendly adventures.'],
 ['Kawaii Coloring & Activities','Cheerful coloring books and creative activities.'],
 ['More Books by Emma Bellori','Explore more standalone stories and discoveries.']
];
const publishedSeries=b=>b.id==='bugs'?'Junior Detectives':b.category==='feelings'?'Big Feelings, Real Problems':b.category==='activity'?'Kawaii Coloring & Activities':'More Books by Emma Bellori';

const catalog=document.querySelector('#series-catalog'),search=document.querySelector('#search'),empty=document.querySelector('#empty');
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function formatLabel(value){const s=String(value??'').replace(/\bedition\b/gi,'');const k=/kindle/i.test(s),p=/paperback/i.test(s);return k&&p?'Kindle + Paperback':k?'Kindle':p?'Paperback':s.trim();}
function cover(b){return b.cover?'<img loading="lazy" decoding="async" src="'+escapeHTML(b.cover)+'" alt="Cover of '+escapeHTML(b.title)+'">':'<div class="cover-placeholder"><strong>'+escapeHTML(b.title)+'</strong></div>';}
function bookCard(b){
 if(b.status==='coming_soon'){const selected=preferences[b.series]===b.id;return '<article class="book-card book-card-upcoming'+(selected?' is-preferred':'')+'"><div class="vote-cover-wrap"><div class="cover-frame upcoming-cover-frame">'+cover(b)+'</div><button type="button" class="vote-heart'+(selected?' is-active':'')+'" data-vote-id="'+escapeHTML(b.id)+'" aria-label="'+(selected?'Your selected book: ':'Support ')+escapeHTML(b.title)+'" aria-pressed="'+selected+'" title="'+(selected?'Your choice — choose another book to change':'Support this upcoming book')+'"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg></button></div><div class="book-meta"><span>'+escapeHTML(b.series)+'</span></div><span class="upcoming-status">Coming Soon</span><h3>'+escapeHTML(b.title)+'</h3><p class="book-description">More details will be announced soon.</p></article>';}
 const detail=b.legacyDetail?'books/'+escapeHTML(b.id)+'.html':'book.html?id='+encodeURIComponent(b.id);
 const age=b.ageRange?'<span class="book-age">Ages '+escapeHTML(String(b.ageRange).replace(/^ages?\s*/i,''))+'</span>':'';
 return '<article class="book-card"><a class="cover-frame cover-link" href="'+detail+'" aria-label="Discover '+escapeHTML(b.title)+'">'+cover(b)+'</a><div class="book-meta"><span>Available now</span><span>'+escapeHTML(formatLabel(b.format))+'</span></div>'+age+'<h3><a class="book-title-link" href="'+detail+'">'+escapeHTML(b.title)+'</a></h3><p class="book-theme">'+escapeHTML(b.theme)+'</p><p class="book-description">'+escapeHTML(b.description)+'</p><div class="book-bottom"><a class="amazon-cta" href="'+escapeHTML(b.amazonUrl)+'" target="_blank" rel="noopener noreferrer sponsored" data-book-id="'+escapeHTML(b.id)+'" aria-label="View '+escapeHTML(b.title)+' on Amazon (opens in new tab)">View on Amazon ↗</a><a class="book-details-link" href="'+detail+'" aria-label="Details for '+escapeHTML(b.title)+'">Book details →</a></div></article>';
}
const collectionState=new Set();
let catalogStatus='all';
const statusButtons=document.querySelectorAll('[data-catalog-status]');
function syncStatusButtons(){statusButtons.forEach(button=>{const active=button.dataset.catalogStatus===catalogStatus;button.setAttribute('aria-pressed',String(active));button.classList.toggle('is-active',active);});}
statusButtons.forEach(button=>button.addEventListener('click',()=>{catalogStatus=button.dataset.catalogStatus;syncStatusButtons();render();}));
function render(){
 const q=search.value.trim().toLocaleLowerCase();
 const filtered=books.filter(b=>(catalogStatus==='all'||(catalogStatus==='published'?b.status==='published':b.status==='coming_soon'))&&[b.title,b.series,b.theme,b.description,b.format,b.ageRange||'',...(b.topics||[])].join(' ').toLocaleLowerCase().includes(q));
 const groups=seriesOrder.map(([name,description],index)=>({name,description,index,items:filtered.filter(b=>b.series===name),publishedCount:books.filter(b=>b.series===name&&b.status!=='coming_soon').length,totalCount:books.filter(b=>b.series===name).length})).filter(g=>g.items.length).sort((a,b)=>b.publishedCount-a.publishedCount||b.totalCount-a.totalCount||a.index-b.index);
 catalog.innerHTML=groups.map((g,i)=>{
  const expanded=!!q||collectionState.has(g.name);
  const visible=expanded?g.items:g.items.slice(0,4);
  const id='series-'+g.index;
  return '<section id="'+id+'" class="series-section series-section-compact" data-series-name="'+escapeHTML(g.name)+'" aria-labelledby="series-title-'+g.index+'"><div class="series-heading"><div><p class="eyebrow">EMMA BELLORI COLLECTION</p><h3 id="series-title-'+g.index+'"><a class="series-title-link" href="collections/'+escapeHTML(g.items[0].seriesSlug)+'.html" aria-label="Explore '+escapeHTML(g.name)+' collection">'+escapeHTML(g.name)+' <span aria-hidden="true">↗</span></a></h3><p>'+escapeHTML(g.description)+'</p></div><span class="series-count">'+g.items.length+' '+(g.items.length===1?'book':'books')+'</span></div><div class="book-grid">'+visible.map(bookCard).join('')+'</div>'+(g.items.length>4&&!q?'<button type="button" class="collection-toggle" data-collection-toggle="'+escapeHTML(g.name)+'" aria-expanded="'+expanded+'" aria-controls="'+id+'">'+(expanded?'Show fewer books ↑':'View all '+g.items.length+' books ↓')+'</button>':'')+'</section>';
 }).join('');
 if(typeof restoreCatalogAfterRender==='function')restoreCatalogAfterRender();
 empty.hidden=filtered.length>0;
 const count=document.querySelector('#results-count');if(count)count.textContent=filtered.length===1?'Showing 1 book':'Showing '+filtered.length+' books across '+groups.length+' collections';
}
catalog.addEventListener('click',e=>{
 const toggle=e.target.closest('[data-collection-toggle]');if(!toggle)return;
 const name=toggle.dataset.collectionToggle;
 if(collectionState.has(name))collectionState.delete(name);else collectionState.add(name);
 render();
 const target=[...catalog.querySelectorAll('.series-section')].find(section=>section.dataset.seriesName===name);
 if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
});
let searchDebounce;
search.addEventListener('input',()=>{render();clearTimeout(searchDebounce);searchDebounce=setTimeout(()=>{if(search.value.trim()&&typeof window.ebTrack==='function')window.ebTrack('catalog_search',{search_term:search.value.trim().slice(0,80)});},700);});

// Coming Soon preferences: one active choice per collection, confirmed by Supabase.
const PREFERENCE_ENDPOINT='https://hsrmqwneuadoomqakzfs.supabase.co/functions/v1/submit-book-preference';
const TURNSTILE_SITE_KEY='0x4AAAAAAFYRKxv3YSSQ6sQI';
const VISITOR_STORAGE_KEY='eb-preference-visitor-v1';
const CHOICES_STORAGE_KEY='eb-preference-choices-v1';
const preferences=Object.create(null);
try {const saved=JSON.parse(localStorage.getItem(CHOICES_STORAGE_KEY)||'{}');if(saved&&typeof saved==='object')for(const [k,v] of Object.entries(saved))if(typeof v==='string')preferences[k]=v;}catch{}
const voteDialog=document.querySelector('#vote-dialog');
const voteError=document.querySelector('#vote-error');
const voteConfirm=document.querySelector('#vote-confirm');
const voteToast=document.querySelector('#vote-toast');
let pendingVote=null,widgetId=null,verifiedToken='',submitting=false,toastTimeout;
function visitorId(){
 let id;try{id=localStorage.getItem(VISITOR_STORAGE_KEY);}catch{}
 if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)){
  id=crypto.randomUUID();try{localStorage.setItem(VISITOR_STORAGE_KEY,id);}catch{}
 }
 return id;
}
function showVoteError(message){voteError.hidden=false;voteError.textContent=message;}
function toast(message){clearTimeout(toastTimeout);voteToast.textContent=message;voteToast.hidden=false;toastTimeout=setTimeout(()=>{voteToast.hidden=true;},4500);}
function prepareTurnstile(){
 if(!voteDialog.open||!pendingVote)return;
 if(!window.turnstile){showVoteError('Security verification is loading. Please try again in a moment.');return;}
 if(widgetId!==null){try{window.turnstile.remove(widgetId);}catch{}widgetId=null;}
 verifiedToken='';voteConfirm.disabled=true;
 document.querySelector('#vote-turnstile').replaceChildren();
 widgetId=window.turnstile.render('#vote-turnstile',{
  sitekey:TURNSTILE_SITE_KEY,theme:'light',
  callback(token){verifiedToken=token;voteConfirm.disabled=false;voteError.hidden=true;},
  'expired-callback'(){verifiedToken='';voteConfirm.disabled=true;showVoteError('Verification expired. Please try again.');},
  'error-callback'(){verifiedToken='';voteConfirm.disabled=true;showVoteError('Verification could not load. Please retry.');}
 });
}
function openVote(book){
 if(submitting||preferences[book.series]===book.id)return;
 pendingVote=book;verifiedToken='';voteError.hidden=true;voteConfirm.disabled=true;
 document.querySelector('#vote-description').textContent='Your pick: '+book.title;
 voteDialog.showModal();
 if(window.turnstile)prepareTurnstile();
 else{showVoteError('Loading security verification…');let tries=0;const wait=setInterval(()=>{if(!voteDialog.open||!pendingVote){clearInterval(wait);return;}if(window.turnstile){clearInterval(wait);voteError.hidden=true;prepareTurnstile();}else if(++tries>30){clearInterval(wait);showVoteError('Security verification is unavailable. Please try again later.');}},250);}
}
document.querySelector('#vote-cancel').addEventListener('click',()=>{if(!submitting)voteDialog.close();});
voteDialog.addEventListener('cancel',e=>{if(submitting)e.preventDefault();});
voteDialog.addEventListener('close',()=>{pendingVote=null;verifiedToken='';if(window.turnstile&&widgetId!==null){try{window.turnstile.remove(widgetId);}catch{}widgetId=null;}});
catalog.addEventListener('click',e=>{const btn=e.target.closest('[data-vote-id]');if(!btn)return;const book=upcoming.find(b=>b.id===btn.dataset.voteId);if(book)openVote(book);});
voteConfirm.addEventListener('click',async()=>{
 if(!pendingVote||!verifiedToken||submitting)return;
 submitting=true;voteConfirm.disabled=true;voteConfirm.textContent='Saving…';voteError.hidden=true;
 const book=pendingVote;
 try{
  const response=await fetch(PREFERENCE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bookId:book.id,visitorId:visitorId(),turnstileToken:verifiedToken})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.success!==true||data.bookId!==book.id)throw Error(response.status===429?'Too many requests. Please try again later.':response.status===403?'Verification failed. Please try again.':'We could not save your vote. Please try again.');
  preferences[book.series]=book.id;
  try{localStorage.setItem(CHOICES_STORAGE_KEY,JSON.stringify(preferences));}catch{}
  voteDialog.close();render();
  toast('♥ Your vote is in! Thanks for helping choose our next story.');
 }catch(error){showVoteError(error.message||'Unable to save your preference.');verifiedToken='';if(window.turnstile&&widgetId!==null)try{window.turnstile.reset(widgetId);}catch{}}
 finally{submitting=false;voteConfirm.textContent='♥ Vote for this book';voteConfirm.disabled=!verifiedToken;}
});
const picker=document.querySelector('#series-picker');
// The options are populated after the canonical catalog loads.
picker.addEventListener('change',()=>{
 const name=picker.value;picker.selectedIndex=0;
 if(!name)return;
 if(search.value.trim())search.value='';
 if(catalogStatus!=='all'){catalogStatus='all';syncStatusButtons();}
 collectionState.add(name);render();
 const target=[...catalog.querySelectorAll('.series-section')].find(s=>s.dataset.seriesName===name);
 if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
});
const toolsBar=document.querySelector('.catalog-tools'),toolsSlot=document.querySelector('.catalog-tools-slot');
function syncToolsBar(){
 const fixed=toolsSlot.getBoundingClientRect().top<=0;
 toolsBar.classList.toggle('is-fixed',fixed);
 toolsSlot.style.height=toolsBar.offsetHeight+'px';
}
window.addEventListener('scroll',syncToolsBar,{passive:true});
window.addEventListener('resize',syncToolsBar);
syncToolsBar();

document.querySelector('#year').textContent=new Date().getFullYear();
fetch('catalog.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('Catalog unavailable');return response.json();}).then(entries=>{
 if(!Array.isArray(entries))throw Error('Invalid catalog');
 const valid=entries.filter(b=>b&&typeof b.id==='string'&&typeof b.title==='string'&&typeof b.series==='string'&&typeof b.seriesSlug==='string'&&(b.status==='published'||b.status==='coming_soon')&&(b.status!=='published'||(typeof b.amazonUrl==='string'&&/^https:\/\/www\.amazon\.[a-z.]+\//.test(b.amazonUrl))));
 if(valid.length!==entries.length||new Set(valid.map(b=>b.id)).size!==valid.length)throw Error('Invalid catalog entries');
 published=valid.filter(b=>b.status==='published').map(b=>({...b,legacyDetail:['mistakes','play','bugs','mad','christmas','halloween'].includes(b.id)}));
 upcoming=valid.filter(b=>b.status==='coming_soon');
 books=[...published,...upcoming];
 const known=new Set(seriesOrder.map(s=>s[0]));
 for(const b of valid)if(!known.has(b.series)){seriesOrder.push([b.series,b.seriesDescription||'Explore stories in this collection.']);known.add(b.series);}
 picker.innerHTML='<option value="">Jump to a series…</option>'+seriesOrder.filter(([name])=>valid.some(b=>b.series===name)).map(([name])=>'<option value="'+escapeHTML(name)+'">'+escapeHTML(name)+'</option>').join('');
 render();
}).catch(error=>{
 console.error('Catalog could not be loaded',error);
 document.querySelector('#results-count').textContent='The book catalog is temporarily unavailable. Please refresh the page.';
});



// Reliable return to catalog: restore only after the actual async render, not from a
// mutation observer racing browser hash scrolling, images and layout.
const RETURN_KEY='eb-catalog-return-v3';
const isCatalogReturn=location.hash==='#catalog-return';
let returnSnapshot=null;
try{
 const item=JSON.parse(sessionStorage.getItem(RETURN_KEY)||'null');
 if(item&&Number.isFinite(item.y)&&item.y>=0&&Date.now()-item.t<1800000)returnSnapshot=item;
}catch{}
if(isCatalogReturn&&returnSnapshot){
 if(['all','published','coming_soon'].includes(returnSnapshot.status))catalogStatus=returnSnapshot.status;
 if(typeof returnSnapshot.query==='string')search.value=returnSnapshot.query;
 if(Array.isArray(returnSnapshot.expanded))returnSnapshot.expanded.forEach(name=>{if(typeof name==='string')collectionState.add(name);});
 syncStatusButtons();
 if('scrollRestoration' in history)history.scrollRestoration='manual';
}
function saveCatalogReturn(){
 try{
  sessionStorage.setItem(RETURN_KEY,JSON.stringify({
   y:window.scrollY,t:Date.now(),status:catalogStatus,query:search.value,
   expanded:[...collectionState]
  }));
 }catch{}
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href]');
 if(!link||link.origin!==location.origin)return;
 if(/\/(?:book\.html|books\/[a-z0-9-]+\.html)$/.test(new URL(link.href).pathname))saveCatalogReturn();
},true);
let didRestoreCatalog=false;
function restoreCatalogAfterRender(){
 if(!isCatalogReturn||!returnSnapshot||didRestoreCatalog)return;
 didRestoreCatalog=true;
 const y=returnSnapshot.y;
 const html=document.documentElement;
 const previous=html.style.scrollBehavior;
 html.style.scrollBehavior='auto';
 const move=()=>window.scrollTo(0,y);
 // Wait for the DOM render and layout, then correct again for late images/fonts.
 requestAnimationFrame(()=>{move();requestAnimationFrame(move);});
 window.addEventListener('load',move,{once:true});
 setTimeout(move,250);
 setTimeout(()=>{move();html.style.scrollBehavior=previous;},750);
}
window.addEventListener('pageshow',event=>{
 // BFCache restores the previous document; do not jump to the top.
 if(event.persisted&&isCatalogReturn&&returnSnapshot)window.scrollTo(0,returnSnapshot.y);
});
