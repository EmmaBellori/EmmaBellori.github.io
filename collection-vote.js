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
function detailHref(book){return '../book.html?id='+encodeURIComponent(book.id);}
function publishedCardMarkup(book,article){
 const img=article.querySelector('img');
 const cover=img?img.getAttribute('src'):('../'+book.cover);
 const alt=img?img.getAttribute('alt'):('Cover of '+book.title);
 const theme=book.theme?'<p class="collection-theme">'+escapeHTML(book.theme)+'</p>':'';
 const description=book.description?'<p class="collection-description">'+escapeHTML(book.description)+'</p>':'';
 return '<div class="collection-cover-wrap"><a href="'+detailHref(book)+'" aria-label="Read about '+escapeHTML(book.title)+'"><img loading="lazy" decoding="async" width="240" height="340" src="'+escapeHTML(cover)+'" alt="'+escapeHTML(alt)+'"></a></div><div class="collection-book-info"><span class="collection-state">Available now</span><h2><a href="'+detailHref(book)+'">'+escapeHTML(book.title)+'</a></h2>'+theme+description+'<div class="collection-actions"><a class="collection-buy" href="'+escapeHTML(book.amazonUrl)+'" target="_blank" rel="noopener noreferrer sponsored" data-book-id="'+escapeHTML(book.id)+'">View on Amazon ↗</a><a class="collection-action" href="'+detailHref(book)+'">Book details →</a></div></div>';
}
async function syncPublishedFromCatalog(){
 const page=document.querySelector('.collection-page');if(!page)return;
 const currentSeries=document.querySelector('.collection-breadcrumb [aria-current="page"]')?.textContent.trim()||'';
 if(!currentSeries)return;
 try{
  const response=await fetch('../catalog.json',{cache:'no-store'});if(!response.ok)return;
  const catalog=await response.json();if(!Array.isArray(catalog))return;
  const seriesBooks=catalog.filter(book=>book&&book.series===currentSeries);
  const publishedBooks=seriesBooks.filter(book=>book.status==='published'&&typeof book.amazonUrl==='string');
  if(!publishedBooks.length)return;
  let availableShelf=page.querySelector('.collection-shelf[aria-labelledby="available-heading"]');
  const upcomingShelf=page.querySelector('.collection-shelf[aria-labelledby="upcoming-heading"]');
  if(!availableShelf){
   availableShelf=document.createElement('section');availableShelf.className='collection-shelf';availableShelf.setAttribute('aria-labelledby','available-heading');availableShelf.innerHTML='<h2 id="available-heading">Available now <span>0</span></h2><p>Discover the books already available and explore their editions on Amazon.</p><div class="collection-grid"></div>';
   if(upcomingShelf)upcomingShelf.before(availableShelf);else page.querySelector('.collection-footer-link')?.before(availableShelf);
  }
  const availableGrid=availableShelf.querySelector('.collection-grid');
  for(const book of publishedBooks){
   const voteButton=page.querySelector('[data-vote-id="'+CSS.escape(book.id)+'"]');
   const article=voteButton?.closest('.collection-book');
   if(!article||article.classList.contains('is-published'))continue;
   article.classList.remove('is-upcoming');article.classList.add('is-published');article.innerHTML=publishedCardMarkup(book,article);availableGrid.appendChild(article);
   const index=upcoming.findIndex(item=>item.id===book.id);if(index!==-1)upcoming.splice(index,1);
  }
  const publishedCount=seriesBooks.filter(book=>book.status==='published').length;
  const comingCount=seriesBooks.filter(book=>book.status==='coming_soon').length;
  const statValues=page.querySelectorAll('.collection-stat dd');
  if(statValues.length>=3){statValues[0].textContent=String(seriesBooks.length);statValues[1].textContent=String(publishedCount);statValues[2].textContent=String(comingCount);}
  const availableCount=availableShelf.querySelector('#available-heading span');if(availableCount)availableCount.textContent=String(publishedCount);
  if(upcomingShelf){const upcomingCount=upcomingShelf.querySelector('#upcoming-heading span');if(upcomingCount)upcomingCount.textContent=String(comingCount);if(comingCount===0)upcomingShelf.hidden=true;}
 }catch{}
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

syncPublishedFromCatalog().finally(syncVotes);
