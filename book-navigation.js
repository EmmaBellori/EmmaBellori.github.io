/* Breadcrumb navigation and return to the last catalog position. */
(function(){
'use strict';
const STORAGE_KEY='eb-catalog-return-v1';
const home=document.querySelector('a.brand');
const back=document.querySelector('.back-link');
const breadcrumb=document.querySelector('[data-book-breadcrumb]');
const root=location.pathname.includes('/books/')?'../':'';
const id=document.body.dataset.bookId||new URLSearchParams(location.search).get('id');
const known={"mistakes":{"series":"Big Feelings, Real Problems","slug":"big-feelings-real-problems"},"play":{"series":"Big Feelings, Real Problems","slug":"big-feelings-real-problems"},"bugs":{"series":"Junior Detectives","slug":"junior-detectives"},"mad":{"series":"Big Feelings, Real Problems","slug":"big-feelings-real-problems"},"christmas":{"series":"Kawaii Coloring & Activities","slug":"kawaii-coloring-activities"},"halloween":{"series":"Kawaii Coloring & Activities","slug":"kawaii-coloring-activities"}};
function stored(){
 try{const s=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null');if(!s||!Number.isFinite(s.y)||s.y<0||Date.now()-s.t>1800000)return null;return s;}catch{return null;}
}
function homeLink(){return root+'index.html#catalog-return';}
if(home)home.href=homeLink();
if(back){back.href=homeLink();back.textContent='← Back to books';}
document.querySelectorAll('a[href$="index.html"],a[href$="index.html#books"]').forEach(a=>{
 if(a.closest('header')||a.closest('footer'))a.href=homeLink();
});
function setSeries(name,slug){
 if(!breadcrumb||!slug)return;
 const a=document.createElement('a');a.href=root+'collections/'+encodeURIComponent(slug)+'.html';a.textContent=name;
 const crumb=document.createElement('span');crumb.setAttribute('aria-hidden','true');crumb.textContent=' / ';
 breadcrumb.append(crumb,a);
 const last=document.createElement('span');last.setAttribute('aria-hidden','true');last.textContent=' / ';
 const current=document.createElement('span');current.setAttribute('aria-current','page');current.textContent=document.querySelector('h1')?.textContent||'Book';
 breadcrumb.append(last,current);
}
if(known[id])setSeries(known[id].series,known[id].slug);
else if(id)fetch(root+'catalog.json').then(r=>r.ok?r.json():[]).then(entries=>{const b=entries.find(x=>x.id===id);if(b)setSeries(b.series,b.seriesSlug);}).catch(()=>{});
})();