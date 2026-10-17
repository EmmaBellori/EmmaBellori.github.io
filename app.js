/* Emma Bellori Books homepage v12 — compact discovery, Amazon conversion and live Coming Soon voting. */
let published=[],upcoming=[],books=[];
const seriesOrder=[
 ['Big Feelings, Real Problems','Stories about emotions, confidence and growing up.'],
 ['Kawaii Coloring & Activities','Cheerful coloring books and creative activities.'],
 ['Junior Detectives','Curiosity, science and discovery for young explorers.'],
 ['Little Christmas Wonders','Heartwarming stories filled with holiday magic.'],
 ['Tiny Doors, Big Adventures','Imaginative journeys into extraordinary worlds.'],
 ['Small Town, Many Hands','Stories of community, kindness and everyday work.'],
 ['Little Steps, Big Discoveries','Playful first learning experiences at home.'],
 ['My First Sports Adventures','Fun first introductions to sports, teamwork and trying something new.'],
 ['My First Earth Adventures','Discover how our planet’s landscapes form and change through friendly adventures.'],
 ['More Books by Emma Bellori','Explore more standalone stories and discoveries.']
];
const LEGACY_DETAIL_IDS=new Set(['mistakes','play','bugs','mad','christmas','halloween']);
const latestGrid=document.querySelector('#latest-grid');
const seriesCatalog=document.querySelector('#series-catalog');
const empty=document.querySelector('#empty');
const searchInput=document.querySelector('#global-search');
const suggestionBox=document.querySelector('#search-suggestions');

const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function formatLabel(value){const s=String(value??'').replace(/\bedition\b/gi,'');const k=/kindle/i.test(s),p=/paperback/i.test(s);return k&&p?'Kindle + Paperback':k?'Kindle':p?'Paperback':s.trim();}
function detailHref(b){return b.legacyDetail?'books/'+encodeURIComponent(b.id)+'.html':'book.html?id='+encodeURIComponent(b.id);}
function coverHTML(b){return b.cover?'<img loading="lazy" decoding="async" src="'+escapeHTML(b.cover)+'" alt="Cover of '+escapeHTML(b.title)+'">':'<div class="cover-placeholder"><strong>'+escapeHTML(b.title)+'</strong></div>';}
function normalize(value){return String(value??'').trim().toLocaleLowerCase();}

// Coming Soon preferences: one active choice per collection, confirmed by Supabase.
const PREFERENCE_ENDPOINT='https://hsrmqwneuadoomqakzfs.supabase.co/functions/v1/submit-book-preference';
const TURNSTILE_SITE_KEY='0x4AAAAAAFYRKxv3YSSQ6sQI';
const VISITOR_STORAGE_KEY='eb-preference-visitor-v1';
const CHOICES_STORAGE_KEY='eb-preference-choices-v1';
const preferences=Object.create(null);
try{const saved=JSON.parse(localStorage.getItem(CHOICES_STORAGE_KEY)||'{}');if(saved&&typeof saved==='object')for(const [k,v] of Object.entries(saved))if(typeof v==='string')preferences[k]=v;}catch{}

function publishedCard(b){
 const detail=detailHref(b);
 const theme=b.theme?'<p class="home-book-theme">'+escapeHTML(b.theme)+'</p>':'';
 return '<article class="home-book-card" data-book-id="'+escapeHTML(b.id)+'">'+
  '<a class="home-cover-wrap" href="'+detail+'" aria-label="Discover '+escapeHTML(b.title)+'">'+coverHTML(b)+'</a>'+
  '<div class="home-card-meta"><span>Available now</span><span>'+escapeHTML(formatLabel(b.format))+'</span></div>'+
  '<h3><a href="'+detail+'">'+escapeHTML(b.title)+'</a></h3>'+theme+
  '<div class="home-card-actions"><a class="home-card-amazon" href="'+escapeHTML(b.amazonUrl)+'" target="_blank" rel="noopener noreferrer sponsored" data-book-id="'+escapeHTML(b.id)+'" aria-label="View '+escapeHTML(b.title)+' on Amazon (opens in new tab)">View on Amazon ↗</a><a class="home-card-details" href="'+detail+'">Book details →</a></div>'+
 '</article>';
}
function upcomingCard(b){
 const selected=preferences[b.series]===b.id;
 return '<article class="home-book-card" data-book-id="'+escapeHTML(b.id)+'">'+
  '<div class="home-cover-wrap">'+coverHTML(b)+
  '<button type="button" class="home-vote-button'+(selected?' is-active':'')+'" data-vote-id="'+escapeHTML(b.id)+'" aria-label="'+(selected?'Your selected book: ':'Vote for ')+escapeHTML(b.title)+'" aria-pressed="'+String(selected)+'" title="'+(selected?'Your choice — choose another book to change':'Vote for this upcoming book')+'"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg></button></div>'+
  '<span class="home-card-status">Coming Soon</span><h3>'+escapeHTML(b.title)+'</h3>'+
 '</article>';
}
function homeCard(b){return b.status==='published'?publishedCard(b):upcomingCard(b);}

