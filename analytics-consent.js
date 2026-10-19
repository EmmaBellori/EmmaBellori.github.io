/* Emma Bellori Books — optional GA4 analytics plus shared site UI. No GA script or cookie before consent. */
(function () {
  'use strict';
  const measurementId = 'G-PJDVFZV1QG';
  const storageKey = 'emma_bellori_analytics_consent_v1';
  const consentVersion = '2026-10-13';
  const sourceUrl = document.currentScript && document.currentScript.src ? document.currentScript.src : location.href;
  const catalogUrl = new URL('catalog.json', sourceUrl).href;
  const AGE_BY_SERIES = Object.freeze({
    'Big Feelings, Real Problems':'4–8',
    'Little Christmas Wonders':'4–8',
    'Tiny Doors, Big Adventures':'6–9',
    'Small Town, Many Hands':'5–8',
    'Little Steps, Big Discoveries':'3–6',
    'Junior Detectives':'6–9',
    'My First Sports Adventures':'5–8',
    'My First Earth Adventures':'5–8',
    'Kawaii Coloring & Activities':'4–10',
    'More Books by Emma Bellori':'4–9'
  });
  let enabled = false;
  let loading = false;
  let consentGranted = false;
  let backToTopButton = null;
  let catalogPromise = null;
  let ageObserver = null;
  let ageDecoratePending = false;
  const read = () => { try { return localStorage.getItem(storageKey); } catch (_) { return null; } };
  const save = (v) => { try { localStorage.setItem(storageKey,v); } catch (_) {} };

  function injectSharedStyles(){
    if(document.getElementById('eb-shared-ui-styles'))return;
    const style=document.createElement('style');
    style.id='eb-shared-ui-styles';
    style.textContent=`
      .eb-back-to-top{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:18px;z-index:9997;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:10px 15px;border:1px solid rgba(38,61,64,.22);border-radius:999px;background:#263d40;color:#fff;box-shadow:0 8px 24px rgba(38,61,64,.2);font:700 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,bottom .2s ease}
      .eb-back-to-top:hover{transform:translateY(-2px);box-shadow:0 11px 28px rgba(38,61,64,.25)}
      .eb-back-to-top:focus-visible{outline:3px solid #d59b75;outline-offset:3px}
      .eb-back-to-top-arrow{font-size:17px;line-height:1}
      .eb-age-badge{display:inline-flex;align-items:center;align-self:flex-start;width:max-content;max-width:100%;margin:6px 0 3px;padding:4px 9px;border-radius:999px;background:#e9f1eb;color:#23433e;font-size:11px;line-height:1.25;font-weight:750;letter-spacing:.01em;white-space:nowrap}
      .home-book-card .eb-age-badge{margin-top:7px}
      .collection-book-info .eb-age-badge{margin-top:5px}
      .eb-age-detail{margin-top:8px!important}
      .eb-related-age{display:block;margin-top:4px;color:#48615c;font-size:11px;font-weight:700}
      @media(max-width:600px){.eb-back-to-top{right:max(12px,env(safe-area-inset-right));padding:10px 13px;font-size:11px}.eb-age-badge{font-size:10px;padding:4px 8px}}
      @media(prefers-reduced-motion:reduce){.eb-back-to-top{transition:none}.eb-back-to-top:hover{transform:none}}
    `;
    document.head.appendChild(style);
  }

  function syncBackToTopOffset(){
    if(!backToTopButton)return;
    const banner=document.getElementById('eb-consent-banner');
    if(banner && !banner.hidden){
      const h=Math.ceil(banner.getBoundingClientRect().height);
      backToTopButton.style.bottom=(h+16)+'px';
    }else backToTopButton.style.bottom='18px';
  }

  function createBackToTop(){
    if(backToTopButton||document.querySelector('.eb-back-to-top'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='eb-back-to-top';
    button.setAttribute('aria-label','Back to top');
    button.innerHTML='<span class="eb-back-to-top-arrow" aria-hidden="true">↑</span><span>Back to top</span>';
    button.addEventListener('click',()=>{
      const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top:0,left:0,behavior:reduce?'auto':'smooth'});
    });
    document.body.appendChild(button);
    backToTopButton=button;
    syncBackToTopOffset();
    window.addEventListener('resize',syncBackToTopOffset,{passive:true});
  }

  function cleanAgeRange(value){return String(value||'').replace(/^ages?\s*/i,'').trim();}
  function ageRangeFor(book){
    if(!book)return '';
    const explicit=cleanAgeRange(book.ageRange);
    return explicit||AGE_BY_SERIES[book.series]||'';
  }
  function makeAgeBadge(range){
    const badge=document.createElement('span');
    badge.className='book-age eb-age-badge';
    badge.textContent='Ages '+range;
    badge.setAttribute('aria-label','Recommended age: '+range+' years');
    return badge;
  }
  function addCardAge(card,book,headingSelector){
    if(!card||card.querySelector('.eb-age-badge'))return;
    const range=ageRangeFor(book);if(!range)return;
    const heading=card.querySelector(headingSelector);
    if(heading)heading.before(makeAgeBadge(range));
  }
  function addDetailAge(book){
    const range=ageRangeFor(book);if(!range)return;
    const copy=document.querySelector('.detail-copy');
    if(!copy||copy.querySelector('.eb-age-detail'))return;
    const p=document.createElement('p');
    p.className='detail-fact eb-age-detail';
    p.innerHTML='<strong>Recommended age:</strong> Ages '+range;
    const format=copy.querySelector('.detail-fact');
    const amazon=copy.querySelector('.primary-book-cta');
    if(format)format.before(p);else if(amazon)amazon.before(p);else copy.appendChild(p);
  }
  function addRelatedAges(byTitle){
    document.querySelectorAll('.related-card').forEach(card=>{
      if(card.querySelector('.eb-related-age'))return;
      const title=(card.querySelector('strong')?.textContent||'').trim();
      const book=byTitle.get(title.toLocaleLowerCase());
      const range=ageRangeFor(book);if(!range)return;
      const host=card.querySelector('.related-card-copy')||card;
      const age=document.createElement('span');age.className='eb-related-age';age.textContent='Ages '+range;host.appendChild(age);
    });
  }
  function decorateAgeRanges(entries){
    if(!Array.isArray(entries)||!entries.length)return;
    const byId=new Map(entries.map(book=>[book.id,book]));
    const byTitle=new Map(entries.map(book=>[String(book.title||'').toLocaleLowerCase(),book]));

    document.querySelectorAll('.home-book-card[data-book-id]').forEach(card=>{
      addCardAge(card,byId.get(card.dataset.bookId),'h3');
    });

    document.querySelectorAll('.collection-book').forEach(card=>{
      const id=card.querySelector('[data-vote-id]')?.dataset.voteId||card.querySelector('[data-book-id]')?.dataset.bookId||'';
      addCardAge(card,byId.get(id),'.collection-book-info h2');
    });

    let detailId=document.body.dataset.bookId||'';
    if(!detailId && /\/book\.html$/.test(location.pathname))detailId=new URLSearchParams(location.search).get('id')||'';
    if(detailId)addDetailAge(byId.get(detailId));
    addRelatedAges(byTitle);
  }
  function scheduleAgeDecoration(entries){
    if(ageDecoratePending)return;ageDecoratePending=true;
    requestAnimationFrame(()=>{ageDecoratePending=false;decorateAgeRanges(entries);});
  }
  function loadAndDecorateAges(){
    if(!catalogPromise)catalogPromise=fetch(catalogUrl,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json();});
    catalogPromise.then(entries=>{
      decorateAgeRanges(entries);
      if(!ageObserver){
        ageObserver=new MutationObserver(()=>scheduleAgeDecoration(entries));
        ageObserver.observe(document.body,{childList:true,subtree:true});
      }
    }).catch(()=>{});
  }

  function loadAnalytics() {
    if (!consentGranted || enabled || loading) return;
    loading = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js',new Date());
    window.gtag('config',measurementId,{send_page_view:true});
    const s=document.createElement('script');
    s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurementId);
    s.onload=()=>{enabled=true;};
    s.onerror=()=>{loading=false;};
    document.head.appendChild(s);
  }
  window.ebTrack=function(name,params){if(consentGranted && (loading || enabled) && typeof window.gtag==='function')window.gtag('event',name,params||{});};
  function hideBanner(){const el=document.getElementById('eb-consent-banner');if(el)el.hidden=true;requestAnimationFrame(syncBackToTopOffset);}
  function showBanner(){const el=document.getElementById('eb-consent-banner');if(el)el.hidden=false;requestAnimationFrame(syncBackToTopOffset);}
  function choose(accept) {
    const wasActive=loading || enabled;
    consentGranted=accept;
    save((accept?'yes':'no')+'|'+consentVersion);
    hideBanner();
    if(accept) loadAnalytics();
    else if (wasActive) {
      location.reload();
    }
  }
  function createUI(){
    injectSharedStyles();
    const banner=document.createElement('section');
    banner.id='eb-consent-banner';banner.className='eb-consent-banner';banner.hidden=true;
    banner.setAttribute('role','region');banner.setAttribute('aria-label','Analytics privacy choices');
    banner.innerHTML='<div class="eb-consent-content"><div><strong>Optional website analytics</strong><p>We use Google Analytics only if you agree, to understand visits and clicks to Amazon. You can decline and still use every feature. <a href="'+(/\/(books|collections|guides)\//.test(location.pathname)?'../':'')+'privacy.html">Privacy information</a>.</p></div><div class="eb-consent-actions"><button type="button" data-eb-choice="no">Reject analytics</button><button type="button" class="eb-accept" data-eb-choice="yes">Accept analytics</button></div></div>';
    document.body.appendChild(banner);
    banner.addEventListener('click',e=>{const b=e.target.closest('[data-eb-choice]');if(b)choose(b.dataset.ebChoice==='yes');});
    const footer=document.querySelector('footer');
    if(footer){const b=document.createElement('button');b.type='button';b.className='eb-privacy-button';b.textContent='Privacy settings';b.addEventListener('click',showBanner);footer.appendChild(b);}
    createBackToTop();
    loadAndDecorateAges();
    const saved=read();
    if(saved==='yes|'+consentVersion){consentGranted=true;loadAnalytics();}
    else if(saved!=='no|'+consentVersion)showBanner();
    else syncBackToTopOffset();
  }
  document.addEventListener('click',function(e){
    const a=e.target.closest('a[href]');
    if(!a || !consentGranted || !(loading || enabled) || typeof window.gtag!=='function')return;
    let u;try{u=new URL(a.href,location.href);}catch(_){return;}
    if(!/(^|\.)amazon\.[a-z.]+$/i.test(u.hostname))return;
    const slug=location.pathname.match(/\/books\/([a-z-]+)\.html$/);
    window.gtag('event','amazon_click',{
      book_id:a.dataset.bookId|| (slug?slug[1]:'homepage'),
      link_host:u.hostname,
      link_type:/\/dp\//.test(u.pathname)?'book_product':'author_page',
      transport_type:'beacon'
    });
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createUI);
  else createUI();
})();

/* Load the independent interior-preview module on every page that already uses the shared site script. */
(function(){
  const current=document.currentScript;
  const src=current&&current.src?new URL('book-preview.js',current.src).href:new URL('book-preview.js',location.href).href;
  if(document.querySelector('script[data-eb-book-preview]'))return;
  const script=document.createElement('script');
  script.src=src;
  script.defer=true;
  script.dataset.ebBookPreview='true';
  document.head.appendChild(script);
})();

/* Normalize age/status presentation on every book detail page. */
(function(){
  const current=document.currentScript;
  const src=current&&current.src?new URL('detail-page-meta.js',current.src).href:new URL('detail-page-meta.js',location.href).href;
  if(document.querySelector('script[data-eb-detail-meta]'))return;
  const script=document.createElement('script');
  script.src=src;
  script.defer=true;
  script.dataset.ebDetailMeta='true';
  document.head.appendChild(script);
})();
