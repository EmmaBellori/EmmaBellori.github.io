/* Breadcrumb navigation and return to the last catalog position. */
(function(){
'use strict';

const home=document.querySelector('a.brand');
const back=document.querySelector('.back-link');
const breadcrumb=document.querySelector('[data-book-breadcrumb]');
const root=location.pathname.includes('/books/')?'../':'';
let seriesApplied=false;
function homeLink(){return root+'index.html#catalog-return';}
if(home)home.href=root+'index.html#home';
if(breadcrumb){const homeCrumb=breadcrumb.querySelector('a');if(homeCrumb)homeCrumb.href=root+'index.html#home';}
if(back){back.href=homeLink();back.textContent='← Back to books';}
document.querySelectorAll('a[href$="index.html"],a[href$="index.html#books"]').forEach(a=>{
 if(a.closest('header')||a.closest('footer'))a.href=root+'index.html#home';
});
function setSeries(name,slug){
 if(seriesApplied||!breadcrumb||!name||!slug)return;
 seriesApplied=true;
 queueMicrotask(()=>{
  const a=document.createElement('a');a.href=root+'collections/'+encodeURIComponent(slug)+'.html';a.textContent=name;
  const crumb=document.createElement('span');crumb.setAttribute('aria-hidden','true');crumb.textContent=' / ';
  breadcrumb.append(crumb,a);
  const last=document.createElement('span');last.setAttribute('aria-hidden','true');last.textContent=' / ';
  const current=document.createElement('span');current.setAttribute('aria-current','page');current.textContent=document.querySelector('h1')?.textContent||'Book';
  breadcrumb.append(last,current);
 });
}
function applyBookMeta(meta){setSeries(meta?.series||'',meta?.seriesSlug||'');}
document.addEventListener('emma:book-ready',event=>applyBookMeta(event.detail));
applyBookMeta({series:document.body.dataset.seriesName,seriesSlug:document.body.dataset.seriesSlug});
})();