function renderLatest(){
 // catalog.json is maintained in addition order; higher catalog positions are newer additions.
 const latest=published.slice().sort((a,b)=>b._catalogIndex-a._catalogIndex).slice(0,6);
 latestGrid.innerHTML=latest.map(publishedCard).join('');
}
function currentSeriesOrder(){
 const list=seriesOrder.slice();
 const known=new Set(list.map(([name])=>name));
 for(const b of books)if(!known.has(b.series)){list.push([b.series,b.seriesDescription||'Explore stories in this collection.']);known.add(b.series);}
 return list;
}
function collectionPreview(publishedItems,upcomingItems){
 // Latest releases already maximize purchase exposure. Collection previews reserve one slot for voting whenever possible.
 if(!upcomingItems.length)return publishedItems.slice(0,3);
 if(!publishedItems.length)return upcomingItems.slice(0,3);
 const publishedSlots=Math.min(2,publishedItems.length);
 const preview=[...publishedItems.slice(0,publishedSlots),...upcomingItems.slice(0,3-publishedSlots)];
 if(preview.length<3)preview.push(...publishedItems.slice(publishedSlots,publishedSlots+(3-preview.length)));
 return preview.slice(0,3);
}
function renderCollections(){
 const order=currentSeriesOrder();
 const groups=order.map(([name,description],index)=>{
  const items=books.filter(b=>b.series===name);
  const publishedItems=items.filter(b=>b.status==='published').sort((a,b)=>b._catalogIndex-a._catalogIndex);
  const upcomingItems=items.filter(b=>b.status==='coming_soon').sort((a,b)=>a._catalogIndex-b._catalogIndex);
  const preview=collectionPreview(publishedItems,upcomingItems);
  return {name,description,index,items,publishedCount:publishedItems.length,preview};
 }).filter(g=>g.items.length).sort((a,b)=>{
  const aHas=a.publishedCount>0,bHas=b.publishedCount>0;
  if(aHas!==bHas)return aHas?-1:1;
  if(aHas&&bHas&&a.publishedCount!==b.publishedCount)return b.publishedCount-a.publishedCount;
  return a.index-b.index;
 });
 seriesCatalog.innerHTML=groups.map(g=>{
  const slug=g.items[0].seriesSlug;
  return '<section class="home-series-preview" data-series-name="'+escapeHTML(g.name)+'"><div class="home-series-heading"><div class="home-series-copy"><p class="eyebrow">EMMA BELLORI COLLECTION</p><h3>'+escapeHTML(g.name)+'</h3><p>'+escapeHTML(g.description)+'</p></div><div class="home-series-actions"><span class="home-series-count">'+g.items.length+' '+(g.items.length===1?'book':'books')+'</span><a class="home-explore-collection" href="collections/'+escapeHTML(slug)+'.html" aria-label="Explore '+escapeHTML(g.name)+' collection">Explore collection →</a></div></div><div class="home-book-grid">'+g.preview.map(homeCard).join('')+'</div></section>';
 }).join('');
 empty.hidden=groups.length>0;
}

