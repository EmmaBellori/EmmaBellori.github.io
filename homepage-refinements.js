/* Homepage refinements: keep Start Here unique, compact latest releases, sync sticky header/search, and add editorial merchandising. */
(()=>{
 const START_HERE_IDS=new Set(['mad','mistakes','i-cant-sleep-without-you']);
 const LATEST_RELEASE_IDS=['little-star-missed-christmas','gingerbread-house','cute-animals-bold-easy'];
 // Load the homepage-only editorial layer.
 if(!document.querySelector('#eb-homepage-merchandising-css')){
  const link=document.createElement('link');
  link.id='eb-homepage-merchandising-css';link.rel='stylesheet';link.href='homepage-merchandising.css';document.head.appendChild(link);
 }

 // Override the homepage latest renderer before the catalog fetch resolves.
 if(typeof renderLatest==='function'){
  renderLatest=function(){
   const eligible=published.filter(book=>!START_HERE_IDS.has(book.id));
   const byId=new Map(eligible.map(book=>[book.id,book]));
   const latest=[];
   // New publication dates take priority, even for titles already listed as Coming Soon.
   // Use catalog order as a deterministic tie-breaker for same-day releases.
   const dated=eligible.filter(book=>/^\d{4}-\d{2}-\d{2}$/.test(book.publishedOn||''))
    .sort((a,b)=>b.publishedOn.localeCompare(a.publishedOn)||b._catalogIndex-a._catalogIndex);
   for(const book of dated.slice(0,3)){latest.push(book);byId.delete(book.id);}
   for(const id of LATEST_RELEASE_IDS){
    if(latest.length>=3)break;
    const book=byId.get(id);
    if(book){latest.push(book);byId.delete(id);}
   }
   if(latest.length<3){
    latest.push(...Array.from(byId.values()).sort((a,b)=>b._catalogIndex-a._catalogIndex).slice(0,3-latest.length));
   }
   latestGrid.innerHTML=latest.slice(0,3).map(publishedCard).join('');
  };
 }

 function wrapFeaturedReleaseContent(card){
  if(!card)return;
  let content=card.querySelector(':scope > .eb-featured-release-content');
  if(!content){
   content=document.createElement('div');
   content.className='eb-featured-release-content';
   card.appendChild(content);
  }

  // The preview module wraps .home-cover-wrap inside .eb-cover-carousel after render.
  // Treat both as the cover host and always keep that host outside the editorial content.
  let coverHost=card.querySelector(':scope > .eb-cover-carousel, :scope > .home-cover-wrap');
  if(!coverHost){
   coverHost=content.querySelector(':scope > .eb-cover-carousel, :scope > .home-cover-wrap');
   if(coverHost)content.before(coverHost);
  }
  if(coverHost && coverHost.nextElementSibling!==content)coverHost.insertAdjacentElement('afterend',content);

  Array.from(card.children).forEach(child=>{
   if(child===content||child===coverHost||child.matches('.home-cover-wrap,.eb-cover-carousel'))return;
   content.appendChild(child);
  });
 }

 function decorateLatest(){
  const cards=Array.from(document.querySelectorAll('#latest-grid .home-book-card'));
  cards.forEach((card,index)=>{
   const featured=index===0;
   card.classList.toggle('is-featured-release',featured);
   card.classList.toggle('is-secondary-release',index>0);
   if(featured)wrapFeaturedReleaseContent(card);
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

 function decorateHomepage(){
  // Publication status comes from catalog.json, never from homepage-only overrides.
  decorateLatest();decorateSeries();
 }
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
