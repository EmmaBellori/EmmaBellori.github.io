/* Collection pages: reuse the same Supabase/Turnstile vote flow as the homepage. */
const upcoming=JSON.parse(document.getElementById('collection-upcoming').textContent);
function syncVotes(){document.querySelectorAll('[data-vote-id]').forEach(btn=>{const b=upcoming.find(x=>x.id===btn.dataset.voteId);if(!b)return;const active=preferences[b.series]===b.id;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));btn.setAttribute('aria-label',active?'Your selected book: '+b.title:'Support '+b.title);btn.title=active?'Your choice — choose another book to change':'Support this upcoming book';});}
// Coming Soon preferences: one active choice per collection, confirmed by Supabase.
const PREFERENCE_ENDPOINT='https://hsrmqwneuadoomqakzfs.supabase.co/functions/v1/submit-book-preference';
const TURNSTILE_SITE_KEY='0x4AAAAAAFYRKxv3YSSQ6sQI';
const VISITOR_STORAGE_KEY='eb-preference-visitor-v1';
const CHOICES_STORAGE_KEY='eb-preference-choices-v1';
const preferences=Object.create(null);
try {const saved=JSON.parse(localStorage.getItem(CHOICES_STORAGE_KEY)||'{}');if(saved&&typeof saved==='object')for(const [k,v] of Object.entries(saved))if(typeof v==='string')preferences[k]=v;}catch{}

