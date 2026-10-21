/* SEO and related-resource enhancements shared by all standalone collection pages. */
(function(){
'use strict';

const CONFIG=Object.freeze({
 'big-feelings-real-problems':{
  summary:'Pair these stories with practical family guides about losing, mistakes, friendship and bedtime confidence.',
  links:[
   ['Parent guide','How to Help Kids Handle Losing a Game','../guides/help-kids-handle-losing.html'],
   ['Parent guide','How to Help Kids Learn From Mistakes','../guides/help-kids-learn-from-mistakes.html'],
   ['Parent guide','How to Help a Child Who Feels Left Out','../guides/help-child-feel-left-out.html'],
   ['Parent guide','How to Help Kids Sleep More Independently','../guides/help-kids-sleep-independently.html']
  ]
 },
 'kawaii-coloring-activities':{
  summary:'Continue the screen-free fun with seasonal activity guides and another playful learning collection.',
  links:[
   ['Free guide','10 Screen-Free Halloween Activities for Kids','../guides/screen-free-halloween-activities-for-kids.html'],
   ['Free guide','10 Screen-Free Christmas Activities for Kids','../guides/screen-free-christmas-activities-for-kids.html'],
   ['Collection','Little Steps, Big Discoveries','little-steps-big-discoveries.html']
  ]
 },
 'junior-detectives':{
  summary:'Move from clue-driven science stories into Earth science and hands-on early discovery.',
  links:[
   ['Collection','My First Earth Adventures','my-first-earth-adventures.html'],
   ['Collection','Little Steps, Big Discoveries','little-steps-big-discoveries.html']
  ]
 },
 'little-christmas-wonders':{
  summary:'Explore more gentle holiday ideas, screen-free Christmas activities and imaginative story collections.',
  links:[
   ['Free guide','10 Screen-Free Christmas Activities for Kids','../guides/screen-free-christmas-activities-for-kids.html'],
   ['Collection','Kawaii Coloring & Activities','kawaii-coloring-activities.html'],
   ['Collection','Tiny Doors, Big Adventures','tiny-doors-big-adventures.html']
  ]
 },
 'little-money-smart-choices':{
  summary:'Continue with stories about everyday systems, practical choices and simple learning through familiar situations.',
  links:[
   ['Collection','Small Town, Many Hands','small-town-many-hands.html'],
   ['Collection','Little Steps, Big Discoveries','little-steps-big-discoveries.html']
  ]
 },
 'little-steps-big-discoveries':{
  summary:'Keep building curiosity with Earth science, investigations and creative activity books.',
  links:[
   ['Collection','My First Earth Adventures','my-first-earth-adventures.html'],
   ['Collection','Junior Detectives','junior-detectives.html'],
   ['Collection','Kawaii Coloring & Activities','kawaii-coloring-activities.html']
  ]
 },
 'my-first-earth-adventures':{
  summary:'Continue exploring science through clue-based investigations and simple hands-on discovery.',
  links:[
   ['Collection','Junior Detectives','junior-detectives.html'],
   ['Collection','Little Steps, Big Discoveries','little-steps-big-discoveries.html']
  ]
 },
 'my-first-sports-adventures':{
  summary:'Connect first sports experiences with stories and practical ideas about frustration, confidence and sportsmanship.',
  links:[
   ['Parent guide','How to Help Kids Handle Losing a Game','../guides/help-kids-handle-losing.html'],
   ['Collection','Big Feelings, Real Problems','big-feelings-real-problems.html'],
   ['Collection','Junior Detectives','junior-detectives.html']
  ]
 },
 'small-town-many-hands':{
  summary:'Explore more books about everyday systems, practical choices and how the world around us works.',
  links:[
   ['Collection','Little Money, Smart Choices','little-money-smart-choices.html'],
   ['Collection','Junior Detectives','junior-detectives.html']
  ]
 },
 'tiny-doors-big-adventures':{
  summary:'Continue with clue-filled discoveries and warm imaginative stories built around curiosity and wonder.',
  links:[
   ['Collection','Junior Detectives','junior-detectives.html'],
   ['Collection','Little Christmas Wonders','little-christmas-wonders.html']
  ]
 }
});

function slug(){return location.pathname.match(/\/collections\/([^/]+)\.html$/)?.[1]||'';}
function canonical(){return document.querySelector('link[rel="canonical"]')?.href||location.href.split('#')[0];}
function text(value){return String(value??'');}
function escapeHTML(value){return text(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function addRelatedHub(){
 const page=document.querySelector('.collection-page');
 const key=slug();const config=CONFIG[key];
 if(!page||!config||page.querySelector('.collection-seo-hub'))return;
 const title='Explore related reading';
 const section=document.createElement('section');
 section.className='collection-seo-hub';section.setAttribute('aria-labelledby','collection-related-reading');
 section.innerHTML='<p class="eyebrow">RELATED READING</p><h2 id="collection-related-reading">'+title+'</h2><p class="collection-seo-summary">'+escapeHTML(config.summary)+'</p><div class="collection-seo-links">'+config.links.map(([kind,label,href])=>'<a class="collection-seo-link" href="'+escapeHTML(href)+'"><span>'+escapeHTML(kind)+'</span><strong>'+escapeHTML(label)+'</strong><b aria-hidden="true">→</b></a>').join('')+'</div>';
 const footerLink=page.querySelector('.collection-footer-link');
 if(footerLink)footerLink.before(section);else page.appendChild(section);
}

function addStructuredData(){
 if(document.querySelector('#collection-seo-structured-data'))return;
 const current=document.querySelector('.collection-breadcrumb [aria-current="page"]')?.textContent.trim()||document.querySelector('h1')?.textContent.trim()||'Collection';
 const url=canonical();
 const home='https://emmabellori.github.io/emma-bellori-books/';
 const published=[];const seen=new Set();
 document.querySelectorAll('.collection-book.is-published h2 a[href]').forEach(a=>{
  const href=new URL(a.getAttribute('href'),location.href).href;
  if(seen.has(href))return;seen.add(href);
  published.push({name:a.textContent.trim(),url:href});
 });
 const graph=[{
  '@type':'BreadcrumbList','@id':url+'#breadcrumb',
  itemListElement:[
   {'@type':'ListItem',position:1,name:'Emma Bellori Books',item:home},
   {'@type':'ListItem',position:2,name:current,item:url}
  ]
 }];
 if(published.length){
  graph.push({
   '@type':'ItemList','@id':url+'#available-books',name:'Available books in '+current,
   numberOfItems:published.length,itemListOrder:'https://schema.org/ItemListOrderAscending',
   itemListElement:published.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,url:item.url}))
  });
 }
 const script=document.createElement('script');script.id='collection-seo-structured-data';script.type='application/ld+json';script.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});document.head.appendChild(script);
}

function run(){addRelatedHub();addStructuredData();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
