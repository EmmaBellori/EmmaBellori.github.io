/* Render upcoming titles only when their original cover assets are available. */
(function(){
 'use strict';
 const section=document.getElementById('coming-soon');
 const grid=document.getElementById('coming-soon-grid');
 if(!section||!grid)return;
 const titles=window.EMMA_COMING_SOON||[];
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 titles.forEach(book=>{
  if(!/^images\/coming-soon\/[a-zA-Z0-9_\-]+\.jpg$/.test(book.cover))return;
  const image=new Image();
  image.onload=()=>{
   const card=document.createElement('article');card.className='upcoming-card';
   card.innerHTML='<div class="upcoming-cover"><img src="'+escape(book.cover)+'" alt="Original cover of '+escape(book.title)+'" loading="lazy" decoding="async" width="800" height="800"></div><div class="upcoming-body"><span class="upcoming-status">Coming Soon</span><p class="upcoming-series">'+escape(book.series||'Emma Bellori Books')+'</p><h3>'+escape(book.title)+'</h3><p class="upcoming-note">More details will be announced soon.</p></div>';
   grid.appendChild(card);section.hidden=false;
  };
  image.src=book.cover;
 });
})();
