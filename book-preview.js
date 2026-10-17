/* Emma Bellori Books — data-driven interior preview UI.
   Preview images can live in catalog.json or in book-previews.json. */
(function(){
  'use strict';
  if(window.__emmaBookPreviewLoaded)return;
  window.__emmaBookPreviewLoaded=true;

  const currentScript=document.currentScript;
  const sourceUrl=currentScript&&currentScript.src?currentScript.src:location.href;
  const catalogUrl=new URL('catalog.json',sourceUrl).href;
  const previewManifestUrl=new URL('book-previews.json',sourceUrl).href;
  const catalogBase=new URL('.',catalogUrl);
  let dialog=null;
  let activeImages=[];
  let activeIndex=0;
  let observer=null;
  let decoratePending=false;

  function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function normalizedImages(book){
    if(!book||!Array.isArray(book.previewImages))return [];
    return book.previewImages.slice(0,3).map((item,index)=>{
      const raw=typeof item==='string'?{src:item}:item;
      if(!raw||typeof raw.src!=='string'||!raw.src.trim())return null;
      let src='';
      try{src=new URL(raw.src.trim(),catalogBase).href;}catch{return null;}
      const alt=typeof raw.alt==='string'&&raw.alt.trim()?raw.alt.trim():'Interior preview '+(index+1)+' of '+book.title;
      return {src,alt};
    }).filter(Boolean);
  }

  function mergePreviewManifest(entries,manifest){
    if(!manifest||typeof manifest!=='object')return entries;
    return entries.map(book=>{
      if(Array.isArray(book.previewImages)&&book.previewImages.length)return book;
      const images=manifest[book.id];
      return Array.isArray(images)&&images.length?Object.assign({},book,{previewImages:images}):book;
    });
  }

  function injectStyles(){
    if(document.getElementById('eb-book-preview-styles'))return;
    const style=document.createElement('style');
    style.id='eb-book-preview-styles';
    style.textContent=`
      .eb-preview-trigger{display:inline-flex;align-items:center;justify-content:center;gap:6px;width:max-content;max-width:100%;min-height:40px;margin:7px 0 10px;padding:8px 12px;border:1px solid #9bada8;border-radius:999px;background:#fffdf9;color:#294b48;font:750 11px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer}
      .eb-preview-trigger:hover{background:#eef4f0}.eb-preview-trigger:focus-visible{outline:3px solid #d59b75;outline-offset:3px}
      .eb-preview-trigger span[aria-hidden="true"]{font-size:15px;line-height:1}
      .home-book-card .eb-preview-trigger{margin-top:2px;margin-bottom:10px}
      .collection-book-info .eb-preview-trigger{margin:7px 0 11px}
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
      @media(max-width:700px){.eb-inside-preview{padding:18px 15px}.eb-inside-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.eb-inside-thumb{min-height:150px}.eb-preview-stage{min-height:55vh;padding:14px 48px}.eb-preview-main{max-height:58vh}.eb-preview-nav{width:38px;height:44px}.eb-preview-prev{left:6px}.eb-preview-next{right:6px}}
      @media(max-width:430px){.eb-inside-grid{grid-template-columns:1fr}.eb-inside-thumb{min-height:220px}.eb-preview-stage{padding:12px 42px}.eb-preview-dialog-header{padding:15px 15px 11px}.eb-preview-footer{padding:10px 12px 14px}}
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

  function makeTrigger(book){
    const count=normalizedImages(book).length;
    const button=document.createElement('button');
    button.type='button';button.className='eb-preview-trigger';button.dataset.previewBookId=book.id;
    button.innerHTML='<span aria-hidden="true">▣</span><span>Preview inside'+(count>1?' ('+count+')':'')+'</span>';
    button.setAttribute('aria-label','Preview inside '+book.title);
    return button;
  }

  function addCardTriggers(entries){
    const byId=new Map(entries.map(book=>[book.id,book]));
    document.querySelectorAll('.home-book-card[data-book-id]').forEach(card=>{
      if(card.querySelector('.eb-preview-trigger'))return;
      const book=byId.get(card.dataset.bookId);if(!normalizedImages(book).length)return;
      const trigger=makeTrigger(book);
      const actions=card.querySelector('.home-card-actions');
      if(actions)actions.before(trigger);else(card.querySelector('h3')||card).after(trigger);
    });
    document.querySelectorAll('.collection-book').forEach(card=>{
      if(card.querySelector('.eb-preview-trigger'))return;
      const id=card.querySelector('[data-vote-id]')?.dataset.voteId||card.querySelector('[data-book-id]')?.dataset.bookId||'';
      const book=byId.get(id);if(!normalizedImages(book).length)return;
      const trigger=makeTrigger(book);
      const title=card.querySelector('.collection-book-info h2');
      if(title)title.after(trigger);else card.querySelector('.collection-book-info')?.appendChild(trigger);
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

  function decorate(entries){addCardTriggers(entries);addDetailGallery(entries);}
  function scheduleDecorate(entries){if(decoratePending)return;decoratePending=true;requestAnimationFrame(()=>{decoratePending=false;decorate(entries);});}

  function fetchJSON(url,fallback){return fetch(url,{cache:'no-store'}).then(r=>r.ok?r.json():fallback).catch(()=>fallback);}
  function init(){
    injectStyles();
    Promise.all([fetchJSON(catalogUrl,[]),fetchJSON(previewManifestUrl,{})]).then(([entries,manifest])=>{
      if(!Array.isArray(entries))return;
      entries=mergePreviewManifest(entries,manifest);
      decorate(entries);
      observer=new MutationObserver(()=>scheduleDecorate(entries));
      observer.observe(document.body,{childList:true,subtree:true});
      document.addEventListener('click',event=>{
        const trigger=event.target.closest('.eb-preview-trigger[data-preview-book-id]');if(!trigger)return;
        const book=entries.find(item=>item.id===trigger.dataset.previewBookId);if(book)openPreview(book,0);
      });
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
