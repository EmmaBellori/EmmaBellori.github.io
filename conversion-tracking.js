/* Emma Bellori Books — conversion context tracking for GA4.
   Persists campaign context during a visit and emits enriched Amazon click events.
   Event delivery still respects the consent gate in analytics-consent.js via window.ebTrack. */
(function(){
  'use strict';

  const SESSION_KEY='eb-attribution-v1';
  const UTM_KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];

  function safeHost(value){
    try{return new URL(value,location.href).hostname.replace(/^www\./,'').slice(0,100);}catch{return '';}
  }

  function readSession(){
    try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'{}')||{};}catch{return {};}
  }

  function writeSession(value){
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(value));}catch{}
  }

  function captureAttribution(){
    const params=new URLSearchParams(location.search);
    const current={};
    for(const key of UTM_KEYS){
      const value=params.get(key);
      if(value)current[key]=value.slice(0,100);
    }
    const saved=readSession();
    const hasUtm=Object.keys(current).length>0;
    if(hasUtm){
      const next={...saved,...current,landing_path:location.pathname,referrer_host:safeHost(document.referrer),captured_at:Date.now()};
      writeSession(next);return next;
    }
    if(Object.keys(saved).length)return saved;
    const next={landing_path:location.pathname,referrer_host:safeHost(document.referrer),captured_at:Date.now()};
    writeSession(next);return next;
  }

  const attribution=captureAttribution();

  function pageType(){
    const path=location.pathname;
    if(/\/guides\//.test(path))return 'guide';
    if(/\/books\//.test(path)||/\/book\.html$/.test(path))return 'book';
    if(/\/collections\//.test(path))return 'collection';
    if(/privacy\.html$/.test(path))return 'privacy';
    return 'homepage';
  }

  function sourcePage(){
    const path=location.pathname.replace(/\/$/,'');
    if(!path)return 'homepage';
    const file=path.split('/').pop()||'homepage';
    return file.replace(/\.html$/,'').slice(0,100);
  }

  function collectionName(anchor){
    const section=anchor.closest('[data-series-name]');
    if(section&&section.dataset.seriesName)return section.dataset.seriesName.slice(0,100);
    const hero=document.querySelector('.collection-hero h1');
    if(hero)return hero.textContent.trim().slice(0,100);
    const eyebrow=document.querySelector('.detail-copy .eyebrow');
    if(eyebrow)return eyebrow.textContent.trim().slice(0,100);
    return '';
  }

  function placement(anchor){
    if(anchor.dataset.placement)return anchor.dataset.placement.slice(0,100);
    if(anchor.classList.contains('primary-book-cta'))return 'book_primary_cta';
    if(anchor.classList.contains('home-card-amazon'))return 'homepage_book_card';
    if(anchor.classList.contains('collection-buy'))return 'collection_book_card';
    if(anchor.closest('.hero'))return 'homepage_hero';
    if(anchor.closest('.home-amazon-band'))return 'homepage_amazon_band';
    if(anchor.closest('footer'))return 'footer';
    if(anchor.closest('.guide-wrap'))return 'guide_body';
    return 'other';
  }

  function bookId(anchor){
    if(anchor.dataset.bookId)return anchor.dataset.bookId.slice(0,100);
    const tagged=anchor.closest('[data-book-id]');
    if(tagged&&tagged.dataset.bookId)return tagged.dataset.bookId.slice(0,100);
    const match=location.pathname.match(/\/books\/([a-z0-9-]+)\.html$/i);
    if(match)return match[1].slice(0,100);
    return 'author_page';
  }

  document.addEventListener('click',function(event){
    const anchor=event.target.closest('a[href]');
    if(!anchor)return;
    let url;try{url=new URL(anchor.href,location.href);}catch{return;}
    if(!/(^|\.)amazon\.[a-z.]+$/i.test(url.hostname))return;
    if(typeof window.ebTrack!=='function')return;

    const payload={
      book_id:bookId(anchor),
      page_type:pageType(),
      source_page:sourcePage(),
      placement:placement(anchor),
      collection:collectionName(anchor),
      link_host:url.hostname.slice(0,100),
      link_type:/\/dp\//.test(url.pathname)?'book_product':'author_page',
      landing_path:String(attribution.landing_path||'').slice(0,100),
      referrer_host:String(attribution.referrer_host||'').slice(0,100),
      utm_source:String(attribution.utm_source||'').slice(0,100),
      utm_medium:String(attribution.utm_medium||'').slice(0,100),
      utm_campaign:String(attribution.utm_campaign||'').slice(0,100),
      utm_content:String(attribution.utm_content||'').slice(0,100),
      transport_type:'beacon'
    };
    window.ebTrack('amazon_click_context',payload);
  },true);
})();
