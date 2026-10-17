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

syncVotes();
