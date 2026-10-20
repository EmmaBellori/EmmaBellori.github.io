/* Emma Bellori Books — shared detail-page metadata and conversion presentation. */
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
  let trackingBound=false;

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
    /* Trust the catalog status only. The dynamic detail template always contains a hidden
       Coming Soon pill, even for published books, so DOM presence must not determine status. */
    return !!(book&&book.status==='coming_soon');
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
  function removeBackToBooks(){
    document.querySelectorAll('.detail-main .book-return-action').forEach(node=>node.remove());
    document.querySelectorAll('.detail-main a.back-link').forEach(link=>{
      if(/back to (?:all )?books/i.test(link.textContent||''))link.remove();
    });
  }

  function isAmazonProductLink(link){
    if(!link||!link.href)return false;
    try{
      const url=new URL(link.href,location.href);
      return /(^|\.)amazon\.[a-z.]+$/i.test(url.hostname)&&/\/dp\//.test(url.pathname);
    }catch{return false;}
  }
  function primaryAmazonLink(){
    const link=document.querySelector('.detail-hero a.primary-book-cta[href]');
    return isAmazonProductLink(link)?link:null;
  }
  function ensureConversionStyles(){
    if(document.getElementById('eb-book-conversion-styles'))return;
    const style=document.createElement('style');
    style.id='eb-book-conversion-styles';
    style.textContent=`
      .eb-conversion-mid{box-sizing:border-box;max-width:920px;margin:30px auto 46px;padding:25px 28px;border:1px solid #d7e4df;border-radius:20px;background:#f3f7f5;text-align:center}
      .eb-conversion-mid .eyebrow{margin:0 0 6px}.eb-conversion-mid h2{margin:0 0 9px;font:normal clamp(1.55rem,3vw,2.1rem)/1.2 Georgia,serif;color:#263d40}
      .eb-conversion-mid p{max-width:660px;margin:0 auto 15px;line-height:1.65;color:#48615c}.eb-conversion-mid .button{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:14px 24px;text-align:center}
      .eb-conversion-mid .eb-conversion-note{margin:10px auto 0;font-size:.78rem;color:#536965}
      .detail-copy .primary-book-cta.eb-amazon-conversion{font-weight:800}
      @media(max-width:700px){.eb-conversion-mid{margin:24px 0 36px;padding:22px 18px}.eb-conversion-mid .button{display:flex;width:100%;box-sizing:border-box}}
    `;
    document.head.appendChild(style);
  }
  function markAmazonCtas(){
    const main=document.querySelector('.detail-main');if(!main)return;
    const title=(main.querySelector('h1')?.textContent||'this book').trim();
    const hero=primaryAmazonLink();
    if(hero){
      hero.dataset.ctaPosition='hero';
      hero.classList.add('eb-amazon-conversion');
      hero.setAttribute('aria-label','Check current price and availability for '+title+' on Amazon');
      if(/^\s*View on Amazon\s*↗?\s*$/i.test(hero.textContent||''))hero.textContent='Check price & availability on Amazon ↗';
      const fineprint=hero.parentElement?.querySelector('.fineprint');
      if(fineprint&&/Amazon\.com displays current prices/i.test(fineprint.textContent||''))fineprint.textContent='Opens Amazon.com to view the current price, available formats and customer reviews, if available.';
    }
    const bottom=main.querySelector('.v4-bottom-cta a[href]');
    if(isAmazonProductLink(bottom)){
      bottom.dataset.ctaPosition='bottom';
      bottom.setAttribute('aria-label','Check current price and availability for '+title+' on Amazon');
      if(/^\s*View on Amazon\s*↗?\s*$/i.test(bottom.textContent||''))bottom.textContent='Check price & availability on Amazon ↗';
    }
    const mid=main.querySelector('.eb-conversion-mid a[href]');
    if(isAmazonProductLink(mid))mid.dataset.ctaPosition='after_preview';
  }
  function ensureMidConversionCta(){
    const main=document.querySelector('.detail-main');
    const hero=document.querySelector('.detail-hero');
    const source=primaryAmazonLink();
    if(!main||!hero||!source)return;
    const title=(main.querySelector('h1')?.textContent||'this book').trim();
    let section=main.querySelector('.eb-conversion-mid');
    if(!section){
      section=document.createElement('section');
      section.className='eb-conversion-mid';
      section.setAttribute('aria-label','Amazon purchase options');
      const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent='AVAILABLE ON AMAZON';
      const heading=document.createElement('h2');heading.textContent='Want to see the current price?';
      const copy=document.createElement('p');copy.textContent='Open '+title+' on Amazon.com to view current availability and available formats.';
      const link=document.createElement('a');link.className='button';link.href=source.href;link.target='_blank';link.rel='noopener noreferrer sponsored';link.dataset.bookId=source.dataset.bookId||detailId();link.dataset.ctaPosition='after_preview';link.textContent='Check price & availability on Amazon ↗';link.setAttribute('aria-label','Check current price and availability for '+title+' on Amazon');
      const note=document.createElement('p');note.className='eb-conversion-note';note.textContent='Purchase is completed on Amazon.';
      section.append(eyebrow,heading,copy,link,note);
    }
    const preview=main.querySelector('.eb-inside-preview');
    const anchor=preview||hero;
    if(anchor.nextElementSibling!==section)anchor.insertAdjacentElement('afterend',section);
  }
  function bindConversionTracking(){
    if(trackingBound)return;trackingBound=true;
    document.addEventListener('click',event=>{
      const preview=event.target.closest('.eb-inside-thumb');
      if(preview){
        const siblings=Array.from(preview.parentElement?.querySelectorAll('.eb-inside-thumb')||[]);
        const index=Math.max(0,siblings.indexOf(preview))+1;
        if(typeof window.ebTrack==='function')window.ebTrack('book_preview_open',{book_id:detailId()||'unknown',preview_index:index});
        return;
      }
      const link=event.target.closest('a[data-cta-position][href]');
      if(!isAmazonProductLink(link))return;
      let host='';try{host=new URL(link.href,location.href).hostname;}catch{}
      if(typeof window.ebTrack==='function')window.ebTrack('amazon_cta_click',{
        book_id:link.dataset.bookId||detailId()||'unknown',
        cta_position:link.dataset.ctaPosition||'unknown',
        cta_text:(link.textContent||'').trim().slice(0,80),
        link_host:host
      });
    },true);
  }
  function decorateConversion(){
    ensureConversionStyles();
    markAmazonCtas();
    ensureMidConversionCta();
    markAmazonCtas();
  }

  function decorate(){
    if(!document.querySelector('.detail-main'))return;
    const book=currentBook();
    cleanLegacyAgeText();
    ensureAgeBadge(book);
    cleanComingSoonDetail(book);
    removeBackToBooks();
    decorateConversion();
  }
  function schedule(){
    if(pending)return;pending=true;
    requestAnimationFrame(()=>{pending=false;decorate();});
  }
  function init(){
    bindConversionTracking();
    fetch(catalogUrl,{cache:'no-store'}).then(response=>response.ok?response.json():[]).then(data=>{entries=Array.isArray(data)?data:[];decorate();}).catch(()=>decorate());
    decorate();
    observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','data-book-id','data-series-slug']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
