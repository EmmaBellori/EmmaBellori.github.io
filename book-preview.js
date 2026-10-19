/* Emma Bellori Books — data-driven interior preview UI.
   Preview images can live in catalog.json or in supplemental preview manifests.
   Cards use arrows on the cover itself; detail pages keep the larger Inside the book gallery. */
(function(){
  'use strict';
  if(window.__emmaBookPreviewLoaded)return;
  window.__emmaBookPreviewLoaded=true;

  const currentScript=document.currentScript;
  const sourceUrl=currentScript&&currentScript.src?currentScript.src:location.href;
  const catalogUrl=new URL('catalog.json',sourceUrl).href;
  const previewManifestUrl=new URL('book-previews.json',sourceUrl).href;
  const previewBatchUrl=new URL('book-previews-batch-32.json',sourceUrl).href;
  const littleMoneyManifestUrl=new URL('book-previews-little-money.json',sourceUrl).href;
  const catalogBase=new URL('.',catalogUrl);
  let dialog=null;
  let activeImages=[];
  let activeIndex=0;
  let observer=null;
  let decoratePending=false;

  function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function absoluteSrc(src){try{return new URL(String(src||'').trim(),catalogBase).href;}catch{return '';}}
  function normalizedImages(book){
    if(!book||!Array.isArray(book.previewImages))return [];
    return book.previewImages.slice(0,3).map((item,index)=>{
      const raw=typeof item==='string'?{src:item}:item;
      if(!raw||typeof raw.src!=='string'||!raw.src.trim())return null;
      const src=absoluteSrc(raw.src);if(!src)return null;
      const alt=typeof raw.alt==='string'&&raw.alt.trim()?raw.alt.trim():'Interior preview '+(index+1)+' of '+book.title;
      return {src,alt};
    }).filter(Boolean);
  }
  function coverSlide(book){
    const src=absoluteSrc(book&&book.cover);if(!src)return null;
    return {src,alt:'Cover of '+book.title};
  }
  function cardSlides(book){
    const previews=normalizedImages(book);if(!previews.length)return [];
    const cover=coverSlide(book);
    return cover?[cover,...previews]:previews;
  }

  function mergePreviewManifest(entries,manifest){
    if(!manifest||typeof manifest!=='object')return entries;
    return entries.map(book=>{
      if(Array.isArray(book.previewImages)&&book.previewImages.length)return book;
      const images=manifest[book.id];
      return Array.isArray(images)&&images.length?Object.assign({},book,{previewImages:images}):book;
    });
  }
  function appendManifestOnlyEntries(entries,manifest){
    if(!manifest||typeof manifest!=='object')return entries;
    const result=entries.slice();
    const seen=new Set(result.map(book=>book&&book.id).filter(Boolean));
    for(const [id,images] of Object.entries(manifest)){
      if(seen.has(id)||!Array.isArray(images)||!images.length)continue;
      result.push({id,title:id,previewImages:images});
      seen.add(id);
    }
    return result;
  }
  function enrichBookFromCard(book,card){
    if(!book||!card)return book;
    const enriched=Object.assign({},book);
    const title=(card.querySelector('h3,h2')?.textContent||'').trim();
    if(!enriched.title||enriched.title===enriched.id)enriched.title=title||enriched.id;
    const image=card.querySelector('img');
    if(!enriched.cover&&image)enriched.cover=image.currentSrc||image.getAttribute('src')||'';
    return enriched;
  }

  function injectStyles(){
    if(document.getElementById('eb-book-preview-styles'))return;
    const style=document.createElement('style');
    style.id='eb-book-preview-styles';
    style.textContent=`
      .eb-cover-carousel{position:relative;min-width:0}
      .eb-cover-carousel>.home-cover-wrap{display:block;width:100%}
      .collection-cover-wrap.eb-cover-carousel-host{position:relative}
      .eb-cover-arrow{position:absolute;top:50%;z-index:6;display:grid;place-items:center;width:38px;height:46px;padding:0;border:1px solid rgba(38,61,64,.18);border-radius:999px;background:rgba(255,255,255,.94);color:#263d40;box-shadow:0 5px 16px rgba(30,49,50,.15);font:700 25px/1 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer;transform:translateY(-50%);transition:background .16s ease,transform .16s ease,box-shadow .16s ease}
      .eb-cover-arrow:hover{background:#fff;box-shadow:0 7px 20px rgba(30,49,50,.2)}
      .eb-cover-arrow:focus-visible{outline:3px solid #d59b75;outline-offset:2px}
      .eb-cover-prev{left:7px}.eb-cover-next{right:7px}
      .eb-cover-counter{position:absolute;left:50%;bottom:8px;z-index:5;transform:translateX(-50%);display:inline-flex;align-items:center;justify-content:center;min-width:42px;min-height:23px;padding:3px 8px;border-radius:999px;background:rgba(38,61,64,.82);color:#fff;font:750 10px/1 system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:.02em;pointer-events:none}
      .eb-cover-carousel .home-cover-wrap img,.collection-cover-wrap.eb-cover-carousel-host img{object-fit:contain!important;object-position:center!important}
      .eb-inside-preview{margin-top:28px;padding:24px;border:1px solid #e6ded5;border-radius:18px;background:#fffdf9}
      .eb-inside-preview .eyebrow{margin-top:0}.eb-inside-preview h2{margin:4px 0 7px}.eb-inside-preview>p:not(.eyebrow){margin:0 0 16px;color:#61716f}
      .eb-inside-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .eb-inside-thumb{display:flex;align-items:center;justify-content:center;min-width:0;min-height:180px;padding:8px;border:1px solid #e1d9cf;border-radius:12px;background:#f8f4ed;cursor:zoom-in;overflow:hidden}
      .eb-inside-thumb img{display:block;width:100%;height:100%;max-height:330px;object-fit:contain;object-position:center}
      .eb-inside-thumb:focus-visible{outline:3px solid #d59b75;outline-offset:3px}
      .eb-preview-dialog{width:min(960px,calc(100% - 28px));max-width:960px;padding:0;border:0;border-radius:20px;background:#fffdf9;color:#263d40;box-shadow:0 28px 90px rgba(20,39,42,.34);overflow:hidden}
      .eb-preview-dialog::backdrop{background:rgba(22,39,42,.72);backdrop-filter:blur(2px)}
      .eb-preview-dialog-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:18px 20px 13px;border-bottom:1px solid #e9e2d8}
      .eb-preview-dialog-header p{margin:0 0 3px;color:#a46f65;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.eb-preview-dialog-header h2{margin:0;font:normal clamp(1.25rem,3vw,1.7rem)/1.18 Georgia,serif}
      .eb-preview-close{flex:0 0 auto;width:42px;height:42px;border:1px solid #d6dedb;border-radius:50%;background:white;color:#263d40;font-size:23px;line-height:1;cursor:pointer}.eb-preview-close:hover{background:#eef4f0}.eb-preview-close:focus-visible{outline:3px solid #d59b75;outline-offset:2px}
      .eb-preview-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:min(64vh,650px);padding:18px 64px;background:#f5f0e8}
      .eb-preview-main{display:block;max-width:100%;width:auto;max-height:64vh;object-fit:contain;box-shadow:0 8px 24px rgba(31,47,48,.12);background:white}
      .eb-preview-nav{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:48px;border:1px solid #ccd7d3;border-radius:999px;background:rgba(255,255,255,.94);color:#263d40;font-size:25px;cursor:pointer}.eb-preview-nav:hover{background:white}.eb-preview-nav:focus-visible{outline:3px solid #d59b75;outline-offset:2px}.eb-preview-prev{left:12px}.eb-preview-next{right:12px}
      .eb-preview-footer{padding:12px 18px 18px}.eb-preview-count{margin:0 0 9px;text-align:center;color:#61716f;font-size:11px;font-weight:700}
      .eb-preview-thumbs{display:flex;justify-content:center;gap:9px;overflow-x:auto}.eb-preview-thumb{flex:0 0 72px;height:88px;padding:4px;border:2px solid transparent;border-radius:9px;background:#f1ede6;cursor:pointer}.eb-preview-thumb.is-active{border-color:#53716c}.eb-preview-thumb img{width:100%;height:100%;object-fit:contain}.eb-preview-thumb:focus-visible{outline:3px solid #d59b75;outline-offset:2px}
      @media(max-width:700px){.eb-cover-arrow{width:36px;height:44px}.eb-cover-prev{left:5px}.eb-cover-next{right:5px}.eb-inside-preview{padding:18px 15px}.eb-inside-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.eb-inside-thumb{min-height:150px}.eb-preview-stage{min-height:55vh;padding:14px 48px}.eb-preview-main{max-height:58vh}.eb-preview-nav{width:38px;height:44px}.eb-preview-prev{left:6px}.eb-preview-next{right:6px}}
      @media(max-width:430px){.eb-cover-arrow{width:34px;height:42px;font-size:22px}.eb-cover-counter{bottom:6px}.eb-inside-grid{grid-template-columns:1fr}.eb-inside-thumb{min-height:220px}.eb-preview-stage{padding:12px 42px}.eb-preview-dialog-header{padding:15px 15px 11px}.eb-preview-footer{padding:10px 12px 14px}}
      @media(prefers-reduced-motion:reduce){.eb-cover-arrow{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function ensureDialog(){
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.className='eb-preview-dialog';
    dialog.setAttribute('aria-labelledby','eb-preview-title');
    dialog.innerHTML=`<div class="eb-preview-dialog-header"><div><p>LOOK INSIDE</p><h2 id="eb-preview-title">Interior preview</h2></div><button type="button" class="eb-preview-close" aria-label="Close interior preview">×</button></div><div class="eb-preview-stage"><button type="button" class="eb-preview-nav eb-preview-prev" aria-label="Previous preview image">‹</button><img class="eb-preview-main" alt=""><button type="button" class="eb-preview-nav eb-preview-next" aria-label="Next preview image">›</button></div><div class="eb-preview-footer"><p class="eb-preview-count" aria-live="polite"></p><div class="eb-preview-thumbs" aria-label="Preview pages"></div></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('.eb-preview-close').addEventListener('click',()=>dialog.close());
    dialog.querySelector('.eb-preview-prev').addEventListener('click',()=>setActiveImage(activeIndex-1));
    dialog.querySelector('.eb-preview-next').addEventListener('click',()=>setActiveImage(activeIndex+1));
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'){event.preventDefault();setActiveImage(activeIndex-1);}
      if(event.key==='ArrowRight'){event.preventDefault();setActiveImage(activeIndex+1);}
    });
    return dialog;
  }

  function setActiveImage(index){
    if(!activeImages.length)return;
    activeIndex=(index+activeImages.length)%activeImages.length;
    const modal=ensureDialog();
    const image=activeImages[activeIndex];
    const main=modal.querySelector('.eb-preview-main');
    main.src=image.src;main.alt=image.alt;
    modal.querySelector('.eb-preview-count').textContent='Preview '+(activeIndex+1)+' of '+activeImages.length;
    modal.querySelectorAll('.eb-preview-thumb').forEach((button,i)=>{button.classList.toggle('is-active',i===activeIndex);button.setAttribute('aria-current',i===activeIndex?'true':'false');});
    const hasMultiple=activeImages.length>1;
    modal.querySelector('.eb-preview-prev').hidden=!hasMultiple;
    modal.querySelector('.eb-preview-next').hidden=!hasMultiple;
  }

  function openPreview(book,startIndex=0){
    const images=normalizedImages(book);if(!images.length)return;
    activeImages=images;activeIndex=0;
    const modal=ensureDialog();
    modal.querySelector('#eb-preview-title').textContent=book.title;
    const thumbs=modal.querySelector('.eb-preview-thumbs');
    thumbs.innerHTML=images.map((image,index)=>'<button type="button" class="eb-preview-thumb" data-preview-index="'+index+'" aria-label="Show preview '+(index+1)+'"><img src="'+escapeHTML(image.src)+'" alt=""></button>').join('');
    thumbs.querySelectorAll('[data-preview-index]').forEach(button=>button.addEventListener('click',()=>setActiveImage(Number(button.dataset.previewIndex))));
    setActiveImage(Math.max(0,Math.min(startIndex,images.length-1)));
    modal.showModal();
  }

  function setCardSlide(carousel,index){
    const slides=carousel._ebSlides||[];if(!slides.length)return;
    const next=(index+slides.length)%slides.length;
    carousel.dataset.ebSlideIndex=String(next);
    const image=carousel.querySelector('img');if(!image)return;
    image.src=slides[next].src;image.alt=slides[next].alt;
    const counter=carousel.querySelector('.eb-cover-counter');if(counter)counter.textContent=(next+1)+' / '+slides.length;
  }

  function addCarouselControls(carousel,book){
    if(carousel.querySelector('.eb-cover-arrow'))return;
    const slides=cardSlides(book);if(slides.length<2)return;
    carousel._ebSlides=slides;carousel.dataset.ebSlideIndex='0';
    if(!carousel.querySelector('img')){
      const placeholder=carousel.querySelector('.cover-placeholder');
      const image=document.createElement('img');image.loading='lazy';image.decoding='async';image.src=slides[0].src;image.alt=slides[0].alt;
      if(placeholder)placeholder.replaceWith(image);else carousel.prepend(image);
    }
    const previous=document.createElement('button');
    previous.type='button';previous.className='eb-cover-arrow eb-cover-prev';previous.setAttribute('aria-label','Previous image for '+book.title);previous.textContent='‹';
    const next=document.createElement('button');
    next.type='button';next.className='eb-cover-arrow eb-cover-next';next.setAttribute('aria-label','Next image for '+book.title);next.textContent='›';
    const counter=document.createElement('span');counter.className='eb-cover-counter';counter.textContent='1 / '+slides.length;counter.setAttribute('aria-hidden','true');
    const move=delta=>event=>{event.preventDefault();event.stopPropagation();setCardSlide(carousel,Number(carousel.dataset.ebSlideIndex||0)+delta);};
    previous.addEventListener('click',move(-1));next.addEventListener('click',move(1));
    carousel.append(previous,next,counter);
  }

  function decorateHomeCard(card,book){
    book=enrichBookFromCard(book,card);
    if(!book||!normalizedImages(book).length)return;
    card.querySelectorAll('.eb-preview-trigger').forEach(node=>node.remove());
    if(card.querySelector('.eb-cover-carousel'))return;
    const cover=card.querySelector('.home-cover-wrap');if(!cover)return;
    const carousel=document.createElement('div');carousel.className='eb-cover-carousel';
    cover.before(carousel);carousel.appendChild(cover);addCarouselControls(carousel,book);
  }

  function decorateCollectionCard(card,book){
    book=enrichBookFromCard(book,card);
    if(!book||!normalizedImages(book).length)return;
    card.querySelectorAll('.eb-preview-trigger').forEach(node=>node.remove());
    const cover=card.querySelector('.collection-cover-wrap');if(!cover||cover.classList.contains('eb-cover-carousel-host'))return;
    cover.classList.add('eb-cover-carousel-host');addCarouselControls(cover,book);
  }

  function addCardCarousels(entries){
    const byId=new Map(entries.map(book=>[book.id,book]));
    document.querySelectorAll('.home-book-card[data-book-id]').forEach(card=>decorateHomeCard(card,byId.get(card.dataset.bookId)));
    document.querySelectorAll('.collection-book').forEach(card=>{
      const id=card.querySelector('[data-vote-id]')?.dataset.voteId||card.querySelector('[data-book-id]')?.dataset.bookId||'';
      decorateCollectionCard(card,byId.get(id));
    });
  }

  function detailBookId(){
    if(document.body.dataset.bookId)return document.body.dataset.bookId;
    if(/\/book\.html$/.test(location.pathname))return new URLSearchParams(location.search).get('id')||'';
    return '';
  }

  function addDetailGallery(entries){
    if(document.querySelector('.eb-inside-preview'))return;
    const id=detailBookId();if(!id)return;
    const book=entries.find(item=>item.id===id);const images=normalizedImages(book);if(!images.length)return;
    const main=document.querySelector('.detail-main');if(!main)return;
    const section=document.createElement('section');
    section.className='eb-inside-preview';
    section.innerHTML='<p class="eyebrow">LOOK INSIDE</p><h2>Inside the book</h2><p>A small preview of the interior. Tap any page to view it larger.</p><div class="eb-inside-grid"></div>';
    const grid=section.querySelector('.eb-inside-grid');
    images.forEach((image,index)=>{
      const button=document.createElement('button');button.type='button';button.className='eb-inside-thumb';button.setAttribute('aria-label','Enlarge interior preview '+(index+1)+' of '+book.title);
      const img=document.createElement('img');img.src=image.src;img.alt=image.alt;img.loading='lazy';img.decoding='async';button.appendChild(img);
      button.addEventListener('click',()=>openPreview(book,index));grid.appendChild(button);
    });
    const about=main.querySelector('.v4-info');
    const related=main.querySelector('.related-section');
    if(about)about.after(section);else if(related)related.before(section);else main.appendChild(section);
  }

  function decorate(entries){
    document.querySelectorAll('.eb-preview-trigger').forEach(node=>node.remove());
    addCardCarousels(entries);addDetailGallery(entries);
  }
  function scheduleDecorate(entries){if(decoratePending)return;decoratePending=true;requestAnimationFrame(()=>{decoratePending=false;decorate(entries);});}

  function fetchJSON(url,fallback){return fetch(url,{cache:'no-store'}).then(r=>r.ok?r.json():fallback).catch(()=>fallback);}
  function init(){
    injectStyles();
    Promise.all([fetchJSON(catalogUrl,[]),fetchJSON(previewManifestUrl,{}),fetchJSON(previewBatchUrl,{}),fetchJSON(littleMoneyManifestUrl,{})]).then(([entries,manifest,batchManifest,littleMoneyManifest])=>{
      if(!Array.isArray(entries))return;
      entries=mergePreviewManifest(entries,manifest);
      entries=mergePreviewManifest(entries,batchManifest);
      entries=mergePreviewManifest(entries,littleMoneyManifest);
      entries=appendManifestOnlyEntries(entries,littleMoneyManifest);
      decorate(entries);
      observer=new MutationObserver(()=>scheduleDecorate(entries));
      observer.observe(document.body,{childList:true,subtree:true});
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();