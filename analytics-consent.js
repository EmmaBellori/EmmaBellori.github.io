/* Emma Bellori Books — optional GA4 analytics. No GA script or cookie before consent. */
(function () {
  'use strict';
  const measurementId = 'G-PJDVFZV1QG';
  const storageKey = 'emma_bellori_analytics_consent_v1';
  const consentVersion = '2026-10-13';
  let enabled = false;
  let loading = false;
  const read = () => { try { return localStorage.getItem(storageKey); } catch (_) { return null; } };
  const save = (v) => { try { localStorage.setItem(storageKey,v); } catch (_) {} };
  function loadAnalytics() {
    if (enabled || loading) return;
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
  window.ebTrack=function(name,params){if(loading && typeof window.gtag==='function')window.gtag('event',name,params||{});};
  function hideBanner(){const el=document.getElementById('eb-consent-banner');if(el)el.hidden=true;}
  function showBanner(){const el=document.getElementById('eb-consent-banner');if(el)el.hidden=false;}
  function choose(accept) {
    save((accept?'yes':'no')+'|'+consentVersion);
    hideBanner();
    if(accept) loadAnalytics();
    else if (loading) { // GA was already loaded in this page view; reload to ensure no further tracking.
      location.reload();
    }
  }
  function createUI(){
    const banner=document.createElement('section');
    banner.id='eb-consent-banner';banner.className='eb-consent-banner';banner.hidden=true;
    banner.setAttribute('role','region');banner.setAttribute('aria-label','Analytics privacy choices');
    banner.innerHTML='<div class="eb-consent-content"><div><strong>Optional website analytics</strong><p>We use Google Analytics only if you agree, to understand visits and clicks to Amazon. You can decline and still use every feature. <a href="'+(location.pathname.includes('/books/')?'../':'')+'privacy.html">Privacy information</a>.</p></div><div class="eb-consent-actions"><button type="button" data-eb-choice="no">Reject analytics</button><button type="button" class="eb-accept" data-eb-choice="yes">Accept analytics</button></div></div>';
    document.body.appendChild(banner);
    banner.addEventListener('click',e=>{const b=e.target.closest('[data-eb-choice]');if(b)choose(b.dataset.ebChoice==='yes');});
    const footer=document.querySelector('footer');
    if(footer){const b=document.createElement('button');b.type='button';b.className='eb-privacy-button';b.textContent='Privacy settings';b.addEventListener('click',showBanner);footer.appendChild(b);}
    const saved=read();
    if(saved==='yes|'+consentVersion)loadAnalytics();
    else if(saved!=='no|'+consentVersion)showBanner();
  }
  document.addEventListener('click',function(e){
    const a=e.target.closest('a[href]');
    if(!a || !loading || typeof window.gtag!=='function')return;
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
