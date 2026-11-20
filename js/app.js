const PACKAGES = [
  {id:'solo',name:'Solo Portrait & Birthday Session',cat:'Portraits',price:45000,img:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',desc:'One look, clean backdrop, 10 retouched photos. Perfect for birthdays & solo portraits.'},
  {id:'glam',name:'Deluxe Glam & Multi-Outfit Shoot',cat:'Portraits',price:85000,img:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',desc:'Up to 4 outfit changes, glam touch-up, 25 retouched photos.'},
  {id:'corp',name:'Executive & Corporate Headshots',cat:'Corporate',price:50000,img:'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=85',desc:'Studio headshots with brand-consistent lighting, 8 retouched photos.'},
  {id:'fam',name:'Family & Maternity Studio Session',cat:'Portraits',price:75000,img:'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=85',desc:'Family/maternity session, 20 retouched photos, props included.'},
  {id:'brand',name:'Fashion & Product Brand Lookbook',cat:'Brand & Events',price:120000,img:'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=85',desc:'Full lookbook shoot for brands/products, 40 retouched photos.'},
  {id:'retouch',name:'Express Retouched Edits & Reels Add-On',cat:'Brand & Events',price:25000,img:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85',desc:'Add-on: extra retouching + short reels edit.'},
];

const state = {
  added: new Set(),
  activeCat:'All',
  query:'',
  detailPkg:null,
  outfit:1,
  extra:0,
  floatVisible:false,
};

const PLACEHOLDER = 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#E7E5E0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6B6F76">Image unavailable</text></svg>');

function naira(n){return '₦'+n.toLocaleString('en-NG');}

function renderCards(){
  const grid=document.getElementById('cardGrid');
  const q=state.query.toLowerCase();
  const filtered=PACKAGES.filter(p=>{
    if(state.activeCat!=='All' && p.cat!==state.activeCat) return false;
    if(q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });
  grid.innerHTML=filtered.map(p=>{
    const added=state.added.has(p.id);
    return `<article class="pkg-card ${added?'alt':''}" data-id="${p.id}">
      <img class="pkg-img" src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER}'" width="900" height="675" />
      <div class="pkg-body">
        <div class="pkg-cat">${p.cat}</div>
        <div class="pkg-name">${p.name}</div>
        <div class="pkg-price">from ${naira(p.price)}</div>
        <button class="pkg-add ${added?'added':''}" data-add="${p.id}">${added?'✓ Added':'+ Add'}</button>
      </div>
    </article>`;
  }).join('');
  grid.querySelectorAll('.pkg-card').forEach(c=>{
    c.addEventListener('click',e=>{
      if(e.target.closest('[data-add]')) return;
      openDetail(c.dataset.id);
    });
  });
  grid.querySelectorAll('[data-add]').forEach(b=>{
    b.addEventListener('click',e=>{
      e.stopPropagation();
      toggleAdd(b.dataset.add);
    });
  });
}

function toggleAdd(id){
  if(state.added.has(id)) state.added.delete(id); else state.added.add(id);
  updateFloat();
  renderCards();
}

function updateFloat(){
  const bar=document.getElementById('floatBar');
  const count=state.added.size;
  const total=[...state.added].reduce((s,id)=>s+PACKAGES.find(p=>p.id===id).price,0);
  document.getElementById('floatText').textContent=`${count} package${count===1?'':'s'} · ${naira(total)} — Reserve Shoot →`;
  if(count>0){bar.classList.add('show');bar.setAttribute('aria-hidden','false');}
  else{bar.classList.remove('show');bar.setAttribute('aria-hidden','true');}
}

function openDetail(id){
  const p=PACKAGES.find(x=>x.id===id);
  state.detailPkg=p;
  state.outfit=1; state.extra=0;
  renderSheet();
  document.getElementById('sheetOverlay').classList.add('show');
  document.getElementById('detailSheet').classList.add('show');
}
function closeDetail(){
  document.getElementById('sheetOverlay').classList.remove('show');
  document.getElementById('detailSheet').classList.remove('show');
}
function totalForDetail(){
  const p=state.detailPkg;
  const outfitExtra=(state.outfit-1)*8000;
  const extraMap={0:0,5:12000,10:22000,20:38000};
  return p.price+outfitExtra+(extraMap[state.extra]||0);
}
function renderSheet(){
  const p=state.detailPkg;
  const body=document.getElementById('sheetBody');
  body.innerHTML=`
    <img src="${p.img}" alt="${p.name}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'" width="900" height="506" />
    <h3>${p.name}</h3>
    <div class="sheet-price">from ${naira(p.price)}</div>
    <div class="sheet-desc">${p.desc}</div>
    <div class="stepper-row">
      <span class="label">Outfit Changes (1–4)</span>
      <div class="stepper">
        <button class="step-btn" id="outfitMinus">−</button>
        <span class="step-val" id="outfitVal">${state.outfit}</span>
        <button class="step-btn" id="outfitPlus">+</button>
      </div>
    </div>
    <div style="margin-top:12px;font-size:13px;font-weight:600;color:var(--muted)">Extra Retouched Photos</div>
    <div class="extra-opts">
      <button class="extra-opt ${state.extra===0?'active':''}" data-extra="0">Base</button>
      <button class="extra-opt ${state.extra===5?'active':''}" data-extra="5">+5</button>
      <button class="extra-opt ${state.extra===10?'active':''}" data-extra="10">+10</button>
      <button class="extra-opt ${state.extra===20?'active':''}" data-extra="20">+20</button>
    </div>
    <div class="sheet-total"><span class="label">Total</span><span class="val" id="sheetTotal">${naira(totalForDetail())}</span></div>
    <button class="pkg-add" style="margin-top:14px" id="sheetAddBtn">${state.added.has(p.id)?'✓ Added':'+ Add to booking'}</button>
  `;
  document.getElementById('outfitMinus').onclick=()=>{if(state.outfit>1){state.outfit--;renderSheet();}};
  document.getElementById('outfitPlus').onclick=()=>{if(state.outfit<4){state.outfit++;renderSheet();}};
  body.querySelectorAll('[data-extra]').forEach(b=>b.onclick=()=>{state.extra=+b.dataset.extra;renderSheet();});
  document.getElementById('sheetAddBtn').onclick=()=>{
    state.added.add(p.id);
    updateFloat();renderCards();closeDetail();
  };
}

function openDrawer(){
  const count=state.added.size;
  const total=[...state.added].reduce((s,id)=>s+PACKAGES.find(p=>p.id===id).price,0);
  const names=[...state.added].map(id=>PACKAGES.find(p=>p.id===id).name).join(', ');
  document.getElementById('drawerSummary').textContent=`${count} package${count===1?'':'s'}: ${names} — ${naira(total)}`;
  document.getElementById('drawerOverlay').classList.add('show');
  document.getElementById('bookingDrawer').classList.add('show');
}
function closeDrawer(){
  document.getElementById('drawerOverlay').classList.remove('show');
  document.getElementById('bookingDrawer').classList.remove('show');
}

function sendWhatsApp(){
  const name=document.getElementById('bName').value.trim();
  const phone=document.getElementById('bPhone').value.trim();
  const dt=document.getElementById('bDateTime').value;
  const names=[...state.added].map(id=>PACKAGES.find(p=>p.id===id).name).join(', ');
  const total=[...state.added].reduce((s,id)=>s+PACKAGES.find(p=>p.id===id).price,0);
  const msg=`Hi Mastodon Photo Studio! I'd like to book a shoot.\nName: ${name}\nPhone: ${phone}\nPreferred: ${dt}\nPackages: ${names}\nTotal: ${naira(total)}`;
  const url='https://wa.me/2348137277619?text='+encodeURIComponent(msg);
  window.open(url,'_blank');
}

function setChapter(i){
  document.querySelectorAll('.chapter-pill').forEach((p,idx)=>p.classList.toggle('active',idx===i));
  document.querySelectorAll('.chapter-panel').forEach((p,idx)=>p.classList.toggle('active',idx===i));
}
document.querySelectorAll('.chapter-pill').forEach(p=>p.addEventListener('click',()=>setChapter(+p.dataset.chapter)));

const chapterSection=document.getElementById('chapters');
function updateChapterOnScroll(){
  if(!chapterSection) return;
  const rect=chapterSection.getBoundingClientRect();
  const vh=window.innerHeight;
  const total=chapterSection.offsetHeight - vh*0.5;
  let progress=(vh*0.5 - rect.top)/Math.max(total,1);
  progress=Math.min(1,Math.max(0,progress));
  const idx=Math.min(2,Math.floor(progress*3));
  setChapter(idx);
}
let ticking=false;
window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>{updateChapterOnScroll();ticking=false;});}}, {passive:true});
updateChapterOnScroll();

