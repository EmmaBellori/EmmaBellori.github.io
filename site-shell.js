/* Emma Bellori Books — shared navigation, mobile menu, active states and editorial footer. */
(function(){
  'use strict';
  if(window.__emmaSiteShellLoaded)return;
  window.__emmaSiteShellLoaded=true;

  function injectStyles(){
    if(document.getElementById('eb-site-shell-styles'))return;
    const style=document.createElement('style');
    style.id='eb-site-shell-styles';
    style.textContent=`
      .site-header{transition:padding .18s ease,box-shadow .18s ease,background .18s ease}
      .site-header .brand-logo,.site-header .brand-label{transition:transform .18s ease,font-size .18s ease,width .18s ease,height .18s ease}
      .site-header.is-compact{padding-top:7px!important;padding-bottom:7px!important;box-shadow:0 7px 22px rgba(38,61,64,.1)!important;background:rgba(255,250,243,.99)!important}
      .site-header.is-compact .brand-logo{width:46px!important;height:46px!important}
      .site-header.is-compact .brand-label{font-size:23px!important}
      .site-header nav a{position:relative}
      .site-header nav a[aria-current="page"]{color:#1f4f53}
      .site-header nav a[aria-current="page"]::after{content:"";position:absolute;left:4px;right:4px;bottom:3px;height:2px;border-radius:2px;background:#b56d5c}
      .eb-menu-toggle{display:none;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:8px 12px;border:1px solid #b9c4bf;border-radius:999px;background:#fff;color:#27474a;font:750 12px/1 system-ui,-apple-system,Segoe UI,sans-serif}
      .eb-menu-icon{display:grid;gap:4px;width:17px}.eb-menu-icon span{display:block;height:2px;border-radius:2px;background:currentColor}
      .eb-site-footer{max-width:none!important;margin:0!important;padding:0!important;background:#233e43;color:#f8f4ed;font-size:13px!important}
      .eb-footer-inner{max-width:1180px;margin:0 auto;padding:38px 28px 25px;display:grid;grid-template-columns:minmax(250px,1.45fr) repeat(3,minmax(140px,.7fr));gap:34px}
      .eb-footer-brand{display:flex;align-items:center;gap:12px;margin-bottom:12px}.eb-footer-brand img{width:54px;height:54px;object-fit:contain}.eb-footer-brand strong{display:block;font:700 22px/1.1 Georgia,serif}.eb-footer-brand span{display:block;margin-top:4px;color:#cedbd7;font-size:10px;letter-spacing:.14em}
      .eb-footer-about{max-width:340px;margin:0;color:#d8e2df;line-height:1.55}
      .eb-footer-column h2{margin:0 0 10px;color:#fff;font:700 12px/1.2 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.12em}
      .eb-footer-column a,.eb-footer-column button{display:block;width:max-content;max-width:100%;margin:7px 0;padding:0;border:0;background:none;color:#dce6e3;text-decoration:none;font:600 12px/1.45 system-ui,sans-serif;text-align:left}
      .eb-footer-column a:hover,.eb-footer-column button:hover{text-decoration:underline;color:#fff}
      .eb-footer-bottom{max-width:1180px;margin:0 auto;padding:17px 28px 24px;border-top:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;color:#bfcfca;font-size:11px}
      @media(max-width:760px){
        .site-header{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:10px!important}
        .site-header .brand{min-width:0}.site-header .brand-label{font-size:21px!important}.site-header .brand-label>span{font-size:7.5px!important;letter-spacing:1.15px!important}
        .eb-menu-toggle{display:inline-flex}
        .site-header nav{display:none!important;grid-column:1/-1;width:100%;padding:8px 0 3px;gap:3px!important}
        .site-header nav.is-open{display:grid!important;grid-template-columns:1fr 1fr}
        .site-header nav a{display:flex!important;justify-content:flex-start;min-height:42px!important;padding:9px 10px!important;border-radius:10px}
        .site-header nav a:hover{background:#eef3ef;text-decoration:none}
        .site-header nav a[aria-current="page"]{background:#e9f0eb}.site-header nav a[aria-current="page"]::after{display:none}
        .site-header.is-compact .brand-logo{width:42px!important;height:42px!important}.site-header.is-compact .brand-label{font-size:20px!important}
        .eb-footer-inner{grid-template-columns:1fr 1fr;padding:31px 20px 22px;gap:26px 18px}.eb-footer-intro{grid-column:1/-1}.eb-footer-bottom{padding:15px 20px 22px}
      }
      @media(max-width:440px){.site-header nav.is-open{grid-template-columns:1fr}.eb-footer-inner{grid-template-columns:1fr}.eb-footer-intro{grid-column:auto}}
      @media(prefers-reduced-motion:reduce){.site-header,.site-header .brand-logo,.site-header .brand-label{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function activeKey(){
    const p=location.pathname;
    if(/\/guides\//.test(p))return 'guides';
    if(/\/collections\//.test(p))return 'collections';
    if(/\/books\//.test(p)||/\/book\.html$/.test(p))return 'collections';
    if(location.hash==='#latest')return 'latest';
    if(location.hash==='#books')return 'collections';
    if(location.hash==='#parenting-guides')return 'guides';
    if(location.hash==='#about')return 'about';
    return 'start';
  }

  function decorateHeader(){
    const header=document.querySelector('.site-header');if(!header)return;
    const brand=header.querySelector('.brand');
    if(brand){
      brand.href='/';
      const logo=brand.querySelector('.brand-logo');if(logo)logo.alt='Emma Bellori Books';
      const label=brand.querySelector('.brand-label');
      if(label)label.innerHTML='Emma Bellori Books<span>BOOKS FOR CURIOUS MINDS</span>';
    }
    let nav=header.querySelector('nav');
    if(!nav){nav=document.createElement('nav');header.appendChild(nav);}
    nav.id='eb-site-nav';nav.setAttribute('aria-label','Main navigation');
    nav.innerHTML='<a data-nav="start" href="/#start-here">Start here</a><a data-nav="latest" href="/#latest">Latest releases</a><a data-nav="collections" href="/#books">Collections</a><a data-nav="guides" href="/#parenting-guides">Free guides</a><a data-nav="about" href="/#about">About</a>';
    const key=activeKey();nav.querySelector('[data-nav="'+key+'"]').setAttribute('aria-current','page');

    let toggle=header.querySelector('.eb-menu-toggle');
    if(!toggle){
      toggle=document.createElement('button');toggle.type='button';toggle.className='eb-menu-toggle';toggle.setAttribute('aria-controls','eb-site-nav');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open site menu');toggle.innerHTML='<span class="eb-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span><span>Menu</span>';
      header.insertBefore(toggle,nav);
    }
    const close=()=>{nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open site menu');};
    toggle.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close site menu':'Open site menu');});
    nav.addEventListener('click',close);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    window.addEventListener('resize',()=>{if(innerWidth>760)close();},{passive:true});

    const syncCompact=()=>header.classList.toggle('is-compact',window.scrollY>70);
    syncCompact();window.addEventListener('scroll',syncCompact,{passive:true});
  }

  function decorateFooter(){
    const footer=document.querySelector('footer');if(!footer)return;
    const privacyButton=footer.querySelector('.eb-privacy-button');
    footer.classList.add('eb-site-footer');
    footer.innerHTML='<div class="eb-footer-inner"><div class="eb-footer-intro"><a class="eb-footer-brand" href="/"><img src="/images/emma-bellori-logo.webp" alt="Emma Bellori Books"><span><strong>Emma Bellori Books</strong><span>BOOKS FOR CURIOUS MINDS</span></span></a><p class="eb-footer-about">Illustrated children\'s stories, learning adventures and creative books designed to spark curiosity, confidence and imagination.</p></div><div class="eb-footer-column"><h2>Explore</h2><a href="/#start-here">Start here</a><a href="/#latest">Latest releases</a><a href="/#books">Collections</a><a href="/#parenting-guides">Free guides</a></div><div class="eb-footer-column"><h2>Emma Bellori</h2><a href="/#about">About</a><a href="https://www.amazon.com/author/emmabellori" target="_blank" rel="noopener noreferrer">Amazon Author Page ↗</a><a href="https://emma-bellori.author-pages.com/" target="_blank" rel="noopener noreferrer">BookBub ↗</a></div><div class="eb-footer-column eb-footer-info"><h2>Info</h2><a href="/privacy.html">Privacy & analytics</a><a href="mailto:emmabelloribooks@outlook.com">Contact</a></div></div><div class="eb-footer-bottom"><span>© '+new Date().getFullYear()+' Emma Bellori Books</span><span>Independent author website · Purchases completed on Amazon</span></div>';
    if(privacyButton){const host=footer.querySelector('.eb-footer-info');if(host)host.appendChild(privacyButton);}
  }

  function init(){injectStyles();decorateHeader();decorateFooter();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
