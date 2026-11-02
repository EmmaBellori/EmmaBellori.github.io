/* Emma Bellori Books — Free Activity Club signup.
   Signup works independently from analytics consent and stores only the data submitted to the server. */
(function(){
  'use strict';
  const ENDPOINT='https://hsrmqwneuadoomqakzfs.supabase.co/functions/v1/join-activity-club';
  const SITE_KEY='0x4AAAAAAFYRKxv3YSSQ6sQI';
  const ATTRIBUTION_KEY='eb-attribution-v1';
  let widgetId=null,token='',loadingTurnstile=false;

  function pageType(){
    if(/\/guides\//.test(location.pathname))return 'guide';
    if(/\/books\//.test(location.pathname)||/\/book\.html$/.test(location.pathname))return 'book';
    if(/\/collections\//.test(location.pathname))return 'collection';
    return 'homepage';
  }
  function sourcePage(){
    const clean=location.pathname.replace(/\/$/,'');
    if(!clean)return 'homepage';
    return (clean.split('/').pop()||'homepage').replace(/\.html$/,'').slice(0,100);
  }
  function attribution(){
    try{return JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY)||'{}')||{};}catch{return {};}
  }
  function injectStyles(){
    if(document.getElementById('eb-activity-club-styles'))return;
    const style=document.createElement('style');
    style.id='eb-activity-club-styles';
    style.textContent=`
      .eb-club{max-width:980px;margin:44px auto;padding:30px;border:1px solid #e7ddd1;border-radius:24px;background:#fff8ef;box-shadow:0 14px 40px rgba(38,61,64,.06)}
      .eb-club-inner{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.8fr);gap:28px;align-items:center}
      .eb-club .eyebrow{margin:0 0 8px;letter-spacing:.12em;text-transform:uppercase;font-size:.76rem;font-weight:800;color:#53605e}
      .eb-club h2{margin:0 0 10px;font-size:clamp(1.55rem,3vw,2.15rem);line-height:1.15;color:#263d40}
      .eb-club p{margin:0 0 10px;line-height:1.6;color:#425452}
      .eb-club-benefits{margin:14px 0 0;padding-left:20px;color:#425452}
      .eb-club-benefits li{margin:6px 0}
      .eb-club-form{display:grid;gap:10px;padding:18px;border-radius:18px;background:#fff;border:1px solid #eadfd2}
      .eb-club-form label{font-size:.88rem;font-weight:750;color:#2d4544}
      .eb-club-form input[type=email]{width:100%;min-height:46px;padding:11px 13px;border:1px solid #cfc4b7;border-radius:12px;font:inherit;background:#fff;color:#243b3b}
      .eb-club-form input[type=email]:focus{outline:3px solid rgba(20,109,120,.18);border-color:#146d78}
      .eb-club-consent{display:flex;gap:9px;align-items:flex-start;font-size:.78rem;line-height:1.45;color:#596764}
      .eb-club-consent input{margin-top:3px}
      .eb-club-consent a{color:#365c59;font-weight:700}
      .eb-club-turnstile{min-height:65px}
      .eb-club-submit{min-height:46px;border:0;border-radius:999px;background:#263d40;color:#fff;font:750 14px/1 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer;padding:12px 18px}
      .eb-club-submit:disabled{opacity:.55;cursor:not-allowed}
      .eb-club-status{min-height:20px;margin:0!important;font-size:.82rem!important;font-weight:650}
      .eb-club-status.is-success{color:#24603d}.eb-club-status.is-error{color:#9b3b35}
      .eb-club-note{font-size:.72rem!important;color:#6a7572!important;margin:0!important}
      @media(max-width:760px){.eb-club{margin:34px 20px;padding:22px}.eb-club-inner{grid-template-columns:1fr}.eb-club-form{padding:16px}}
    `;
    document.head.appendChild(style);
  }
  function ensureTurnstile(callback){
    if(window.turnstile){callback();return;}
    if(loadingTurnstile){const wait=setInterval(()=>{if(window.turnstile){clearInterval(wait);callback();}},150);setTimeout(()=>clearInterval(wait),7000);return;}
    loadingTurnstile=true;
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.defer=true;script.async=true;
    script.onload=()=>{loadingTurnstile=false;callback();};
    script.onerror=()=>{loadingTurnstile=false;const status=document.querySelector('.eb-club-status');if(status){status.textContent='Security verification could not load. Please refresh and try again.';status.className='eb-club-status is-error';}};
    document.head.appendChild(script);
  }
  function renderWidget(){
    const host=document.querySelector('.eb-club-turnstile');
    const submit=document.querySelector('.eb-club-submit');
    if(!host||!window.turnstile||widgetId!==null)return;
    widgetId=window.turnstile.render(host,{sitekey:SITE_KEY,theme:'light',callback(value){token=value;submit.disabled=false;},'expired-callback'(){token='';submit.disabled=true;},'error-callback'(){token='';submit.disabled=true;}});
  }
  function markup(){
    const privacy=/\/guides\//.test(location.pathname)?'../privacy.html':'privacy.html';
    return `<section class="eb-club" aria-labelledby="eb-club-title"><div class="eb-club-inner"><div><p class="eyebrow">FREE ACTIVITY CLUB</p><h2 id="eb-club-title">One useful idea for families, delivered simply.</h2><p>Join the Emma Bellori Free Activity Club for occasional printable activities, practical family ideas and new free guides connected to the themes in the books.</p><ul class="eb-club-benefits"><li>Free family activities and printable ideas</li><li>New guides about feelings, friendship, learning and bedtime</li><li>Occasional new-book updates — no daily emails</li></ul></div><form class="eb-club-form" novalidate><label for="eb-club-email">Email address</label><input id="eb-club-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required><label class="eb-club-consent"><input name="consent" type="checkbox" required><span>I agree to receive Emma Bellori Books emails and understand I can unsubscribe at any time. See the <a href="${privacy}">privacy information</a>.</span></label><div class="eb-club-turnstile"></div><button class="eb-club-submit" type="submit" disabled>Join the Free Activity Club →</button><p class="eb-club-status" role="status" aria-live="polite"></p><p class="eb-club-note">Your email is used only for this mailing list. Purchases remain on Amazon or Payhip.</p></form></div></section>`;
  }
  function insert(){
    if(document.querySelector('.eb-club'))return;
    const isGuide=/\/guides\//.test(location.pathname);
    if(!isGuide && !/\/(?:index\.html)?$/.test(location.pathname))return;
    injectStyles();
    const wrapper=document.createElement('div');wrapper.innerHTML=markup();const club=wrapper.firstElementChild;
    if(isGuide){
      const main=document.querySelector('main');
      if(!main)return;
      main.insertAdjacentElement('afterend',club);
    }else{
      const guides=document.querySelector('#parenting-guides');
      if(!guides)return;
      guides.insertAdjacentElement('afterend',club);
    }
    const form=club.querySelector('.eb-club-form');
    const status=club.querySelector('.eb-club-status');
    const submit=club.querySelector('.eb-club-submit');
    form.addEventListener('submit',async event=>{
      event.preventDefault();status.textContent='';status.className='eb-club-status';
      const email=form.email.value.trim();const consent=form.consent.checked;
      if(!email||!form.email.checkValidity()||!consent){status.textContent='Enter a valid email and confirm the mailing-list consent.';status.className='eb-club-status is-error';return;}
      if(!token){status.textContent='Complete the security verification first.';status.className='eb-club-status is-error';return;}
      submit.disabled=true;submit.textContent='Joining…';
      const attr=attribution();
      try{
        const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,consent:true,turnstileToken:token,sourcePage:sourcePage(),pageType:pageType(),utmSource:attr.utm_source||'',utmMedium:attr.utm_medium||'',utmCampaign:attr.utm_campaign||''})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok||data.success!==true)throw Error(data.error||'We could not save your signup.');
        form.email.value='';form.consent.checked=false;status.textContent='Welcome — your signup has been saved.';status.className='eb-club-status is-success';
        if(typeof window.ebTrack==='function')window.ebTrack('newsletter_signup',{source_page:sourcePage(),page_type:pageType(),utm_source:String(attr.utm_source||'').slice(0,100),utm_campaign:String(attr.utm_campaign||'').slice(0,100)});
      }catch(error){status.textContent=error.message||'We could not save your signup. Please try again.';status.className='eb-club-status is-error';}
      finally{token='';submit.textContent='Join the Free Activity Club →';submit.disabled=true;if(window.turnstile&&widgetId!==null)try{window.turnstile.reset(widgetId);}catch{}}
    });
    ensureTurnstile(renderWidget);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',insert,{once:true});else insert();
})();