window.addEventListener('load',()=>{
  setTimeout(()=>{
    const s=document.getElementById('splash');
    s.classList.add('exit');
    setTimeout(()=>{s.style.display='none';},700);
  },1100);
});

document.addEventListener('DOMContentLoaded',()=>{
  renderCards();
  document.getElementById('catChips').addEventListener('click',e=>{
    const b=e.target.closest('.cat-chip'); if(!b) return;
    state.activeCat=b.dataset.cat;
    document.querySelectorAll('.cat-chip').forEach(c=>c.classList.toggle('active',c===b));
    renderCards();
  });
  document.getElementById('searchInput').addEventListener('input',e=>{state.query=e.target.value;renderCards();});
  document.getElementById('sheetOverlay').addEventListener('click',closeDetail);
  document.getElementById('floatBtn').addEventListener('click',openDrawer);
  document.getElementById('drawerOverlay').addEventListener('click',closeDrawer);
  document.getElementById('sendWaBtn').addEventListener('click',sendWhatsApp);
  document.getElementById('getStartedBtn').addEventListener('click',()=>document.getElementById('packages').scrollIntoView({behavior:'smooth'}));
  document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{
    const v=c.dataset.chip.toLowerCase();
    if(v.includes('birthday')){state.activeCat='Birthday';}
    else if(v.includes('corporate')){state.activeCat='Corporate';}
    else if(v.includes('brand')){state.activeCat='Brand & Events';}
    else{state.activeCat='All';}
    document.querySelectorAll('.cat-chip').forEach(x=>x.classList.toggle('active',x.dataset.cat===state.activeCat));
    renderCards();
    document.getElementById('packages').scrollIntoView({behavior:'smooth'});
  }));
});
