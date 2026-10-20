/* Homepage refinements: keep Start Here unique, route published SEO pages, compact latest releases, and sync sticky header/search. */
(()=>{
 const START_HERE_IDS=new Set(['mad','mistakes','i-cant-sleep-without-you']);
 const STATIC_BOOK_PATHS={
  'i-cant-sleep-without-you':'books/i-cant-sleep-without-you.html',
  'door-teapot':'books/the-door-inside-the-teapot.html'
 };

 // Prefer clean static URLs for published titles that have dedicated SEO pages.
 if(typeof detailHref==='function'){
  const dynamicDetailHref=detailHref;
  detailHref=function(book){return STATIC_BOOK_PATHS[book&&book.id]||dynamicDetailHref(book);};
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
