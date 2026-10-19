/* Emma Bellori Books — shared detail-page metadata presentation. */
(function(){
  'use strict';
  if(window.__emmaDetailMetaLoaded)return;
  window.__emmaDetailMetaLoaded=true;

  const currentScript=document.currentScript;
  const sourceUrl=currentScript&&currentScript.src?currentScript.src:location.href;
  const catalogUrl=new URL('catalog.json',sourceUrl).href;
  const AGE_BY_SERIES=Object.freeze({
    'Big Feelings, Real Problems':'4–8',
    'Little Christmas Wonders':'4–8',
    'Tiny Doors, Big Adventures':'6–9',
    'Small Town, Many Hands':'5–8',
    'Little Steps, Big Discoveries':'3–6',
    'Junior Detectives':'6–9',
    'My First Sports Adventures':'5–8',
    'My First Earth Adventures':'5–8',
    'Kawaii Coloring & Activities':'4–10',
    'Little Money, Smart Choices':'5–8',
    'More Books by Emma Bellori':'4–9'
  });
  let entries=[];
  let observer=null;
  let pending=false;

  function cleanAgeRange(value){return String(value||'').replace(/^ages?\s*/i,'').trim();}
  function detailId(){
    if(document.body.dataset.bookId)return document.body.dataset.bookId;
    const tagged=document.querySelector('[data-book-id]');
    if(tagged&&tagged.dataset.bookId)return tagged.dataset.bookId;
    if(/\/book\.html$/.test(location.pathname))return new URLSearchParams(location.search).get('id')||'';
    return '';
  }
  function currentBook(){
    const id=detailId();
    const found=entries.find(book=>book&&book.id===id);
    if(found)return found;
    const series=(document.querySelector('.detail-subtitle')?.textContent||'').trim();
    return {id,series,seriesSlug:document.body.dataset.seriesSlug||''};
  }
  function ageRangeFor(book){
    const explicit=cleanAgeRange(book&&book.ageRange);
    return explicit||AGE_BY_SERIES[book&&book.series]||'';
  }
  function ensureBadgeRow(){
    const copy=document.querySelector('.detail-copy');if(!copy)return null;
    let row=copy.querySelector('.eb-detail-badges');
    if(!row){
      row=document.createElement('div');row.className='eb-detail-badges';
      const lead=copy.querySelector('.lead');
      if(lead)lead.insertAdjacentElement('afterend',row);else copy.prepend(row);
    }
    return row;
  }
  function ensureAgeBadge(book){
    const range=ageRangeFor(book);if(!range)return;
    const row=ensureBadgeRow();if(!row)return;
    let badge=document.querySelector('.detail-copy .eb-age-detail');
    if(!badge){badge=document.createElement('span');row.prepend(badge);}else if(badge.parentElement!==row)row.prepend(badge);
    badge.className='book-age eb-age-badge eb-age-detail';
    badge.textContent='Ages '+range;
    badge.setAttribute('aria-label','Recommended age: '+range+' years');
  }
  function isComingSoon(book){
    return !!((book&&book.status==='coming_soon')||document.querySelector('.detail-copy .coming-soon-pill'));
  }
  function cleanComingSoonDetail(book){
    if(!isComingSoon(book))return;
    const copy=document.querySelector('.detail-copy');if(!copy)return;
    const row=ensureBadgeRow();

    copy.querySelectorAll('.detail-fact').forEach(node=>{
      if(/^\s*Publication status\s*:/i.test(node.textContent||''))node.remove();
    });

    const amazon=document.querySelector('#book-amazon');
    if(amazon){amazon.hidden=true;amazon.removeAttribute('href');amazon.style.setProperty('display','none','important');}
    const fineprint=document.querySelector('#book-fineprint');if(fineprint)fineprint.hidden=true;

    const comingHost=document.querySelector('#book-coming-soon-actions');
    if(comingHost){
      comingHost.querySelectorAll('.coming-soon-note,.coming-soon-collection-link').forEach(node=>node.remove());
      const pills=comingHost.querySelectorAll('.coming-soon-pill');
      pills.forEach((pill,index)=>{if(index>0)pill.remove();});
      const pill=comingHost.querySelector('.coming-soon-pill');
      if(pill&&row&&pill.parentElement!==row)row.appendChild(pill);
      comingHost.hidden=true;
    }
    const allPills=copy.querySelectorAll('.coming-soon-pill');
    allPills.forEach((pill,index)=>{if(index>0)pill.remove();});
    const status=copy.querySelector('.coming-soon-pill');if(status&&row&&status.parentElement!==row)row.appendChild(status);

    const bottom=document.querySelector('#book-bottom-cta');
    if(bottom)bottom.hidden=true;
  }
  function cleanLegacyAgeText(){
    document.querySelectorAll('.detail-copy .detail-fact').forEach(node=>{
      if(/^\s*(Recommended|Suggested) age\s*:/i.test(node.textContent||'')){
        const match=(node.textContent||'').match(/(?:Ages?\s*)?(\d+\s*[–-]\s*\d+)/i);
        const range=match?match[1].replace('-', '–'):'';
        const badge=document.createElement('span');
        badge.className='book-age eb-age-badge eb-age-detail';
        if(range){badge.textContent='Ages '+range;badge.setAttribute('aria-label','Recommended age: '+range+' years');}
        node.replaceWith(badge);
      }
    });
  }
  function decorate(){
    if(!document.querySelector('.detail-main'))return;
    const book=currentBook();
    cleanLegacyAgeText();
    ensureAgeBadge(book);
    cleanComingSoonDetail(book);
  }
  function schedule(){
    if(pending)return;pending=true;
    requestAnimationFrame(()=>{pending=false;decorate();});
  }
  function init(){
    fetch(catalogUrl,{cache:'no-store'}).then(response=>response.ok?response.json():[]).then(data=>{entries=Array.isArray(data)?data:[];decorate();}).catch(()=>decorate());
    decorate();
    observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','data-book-id','data-series-slug']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
