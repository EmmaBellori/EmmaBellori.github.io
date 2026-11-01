/* Homepage refinements: keep Start Here unique, compact latest releases, sync sticky header/search, and add editorial merchandising. */
(()=>{
 const START_HERE_IDS=new Set(['mad','mistakes','i-cant-sleep-without-you']);

 // Load the homepage-only editorial layer.
 if(!document.querySelector('#eb-homepage-merchandising-css')){
  const link=document.createElement('link');
  link.id='eb-homepage-merchandising-css';link.rel='stylesheet';link.href='homepage-merchandising.css';document.head.appendChild(link);
 }

 // Override the homepage latest renderer before the catalog fetch resolves.
 if(typeof renderLatest==='function'){
  renderLatest=function(){
   const latest=published
    .filter(book=>!START_HERE_IDS.has(book.id))
    .slice()
    .sort((a,b)=>b._catalogIndex-a._catalogIndex)
    .slice(0,3);
   latestGrid.innerHTML=latest.map(publishedCard).join('');
  };
 }

 function decorateLatest(){
  const cards=Array.from(document.querySelectorAll('#latest-grid .home-book-card'));
  cards.forEach((card,index)=>{
   card.classList.toggle('is-featured-release',index===0);
   card.classList.toggle('is-secondary-release',index>0);
  });
 }

 function decorateSeries(){
  document.querySelectorAll('.home-series-preview').forEach(section=>{
   const heading=section.querySelector('.home-series-heading');
   if(!heading||heading.querySelector('.eb-series-cover-stack'))return;
   const images=Array.from(section.querySelectorAll('.home-book-card .home-cover-wrap img')).slice(0,3);
   if(!images.length)return;
   const stack=document.createElement('div');stack.className='eb-series-cover-stack';stack.setAttribute('aria-hidden','true');
   images.forEach(image=>{const clone=image.cloneNode(false);clone.removeAttribute('loading');clone.removeAttribute('alt');stack.appendChild(clone);});
   heading.prepend(stack);
  });
 }

 function decorateHomepage(){decorateLatest();decorateSeries();}
 decorateHomepage();
 const homeObserver=new MutationObserver(decorateHomepage);
 if(latestGrid)homeObserver.observe(latestGrid,{childList:true,subtree:true});
 if(seriesCatalog)homeObserver.observe(seriesCatalog,{childList:true,subtree:true});

 // Keep the search bar directly below the sticky site header at every viewport size.
 const header=document.querySelector('.home-v12 .site-header');
 if(header){
  const syncStickyOffset=()=>{
   const height=Math.ceil(header.getBoundingClientRect().height);
   document.documentElement.style.setProperty('--home-sticky-header-height',height+'px');
  };
  syncStickyOffset();
  window.addEventListener('resize',syncStickyOffset,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(syncStickyOffset).observe(header);
 }
})();