// Sticky free search with suggestions that update as the user types.
function closeSuggestions(){suggestionBox.hidden=true;suggestionBox.innerHTML='';searchInput.setAttribute('aria-expanded','false');}
function searchDestination(b){return b.status==='published'?detailHref(b):'collections/'+encodeURIComponent(b.seriesSlug)+'.html#upcoming-heading';}
function renderSuggestions(){
 const q=normalize(searchInput.value);
 if(!q||!books.length){closeSuggestions();return;}
 const matches=books.filter(b=>normalize([b.title,b.series,b.theme,b.description].join(' ')).includes(q)).slice(0,8);
 if(!matches.length){suggestionBox.innerHTML='<div class="home-search-suggestion" role="option" aria-disabled="true"><span><strong>No matching titles</strong><small>Try a shorter title or collection name.</small></span></div>';suggestionBox.hidden=false;searchInput.setAttribute('aria-expanded','true');return;}
 suggestionBox.innerHTML=matches.map(b=>'<a class="home-search-suggestion" role="option" href="'+searchDestination(b)+'" data-search-book-id="'+escapeHTML(b.id)+'"><span><strong>'+escapeHTML(b.title)+'</strong><small>'+escapeHTML(b.series)+'</small></span><span class="home-search-status">'+(b.status==='published'?'Available now':'Coming Soon')+'</span></a>').join('');
 suggestionBox.hidden=false;searchInput.setAttribute('aria-expanded','true');
}
let searchDebounce;
searchInput.addEventListener('input',()=>{renderSuggestions();clearTimeout(searchDebounce);searchDebounce=setTimeout(()=>{const term=searchInput.value.trim();if(term&&typeof window.ebTrack==='function')window.ebTrack('catalog_search',{search_term:term.slice(0,80)});},700);});
searchInput.addEventListener('focus',renderSuggestions);
searchInput.addEventListener('keydown',event=>{
 if(event.key==='Escape'){closeSuggestions();return;}
 if(event.key==='Enter'&&!suggestionBox.hidden){const first=suggestionBox.querySelector('a.home-search-suggestion');if(first){event.preventDefault();first.click();}}
});
document.addEventListener('click',event=>{if(!event.target.closest('.home-search-inner'))closeSuggestions();});

// Live voting dialog — same production endpoint and one-choice-per-series rule as collection pages.
const voteDialog=document.querySelector('#vote-dialog');
const voteError=document.querySelector('#vote-error');
const voteConfirm=document.querySelector('#vote-confirm');
const voteToast=document.querySelector('#vote-toast');
let pendingVote=null,widgetId=null,verifiedToken='',submitting=false,toastTimeout;
function visitorId(){let id;try{id=localStorage.getItem(VISITOR_STORAGE_KEY);}catch{}if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)){id=crypto.randomUUID();try{localStorage.setItem(VISITOR_STORAGE_KEY,id);}catch{}}return id;}
function showVoteError(message){voteError.hidden=false;voteError.textContent=message;}
function toast(message){clearTimeout(toastTimeout);voteToast.textContent=message;voteToast.hidden=false;toastTimeout=setTimeout(()=>{voteToast.hidden=true;},4500);}
function prepareTurnstile(){
 if(!voteDialog.open||!pendingVote)return;
 if(!window.turnstile){showVoteError('Security verification is loading. Please try again in a moment.');return;}
 if(widgetId!==null){try{window.turnstile.remove(widgetId);}catch{}widgetId=null;}
 verifiedToken='';voteConfirm.disabled=true;document.querySelector('#vote-turnstile').replaceChildren();
 widgetId=window.turnstile.render('#vote-turnstile',{sitekey:TURNSTILE_SITE_KEY,theme:'light',callback(token){verifiedToken=token;voteConfirm.disabled=false;voteError.hidden=true;},'expired-callback'(){verifiedToken='';voteConfirm.disabled=true;showVoteError('Verification expired. Please try again.');},'error-callback'(){verifiedToken='';voteConfirm.disabled=true;showVoteError('Verification could not load. Please retry.');}});
}
function openVote(book){
 if(submitting||preferences[book.series]===book.id)return;
 pendingVote=book;verifiedToken='';voteError.hidden=true;voteConfirm.disabled=true;
 document.querySelector('#vote-description').textContent='Your pick: '+book.title;
 voteDialog.showModal();
 if(window.turnstile)prepareTurnstile();
 else{showVoteError('Loading security verification…');let tries=0;const wait=setInterval(()=>{if(!voteDialog.open||!pendingVote){clearInterval(wait);return;}if(window.turnstile){clearInterval(wait);voteError.hidden=true;prepareTurnstile();}else if(++tries>30){clearInterval(wait);showVoteError('Security verification is unavailable. Please try again later.');}},250);}
}
seriesCatalog.addEventListener('click',event=>{const btn=event.target.closest('[data-vote-id]');if(!btn)return;const book=upcoming.find(b=>b.id===btn.dataset.voteId);if(book)openVote(book);});
document.querySelector('#vote-cancel').addEventListener('click',()=>{if(!submitting)voteDialog.close();});
voteDialog.addEventListener('cancel',event=>{if(submitting)event.preventDefault();});
voteDialog.addEventListener('close',()=>{pendingVote=null;verifiedToken='';if(window.turnstile&&widgetId!==null){try{window.turnstile.remove(widgetId);}catch{}widgetId=null;}});
voteConfirm.addEventListener('click',async()=>{
 if(!pendingVote||!verifiedToken||submitting)return;
 submitting=true;voteConfirm.disabled=true;voteConfirm.textContent='Saving…';voteError.hidden=true;const book=pendingVote;
 try{
  const response=await fetch(PREFERENCE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bookId:book.id,visitorId:visitorId(),turnstileToken:verifiedToken})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.success!==true||data.bookId!==book.id)throw Error(response.status===429?'Too many requests. Please try again later.':response.status===403?'Verification failed. Please try again.':'We could not save your vote. Please try again.');
  preferences[book.series]=book.id;try{localStorage.setItem(CHOICES_STORAGE_KEY,JSON.stringify(preferences));}catch{}
  voteDialog.close();renderCollections();toast('♥ Your vote is in! More votes move this title higher in the publication priority.');
 }catch(error){showVoteError(error.message||'Unable to save your preference.');verifiedToken='';if(window.turnstile&&widgetId!==null)try{window.turnstile.reset(widgetId);}catch{}}
 finally{submitting=false;voteConfirm.textContent='♥ Vote for this book';voteConfirm.disabled=!verifiedToken;}
});