function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const PUBLISHED_DETAIL_OVERRIDES=Object.freeze({'door-teapot':'the-door-inside-the-teapot'});
function detailHref(book){
 if(book&&book.status==='published'){
  const slug=PUBLISHED_DETAIL_OVERRIDES[book.id]||book.id;
  return '../books/'+encodeURIComponent(slug)+'.html';
 }
 return '../book.html?id='+encodeURIComponent(book.id);
}
function publishedCardMarkup(book){
 const detail=detailHref(book);
 const cover='../'+String(book.cover||'');
 const theme=book.theme?'<p class="collection-theme">'+escapeHTML(book.theme)+'</p>':'';
 const description=book.description?'<p class="collection-description">'+escapeHTML(book.description)+'</p>':'';
 const format=book.format?'<p class="collection-format">'+escapeHTML(book.format)+'</p>':'';
 return '<div class="collection-cover-wrap"><a href="'+detail+'" aria-label="Read about '+escapeHTML(book.title)+'"><img loading="lazy" decoding="async" width="240" height="340" src="'+escapeHTML(cover)+'" alt="Cover of '+escapeHTML(book.title)+'"></a></div><div class="collection-book-info"><span class="collection-state">Available now</span><h2><a href="'+detail+'">'+escapeHTML(book.title)+'</a></h2>'+theme+description+format+'<div class="collection-actions"><a class="collection-buy" href="'+escapeHTML(book.amazonUrl)+'" target="_blank" rel="noopener noreferrer sponsored" data-book-id="'+escapeHTML(book.id)+'">View on Amazon ↗</a><a class="collection-action" href="'+detail+'">Book details →</a></div></div>';
}
function upcomingCardMarkup(book){
 const cover='../'+String(book.cover||'');
 return '<div class="collection-cover-wrap"><img loading="lazy" decoding="async" width="240" height="340" src="'+escapeHTML(cover)+'" alt="Cover of '+escapeHTML(book.title)+'"><button type="button" class="vote-heart collection-heart" data-vote-id="'+escapeHTML(book.id)+'" aria-pressed="false" aria-label="Support '+escapeHTML(book.title)+'" title="Support this upcoming book"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg></button></div><div class="collection-book-info"><span class="collection-state">Coming Soon</span><h2>'+escapeHTML(book.title)+'</h2><div class="collection-actions"></div></div>';
}
function ensureShelf(page,type){
 const published=type==='published';
 const heading=published?'available-heading':'upcoming-heading';
 let shelf=page.querySelector('.collection-shelf[aria-labelledby="'+heading+'"]');
 if(shelf)return shelf;
 shelf=document.createElement('section');
 shelf.className='collection-shelf';shelf.setAttribute('aria-labelledby',heading);
 shelf.innerHTML=published
  ?'<h2 id="available-heading">Available now <span>0</span></h2><p>Discover the books already available and explore their editions on Amazon.</p><div class="collection-grid"></div>'
  :'<h2 id="upcoming-heading">Coming Soon <span>0</span></h2><p>Tap the heart on a book you would love to see published next. You can choose one favorite per collection.</p><div class="collection-grid"></div>';
 const following=published?page.querySelector('.collection-shelf[aria-labelledby="upcoming-heading"]'):null;
 const anchor=following||page.querySelector('.collection-footer-link');
 if(anchor)anchor.before(shelf);else page.appendChild(shelf);
 return shelf;
}
function articleBookId(article){
 return article.dataset.bookId||article.querySelector('[data-vote-id]')?.dataset.voteId||article.querySelector('[data-book-id]')?.dataset.bookId||'';
}
function linkUpcomingDetailCards(){
 document.querySelectorAll('.collection-book.is-upcoming').forEach(article=>{
  const id=articleBookId(article);
  const book=upcoming.find(item=>item.id===id);if(!book)return;
  const heading=article.querySelector('.collection-book-info h2');
  if(heading&&!heading.querySelector('a'))heading.innerHTML='<a href="'+detailHref(book)+'">'+escapeHTML(book.title)+'</a>';
  const actions=article.querySelector('.collection-actions');
  if(actions&&!actions.querySelector('.collection-action[data-coming-soon-details]')){
   const link=document.createElement('a');link.className='collection-action';link.dataset.comingSoonDetails='true';link.href=detailHref(book);link.textContent='Book details →';actions.appendChild(link);
  }
 });
}
async function syncPublishedFromCatalog(){
 const page=document.querySelector('.collection-page');if(!page)return;
 const seriesSlug=location.pathname.match(/\/collections\/([^/]+)\.html$/)?.[1]||'';
 if(!seriesSlug)return;
 try{
  const response=await fetch('../catalog.json',{cache:'no-store'});if(!response.ok)throw Error('Catalog unavailable');
  const catalog=await response.json();if(!Array.isArray(catalog))throw Error('Invalid catalog');
  const seriesBooks=catalog.filter(book=>book&&book.seriesSlug===seriesSlug&&(book.status==='published'||book.status==='coming_soon'));
  if(!seriesBooks.length)return;
  const existing=new Map();
  page.querySelectorAll('.collection-book').forEach(article=>{const id=articleBookId(article);if(id)existing.set(id,article);});
  let availableShelf=page.querySelector('.collection-shelf[aria-labelledby="available-heading"]');
  let upcomingShelf=page.querySelector('.collection-shelf[aria-labelledby="upcoming-heading"]');
  let availableCount=0,comingCount=0;
  for(const book of seriesBooks){
   let article=existing.get(book.id);
   if(book.status==='published'){
    if(typeof book.amazonUrl!=='string'||!book.amazonUrl.trim())throw Error('Missing Amazon URL for '+book.id);
    if(!availableShelf)availableShelf=ensureShelf(page,'published');
    if(!article){article=document.createElement('article');article.className='collection-book is-published';article.innerHTML=publishedCardMarkup(book);}
    else if(!article.classList.contains('is-published')){article.className='collection-book is-published';article.innerHTML=publishedCardMarkup(book);}
    const buyLink=article.querySelector('.collection-buy');
    if(buyLink)buyLink.href=book.amazonUrl;
    const target=availableShelf.querySelector('.collection-grid');
    if(article.parentElement!==target)target.appendChild(article);
    availableCount++;
   }else{
    if(!upcomingShelf)upcomingShelf=ensureShelf(page,'upcoming');
    if(!article){article=document.createElement('article');article.className='collection-book is-upcoming';article.innerHTML=upcomingCardMarkup(book);}
    else if(!article.classList.contains('is-upcoming')){article.className='collection-book is-upcoming';article.innerHTML=upcomingCardMarkup(book);}
    const target=upcomingShelf.querySelector('.collection-grid');
    if(article.parentElement!==target)target.appendChild(article);
    comingCount++;
   }
   article.dataset.bookId=book.id;
  }
  // The catalog is authoritative for visibility and voting; retired entries must not linger.
  const knownIds=new Set(seriesBooks.map(book=>book.id));
  existing.forEach((article,id)=>{if(!knownIds.has(id))article.remove();});
  upcoming.splice(0,upcoming.length,...seriesBooks.filter(book=>book.status==='coming_soon').map(book=>({id:book.id,title:book.title,series:book.series})));
  const statValues=page.querySelectorAll('.collection-stat dd');
  if(statValues.length>=3){statValues[0].textContent=String(seriesBooks.length);statValues[1].textContent=String(availableCount);statValues[2].textContent=String(comingCount);}
  if(availableShelf){
   const count=availableShelf.querySelector('#available-heading span');if(count)count.textContent=String(availableCount);
   availableShelf.hidden=availableCount===0;
  }
  if(upcomingShelf){
   const count=upcomingShelf.querySelector('#upcoming-heading span');if(count)count.textContent=String(comingCount);
   upcomingShelf.hidden=comingCount===0;
  }
 }catch(error){console.warn('Collection catalog sync failed:',error);}
}

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
document.querySelector('.collection-page').addEventListener('click',e=>{const btn=e.target.closest('[data-vote-id]');if(!btn)return;const book=upcoming.find(b=>b.id===btn.dataset.voteId);if(book)openVote(book);});
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
  voteDialog.close();syncVotes();
  toast('♥ Your vote is in! Thanks for helping choose our next story.');
 }catch(error){showVoteError(error.message||'Unable to save your preference.');verifiedToken='';if(window.turnstile&&widgetId!==null)try{window.turnstile.reset(widgetId);}catch{}}
 finally{submitting=false;voteConfirm.textContent='♥ Vote for this book';voteConfirm.disabled=!verifiedToken;}
});

function loadCollectionSeo(){
 if(!document.querySelector('link[data-collection-seo]')){
  const style=document.createElement('link');style.rel='stylesheet';style.href='../collection-seo.css?v=1';style.dataset.collectionSeo='true';document.head.appendChild(style);
 }
 if(!document.querySelector('script[data-collection-seo]')){
  const script=document.createElement('script');script.src='../collection-seo.js?v=1';script.dataset.collectionSeo='true';document.head.appendChild(script);
 }
}
syncPublishedFromCatalog().finally(()=>{linkUpcomingDetailCards();syncVotes();loadCollectionSeo();});