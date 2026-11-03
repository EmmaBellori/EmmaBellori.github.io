/* Emma Bellori Books — Free Activity Club signup.
   Signup works independently from analytics consent and stores only the data submitted to the server. */
(function(){
  'use strict';
  const ENDPOINT='https://hsrmqwneuadoomqakzfs.supabase.co/functions/v1/join-activity-club';
  const SITE_KEY='0x4AAAAAAFYRKxv3YSSQ6sQI';
  const ATTRIBUTION_KEY='eb-attribution-v1';
  const KLAVIYO_PUBLIC_KEY='YdseTx';
  const KLAVIYO_LIST_ID='Rv2JJy';
  const KLAVIYO_ENDPOINT=`https://a.klaviyo.com/client/subscriptions/?company_id=${encodeURIComponent(KLAVIYO_PUBLIC_KEY)}`;
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
  async function requestKlaviyoDoubleOptIn(email){
    const response=await fetch(KLAVIYO_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json','revision':'2025-01-15'},
      body:JSON.stringify({
        data:{
          type:'subscription',
          attributes:{
            custom_source:'Emma Bellori Free Activity Club',
            profile:{data:{type:'profile',attributes:{
              email,
              subscriptions:{email:{marketing:{consent:'SUBSCRIBED'}}}
            }}}
          },
          relationships:{list:{data:{type:'list',id:KLAVIYO_LIST_ID}}}
        }
      })
    });
    if(!response.ok)throw Error('Your request was saved, but we could not send the confirmation email. Please try again.');
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
      .eb-club-note{font-size:.75rem!important;color:#6a7572!important;margin:0!important}
      .eb-club-action{min-width:0}
      .eb-club [hidden]{display:none!important}
      .eb-club-success{padding:26px 22px;border-radius:20px;background:#fff;border:1px solid #d8e5dc;box-shadow:0 10px 30px rgba(38,61,64,.07)}
      .eb-club-success-icon{width:46px;height:46px;display:grid;place-items:center;margin-bottom:14px;border-radius:50%;background:#e2f0e5;color:#23603f;font-size:1.5rem;font-weight:800}
      .eb-club-success h3{font:normal 1.8rem/1.15 Georgia,serif;color:#263d40;margin:0 0 12px}
      .eb-club-success h3:focus{outline:none}
      .eb-club-success strong{overflow-wrap:anywhere}
      .eb-club-next-steps{margin:15px 0 16px;padding-left:22px;color:#425452;line-height:1.7}
      .eb-club-next-steps li{padding-left:3px;margin:5px 0}
      .eb-club-success .eb-club-success-help{font-size:.84rem;color:#586e68}
      .eb-club-success-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px}
      .eb-club-success-link{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;min-height:44px;padding:11px 17px;background:#263d40;color:white;border-radius:24px;font-size:.86rem;font-weight:750}
      .eb-club-success-link:hover{background:#3d5b5d}
      .eb-club-try-again{background:transparent;border:0;padding:10px 0;color:#365c59;text-decoration:underline;font-size:.82rem;font-weight:650;cursor:pointer}
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
    const guides=/\/guides\//.test(location.pathname)?'./':'guides/';
    return `<section class="eb-club" aria-labelledby="eb-club-title"><div class="eb-club-inner"><div><p class="eyebrow">FREE ACTIVITY CLUB</p><h2 id="eb-club-title">A little inspiration for growing minds.</h2><p>Get practical family ideas, free guides and occasional printable activities. Friendly support for the little moments that matter.</p><ul class="eb-club-benefits"><li>Free family activities and printable ideas</li><li>New guides about feelings, friendship, learning and bedtime</li><li>Occasional new-book updates — no daily emails</li></ul></div><div class="eb-club-action"><form class="eb-club-form" novalidate><label for="eb-club-email">Email address</label><input id="eb-club-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required><label class="eb-club-consent"><input name="consent" type="checkbox" required><span>I agree to receive Emma Bellori Books emails and understand I can unsubscribe at any time. See the <a href="${privacy}">privacy information</a>.</span></label><div class="eb-club-turnstile"></div><button class="eb-club-submit" type="submit" disabled>Get free family ideas →</button><p class="eb-club-status" role="status" aria-live="polite"></p><p class="eb-club-note">Free to join. Confirm your email to finish signing up; unsubscribe whenever you wish.</p></form><section class="eb-club-success" hidden aria-labelledby="eb-club-success-heading">
      <div class="eb-club-success-icon" aria-hidden="true">✉</div>
      <p class="eyebrow">Almost there</p>
      <h3 id="eb-club-success-heading" tabindex="-1">Check your inbox</h3>
      <p>We sent a confirmation email to <strong class="eb-club-success-email"></strong>.</p>
      <ol class="eb-club-next-steps"><li>Open the email from Emma Bellori Books.</li><li>Tap <strong>Confirm my subscription</strong>.</li><li>Enjoy the free guides while your welcome email arrives.</li></ol>
      <p class="eb-club-success-help">No email? Check Spam or Promotions. You are not subscribed until you confirm.</p>
      <div class="eb-club-success-actions"><a class="eb-club-success-link" href="${guides}">Browse free family guides →</a><button class="eb-club-try-again" type="button">Use another email</button></div>
    </section></div></div></section>`;
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
    const success=club.querySelector('.eb-club-success');
    success.querySelector('.eb-club-try-again').addEventListener('click',()=>{
      success.hidden=true;form.hidden=false;status.textContent='';status.className='eb-club-status';
      form.email.focus();
    });
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
        await requestKlaviyoDoubleOptIn(email);
        form.email.value='';form.consent.checked=false;
        success.querySelector('.eb-club-success-email').textContent=email;
        form.hidden=true;success.hidden=false;success.querySelector('h3').focus();
        status.textContent='Confirmation email requested.';status.className='eb-club-status is-success';
        if(typeof window.ebTrack==='function')window.ebTrack('newsletter_signup',{source_page:sourcePage(),page_type:pageType(),signup_stage:'double_opt_in_requested',utm_source:String(attr.utm_source||'').slice(0,100),utm_campaign:String(attr.utm_campaign||'').slice(0,100)});
      }catch(error){status.textContent=error.message||'We could not save your signup. Please try again.';status.className='eb-club-status is-error';}
      finally{token='';submit.textContent='Get free family ideas →';submit.disabled=true;if(window.turnstile&&widgetId!==null)try{window.turnstile.reset(widgetId);}catch{}}
    });
    ensureTurnstile(renderWidget);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',insert,{once:true});else insert();
})();