// Preserve the working Back to books behavior from book detail pages.
const RETURN_KEY='eb-catalog-return-v3';
const isCatalogReturn=location.hash==='#catalog-return';
let returnSnapshot=null,didRestoreCatalog=false;
try{const item=JSON.parse(sessionStorage.getItem(RETURN_KEY)||'null');if(item&&Number.isFinite(item.y)&&item.y>=0&&Date.now()-item.t<1800000)returnSnapshot=item;}catch{}
if(isCatalogReturn&&returnSnapshot){if(typeof returnSnapshot.query==='string')searchInput.value=returnSnapshot.query;if('scrollRestoration' in history)history.scrollRestoration='manual';}
function saveCatalogReturn(){try{sessionStorage.setItem(RETURN_KEY,JSON.stringify({y:window.scrollY,t:Date.now(),query:searchInput.value||''}));}catch{}}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href]');if(!link||link.origin!==location.origin)return;
 const path=new URL(link.href).pathname;if(/\/(?:book\.html|books\/[a-z0-9-]+\.html)$/.test(path))saveCatalogReturn();
},true);
function restoreCatalogAfterRender(){
 if(!isCatalogReturn||!returnSnapshot||didRestoreCatalog)return;didRestoreCatalog=true;
 const y=returnSnapshot.y,html=document.documentElement,previous=html.style.scrollBehavior;html.style.scrollBehavior='auto';
 const move=()=>window.scrollTo(0,y);requestAnimationFrame(()=>{move();requestAnimationFrame(move);});window.addEventListener('load',move,{once:true});setTimeout(move,250);setTimeout(()=>{move();html.style.scrollBehavior=previous;},750);
}
window.addEventListener('pageshow',event=>{if(event.persisted&&isCatalogReturn&&returnSnapshot)window.scrollTo(0,returnSnapshot.y);});

document.querySelector('#year').textContent=new Date().getFullYear();
fetch('catalog.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('Catalog unavailable');return response.json();}).then(entries=>{
 if(!Array.isArray(entries))throw Error('Invalid catalog');
 const valid=entries.map((b,index)=>({...b,_catalogIndex:index})).filter(b=>b&&typeof b.id==='string'&&typeof b.title==='string'&&typeof b.series==='string'&&typeof b.seriesSlug==='string'&&(b.status==='published'||b.status==='coming_soon')&&(b.status!=='published'||(typeof b.amazonUrl==='string'&&/^https:\/\/www\.amazon\.[a-z.]+\//.test(b.amazonUrl))));
 if(valid.length!==entries.length||new Set(valid.map(b=>b.id)).size!==valid.length)throw Error('Invalid catalog entries');
 published=valid.filter(b=>b.status==='published').map(b=>({...b,legacyDetail:LEGACY_DETAIL_IDS.has(b.id)}));
 upcoming=valid.filter(b=>b.status==='coming_soon');books=[...published,...upcoming];
 renderLatest();renderCollections();restoreCatalogAfterRender();
}).catch(error=>{console.error('Catalog could not be loaded',error);empty.hidden=false;empty.textContent='The book catalog is temporarily unavailable. Please refresh the page.';});
