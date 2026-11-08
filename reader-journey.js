/* Accessible book-finder filters and one-page print activity. No data leaves the browser. */
(function(){
 'use strict';
 const root=document.querySelector('[data-eb-book-finder]');
 if(root){
  const topic=root.querySelector('#eb-filter-topic');
  const age=root.querySelector('#eb-filter-age');
  const search=root.querySelector('#eb-filter-search');
  const cards=[...root.querySelectorAll('[data-eb-finder-card]')];
  const count=root.querySelector('#eb-result-count');
  const empty=root.querySelector('#eb-finder-empty');
  const params=new URLSearchParams(location.search);
  if(['feelings','discovery','creative'].includes(params.get('topic')))topic.value=params.get('topic');
  const initialAge=params.get('age')||'';
  if([...age.options].some(o=>o.value===initialAge))age.value=initialAge;
  const initialSearch=(params.get('q')||'').slice(0,80);search.value=initialSearch;
  function apply(track){
   const selectedTopic=topic.value;
   const selectedAge=age.value;
   const query=search.value.toLocaleLowerCase().trim();
   let found=0;
   cards.forEach(card=>{
    const subjects=(card.dataset.topics||'').split(/\s+/);
    const thematic=!selectedTopic||subjects.includes(selectedTopic);
    const ages=selectedAge.split('-').map(Number);
    const lower=Number(card.dataset.ageFrom||0),upper=Number(card.dataset.ageTo||0);
    const inAge=!selectedAge||(ages.length===2&&ages.every(Number.isFinite)&&lower<=ages[1]&&upper>=ages[0]);
    const searchable=(card.dataset.search||'').toLocaleLowerCase().includes(query);
    const match=thematic&&inAge&&searchable;card.hidden=!match;if(match)found++;
   });
   count.textContent=found===1?'1 available book matches your choices':found+' available books match your choices';
   empty.hidden=found>0;
   const next=new URL(location.href);
   [['topic',selectedTopic],['age',selectedAge],['q',search.value.trim().slice(0,80)]].forEach(([k,v])=>{if(v)next.searchParams.set(k,v);else next.searchParams.delete(k);});
   history.replaceState(null,'',next.pathname+next.search+next.hash);
   if(track&&typeof window.ebTrack==='function')window.ebTrack('book_finder_filter',{filter_topic:selectedTopic||'all',filter_age:selectedAge||'all',has_query:Boolean(query),result_count:found});
  }
  [topic,age].forEach(input=>input.addEventListener('change',()=>apply(true)));
  let lastTimer;
  search.addEventListener('input',()=>{clearTimeout(lastTimer);apply(false);lastTimer=setTimeout(()=>apply(true),650);});
  root.querySelector('#eb-clear-filters')?.addEventListener('click',()=>{topic.value='';age.value='';search.value='';apply(true);search.focus();});
  apply(false);
 }
 document.querySelectorAll('[data-eb-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-placement]');
  if(!link || /(amazon|payhip)\./.test(link.hostname))return;
  if(typeof window.ebTrack==='function')window.ebTrack('reader_journey_click',{placement:(link.dataset.placement||'').slice(0,80),destination:new URL(link.href).pathname.slice(0,100)});
 },true);
})();
