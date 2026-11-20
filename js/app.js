const PACKAGES = [
  {id:'solo',name:'Solo Portrait & Birthday Session',cat:'Portraits',price:45000,img:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',desc:'One look, clean backdrop, 10 retouched photos. Perfect for birthdays & solo portraits.'},
  {id:'glam',name:'Deluxe Glam & Multi-Outfit Shoot',cat:'Birthday Glam',price:85000,img:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',desc:'Up to 4 outfit changes, glam touch-up, 25 retouched photos.'},
  {id:'corp',name:'Executive & Corporate Headshots',cat:'Corporate',price:50000,img:'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=85',desc:'Studio headshots with brand-consistent lighting, 8 retouched photos.'},
  {id:'fam',name:'Family & Maternity Studio Session',cat:'Maternity',price:75000,img:'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=85',desc:'Family/maternity session, 20 retouched photos, props included.'},
  {id:'brand',name:'Fashion & Brand Lookbook',cat:'Brand Lookbook',price:120000,img:'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=85',desc:'Full lookbook shoot for brands/products, 40 retouched photos.'},
];

const state = { added: new Set(), custom: {} };
const spatial = { idx:0, outfit:1, extra:0 };

const PLACEHOLDER = 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#E7E5E0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6B6F76">Image unavailable</text></svg>');

function naira(n){ return '₦'+Number(n).toLocaleString('en-NG'); }

// Splash
window.addEventListener('load', () => {
  setTimeout(() => {
    const s = document.getElementById('splash');
    if(!s) return;
    s.classList.add('exit');
    setTimeout(() => { s.style.display = 'none'; }, 700);
  }, 1100);
});

// ---------- 3D Stage ----------
function initStage(){
  const wrap = document.getElementById('stageCanvasWrap');
  const canvas = document.getElementById('stageCanvas');
  if(!wrap || !canvas) return;
  const S = { rotY:0.4, rotX:0.15, dragging:false, autoRotate:true, lastX:0, lastY:0 };
  function resize(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    canvas.width = Math.max(1, Math.floor(w*dpr));
    canvas.height = Math.max(1, Math.floor(h*dpr));
  }
  resize();
  window.addEventListener('resize', resize);

  wrap.addEventListener('pointerdown', e => { S.dragging=true; S.autoRotate=false; S.lastX=e.clientX; S.lastY=e.clientY; try{wrap.setPointerCapture(e.pointerId);}catch(err){} });
  window.addEventListener('pointermove', e => { if(!S.dragging) return; const dx=e.clientX-S.lastX, dy=e.clientY-S.lastY; S.rotY += dx*0.012; S.rotX += dy*0.008; S.rotX = Math.max(-0.6, Math.min(0.6, S.rotX)); S.lastX=e.clientX; S.lastY=e.clientY; });
  window.addEventListener('pointerup', () => { S.dragging=false; setTimeout(()=>{ S.autoRotate=true; }, 1500); });

  let gl = null;
  try { gl = canvas.getContext('webgl', {alpha:true, antialias:true}); } catch(e){ gl=null; }
  if(gl){
    try { runWebGL(gl, canvas, wrap, S, resize); return; }
    catch(err){ console.warn('WebGL init failed, fallback to 2D', err); }
  }
  run2D(canvas, wrap, S, resize);
}

function runWebGL(gl, canvas, wrap, S, resize){
  const vs = `
    attribute vec3 aPos;
    attribute vec4 aColor;
    attribute vec2 aUV;
    uniform float uRotY;
    uniform float uRotX;
    uniform mat4 uProj;
    varying vec4 vColor;
    varying vec2 vUV;
    void main(){
      float cy=cos(uRotY), sy=sin(uRotY);
      float cx=cos(uRotX), sx=sin(uRotX);
      vec3 p=aPos;
      float x=p.x*cy + p.z*sy;
      float z=-p.x*sy + p.z*cy;
      p=vec3(x,p.y,z);
      float y=p.y*cx - p.z*sx;
      z=p.y*sx + p.z*cx;
      p=vec3(p.x,y,z);
      gl_Position = uProj * vec4(p,1.0);
      vColor=aColor;
      vUV=aUV;
    }`;
  const fs = `
    precision mediump float;
    varying vec4 vColor;
    varying vec2 vUV;
    uniform float uTime;
    uniform sampler2D uTex;
    void main(){
      vec4 t = texture2D(uTex, vUV);
      vec3 col = vColor.rgb * (0.85 + 0.15*t.r);
      float rim = pow(1.0 - abs(vUV.x*2.0-1.0), 2.0) * 0.25;
      col += vec3(0.83,0.64,0.35)*rim*(0.7+0.3*sin(uTime*1.3));
      gl_FragColor = vec4(col, vColor.a);
    }`;
  function compile(type, src){ const sh=gl.createShader(type); gl.shaderSource(sh,src); gl.compileShader(sh); if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){ throw new Error(gl.getShaderInfoLog(sh)); } return sh; }
  const vsh=compile(gl.VERTEX_SHADER,vs), fsh=compile(gl.FRAGMENT_SHADER,fs);
  const prog=gl.createProgram(); gl.attachShader(prog,vsh); gl.attachShader(prog,fsh); gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){ throw new Error(gl.getProgramInfoLog(prog)); }
  gl.useProgram(prog);

  const uRotY=gl.getUniformLocation(prog,'uRotY');
  const uRotX=gl.getUniformLocation(prog,'uRotX');
  const uProj=gl.getUniformLocation(prog,'uProj');
  const uTime=gl.getUniformLocation(prog,'uTime');
  const uTex=gl.getUniformLocation(prog,'uTex');

  // texture UNSIGNED_BYTE
  const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex);
  const size=64; const data=new Uint8Array(size*size*4);
  for(let i=0;i<size*size;i++){ const v=Math.floor(120+Math.random()*60); data[i*4]=v; data[i*4+1]=Math.floor(v*.9); data[i*4+2]=Math.floor(v*.7); data[i*4+3]=255; }
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);

  const verts=[]; // each: p[3], c[4], uv[2]
  function tri(a,b,c){ verts.push(a,b,c); }
  const segs=48; const lensR=0.85;
  for(let i=0;i<segs;i++){
    const a1=(i/segs)*Math.PI*2, a2=((i+1)/segs)*Math.PI*2;
    tri({p:[0,0,0],c:[0.95,0.85,0.55,0.9],uv:[0.5,0.5]},
        {p:[Math.cos(a1)*lensR,Math.sin(a1)*lensR,0],c:[0.6,0.45,0.2,0.85],uv:[(Math.cos(a1)+1)/2,(Math.sin(a1)+1)/2]},
        {p:[Math.cos(a2)*lensR,Math.sin(a2)*lensR,0],c:[0.6,0.45,0.2,0.85],uv:[(Math.cos(a2)+1)/2,(Math.sin(a2)+1)/2]});
  }
  const apR=0.32;
  for(let i=0;i<segs;i++){
    const a1=(i/segs)*Math.PI*2, a2=((i+1)/segs)*Math.PI*2;
    tri({p:[0,0,0.02],c:[0.05,0.06,0.08,1],uv:[0.5,0.5]},
        {p:[Math.cos(a1)*apR,Math.sin(a1)*apR,0.02],c:[0.08,0.09,0.12,1],uv:[(Math.cos(a1)+1)/2,(Math.sin(a1)+1)/2]},
        {p:[Math.cos(a2)*apR,Math.sin(a2)*apR,0.02],c:[0.08,0.09,0.12,1],uv:[(Math.cos(a2)+1)/2,(Math.sin(a2)+1)/2]});
  }
  function quad(x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4,color){
    tri({p:[x1,y1,z1],c:color,uv:[0,0]},{p:[x2,y2,z2],c:color,uv:[1,0]},{p:[x3,y3,z3],c:color,uv:[1,1]});
    tri({p:[x1,y1,z1],c:color,uv:[0,0]},{p:[x3,y3,z3],c:color,uv:[1,1]},{p:[x4,y4,z4],c:color,uv:[0,1]});
  }
  const pa=0.30;
  quad(-1.5,-0.9,-0.3,-1.5,0.9,-0.3,-1.5,0.9,0.3,-1.5,-0.9,0.3,[0.83,0.64,0.35,pa]);
  quad(1.5,-0.9,-0.3,1.5,0.9,-0.3,1.5,0.9,0.3,1.5,-0.9,0.3,[0.37,0.7,0.79,pa]);
  quad(-0.9,1.2,-0.3,0.9,1.2,-0.3,0.9,1.2,0.3,-0.9,1.2,0.3,[0.83,0.64,0.35,pa]);
  quad(-0.9,-1.2,-0.3,0.9,-1.2,-0.3,0.9,-1.2,0.3,-0.9,-1.2,0.3,[0.37,0.7,0.79,pa]);
  const rimR=0.95;
  for(let i=0;i<segs;i++){
    const a1=(i/segs)*Math.PI*2, a2=((i+1)/segs)*Math.PI*2;
    tri({p:[Math.cos(a1)*rimR,Math.sin(a1)*rimR,0],c:[0.83,0.64,0.35,0.16],uv:[(Math.cos(a1)+1)/2,(Math.sin(a1)+1)/2]},
        {p:[Math.cos(a2)*rimR,Math.sin(a2)*rimR,0],c:[0.37,0.7,0.79,0.16],uv:[(Math.cos(a2)+1)/2,(Math.sin(a2)+1)/2]},
        {p:[0,0,0],c:[0.95,0.85,0.55,0.04],uv:[0.5,0.5]});
  }

  const pos=new Float32Array(verts.length*3);
  const col=new Float32Array(verts.length*4);
  const uv=new Float32Array(verts.length*2);
  verts.forEach((v,i)=>{ pos[i*3]=v.p[0];pos[i*3+1]=v.p[1];pos[i*3+2]=v.p[2]; col[i*4]=v.c[0];col[i*4+1]=v.c[1];col[i*4+2]=v.c[2];col[i*4+3]=v.c[3]; uv[i*2]=v.uv[0];uv[i*2+1]=v.uv[1]; });
  const posBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,posBuf); gl.bufferData(gl.ARRAY_BUFFER,pos,gl.STATIC_DRAW);
  const colBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,colBuf); gl.bufferData(gl.ARRAY_BUFFER,col,gl.STATIC_DRAW);
  const uvBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,uvBuf); gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
  const aPos=gl.getAttribLocation(prog,'aPos'); const aColor=gl.getAttribLocation(prog,'aColor'); const aUV=gl.getAttribLocation(prog,'aUV');

  function perspective(fovy,aspect,near,far){
    const f=1/Math.tan(fovy/2); const nf=1/(near-far);
    return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
  }

  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.039,0.043,0.051,1);

  function frame(t){
    resize();
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    if(S.autoRotate && !S.dragging){ S.rotY += 0.004; }
    gl.useProgram(prog);
    gl.uniform1f(uRotY, S.rotY);
    gl.uniform1f(uRotX, S.rotX);
    gl.uniform1f(uTime, t*0.001);
    const p=perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 10);
    const T=new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-3,1]);
    const R=new Float32Array(16);
    for(let c=0;c<4;c++) for(let r=0;r<4;r++){ let s=0; for(let k=0;k<4;k++) s += p[r + k*4]*T[k + c*4]; R[r+c*4]=s; }
    gl.uniformMatrix4fv(uProj,false,R);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,tex); gl.uniform1i(uTex,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,posBuf); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,colBuf); gl.enableVertexAttribArray(aColor); gl.vertexAttribPointer(aColor,4,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,uvBuf); gl.enableVertexAttribArray(aUV); gl.vertexAttribPointer(aUV,2,gl.FLOAT,false,0,0);
    gl.drawArrays(gl.TRIANGLES,0,verts.length);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function run2D(canvas, wrap, S, resize){
  const ctx = canvas.getContext('2d');
  function frame(t){
    resize();
    const w=canvas.width, h=canvas.height;
    ctx.fillStyle='#0A0B0D'; ctx.fillRect(0,0,w,h);
    const g=ctx.createRadialGradient(w*0.3,h*0.4,0,w*0.5,h*0.5,Math.max(w,h)*0.6);
    g.addColorStop(0,'rgba(212,163,89,0.14)'); g.addColorStop(1,'rgba(10,11,13,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    const g2=ctx.createRadialGradient(w*0.7,h*0.6,0,w*0.5,h*0.5,Math.max(w,h)*0.5);
    g2.addColorStop(0,'rgba(95,179,201,0.10)'); g2.addColorStop(1,'rgba(10,11,13,0)');
    ctx.fillStyle=g2; ctx.fillRect(0,0,w,h);
    if(S.autoRotate && !S.dragging){ S.rotY += 0.004; }
    const cx=w/2, cy=h/2, scale=Math.min(w,h)*0.34;
    ctx.save();
    ctx.translate(cx,cy);
    // panels
    const panels=[
      {x:-scale*1.5,y:0,w:scale*0.22,hh:scale*1.5,color:'rgba(212,163,89,0.22)'},
      {x:scale*1.28,y:0,w:scale*0.22,hh:scale*1.5,color:'rgba(95,179,201,0.22)'},
      {x:0,y:-scale*1.35,w:scale*1.5,hh:scale*0.22,color:'rgba(212,163,89,0.22)'},
      {x:0,y:scale*1.15,w:scale*1.5,hh:scale*0.22,color:'rgba(95,179,201,0.22)'},
    ];
    panels.forEach(pn=>{
      ctx.fillStyle=pn.color;
      ctx.fillRect(pn.x-pn.w/2, pn.y-pn.hh/2, pn.w, pn.hh);
    });
    ctx.restore();
    // lens
    const cosY=Math.cos(S.rotY);
    const rx=scale*(0.15+0.85*Math.abs(cosY));
    const lg=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*0.85);
    lg.addColorStop(0,'rgba(245,241,234,0.9)');
    lg.addColorStop(0.45,'rgba(212,163,89,0.6)');
    lg.addColorStop(1,'rgba(95,179,201,0.25)');
    ctx.fillStyle=lg;
    ctx.beginPath(); ctx.ellipse(cx,cy,rx,scale*0.85,0,0,Math.PI*2); ctx.fill();
    // aperture
    ctx.fillStyle='rgba(10,11,13,0.85)';
    ctx.beginPath(); ctx.ellipse(cx,cy,rx*0.38,scale*0.38,0,0,Math.PI*2); ctx.fill();
    // rim
    ctx.strokeStyle='rgba(212,163,89,0.45)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(cx,cy,rx*1.06,scale*0.9,0,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(95,179,201,0.35)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.ellipse(cx,cy,rx*1.12,scale*0.96,0,0,Math.PI*2); ctx.stroke();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------- Spatial carousel ----------
function totalSpatial(){
  const p=PACKAGES[spatial.idx];
  const outfitExtra=(spatial.outfit-1)*8000;
  const extraMap={0:0,5:12000,10:22000,20:38000};
  return p.price+outfitExtra+(extraMap[spatial.extra]||0);
}
function renderSpatial(){
  const p=PACKAGES[spatial.idx];
  const img=document.getElementById('spatialImg');
  img.src=p.img; img.alt=p.name;
  img.onerror=function(){ this.onerror=null; this.src=PLACEHOLDER; };
  document.getElementById('spatialCatLabel').textContent=p.cat;
  document.getElementById('spatialName').textContent=p.name;
  document.getElementById('spatialPrice').textContent='from '+naira(p.price);
  document.getElementById('spatialDesc').textContent=p.desc;
  document.getElementById('outfitVal').textContent=spatial.outfit;
  document.getElementById('spatialTotal').textContent=naira(totalSpatial());
  document.querySelectorAll('#extraOpts .extra-opt').forEach(b=>b.classList.toggle('active', +b.dataset.extra===spatial.extra));
  const dots=document.getElementById('spatialDots');
  dots.innerHTML=PACKAGES.map((_,i)=>`<span class="spatial-dot ${i===spatial.idx?'active':''}"></span>`).join('');
  document.querySelectorAll('.spatial-cat').forEach((b,i)=>b.classList.toggle('active', i===spatial.idx));
  const btn=document.getElementById('selectBtn');
  if(state.added.has(p.id)){ btn.textContent='✓ Selected'; btn.classList.add('selected'); }
  else { btn.textContent='Select Package'; btn.classList.remove('selected'); }
}
function spatialGo(i){ spatial.idx=(i+PACKAGES.length)%PACKAGES.length; spatial.outfit=1; spatial.extra=0; renderSpatial(); }

// ---------- Float / booking ----------
function bookedTotal(){ return [...state.added].reduce((s,id)=> s + (state.custom[id]?.total || PACKAGES.find(p=>p.id===id).price), 0); }
function updateFloat(){
  const bar=document.getElementById('floatBar');
  const count=state.added.size;
  const total=bookedTotal();
  document.getElementById('floatText').textContent=`${count} package${count===1?'':'s'} · ${naira(total)} — Reserve Shoot →`;
  if(count>0){ bar.classList.add('show'); bar.setAttribute('aria-hidden','false'); }
  else { bar.classList.remove('show'); bar.setAttribute('aria-hidden','true'); }
}
function openDrawer(){
  const count=state.added.size;
  const total=bookedTotal();
  const names=[...state.added].map(id=>{
    const p=PACKAGES.find(x=>x.id===id);
    const c=state.custom[id];
    let s=p.name;
    if(c){ s+=` (${c.outfit} outfit${c.outfit>1?'s':''}, +${c.extra} edits)`; }
    return s;
  }).join(', ');
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
  const names=[...state.added].map(id=>{
    const p=PACKAGES.find(x=>x.id===id);
    const c=state.custom[id];
    let s=p.name;
    if(c){ s+=` [${c.outfit} outfit${c.outfit>1?'s':''}, +${c.extra} retouched edits, ${naira(c.total)}]`; }
    return s;
  }).join(', ');
  const total=bookedTotal();
  const msg=`Hi Mastodon Photo Studio! I'd like to book a shoot.\nName: ${name}\nPhone: ${phone}\nPreferred: ${dt}\nPackages: ${names}\nTotal: ${naira(total)}`;
  const url='https://wa.me/2348137277619?text='+encodeURIComponent(msg);
  window.open(url,'_blank');
}

// ---------- Chapters parallax ----------
let ticking=false;
function updateParallax(){
  document.querySelectorAll('.chapter-panel').forEach(panel=>{
    const rect=panel.getBoundingClientRect();
    const vh=window.innerHeight;
    const progress=(vh - rect.top)/(vh+rect.height);
    const bg=panel.querySelector('.chapter-bg');
    if(bg) bg.style.setProperty('--py', ((progress-0.5)*80)+'px');
  });
}
window.addEventListener('scroll',()=>{ if(!ticking){ ticking=true; requestAnimationFrame(()=>{ updateParallax(); ticking=false; }); } }, {passive:true});

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  initStage();
  renderSpatial();

  // spatial nav
  document.getElementById('spatialPrev').addEventListener('click', ()=>spatialGo(spatial.idx-1));
  document.getElementById('spatialNext').addEventListener('click', ()=>spatialGo(spatial.idx+1));
  document.querySelectorAll('.spatial-cat').forEach((b,i)=>b.addEventListener('click', ()=>spatialGo(i)));
  // outfit steppers
  document.getElementById('outfitMinus').addEventListener('click', ()=>{ if(spatial.outfit>1){ spatial.outfit--; renderSpatial(); } });
  document.getElementById('outfitPlus').addEventListener('click', ()=>{ if(spatial.outfit<4){ spatial.outfit++; renderSpatial(); } });
  // extra opts
  document.getElementById('extraOpts').addEventListener('click', e=>{
    const b=e.target.closest('.extra-opt'); if(!b) return;
    spatial.extra=+b.dataset.extra; renderSpatial();
  });
  // select
  document.getElementById('selectBtn').addEventListener('click', ()=>{
    const p=PACKAGES[spatial.idx];
    state.custom[p.id]={ outfit:spatial.outfit, extra:spatial.extra, total:totalSpatial() };
    state.added.add(p.id);
    updateFloat(); renderSpatial();
  });

  // swipe
  const stage=document.getElementById('spatialStage');
  let sx=0, sy=0, swiping=false;
  stage.addEventListener('touchstart', e=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; swiping=true; }, {passive:true});
  stage.addEventListener('touchend', e=>{ if(!swiping) return; const dx=e.changedTouches[0].clientX-sx; const dy=e.changedTouches[0].clientY-sy; if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)){ spatialGo(spatial.idx + (dx<0?1:-1)); } swiping=false; });

  // booking
  document.getElementById('floatBtn').addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
  document.getElementById('sendWaBtn').addEventListener('click', sendWhatsApp);

  // hero CTA
  document.getElementById('bookShootBtn').addEventListener('click', ()=>document.getElementById('packages').scrollIntoView({behavior:'smooth'}));

  // image fallbacks
  document.querySelectorAll('img').forEach(img=>{
    img.addEventListener('error', function(){ this.onerror=null; this.src=PLACEHOLDER; }, {once:true});
  });

  updateParallax();
});
