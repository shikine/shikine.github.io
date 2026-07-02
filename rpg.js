/* ═══════════════════════════════════════════════════════════════
   あわい村 — ゲームエンジン（rpg-data.js を先に読み込むこと）
   ═══════════════════════════════════════════════════════════════ */

const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const TS=16, MW=64, MH=46;          // tile size, world size (tiles)
let VW=28, VH=18;                   // viewport in tiles (portrait mobile overrides)
cv.width=VW*TS; cv.height=VH*TS;
ctx.imageSmoothingEnabled=false; ctx.textAlign='center';

/* ── deterministic RNG ── */
let _s=20260618; const rnd=()=>{_s=(_s*1103515245+12345)&0x7fffffff;return _s/0x7fffffff;};

/* ── tile codes: 0 grass 1 path 2 water 3 tree 4 flower 5 dirt
   6 bush 7 sand 8 lava 9 rock 10 cactus 11 mountain(八ヶ岳) ── */
const M=[];
for(let r=0;r<MH;r++){M[r]=[];for(let c=0;c<MW;c++)M[r][c]=0;}
function set(c,r,v){if(r>=0&&r<MH&&c>=0&&c<MW)M[r][c]=v;}
// 八ヶ岳 — mountain range across the north
for(let r=0;r<5;r++)for(let c=0;c<MW;c++)M[r][c]=11;
// side & bottom forest border
for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){
  if((c<2||c>=MW-2||r>=MH-2)&&M[r][c]!==11)M[r][c]=3;
}
// scattered trees / flowers / bushes (central plains)
for(let r=5;r<MH-3;r++)for(let c=3;c<MW-3;c++){
  const v=rnd();
  if(v>.93)M[r][c]=3; else if(v>.88)M[r][c]=6; else if(v>.80)M[r][c]=4;
}
// 裏山の森（右上・八ヶ岳のふもとに濃い木立をつくる）
for(let r=5;r<12;r++)for(let c=47;c<MW-2;c++){ if(rnd()>.42) set(c,r,3); }
for(const [c,r,v] of WILDBERRY){ if(!(c===56&&r===7)) set(c,r,v); }   // 音響装置(56,7)は避ける
// pond (north-west, below the mountains)
for(let r=6;r<13;r++)for(let c=5;c<14;c++)
  if((r-9)*(r-9)/9+(c-9)*(c-9)/16<1.1)set(c,r,2);
// 2nd pond (east)
for(let r=20;r<26;r++)for(let c=51;c<60;c++)
  if((r-23)*(r-23)/9+(c-55)*(c-55)/16<1.05)set(c,r,2);
// desert (south-west corner)
for(let r=34;r<MH-2;r++)for(let c=3;c<19;c++)set(c,r,7);
// 砂漠にはサボテンと岩をひとつずつだけ置く
set(5,40,10);    // サボテン
set(16,41,9);    // 岩
// lava lake (south-east corner) ringed with rock
for(let r=33;r<MH-2;r++)for(let c=44;c<MW-2;c++){
  const d=(r-39)*(r-39)/16+(c-52)*(c-52)/40;
  if(d<1)set(c,r,8); else if(d<1.5)set(c,r,9);
}
// 温泉（露天風呂）— 溶岩のただ中に湯だまりを掘り、まわりを溶岩が囲む。北から細い石畳の参道でつなぐ
const ONSEN_CELLS=[];
for(let r=37;r<=41;r++)for(let c=48;c<=56;c++){
  if((r-39)*(r-39)/2.2+(c-52)*(c-52)/8 < 1){ set(c,r,27); ONSEN_CELLS.push({c,r}); }
}
for(let r=35;r<=37;r++) set(52,r,28);   // 北の草地→湯への石畳（溶岩の中の安全な通路）
// field rows (north-east plains)
for(let r=13;r<17;r++)for(let c=40;c<48;c++)set(c,r, r%2?5:0);
// strawberry field (いちご畑) — plant rows (12) alternate with walkable dirt (5)
for(let r=29;r<34;r++)for(let c=17;c<28;c++)set(c,r,(r-29)%2===0?12:5);
// vineyard (ぶどう畑 / ワイン用) — north-central
for(let r=8;r<13;r++)for(let c=34;c<45;c++)set(c,r,(r-8)%2===0?14:5);
// lettuce field (レタス畑) — central
for(let r=20;r<24;r++)for(let c=34;c<45;c++)set(c,r,(r-20)%2===0?16:5);
// small tomato field (小さなトマト畑) — レタスの左隣：成長段階を四季と連動させる（株マスを記録）
const TOMATO_CELLS=[];
for(let r=20;r<24;r++)for(let c=28;c<32;c++){
  if((r-20)%2===0){ set(c,r,19); TOMATO_CELLS.push({c,r}); } else set(c,r,5);
}
for(const m of MUSHROOM_CELLS) set(m.c,m.r,25);
set(12,16,3); set(16,17,3); set(11,19,3);   // 木陰をつくる木（各きのこの隣）
// hippie meadow (自由の広場) — top-left, east of the pond: grass + flowers
for(let r=6;r<12;r++)for(let c=15;c<23;c++)set(c,r, rnd()>.62?4:0);
// small rice paddy (ちいさな田んぼ) — south-central
for(let r=21;r<23;r++)for(let c=22;c<26;c++)set(c,r,18);
// 詩人の野原（花の咲く開けた草地）— 郵便屋とメルマガのあいだ
for(let r=26;r<31;r++)for(let c=35;c<43;c++) if(M[r][c]===0 && rnd()>.62) set(c,r,4);
// river (川) — meanders south out of the west pond; the bear lingers near it
for(let r=13;r<34;r++){ const cc=6+Math.round(Math.sin((r-13)*0.55)); for(let c=cc-1;c<=cc+1;c++) if(c>=3&&c<=7) set(c,r,2); }

// carve path tiles & clear footprints
function clear(c,r){if(r>=0&&r<MH&&c>=0&&c<MW)M[r][c]=0;}
[...SPOTS,...DECO,...BOULDERS].forEach(s=>{
  for(let r=s.y-1;r<s.y+s.h+1;r++)for(let c=s.x-1;c<s.x+s.w+1;c++)clear(c,r);
});
// prep ground under placed objects: sand in the desert, grass elsewhere
OBJS.forEach(o=>{ for(let r=o.y;r<o.y+o.h;r++)for(let c=o.x;c<o.x+o.w;c++)
  set(c,r,(r>=34&&c>=3&&c<19)?7:0); });
// prep ground under treasure chests
TREASURES.forEach(t=>{ if(t.type==='chest') set(t.x,t.y,(t.y>=34&&t.x>=3&&t.x<19)?7:0); });
// keep the cat's spot beside the truck clear (rescued from the kei truck)
set(16,30,0); set(16,31,0);
// keep Larry's spot near the lava clear
set(48,33,0); set(48,34,0);
// keep the momo spawn tile walkable (sand, in front of the troupe)
set(11,34,7);
// keep the bear-side spawn tile walkable (land, just below the bear)
set(4,18,0);
// keep the firefly spawn tile walkable (east bank by the river fireflies)
set(8,22,0);
// keep the tile in front of the forest speaker walkable (small clearing to listen)
set(56,8,0);
// open south paddock for the grazing horse (clear trees/bushes to grass)
for(let r=PASTURE.y;r<=PASTURE.y+PASTURE.h;r++)for(let c=PASTURE.x;c<=PASTURE.x+PASTURE.w;c++)
  if(r>=0&&r<MH&&c>=0&&c<MW&&M[r][c]!==2) set(c,r,0);
// clear ground under the warp circle (walkable sand) and the signpost tile
for(let r=WARP.y;r<WARP.y+WARP.h;r++)for(let c=WARP.x;c<WARP.x+WARP.w;c++)set(c,r,7);
set(SIGN.x,SIGN.y,7);
// clear ground under the shrine and its approach (avoid overwriting water)
for(let r=SHRINE.y-1;r<=SHRINE.y+SHRINE.h;r++) for(let c=SHRINE.x-1;c<=SHRINE.x+SHRINE.w;c++)
  { if(r<0||r>=MH||c<0||c>=MW)continue; if(M[r][c]!==2) M[r][c]=0; }
// simple paths: a horizontal main road + spurs to each door
function road(c1,r1,c2,r2){ // L-shaped
  for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++)if(M[r1][c]!==2)M[r1][c]=1;
  for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++)if(M[r][c2]!==2)M[r][c2]=1;
}
const HUB=[32,18];
SPOTS.forEach(s=>road(HUB[0],HUB[1],s.x+((s.w/2)|0),s.y+s.h));
for(let c=8;c<58;c++)if(M[18][c]!==2)M[18][c]=1;     // main road




NPCS.forEach(n=>{n.px=n.x*TS;n.py=n.y*TS;n.hx=n.px;n.hy=n.py;n.dir=n.dir||'down';n.frame=0;n.t=rnd()*120;n.mdir=null;n.moving=false;n.hopT=0;n.hopY=0;n.hopCd=120+rnd()*180;n.blinkOff=rnd()*4000;});
/* 元気なNPCの「ぴょこっ」アクション（amp=高さ, hops=回数） */
function startHop(n,amp,hops){ n.hopAmp=amp; n.hopN=hops; n.hopDur=hops*13; n.hopT=n.hopDur; }
const LARRY=NPCS.find(n=>n.name==='劇団員ラリー'); // 夜にスポットライトを当てる対象

ANIMALS.forEach(a=>{a.px=a.x*TS;a.py=a.y*TS;a.hx=a.px;a.hy=a.py;a.dir=rnd()<.5?'left':'right';a.frame=0;a.t=rnd()*120;a.mdir=null;a.moving=false;a.fleeing=false;a.gone=false;a.fleeT=0;a.fvx=0;a.fvy=0;});


/* ── ホタル（川の近く・6月いっぱいの期間限定） ── */
const FIREFLIES=[];
for(let i=0;i<16;i++){ const r=14+Math.random()*18; const cc=6+Math.sin((r-13)*0.55);
  FIREFLIES.push({ ax:(cc+(Math.random()*4-2))*TS, ay:r*TS, ph:Math.random()*6.28, dr:Math.random()*6.28 }); }
// 夏のあいだだけ出現（メニューやYキーの季節切替・?to=hotaru の夏固定にも連動）
function fireflySeason(){ return curSeason()==='summer'; }
// 話しかけたあと、点滅を一時的に速くする「あいさつ」用
let _ffBoostUntil=0, _ffClock=0, _ffLast=0;
function drawFireflies(){
  if(!fireflySeason()) return;
  const m=curMode(); if(m!=='night') return;   // 蛍は夜だけ出る
  const now=Date.now();
  const dt=_ffLast?Math.min(80,now-_ffLast):16; _ffLast=now;
  const fast = now<_ffBoostUntil;               // あいさつ中は明滅が速く・少し明るく
  _ffClock += dt*(fast?3.2:1.0);
  const boost = fast?1.3:1;
  const t=now;
  for(const f of FIREFLIES){
    const wx=f.ax + Math.sin(t/1700+f.dr)*10 + Math.cos(t/2300+f.ph)*6;
    const wy=f.ay + Math.cos(t/1900+f.dr)*8  + Math.sin(t/2600+f.ph)*5;
    const sx=wx-cam.x, sy=wy-cam.y;
    if(sx<-8||sx>cv.width+8||sy<-8||sy>cv.height+8) continue;
    const a=(0.2+0.8*(0.5+0.5*Math.sin(_ffClock/330+f.ph*3)))*boost;
    const g=ctx.createRadialGradient(sx,sy,0, sx,sy,6);
    g.addColorStop(0,'rgba(214,255,150,'+(0.55*a)+')'); g.addColorStop(1,'rgba(190,255,120,0)');
    ctx.fillStyle=g; ctx.fillRect(sx-6,sy-6,12,12);
    ctx.globalAlpha=Math.min(1,a); ctx.fillStyle='#eaffb0'; ctx.fillRect(sx|0,sy|0,1,1); ctx.globalAlpha=1;
  }
}

/* ── 温泉の湯気（露天風呂のマスから、白い湯気がゆらめき立ちのぼる） ── */
function drawOnsenSteam(){
  if(typeof ONSEN_CELLS==='undefined') return;
  const t=Date.now();
  for(const m of ONSEN_CELLS){
    const bx=m.c*TS+TS/2-cam.x, by=m.r*TS+TS/2-cam.y;
    if(bx<-24||bx>cv.width+24||by<-40||by>cv.height+24) continue;
    for(let i=0;i<2;i++){
      const seed=m.c*7+m.r*13+i*131;
      const rise=((t/24 + seed*37) % 64);                  // 0..64 上昇
      const sx=bx + Math.sin(t/1300 + seed)*4 + Math.sin(t/520+seed)*1.5;
      const sy=by + 5 - rise;
      const a=0.16*(1-rise/64);                            // 上ほど薄く消える
      if(a<=0.01) continue;
      const rad=3+rise*0.09;
      const g=ctx.createRadialGradient(sx,sy,0, sx,sy,rad);
      g.addColorStop(0,'rgba(236,246,245,'+a.toFixed(3)+')'); g.addColorStop(1,'rgba(236,246,245,0)');
      ctx.fillStyle=g; ctx.fillRect(sx-rad,sy-rad,rad*2,rad*2);
    }
  }
}

HERON.px=HERON.x*TS; HERON.py=HERON.y*TS;

BEAR.px=BEAR.x*TS; BEAR.py=BEAR.y*TS; BEAR.hx=BEAR.px; BEAR.hy=BEAR.py;

/* ── 雉の親子（雄雉が先導し、子6羽と母雉が一列でついて歩く） ── */
const PHEASANTS=(()=>{
  const hc=44, hr=14;
  const lead={px:hc*TS,py:hr*TS,hx:hc*TS,hy:hr*TS,dir:'left',frame:0,moving:false,t:40,mdir:null};
  const order=['chick','chick','chick','chick','chick','chick','hen']; // 子6羽＋しんがりの母
  const followers=order.map(k=>({kind:k,px:lead.px,py:lead.py,dir:'left',frame:0,moving:false}));
  return {lead,followers,hist:[],fleeing:false,gone:false,fleeT:0,fvx:0,fvy:0};
})();
function updatePheasants(){
  const ph=PHEASANTS, L=ph.lead;
  if(ph.gone) return;
  if(ph.fleeing){                                    // 家族そろって走り去り、やがて消える
    L.px+=ph.fvx; L.py+=ph.fvy; L.moving=true; L.frame+=0.4; ph.fleeT++;
    L.dir = Math.abs(ph.fvx)>Math.abs(ph.fvy) ? (ph.fvx<0?'left':'right') : (ph.fvy<0?'up':'down');
    ph.hist.unshift({px:L.px,py:L.py,dir:L.dir,moving:true});
    const gap=7, need=gap*ph.followers.length+2; if(ph.hist.length>need) ph.hist.length=need;
    ph.followers.forEach((f,i)=>{ const h=ph.hist[(i+1)*gap]; if(h){ f.px=h.px;f.py=h.py;f.dir=h.dir;f.moving=true;f.frame+=0.4; } });
    if(ph.fleeT>90) ph.gone=true;
    return;
  }
  L.t--;
  if(L.t<=0){ L.t=70+rnd()*130; L.mdir = rnd()<.4?null:['up','down','left','right'][(rnd()*4)|0]; }
  let dx=0,dy=0;
  if(L.mdir){ const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[L.mdir];
    if(Math.hypot(L.px-L.hx,L.py-L.hy)<TS*5){dx=d[0];dy=d[1];}else{L.mdir=null;L.t=30;} }
  moveEnt(L,dx,dy,0.45);
  ph.hist.unshift({px:L.px,py:L.py,dir:L.dir,moving:L.moving});
  const gap=7, need=gap*ph.followers.length+2;
  if(ph.hist.length>need) ph.hist.length=need;
  ph.followers.forEach((f,i)=>{ const h=ph.hist[(i+1)*gap]; if(h){
    f.px=h.px; f.py=h.py; f.dir=h.dir; f.moving=h.moving; f.frame+=f.moving?0.16:0; } });
}

/* ── player ── */
const P={px:HUB[0]*TS, py:HUB[1]*TS+TS, dir:'down', speed:1.5, frame:0, moving:false,
         swim:false, berries:0, grapes:0, lettuce:0, tomato:0, mushroom:0, flowers:0, lastCrop:'', boostUntil:0, slowUntil:0, blinkOff:1700};
const SOLID=new Set([2,3,6,8,9,10,11,12,13,14,15,16,17,19,20,21,22,23,24,25,26,29,30,31]);
const PICKED=[]; // {c,r,at,ripe} for crop regrow
const inB=(c,r)=>{for(const s of SPOTS)if(c>=s.x&&c<s.x+s.w&&r>=s.y&&r<s.y+s.h)return true;
  for(const s of DECO)if(c>=s.x&&c<s.x+s.w&&r>=s.y&&r<s.y+s.h)return true;
  for(const s of BOULDERS)if(c>=s.x&&c<s.x+s.w&&r>=s.y&&r<s.y+s.h)return true;
  for(const s of OBJS)if(c>=s.x&&c<s.x+s.w&&r>=s.y&&r<s.y+s.h)return true;
  for(const t of TREASURES)if(t.type==='chest'&&c===t.x&&r===t.y)return true;
  if(c===SIGN.x&&r===SIGN.y)return true;
  if(c>=SHRINE.x&&c<SHRINE.x+SHRINE.w&&r>=SHRINE.y&&r<SHRINE.y+SHRINE.h)return true;
  return false;};
function solidAt(px,py,self){
  const c=(px/TS)|0,r=(py/TS)|0;
  if(r<0||r>=MH||c<0||c>=MW)return true;
  const t=M[r][c];
  if(SOLID.has(t)){
    if(self===P){
      // player passes through water (swim), interior trees/bushes, and growing crops (slow); outer forest stays solid
      const interiorBrush=(t===3||t===6)&&c>=2&&c<MW-2&&r<MH-2;
      if(!(t===2||interiorBrush||CROPTILE.has(t)))return true;
    } else return true;
  }
  if(inB(c,r))return true;
  // NPC collision
  for(const n of NPCS){ if(n===self||npcHidden(n))continue;
    if(Math.abs(px-(n.px+TS/2))<11&&Math.abs(py-(n.py+TS-3))<10)return true;}
  if(self&&self!==P&&Math.abs(px-(P.px+TS/2))<11&&Math.abs(py-(P.py+TS-3))<10)return true; // player blocks npc
  return false;
}
function canMove(nx,ny,self){
  const m=3;
  return !solidAt(nx+m,ny+TS-2,self)&&!solidAt(nx+TS-m,ny+TS-2,self)
       &&!solidAt(nx+m,ny+TS/2,self)&&!solidAt(nx+TS-m,ny+TS/2,self);
}

/* ── input ── */
const keys={};
addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  keys[e.key.toLowerCase()]=true;
  if(dlgOpen&&(e.key==='1'||e.key==='2')){ const cur=curPages[curIdx];
    if(cur&&cur.choices){ chooseBranch(+e.key-1); return; } }   // 分岐は数字キーでも選べる
  if(e.key===' '||e.key==='Enter'){ if(!running)startGame(); else interact(); }
  if((e.key==='e'||e.key==='E')&&running&&!dlgOpen&&!panelOpen) eatCrop();
  if((e.key==='t'||e.key==='T')&&running) cycleTime();
  if((e.key==='y'||e.key==='Y')&&running) cycleSeason();
  if(e.key==='Escape'){ closePanel(); closeDlg(); closeMenu(); }
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});   // フォーカスが外れたら押しっぱなしを解除
document.querySelectorAll('#pad button').forEach(b=>{
  const d=b.dataset.d,on=e=>{e.preventDefault();keys['_'+d]=true},off=e=>{e.preventDefault();keys['_'+d]=false};
  b.addEventListener('touchstart',on);b.addEventListener('touchend',off);
  b.addEventListener('mousedown',on);b.addEventListener('mouseup',off);b.addEventListener('mouseleave',off);
});
document.getElementById('act').addEventListener('touchstart',e=>{e.preventDefault();interact()});
document.getElementById('act').addEventListener('click',interact);
document.getElementById('eat').addEventListener('touchstart',e=>{e.preventDefault();eatCrop()});
document.getElementById('eat').addEventListener('click',eatCrop);

/* ── dialog (paged) ── */
let dlgOpen=false,curPages=[],curIdx=0,dlgConfirm=null;
const dlg=document.getElementById('dlg');
function openDialog(who,title,pages){
  dlgConfirm=null;
  curPages=pages;curIdx=0;
  document.getElementById('dlgWho').textContent=who||'';
  document.getElementById('dlgTitle').innerHTML=title||'';
  renderPage(); dlg.classList.add('show'); dlgOpen=true;
}
function renderPage(){
  const cur=curPages[curIdx];
  const body=document.getElementById('dlgBody'), next=document.getElementById('dlgNext');
  if(cur&&typeof cur==='object'&&cur.choices){          // 分岐ページ：選択肢ボタンを出す
    let h=cur.q?('<div class="dlgq">'+cur.q+'</div>'):'';
    h+='<div class="dlgchoices">';
    cur.choices.forEach((c,i)=>h+='<button class="dlgchoice" data-i="'+i+'">'+c.t+'</button>');
    h+='</div>';
    body.innerHTML=h; next.style.display='none';
    body.querySelectorAll('.dlgchoice').forEach(b=>b.addEventListener('click',ev=>{ ev.stopPropagation(); chooseBranch(+b.dataset.i); }));
  } else {
    body.innerHTML=cur; next.style.display=(curIdx<curPages.length-1)?'block':'none';
  }
}
function chooseBranch(i){ const cur=curPages[curIdx]; if(!cur||!cur.choices||!cur.choices[i])return;
  curPages=cur.choices[i].next||[]; curIdx=0; renderPage(); }
function advance(){ const cur=curPages[curIdx];
  if(cur&&typeof cur==='object'&&cur.choices) return;    // 選択待ち：スペース/クリックでは進めない
  if(curIdx<curPages.length-1){curIdx++;renderPage();}
  else { const cb=dlgConfirm; dlgConfirm=null; closeDlg(); if(cb)cb(); } }
function closeDlg(){dlg.classList.remove('show');dlgOpen=false;dlgConfirm=null;stopObsLive();}
function openConfirm(title,pages,onYes){ openDialog('',title,pages); dlgConfirm=onYes; }
dlg.addEventListener('click',e=>{if(e.target.closest('a,.close,.dlgchoice'))return;advance();});

/* ── centered panel (works / apps) ── */
let panelOpen=false;
const panel=document.getElementById('panel');
function openPanel(title,html){
  document.getElementById('panelTitle').innerHTML=title;
  document.getElementById('panelBody').innerHTML=html;
  panel.classList.add('show'); panelOpen=true;
}
function closePanel(){panel.classList.remove('show');panelOpen=false;
  if(KITCHEN.open){ KITCHEN.open=false; kitchenClear(); } }   // 台所を閉じたら演奏を止める
panel.addEventListener('click',e=>{if(e.target===panel)closePanel();});

/* ── 全体マップ（メニューから表示） ── */
// 全体マップ用：タイルごとに小さなモチーフを描いて“詳細な地図”にする
function drawMapTile(mx,t,x,y,sc,c,r){
  const rv=((c*73856093)^(r*19349663))>>>0, h=(rv%1000)/1000;
  const F=(dx,dy,w,hh,col)=>{mx.fillStyle=col;mx.fillRect(x+dx,y+dy,w,hh);};
  const dot=(cx,cy,rr,col)=>{mx.fillStyle=col;mx.beginPath();mx.arc(x+cx,y+cy,rr,0,7);mx.fill();};
  const g1=(c+r)%2?'#5a9356':'#54914f';
  switch(t){
    case 2: // 水・川
      F(0,0,sc,sc,'#4f86ab'); F(0,0,sc,Math.max(1,sc*0.18),'#6aa0c4');
      if(h>0.5)F(sc*0.2,sc*0.55,sc*0.4,Math.max(1,sc*0.1),'#9cc6dc'); break;
    case 1: // 道
      F(0,0,sc,sc,'#cbb079'); if(h>0.6)F(sc*0.3,sc*0.45,sc*0.22,sc*0.15,'#bda06a'); break;
    case 7: // 砂
      F(0,0,sc,sc,'#dcc486'); if(h>0.5)F(sc*0.25,sc*0.3,Math.max(1,sc*0.14),Math.max(1,sc*0.14),'#ccb274'); break;
    case 8: // 溶岩
      F(0,0,sc,sc,'#e0531e'); dot(sc*0.5,sc*0.5,sc*0.24,'#ffae3a'); dot(sc*0.32,sc*0.7,sc*0.1,'#ffe08a'); break;
    case 9: // 岩
      F(0,0,sc,sc,g1); dot(sc*0.5,sc*0.56,sc*0.34,'#8b8a86'); dot(sc*0.42,sc*0.46,sc*0.2,'#a7a6a1'); break;
    case 10: // サボテン
      F(0,0,sc,sc,'#dcc486'); F(sc*0.42,sc*0.18,sc*0.16,sc*0.62,'#3a8047'); F(sc*0.22,sc*0.42,sc*0.2,sc*0.12,'#3a8047'); break;
    case 11: { // 八ヶ岳
      F(0,0,sc,sc,'#6b7486');
      mx.fillStyle='#5a6376'; mx.beginPath(); mx.moveTo(x,y+sc); mx.lineTo(x+sc*0.5,y+sc*0.12); mx.lineTo(x+sc,y+sc); mx.closePath(); mx.fill();
      mx.fillStyle='#eef2f8'; mx.beginPath(); mx.moveTo(x+sc*0.5,y+sc*0.12); mx.lineTo(x+sc*0.36,y+sc*0.42); mx.lineTo(x+sc*0.64,y+sc*0.42); mx.closePath(); mx.fill();
      break; }
    case 3: // 木
      F(0,0,sc,sc,'#4a7a4a'); F(sc*0.44,sc*0.55,sc*0.12,sc*0.42,'#6b4a2c');
      dot(sc*0.5,sc*0.4,sc*0.42,'#2f6b3a'); dot(sc*0.4,sc*0.34,sc*0.26,'#3c8147'); break;
    case 6: // 茂み
      F(0,0,sc,sc,g1); dot(sc*0.5,sc*0.6,sc*0.34,'#3a7d45'); dot(sc*0.36,sc*0.52,sc*0.2,'#4f9a57'); break;
    case 5: // 畑の土・畝
      F(0,0,sc,sc,'#8a6a44'); F(0,sc*0.5,sc,Math.max(1,sc*0.14),'#795c39'); break;
    case 18: // 田んぼ
      F(0,0,sc,sc,'#6f93a0'); F(sc*0.22,sc*0.2,Math.max(1,sc*0.1),sc*0.6,'#5a9a4c'); F(sc*0.56,sc*0.25,Math.max(1,sc*0.1),sc*0.55,'#6cb05a'); break;
    case 12: case 13: // いちご畑
      F(0,0,sc,sc,'#4a7a4a'); dot(sc*0.5,sc*0.55,sc*0.24,'#2f6b3a'); if(t===12)dot(sc*0.52,sc*0.62,sc*0.12,'#e23b4a'); break;
    case 14: case 15: // ぶどう畑
      F(0,0,sc,sc,'#4a7a4a'); F(sc*0.12,sc*0.18,sc*0.76,Math.max(1,sc*0.14),'#3a7d45'); if(t===14)dot(sc*0.46,sc*0.62,sc*0.16,'#5b2f7a'); break;
    case 16: case 17: // レタス畑
      F(0,0,sc,sc,'#4a7a4a'); dot(sc*0.5,sc*0.55,sc*0.27,'#4f9a44'); dot(sc*0.5,sc*0.52,sc*0.15,'#6cc05a'); break;
    case 19: case 20: case 21: case 22: case 23: case 24: { // トマト畑（段階で実の色が変わる）
      F(0,0,sc,sc,'#4a7a4a'); dot(sc*0.5,sc*0.5,sc*0.24,'#2f6b3a');
      const fc=(t===19)?'#e0402a':(t===23)?'#3d8c2a':(t===24)?'#c03020':(t===20)?'#e8d24f':null;
      if(fc)dot(sc*0.5,sc*0.6,sc*0.13,fc); break; }
    case 25: case 26: // きのこの森
      F(0,0,sc,sc,'#3f6e42'); F(0,sc*0.62,sc,sc*0.38,'#5a4a38');
      if(t===25){ F(sc*0.28,sc*0.42,sc*0.2,sc*0.16,'#d23b32'); dot(sc*0.66,sc*0.56,sc*0.1,'#9a6a3a'); } break;
    case 29: case 30: case 31: // 野イチゴ（林床）
      F(0,0,sc,sc,'#3f6e42'); dot(sc*0.5,sc*0.5,sc*0.22,'#2f6b3a');
      if(t!==31) dot(sc*0.54,sc*0.6,sc*0.13,t===29?'#e23b4a':'#f2c12e'); break;
    case 27: // 温泉
      F(0,0,sc,sc,'#5fb4b0'); F(0,0,sc,Math.max(1,sc*0.2),'#7fcfc8'); dot(sc*0.5,sc*0.5,sc*0.16,'#c7eeea'); break;
    case 28: // 湯への石畳
      F(0,0,sc,sc,'#847b73'); F(sc*0.5,0,Math.max(1,sc*0.12),sc,'#6a605a'); F(0,sc*0.5,sc,Math.max(1,sc*0.12),'#6a605a'); break;
    default: // 草地（＋花）
      F(0,0,sc,sc,g1);
      if(t===4){ const fc=['#e8d24f','#e57ba0','#ffffff','#d98cf0'][rv%4]; dot(sc*0.5,sc*0.42,sc*0.16,fc); }
      else if(h>0.75) F(sc*0.3,sc*0.55,Math.max(1,sc*0.1),sc*0.3,'#4e864e');
  }
}
function openMapPanel(){
  closeMenu();
  const sc=12, w=MW*sc, h=MH*sc;
  const pc=v=>(v).toFixed(2);
  // エリア名ラベル（タイル座標→％）。mini:true は絵文字だけ表示（小ネタ・収穫スポット）
  const areas=[
    {t:'⛰ 八ヶ岳',x:32,y:2},{t:'💧 西の池',x:9.5,y:10.5},{t:'💧 東の池',x:55,y:23},
    {t:'🎶 自由の広場',x:18.5,y:6.8},{t:'🎙 焚き火ラジオ',x:21.5,y:12.5,mini:true},{t:'🍄 きのこの森',x:13,y:17,mini:true},{t:'🌊 川',x:6,y:27},
    {t:'🗿 縄文の遺跡',x:5,y:6.5},{t:'⛩ 水神の祠',x:58.3,y:20},{t:'🐴 南の牧場',x:35.5,y:35.5},
    {t:'🔊 裏山の音',x:57,y:6},
    {t:'🍓 野イチゴ',x:53,y:9.5,mini:true},
    {t:'🍓 いちご畑',x:22,y:31},{t:'🍇 ぶどう畑',x:39,y:10},{t:'⛲🍷 井戸・ワインの室',x:35.5,y:14.6},{t:'🥃 蒸留所',x:38.5,y:17.4},{t:'🥬 レタス畑',x:39,y:22},
    {t:'🍅 トマト畑',x:28,y:23.2},{t:'🌾 田んぼ',x:24,y:21.5},{t:'🏜 砂漠',x:8,y:39},
    {t:'🍳 台所',x:17,y:37,mini:true},
    {t:'🌋 溶岩地帯',x:52,y:42},{t:'♨ 温泉',x:52,y:39},
  ];
  let lab='';
  for(const a of areas){
    const txt=a.mini?a.t.split(' ')[0]:a.t;
    lab+='<div class="mlab marea'+(a.mini?' mmini':'')+'" style="left:'+pc(a.x/MW*100)+'%;top:'+pc(a.y/MH*100)+'%">'+txt+'</div>';
  }
  for(const s of SPOTS) lab+='<div class="mlab mspot" style="left:'+pc((s.x+s.w/2)/MW*100)+'%;top:'+pc((s.y+s.h/2)/MH*100)+'%">'+s.icon+' '+s.label+'</div>';
  lab+='<div class="mlab mspot" style="left:'+pc((WARP.x+WARP.w/2)/MW*100)+'%;top:'+pc((WARP.y+WARP.h/2)/MH*100)+'%">✨ ワープ</div>';
  lab+='<div class="mlab mspot" style="left:'+pc(53.5/MW*100)+'%;top:'+pc(17.5/MH*100)+'%">🖼 FAB LABO</div>';
  lab+='<div class="mhere" style="left:'+pc((P.px/TS+0.5)/MW*100)+'%;top:'+pc((P.py/TS+0.5)/MH*100)+'%"></div>';
  lab+='<div class="mlab mspot" style="left:'+pc((P.px/TS+0.5)/MW*100)+'%;top:'+pc(Math.max(1.5,(P.py/TS-1.3)/MH*100))+'%">現在地</div>';
  // 凡例
  const legend=[['#4f86ab','水・川'],['#2f6b3a','森・木'],['#5a9356','草地'],['#cbb079','道'],
    ['#dcc486','砂'],['#6b7486','八ヶ岳'],['#e0531e','溶岩'],['#8a6a44','畑の土']];
  let leg='<div class="mlegend">';
  for(const[col,n] of legend) leg+='<span class="mli"><i style="background:'+col+'"></i>'+n+'</span>';
  leg+='</div>';
  openPanel('🗺 あわい村 — 全体マップ',
    '<style>'
    +'.mpad{position:relative;width:100%;box-sizing:border-box;padding:12px 30px;overflow-x:auto;-webkit-overflow-scrolling:touch}'  /* 端ラベル用の余白＋スマホは横スクロール */
    +'.mwrap{position:relative;width:100%;line-height:0}'
    +'.mwrap canvas{width:100%;display:block;border:2px solid #4a4030;background:#1a1712;image-rendering:auto}'  /* 縮小はなめらかに（モアレ防止） */
    +'.mlab{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;'
    +'text-shadow:0 1px 2px #000,0 0 3px #000,0 0 3px #000;line-height:1}'
    +'.marea{font-size:10px;color:#f2ecda;opacity:.94}'
    +'.mmini{font-size:13px}'  /* 絵文字だけの小スポット */
    +'.mspot{font-size:11px;color:#ffe49a;font-weight:bold;background:rgba(12,9,5,.55);padding:2px 6px;border-radius:4px}'  /* 施設は座布団つきで一段目立つ */
    +'.mhere{position:absolute;width:11px;height:11px;border-radius:50%;background:#ff3b3b;'
    +'border:2px solid #fff;transform:translate(-50%,-50%);animation:mpulse 1.2s ease-out infinite;pointer-events:none;z-index:2}'
    +'@keyframes mpulse{0%{box-shadow:0 0 0 1px rgba(255,59,59,.55)}100%{box-shadow:0 0 0 10px rgba(255,59,59,0)}}'
    +'.mlegend{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:10px}'
    +'.mli{display:flex;align-items:center;gap:5px;font-size:11px;color:#c9c0aa}'
    +'.mli i{width:11px;height:11px;border-radius:2px;display:inline-block;border:1px solid #00000040}'
    +'@media(max-width:560px){.mpad{padding:12px 16px}.mwrap{min-width:560px}.mspot{font-size:10px}}'  /* スマホ：縮めず横スクロールで読める字を保つ */
    +'</style>'
    +'<div class="mpad"><div class="mwrap"><canvas id="mapcv" width="'+w+'" height="'+h+'"></canvas>'+lab+'</div></div>'
    +'<div style="margin-top:8px;font-size:12px;line-height:1.7;color:#b7ad97">'
    +'🔴 いまの現在地。季節や天候で畑や森の様子も移ろう。歩きまわって村を探そう。（スマホは地図を横にスクロール）</div>'
    +leg);
  const mc=document.getElementById('mapcv'); if(!mc)return;
  const mx=mc.getContext('2d');
  mx.fillStyle='#3a5a3a'; mx.fillRect(0,0,w,h);
  for(let r=0;r<MH;r++)for(let c=0;c<MW;c++) drawMapTile(mx,M[r][c],c*sc,r*sc,sc,c,r);
  // 家（装飾の民家・施設とも、屋根＋壁＋扉で「家」に見えるように描く）
  const drawMapHouse=(s)=>{
    const x=s.x*sc, y=s.y*sc, wd=s.w*sc, ht=s.h*sc, roofH=Math.max(4,Math.round(ht*0.45));
    mx.fillStyle='rgba(0,0,0,.20)'; mx.fillRect(x-1,y+ht-2,wd+2,3);                                    // 影
    mx.fillStyle=s.wall||'#d8b486'; mx.fillRect(x,y+roofH,wd,ht-roofH);                                 // 壁
    mx.fillStyle='rgba(0,0,0,.15)'; mx.fillRect(x,y+ht-3,wd,3);                                         // 壁の足元
    mx.fillStyle=s.roof; mx.fillRect(x-1,y,wd+2,roofH);                                                 // 屋根（軒を出す）
    mx.fillStyle='rgba(255,255,255,.22)'; mx.fillRect(x-1,y,wd+2,Math.max(2,Math.round(roofH*0.3)));    // 棟の光
    mx.fillStyle='#3a2718';
    const dw=Math.max(3,Math.round(wd*0.14)), dh=Math.max(4,Math.round(ht*0.28));
    mx.fillRect(x+Math.round(wd/2-dw/2),y+ht-dh,dw,dh);                                                 // 扉
  };
  DECO.forEach(drawMapHouse);
  SPOTS.forEach(drawMapHouse);
  // スマホ（横スクロール時）：現在地が画面の中央に来るよう初期位置を合わせる
  const padEl=document.querySelector('#panel .mpad');
  if(padEl && padEl.scrollWidth>padEl.clientWidth+4){
    const wrapEl=padEl.querySelector('.mwrap');
    padEl.scrollLeft=(P.px/TS+0.5)/MW*wrapEl.clientWidth - padEl.clientWidth/2 + 16;
  }
}
document.getElementById('mapBtn').addEventListener('click',openMapPanel);

/* ── 断層図（地質断面）：現在地を通る南北の断面で、起伏と土地の成り立ちを見る ── */
function openCrossPanel(){
  closeMenu();
  const W=900,H=520, c0=Math.max(0,Math.min(MW-1,(P.px/TS+0.5)|0)), prow=Math.max(0,Math.min(MH-1,(P.py/TS+0.5)|0));
  const pcf=v=>v.toFixed(2);
  // 現在地の経線にそって、北(八ヶ岳)→南の標高プロファイルをタイルから起こす
  const elevTile=t=> t===11?24 : t===9?15 : t===8?13 : (t===3||t===6)?9 : t===2?2 : (t===7||t===10)?5 : t===18?6 : 8;
  const raw=[];
  for(let r=0;r<MH;r++){ let v=elevTile(M[r][c0]);
    if(r>=5){ v += (r<13?3 : r<23?1.6 : r<33?0.4 : -0.6);             // 河岸段丘（だんだん下る）
      v += Math.sin(r*0.9)*0.8 + Math.sin(r*0.37+1.3)*0.7; }          // ゆるやかな起伏（意外と凸凹）
    raw[r]=v; }
  const e=[]; for(let r=0;r<MH;r++){ let s=0,n=0; for(let k=-1;k<=1;k++){const rr=r+k; if(rr>=0&&rr<MH){s+=raw[rr];n++;}} e[r]=s/n; }
  const eMax=Math.max(...e), eMin=Math.min(...e);
  const topY=70, botY=232, ts=16, as=46, lv=44, T=32, rf=Math.round(MH*0.52), magmaBase=480;
  // 行を補間して高解像度に（1px単位で断面を描く）
  const EF=fr=>{ const a=Math.max(0,Math.min(MH-1,fr)), i=Math.floor(a), f=a-i; return e[i]+(e[Math.min(MH-1,i+1)]-e[i])*f; };
  const surfY=fr=> botY - (EF(fr)-eMin)/Math.max(0.001,eMax-eMin)*(botY-topY);
  const magmaY=fr=> magmaBase - 108*Math.exp(-Math.pow((fr-3)/7,2)) - 7*Math.sin(fr*0.6);   // 八ヶ岳直下でせり上がる
  const capTile=fr=> M[Math.max(0,Math.min(MH-1,Math.round(fr)))][c0];
  const rowToX=r=> r/(MH-1)*W, xToRow=x=> x/W*(MH-1);
  const xF=rowToX(rf), xc=rowToX(3);
  // ラベル（px→％）
  const L=[], add=(t,x,y,cls)=>L.push({t,x:x/W*100,y:y/H*100,cls:cls||'marea'});
  add('← 北 ・ 八ヶ岳側', W*0.13,H*0.045); add('南 →', W*0.9,H*0.045);
  add('⛰ 八ヶ岳（火山）', rowToX(2.5), surfY(2)-14,'mspot');
  add('富士見の台地（河岸段丘）', W*0.44, surfY(18)-14);
  let lowR=6; for(let r=7;r<MH-2;r++) if(e[r]<e[lowR]) lowR=r;
  add('🌊 谷（水のしみる低み）', rowToX(lowR), surfY(lowR)+14);
  add('南の森', rowToX(MH-2.5), surfY(MH-3)-14);
  add('⚡ 断層（ずれ）', xF, surfY(rf)-18,'mspot');
  add('🔥 マグマだまり', rowToX(5), (magmaY(4)+H)/2,'mspot');
  add('火道', xc+20, (surfY(3)+magmaY(3))/2,'mspot');
  const sYr=surfY(MH-2);
  add('表土（黒ボク土）', W*0.82, sYr+4+ts/2,'mstrat');
  add('火山灰・軽石層', W*0.82, sYr+4+ts+(as+T)/2,'mstrat');
  add('溶岩・火砕流', W*0.82, sYr+4+ts+as+T+lv/2,'mstrat');
  add('基盤岩', W*0.82, (sYr+4+ts+as+T+lv+magmaY(MH-2))/2,'mstrat');
  let lab=''; for(const o of L) lab+='<div class="mlab '+o.cls+'" style="left:'+pcf(o.x)+'%;top:'+pcf(o.y)+'%">'+o.t+'</div>';
  const xP=rowToX(prow), yP=surfY(prow);
  lab+='<div class="mhere" style="left:'+pcf(xP/W*100)+'%;top:'+pcf(yP/H*100)+'%"></div>';
  lab+='<div class="mlab mspot" style="left:'+pcf(xP/W*100)+'%;top:'+pcf((yP-16)/H*100)+'%">現在地</div>';
  const legend=[['#eef2f8','地表'],['#5b4632','表土（黒ボク土）'],['#c8a86a','火山灰層'],['#7a4a44','溶岩・火砕流'],['#6b6e76','基盤岩'],['#ff7a24','マグマ']];
  let leg='<div class="mlegend">'; for(const[col,n] of legend) leg+='<span class="mli"><i style="background:'+col+'"></i>'+n+'</span>'; leg+='</div>';
  openPanel('⛰ あわい村 — 断層図（土地の成り立ち）',
    '<style>'
    +'.mpad{position:relative;width:100%;box-sizing:border-box;padding:12px 30px;overflow:visible}'  /* 端ラベル用の余白 */
    +'.mwrap{position:relative;width:100%;line-height:0}'
    +'.mwrap canvas{width:100%;display:block;border:2px solid #4a4030;background:#0e1410;image-rendering:auto}'  /* 縮小はなめらかに */
    +'.mlab{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;text-shadow:0 1px 2px #000,0 0 3px #000;line-height:1}'
    +'.marea{font-size:11px;color:#f2ecda;opacity:.95}'
    +'.mspot{font-size:11px;color:#ffe49a;font-weight:bold}'
    +'.mstrat{font-size:10px;font-weight:bold;color:#22180e;background:rgba(240,235,222,.8);padding:1px 4px;border-radius:3px;text-shadow:none}'
    +'.mhere{position:absolute;width:11px;height:11px;border-radius:50%;background:#ff3b3b;border:2px solid #fff;transform:translate(-50%,-50%);animation:mpulse 1.2s ease-out infinite;pointer-events:none;z-index:2}'
    +'@keyframes mpulse{0%{box-shadow:0 0 0 1px rgba(255,59,59,.55)}100%{box-shadow:0 0 0 10px rgba(255,59,59,0)}}'
    +'.mlegend{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:10px}'
    +'.mli{display:flex;align-items:center;gap:5px;font-size:11px;color:#c9c0aa}'
    +'.mli i{width:11px;height:11px;border-radius:2px;display:inline-block;border:1px solid #00000040}'
    +'@media(max-width:560px){.mpad{padding:14px 16px}.marea{font-size:9px}.mspot{font-size:9px}.mstrat{font-size:8.5px}}'  /* スマホ：余白とラベルを調整 */
    +'</style>'
    +'<div class="mpad"><div class="mwrap"><canvas id="xcv" width="'+W+'" height="'+H+'"></canvas>'+lab+'</div></div>'
    +'<div style="margin-top:8px;font-size:12px;line-height:1.7;color:#b7ad97">'
    +'🔴 いまの現在地を通る、北（八ヶ岳）→南の断面。八ヶ岳の噴火が積もり、川が削って段丘をつくった。'
    +'深部には<b>マグマだまり</b>が八ヶ岳を支える。高さは強調表示——平らに見えて、<b>意外と起伏のある土地</b>です。</div>'
    +leg);
  const cv2=document.getElementById('xcv'); if(!cv2)return;
  const g=cv2.getContext('2d');
  const sky=g.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#1b2a3a'); sky.addColorStop(0.5,'#2a3a4a'); sky.addColorStop(1,'#0e1410');
  g.fillStyle=sky; g.fillRect(0,0,W,H);
  const cap=t=> t===11?'#eef2f8' : t===2?'#4f86ab' : t===8?'#e0531e' : (t===7||t===10)?'#dcc486' : (t===3||t===6)?'#2f6b3a' : '#5a9356';
  for(let x=0;x<W;x++){ const fr=xToRow(x), sY=surfY(fr), sh=fr>rf?T:0;
    g.fillStyle=cap(capTile(fr)); g.fillRect(x,sY,1,4);              // 地表（生物相）
    let y=sY+4;
    g.fillStyle='#5b4632'; g.fillRect(x,y,1,ts); y+=ts;             // 表土・黒ボク土
    g.fillStyle='#c8a86a'; g.fillRect(x,y,1,as+sh); y+=as+sh;       // 火山灰・軽石層
    g.fillStyle='#7a4a44'; g.fillRect(x,y,1,lv); y+=lv;             // 溶岩・火砕流
    g.fillStyle='#6b6e76'; g.fillRect(x,y,1,Math.max(0,magmaY(fr)-y)); } // 基盤岩
  // マグマ（地下のマグマ＋八ヶ岳直下のマグマだまり）
  g.save(); g.beginPath(); g.moveTo(0,H); g.lineTo(0,magmaY(0));
  for(let x=0;x<=W;x+=3) g.lineTo(x,magmaY(xToRow(x)));
  g.lineTo(W,H); g.closePath(); g.clip();
  const mg=g.createLinearGradient(0,360,0,H); mg.addColorStop(0,'#a82c0e'); mg.addColorStop(.5,'#ff7a24'); mg.addColorStop(1,'#d24010');
  g.fillStyle=mg; g.fillRect(0,360,W,H-360);
  const cyc=(magmaY(3)+H)/2, rad=g.createRadialGradient(xc,cyc,5,xc,cyc,160);
  rad.addColorStop(0,'rgba(255,240,160,.95)'); rad.addColorStop(.5,'rgba(255,150,40,.5)'); rad.addColorStop(1,'rgba(255,120,30,0)');
  g.fillStyle=rad; g.fillRect(0,320,W,H-320); g.restore();
  g.strokeStyle='#ffd24a'; g.lineWidth=2; g.beginPath();                 // マグマ上面の光るふち
  for(let x=0;x<=W;x+=3){ const y=magmaY(xToRow(x)); x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
  // 火道（マグマが八ヶ岳へのぼる通り道）
  g.save(); g.beginPath(); g.moveTo(xc-3,surfY(3)); g.lineTo(xc+3,surfY(3)); g.lineTo(xc+11,magmaY(3)); g.lineTo(xc-11,magmaY(3)); g.closePath(); g.clip();
  const cg=g.createLinearGradient(0,surfY(3),0,magmaY(3)); cg.addColorStop(0,'rgba(255,120,40,.12)'); cg.addColorStop(1,'rgba(255,165,60,.85)');
  g.fillStyle=cg; g.fillRect(xc-12,surfY(3),24,magmaY(3)-surfY(3)); g.restore();
  // 地表のりんかく線
  g.strokeStyle='rgba(20,15,10,.55)'; g.lineWidth=1.5; g.beginPath();
  for(let x=0;x<=W;x+=2){ const y=surfY(xToRow(x)); x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
  // 断層
  g.strokeStyle='#d04030'; g.lineWidth=2; g.setLineDash([6,4]);
  g.beginPath(); g.moveTo(xF,surfY(rf)-6); g.lineTo(xF+12,magmaY(rf)); g.stroke(); g.setLineDash([]);
  g.fillStyle='#ffd0c4'; g.font='bold 13px sans-serif'; const ya=(surfY(rf)+magmaY(rf))/2; g.fillText('↓',xF+15,ya); g.fillText('↑',xF-13,ya);
}
document.getElementById('crossBtn').addEventListener('click',openCrossPanel);

/* ── strawberry: toast / counter / eat ── */
let _toastT;
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg;
  t.classList.add('show'); clearTimeout(_toastT); _toastT=setTimeout(()=>t.classList.remove('show'),1700); }
function updateCropHud(){ document.getElementById('crops').innerHTML=
  '🍓 <b>×'+P.berries+'</b>&ensp;🍇 <b>×'+P.grapes+'</b>&ensp;🥬 <b>×'+P.lettuce+'</b>&ensp;🍅 <b>×'+P.tomato+'</b>&ensp;🍄 <b>×'+P.mushroom+'</b>&ensp;🌼 <b>×'+P.flowers+'</b>'; }
/* ── treasure hunt ── */
function treasCount(){ return TREASURES.filter(t=>t.found).length; }
function updateTreasHud(){ const e=document.getElementById('treas'); if(e)e.innerHTML='💎 <b>'+treasCount()+'/8</b>'; }
let FW=[], fwUntil=0, fwTimer=0;  // 花火（fireworks）
function launchFirework(){
  const x=40+Math.random()*(cv.width-80), y=24+Math.random()*(cv.height*0.45);
  const col=['#ff5a5a','#ffd24a','#5ad2ff','#a87aff','#7aff9a','#ff8ad2','#fff'][(Math.random()*7)|0];
  const n=22+(Math.random()*12|0);
  for(let i=0;i<n;i++){ const a=(i/n)*Math.PI*2, sp=0.7+Math.random()*1.5;
    FW.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,col}); }
}
function getTreasure(t){ if(t.found)return false; t.found=true; updateTreasHud();
  if(document.getElementById('menu').classList.contains('open')) renderTreasLog();
  if(treasCount()===8){ fwUntil=Date.now()+9000; fwTimer=0;   // 花火を打ち上げる
    setTimeout(()=>openDialog('','🎉 おめでとう！',
      ['あわい村の <b>8つの宝</b> を、すべて見つけた！','夜空に、花火が上がっている。','「構造と物語のあいだ」に、きみだけの物語が生まれた。']),500); }
  return true; }
function renderTreasLog(){
  const lab=document.getElementById('treasLabel'); if(lab)lab.textContent='宝さがし（💎 '+treasCount()+'/8）';
  const box=document.getElementById('treasLog'); if(!box)return;
  box.innerHTML=TREASURES.map(t=>t.found
    ? '<div class="t-on">'+t.icon+' '+t.name+' ✓</div>'
    : '<div class="t-off">❔ '+t.hint+'</div>').join('');
}
function eatCrop(){
  let key=P.lastCrop;
  if(!key||P[key]<=0) key=['berries','grapes','lettuce','tomato','mushroom'].find(k=>P[k]>0);
  if(!key){ showToast('🍴 食べるものを持っていない'); return; }
  P[key]--; updateCropHud();
  if(key==='berries'){ P.boostUntil=Date.now()+5000; P.slowUntil=0; showToast('🍓 もぐもぐ… あまい！ すこし速くなった！'); }
  else if(key==='grapes'){ P.slowUntil=Date.now()+6000; P.boostUntil=0; showToast('🍇 ほろ酔い… ふらふら〜（少し遅くなった）'); }
  else if(key==='tomato'){ showToast('🍅 完熟トマト！ 太陽の味がする。'); }
  else if(key==='mushroom'){ showToast('🍄 きのこ！ 森の滋味…ほっと温まる。'); }
  else { showToast('🥬 みずみずしい！'); }
}
/* ── time-of-day tint + manual switch ── */
let timeMode='auto';
const TINT={morning:'rgba(255,176,120,0.15)',day:null,evening:'rgba(255,108,40,0.27)',night:'rgba(10,14,44,0.58)'};
const TORDER=['auto','morning','day','evening','night'];
function curMode(){ if(timeMode!=='auto')return timeMode; const h=new Date().getHours();
  if(h>=5&&h<10)return 'morning'; if(h>=10&&h<16)return 'day'; if(h>=16&&h<19)return 'evening'; return 'night'; }
function isNight(){ return curMode()==='night'; }
// 夜は里の人が寝静まる：keepNight 指定・ねこ・宝を授ける者だけ残し、ほかの村人は隠す
// until 指定の者（例：平和の行進者）はその時刻まで昼夜とも常駐し、過ぎたら去る
function npcHidden(n){ if(n.until!=null) return Date.now()>=n.until;
  return isNight() && !n.keepNight && !n.cat && n.gives==null; }
// night:true の獣は夜だけ里へ下りてくる（昼は不在）
function animalHidden(a){ return a.night && !isNight(); }
function applyTint(){ const m=curMode(),c=TINT[m];
  if(c){ ctx.fillStyle=c; ctx.fillRect(0,0,cv.width,cv.height); }
  if(m==='night'){
    // 各家の窓からこぼれる灯り（夜の闇の上に暖色をにじませる）
    for(const s of HOUSES){
      const bx=s.x*TS-cam.x, by=s.y*TS-cam.y, bw=s.w*TS;
      for(const cx of [bx+8, bx+bw-8]){ const cy=by+TS+9;
        if(cx<-30||cx>cv.width+30||cy<-30||cy>cv.height+30) continue;
        const wg=ctx.createRadialGradient(cx,cy,1, cx,cy,18);
        wg.addColorStop(0,'rgba(255,214,106,0.55)'); wg.addColorStop(0.5,'rgba(255,206,120,0.20)'); wg.addColorStop(1,'rgba(255,206,120,0)');
        ctx.fillStyle=wg; ctx.fillRect(cx-18,cy-18,36,36);
        px(cx-3,cy-3,6,6,'#ffe49a');   // 窓の灯りを点け直す
      }
    }
    // spotlight on 劇団員ラリー — 足元に広がる円形の光のみ
    const lx=Math.round(LARRY.px+TS/2-cam.x), ly=Math.round(LARRY.py+TS-cam.y);
    if(lx>-60&&lx<cv.width+60&&ly>-60&&ly<cv.height+60){
      const g=ctx.createRadialGradient(lx,ly,3, lx,ly,40);
      g.addColorStop(0,'rgba(255,245,200,0.3)'); g.addColorStop(0.55,'rgba(255,240,190,0.12)'); g.addColorStop(1,'rgba(255,240,190,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
    } } }
function updateTimeBtn(){ document.querySelectorAll('#timeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.m===timeMode)); }
const TNAME={morning:'🌅 朝',day:'☀️ 昼',evening:'🌆 夕',night:'🌙 夜'};
function cycleTime(){ timeMode=TORDER[(TORDER.indexOf(timeMode)+1)%TORDER.length]; updateTimeBtn();
  showToast(timeMode==='auto'?('時間帯：自動（'+TNAME[curMode()]+'）'):('時間帯：'+TNAME[curMode()])); }
document.querySelectorAll('#timeSeg button').forEach(b=>b.addEventListener('click',()=>{ timeMode=b.dataset.m; updateTimeBtn(); }));

/* ── 季節（八ヶ岳の四季） ── */
let seasonMode='auto';
const SORDER=['auto','spring','summer','autumn','winter'];
// 月で自動判定：3-5春 / 6-8夏 / 9-11秋 / 12-2冬
function curSeason(){ if(seasonMode!=='auto')return seasonMode; const mo=new Date().getMonth();
  if(mo>=2&&mo<=4)return 'spring'; if(mo>=5&&mo<=7)return 'summer'; if(mo>=8&&mo<=10)return 'autumn'; return 'winter'; }
// 季節ごとの植物パレット（草・木・茂み・花の色がこれで変わる。降りものや空の色は変えない）
//  g1/g2: 草地の市松, tuft: 草の穂, tree:[暗・中・明]の葉, dark:葉の陰, bush:[本体・明・陰], flowers: 花の色（null=花が咲かない）, snow: 冬の積雪
const VEGPAL={
  spring:{g1:'#6fa85f',g2:'#69a259',tuft:'#8ad27a',tree:['#3f8a47','#4f9f57','#62b56a'],dark:'#2f6b3a',
          bush:['#3a8d45','#4f9f57','#327a3a'],flowers:['#f4a6c0','#ffd24f','#ffffff','#e88ad0'],snow:false},
  summer:{g1:'#4f8f48',g2:'#4a8943',tuft:'#63a85a',tree:['#26592f','#2f6b3a','#3c8147'],dark:'#1f4a27',
          bush:['#2f6b3a','#3a7d45','#246030'],flowers:['#e8d24f','#e57ba0','#ffffff','#d98cf0'],snow:false},
  autumn:{g1:'#9c8c4e',g2:'#96863f',tuft:'#b6a55a',tree:['#b8531f','#d6792a','#e8a83a'],dark:'#8a3a1a',
          bush:['#9a6a2a','#b8862a','#7a4a1a'],flowers:['#d98a8a','#e8b24a','#caa0d0','#d6792a'],snow:false},
  winter:{g1:'#8a9080',g2:'#848a78',tuft:'#9aa08c',tree:['#3a5a44','#46684f','#557a5c'],dark:'#2e4a38',
          bush:['#4a5a48','#56684f','#3a4a3a'],flowers:null,snow:true},
};
let VEG=VEGPAL.summer;                       // 描画のたびに render() 冒頭で現在の季節へ更新
// トマトの成長を四季と連動：春＝苗(22)→花(20)／夏＝青い実(23)→完熟(19)／秋＝完熟(19)→枯れ始め(24)／冬＝枯れ(21)
const TOMATO_STAGE={ spring:[22,20], summer:[23,19], autumn:[19,24], winter:[21] };
function applyTomatoSeason(se){ const seq=TOMATO_STAGE[se]||[19]; let i=0;
  for(const cell of TOMATO_CELLS){ const stage=seq[i++%seq.length];
    if(PICKED.some(p=>p.c===cell.c&&p.r===cell.r)) continue;   // 収穫直後で再生待ちのマスは上書きしない
    M[cell.r][cell.c]=stage; } }
// きのこの森：夏のあいだだけ点々と生える（春・秋・冬は出ない＝草地に戻る）
const MUSHROOM_STAGE={ spring:[0], summer:[25], autumn:[0], winter:[0] };
function applyMushroomSeason(se){ const seq=MUSHROOM_STAGE[se]||[25]; let i=0;
  for(const cell of MUSHROOM_CELLS){ const stage=seq[i++%seq.length];
    if(PICKED.some(p=>p.c===cell.c&&p.r===cell.r)) continue;   // 収穫直後で再生待ちのマスは上書きしない
    M[cell.r][cell.c]=stage; } }
// 野イチゴ：夏のあいだだけ実る（春・秋・冬は出ない＝草地に戻る）。各マスは元の色(赤29/黄30)を保持
const WILDBERRY_STAGE={ spring:0, summer:1, autumn:0, winter:0 };
function applyWildberrySeason(se){ const on=WILDBERRY_STAGE[se]!==0;
  for(const [c,r,v] of WILDBERRY){ if(c===56&&r===7) continue;   // 音響装置のマスは触らない
    if(PICKED.some(p=>p.c===c&&p.r===r)) continue;              // 収穫直後で再生待ちのマスは上書きしない
    if(M[r][c]===31) continue;                                  // 収穫後の株はそのまま（PICKEDで戻る）
    M[r][c]=on?v:0; } }
let _lastSeason=null;
function refreshSeasonPal(){ const se=curSeason(); VEG=VEGPAL[se];
  if(se!==_lastSeason){ _lastSeason=se; applyTomatoSeason(se); applyMushroomSeason(se); applyWildberrySeason(se); } }   // 季節が変わったら畑・森を更新

/* ── 富士見町のリアルタイム天候（Open-Meteo・APIキー不要／晴・曇・雨・雪・霧・強風） ── */
const WEATHER={cond:'sunny', windy:false, wind:0, temp:null, icon:'🌤', label:'取得中…'};
function classifyWeather(code, windMs){
  let cond='sunny', icon='☀️', label='晴れ';
  if((code>=71&&code<=77)||code===85||code===86){ cond='snow'; icon='❄️'; label='雪'; }
  else if((code>=51&&code<=67)||(code>=80&&code<=82)||code>=95){ cond='rain'; icon='🌧'; label='雨'; }
  else if(code===45){ cond='fog'; icon='🌫'; label='霧'; }
  else if(code===48){ cond='fog'; icon='🌫'; label='濃い霧'; }
  else if(code===3){ cond='cloudy'; icon='☁️'; label='くもり'; }
  else if(code===1||code===2){ cond='sunny'; icon='⛅'; label='晴れ'; }
  const windy=windMs>=7;
  if(windy){ icon='💨'; label+='・強風'; }
  return {cond,windy,icon,label};
}
function updateWeatherHud(){ const e=document.getElementById('weather'); if(!e)return;
  e.innerHTML=WEATHER.icon+' <b>'+WEATHER.label+(WEATHER.temp!=null?(' '+Math.round(WEATHER.temp)+'°C'):'')+'</b>'; }
async function fetchWeather(){
  try{
    const url='https://api.open-meteo.com/v1/forecast?latitude=35.9146&longitude=138.2306'
      +'&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=ms&timezone=Asia%2FTokyo';
    const d=await (await fetch(url)).json(); const cur=d.current||{};
    const c=classifyWeather(cur.weather_code|0, cur.wind_speed_10m||0);
    WEATHER.cond=c.cond; WEATHER.windy=c.windy; WEATHER.wind=cur.wind_speed_10m||0;
    WEATHER.temp=(cur.temperature_2m!=null?cur.temperature_2m:null); WEATHER.icon=c.icon; WEATHER.label=c.label;
  }catch(e){ WEATHER.icon='🌤'; WEATHER.label='天気を取得できず'; }
  updateWeatherHud();
}
let WX=[];   // 雨・雪・強風の粒子（見やすさ優先で“ほんの少し”だけ）
function updateWeather(){
  const w=WEATHER, push=(w.windy?2.0:0.5)*(w.wind>=12?1.3:1);
  // 降りものは限りなく最小限に
  const cap = w.cond==='rain'?10 : w.cond==='snow'?9 : (w.windy?6:0);
  while(WX.length<cap && Math.random()<0.18){
    WX.push({ x:Math.random()*(cv.width+60)-30, y:-8-Math.random()*30, ph:Math.random()*6.28,
      vy: w.cond==='rain'?(6+Math.random()*3) : w.cond==='snow'?(0.8+Math.random()*0.8) : (0.4+Math.random()*0.6),
      vx: push*(0.6+Math.random()*0.8) + (w.cond==='rain'?1.0:0),
      len: w.cond==='rain'?(4+Math.random()*3):0 });
  }
  for(let i=WX.length-1;i>=0;i--){ const p=WX[i];
    p.ph+=0.05; p.y+=p.vy; p.x+=p.vx + (w.cond==='snow'?Math.sin(p.ph)*0.6:0);
    if(p.y>cv.height+12||p.x>cv.width+34||p.x<-34) WX.splice(i,1); }
  if(WX.length>cap) WX.length=cap;
}
// 天気は主に淡い空の色で示す（視界をさえぎらない）
const WTINT={sunny:null, cloudy:'rgba(150,156,168,0.12)', rain:'rgba(78,92,116,0.16)', snow:'rgba(210,222,240,0.10)'};
function drawWeather(){
  const w=WEATHER, c=WTINT[w.cond];
  if(c){ ctx.fillStyle=c; ctx.fillRect(0,0,cv.width,cv.height); }
  for(const p of WX){
    if(w.cond==='rain'){ ctx.strokeStyle='rgba(180,200,228,0.30)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-p.vx*0.7, p.y-p.len); ctx.stroke(); }
    else if(w.cond==='snow'){ ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fillRect(p.x|0,p.y|0,1,1); }
    else { ctx.strokeStyle='rgba(228,226,210,0.22)'; ctx.lineWidth=1;   // 強風の舞い（晴・曇でも）
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-7,p.y-1); ctx.stroke(); }
  }
}
// 雨の日の虹（光が要るので夜は出さない。降り出すと淡く現れ、止むと消える）
let rainbowA=0;
const RBCOL=['#ff7a7a','#ffb24d','#ffe866','#8ce99a','#74c0fc','#7c8cff','#b78cff'];
function drawRainbow(){
  const target=(WEATHER.cond==='rain' && curMode()!=='night') ? 1 : 0;
  rainbowA += (target-rainbowA)*0.03;                 // ゆっくり淡く現れ・消える
  if(rainbowA<0.012) return;
  const cx=cv.width*0.6, cy=cv.height*1.18, baseR=cv.height*0.92;
  const band=Math.max(2, Math.round(cv.height*0.013));
  ctx.save(); ctx.lineWidth=band+0.5;
  for(let i=0;i<RBCOL.length;i++){
    ctx.globalAlpha=0.16*rainbowA;
    ctx.strokeStyle=RBCOL[i];
    ctx.beginPath();
    ctx.arc(cx, cy, baseR-i*band, Math.PI, Math.PI*2);  // 空にかかる上半分のアーチ
    ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha=1;
}
// 濃い霧（霧・濃い霧）：白い靄がゆっくり流れ、視界がぼやける。出はじめ・晴れ間に淡くなる
let fogA=0;
function drawFog(){
  const isFog=(WEATHER.cond==='fog');
  const target=isFog?1:0;
  fogA += (target-fogA)*0.02;                          // ゆっくり立ちこめ・晴れる
  if(fogA<0.01) return;
  const dense=(WEATHER.label==='濃い霧')?1.35:1;        // rime fog はより濃く
  const t=Date.now();
  ctx.save();
  ctx.fillStyle='rgba(214,220,226,'+(0.22*dense*fogA)+')';  // 全面のうっすらした靄
  ctx.fillRect(0,0,cv.width,cv.height);
  for(let i=0;i<4;i++){                                 // 流れる靄のかたまり
    const span=cv.width+220, y=cv.height*(0.15+i*0.24);
    const sp=0.006+i*0.002, x=((t*sp + i*180) % span) - 110;
    const r=70+i*16;
    const g=ctx.createRadialGradient(x,y,0, x,y,r);
    g.addColorStop(0,'rgba(232,236,240,'+(0.18*dense*fogA)+')');
    g.addColorStop(1,'rgba(232,236,240,0)');
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  ctx.restore(); ctx.globalAlpha=1;
}
// ── 観測機：畑のPico 2 W（AHT20）と連携 ───────────────────────────
//   Pico の main.py が WiFi 経由で温湿度を 10分ごとにスプレッドシート(GAS)へ記録。
//   ・スマホ含む誰でも：クラウド(GAS)から最新値を取得して表示（JSONPでCORS回避）
//   ・PC直結時のみ：Web Serial で即時のライブ値も表示できる
const GAS_OBS_URL='https://script.google.com/macros/s/AKfycbzJ-dB8q2oNWJ3bbORkV634H9Ndk0iYjZsP5e3GVwUa56c52AJpI-SJORq-FkIOisko/exec';
const CLOUD={ok:false,loading:false,t:null,h:null,s:null,wt:null,ph:null,wd:null,ct:null,ch:null,vib:null,bt:null,cw:null,abv:null,ts:0};
const SENSOR={supported:('serial' in navigator),connected:false,connecting:false,temp:null,hum:null,soil:null,ts:0,err:''};
let _obsPort=null,_obsReader=null,_obsKeep=false;
function refreshObs(){ const el=document.getElementById('obsBox'); if(el) el.innerHTML=obsBoxHTML(); }
function _ago(ms){ const a=Date.now()-ms; if(a<90000)return 'たった今'; if(a<3600000)return Math.round(a/60000)+'分前'; if(a<86400000)return Math.round(a/3600000)+'時間前'; return Math.round(a/86400000)+'日前'; }
// 観測機ダイアログを開いている間だけ、15秒ごとに最新値を取り直す
let _obsTimer=null;
function startObsLive(){ stopObsLive(); _obsTimer=setInterval(()=>{
  if(!dlgOpen || (!document.getElementById('obsBox') && !document.getElementById('wellBox') && !document.getElementById('cellarBox'))){ stopObsLive(); return; }
  fetchCloudObs();
}, 15000); }
function stopObsLive(){ if(_obsTimer){ clearInterval(_obsTimer); _obsTimer=null; } }
// ── GASへのJSONP呼び出し（コールバック登録・後片付け・タイムアウトを共通化） ──
let _gasSeq=1;
function gasJsonp(params, onData, onFail, timeoutMs){
  const cb='_gascb'+(_gasSeq++)+'_'+Date.now(); const s=document.createElement('script'); let done=false;
  const cleanup=()=>{ try{delete window[cb];}catch(e){window[cb]=undefined;} if(s.parentNode)s.parentNode.removeChild(s); };
  window[cb]=function(d){ done=true; cleanup(); onData(d); };
  s.onerror=function(){ if(!done){ done=true; cleanup(); if(onFail)onFail('取得に失敗しました'); } };
  s.src=GAS_OBS_URL+'?'+(params?params+'&':'')+'callback='+cb+'&_='+Date.now();
  document.head.appendChild(s);
  setTimeout(()=>{ if(!done){ done=true; cleanup(); if(onFail)onFail('タイムアウト'); } }, timeoutMs||12000);
}
// クラウド(GAS)から最新の観測値を取得（JSONP）
function fetchCloudObs(){
  if(CLOUD.loading) return;
  CLOUD.loading=true; refreshObs();
  gasJsonp('', d=>{ CLOUD.loading=false;
    if(d&&d.t!=null){ CLOUD.ok=true; CLOUD.t=d.t; CLOUD.h=d.h; CLOUD.s=(d.s!=null?d.s:null);
      CLOUD.wt=(d.wt!=null?d.wt:null); CLOUD.ph=(d.ph!=null?d.ph:null); CLOUD.wd=(d.wd!=null?d.wd:null);
      CLOUD.ct=(d.ct!=null?d.ct:null); CLOUD.ch=(d.ch!=null?d.ch:null); CLOUD.vib=(d.vib!=null?d.vib:null);
      CLOUD.bt=(d.bt!=null?d.bt:null); CLOUD.cw=(d.cw!=null?d.cw:null); CLOUD.abv=(d.abv!=null?d.abv:null); CLOUD.ts=d.ts?Date.parse(d.ts):Date.now(); }
    refreshObs(); refreshWell(); refreshCellar(); refreshStill(); },
  ()=>{ CLOUD.loading=false; refreshObs(); }, 9000);
}
function obsBoxHTML(){
  // ① PC直結（Web Serial）が新鮮なら最優先
  if(SENSOR.connected && SENSOR.temp!=null && (Date.now()-SENSOR.ts)<8000){
    return '📡 <b>畑のリアル観測値</b>（Pico直結）<br>'
      +'・気温：<b>'+SENSOR.temp.toFixed(1)+' ℃</b><br>'
      +'・湿度：<b>'+SENSOR.hum.toFixed(1)+' %</b><br>'
      +(SENSOR.soil!=null?'・土壌：<b>'+SENSOR.soil.toFixed(0)+' %</b><br>':'')
      +'<span style="opacity:.7;font-size:12px">🟢 USB接続中 — '+new Date(SENSOR.ts).toLocaleTimeString('ja-JP')+' 更新</span>';
  }
  if(SENSOR.connected) return '📡 <b>Picoに接続中…</b> データ受信を待っています。';
  let h;
  if(CLOUD.ok && CLOUD.t!=null){            // ② クラウド記録の最新値（スマホ含め誰でも）
    h='📡 <b>畑のリアル観測値</b>（Pico → クラウド記録）<br>'
      +'・気温：<b>'+(Math.round(CLOUD.t*10)/10)+' ℃</b><br>'
      +'・湿度：<b>'+(Math.round(CLOUD.h*10)/10)+' %</b><br>'
      +(CLOUD.s!=null?'・土壌：<b>'+Math.round(CLOUD.s)+' %</b><br>':'')
      +'<span style="opacity:.7;font-size:12px">🛰 '+_ago(CLOUD.ts)+'・15秒ごとに更新（記録は10分ごと）'+(CLOUD.loading?' 🔄':'')+'</span>';
  }else if(CLOUD.loading){                  // ③ 取得中
    h='📡 <b>観測値を取得中…</b>';
  }else{                                    // ④ フォールバック（気象API）
    const w=WEATHER;
    const temp=(w.temp!=null)?(Math.round(w.temp*10)/10+'℃'):'—';
    const wind=(w.wind!=null)?(Math.round(w.wind*10)/10+' m/s'):'—';
    h='📡 <b>いまの気象</b>（参考・気象データ）<br>・気温：'+temp+'<br>・風速：'+wind+'<br>・天候：'+w.label+'<br>'
      +'<a href="#" class="more" onclick="fetchCloudObs();return false;">🔄 畑の観測値を取得</a>';
  }
  if(SENSOR.supported && !SENSOR.connected){   // PC直結のWeb Serial（任意）
    h+='<br><a href="#" class="more" style="font-size:12px" onclick="connectSensor();return false;">'
      +(SENSOR.connecting?'接続中…':'📟 PCならUSB直結でライブ表示')+'</a>';
  }
  if(SENSOR.err) h+='<br><span style="color:#f09c9c;font-size:12px">'+SENSOR.err+'</span>';
  return h;
}
function parseSensorLine(line){
  const m=line.match(/OBS,(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(-?\d+(?:\.\d+)?))?/);
  if(m){ SENSOR.temp=parseFloat(m[1]); SENSOR.hum=parseFloat(m[2]); if(m[3]!=null) SENSOR.soil=parseFloat(m[3]); SENSOR.ts=Date.now(); refreshObs(); }
}
async function _obsRead(){
  const dec=new TextDecoder(); let buf='';
  while(_obsKeep && _obsPort && _obsPort.readable){
    _obsReader=_obsPort.readable.getReader();
    try{
      while(true){ const {value,done}=await _obsReader.read(); if(done) break;
        buf+=dec.decode(value,{stream:true});
        let nl; while((nl=buf.indexOf('\n'))>=0){ parseSensorLine(buf.slice(0,nl)); buf=buf.slice(nl+1); }
        if(buf.length>4096) buf=buf.slice(-256);
      }
    }catch(e){}
    finally{ try{_obsReader.releaseLock();}catch(_){} }
  }
  SENSOR.connected=false; refreshObs();
}
async function _obsOpen(port){
  await port.open({baudRate:115200});
  _obsPort=port; _obsKeep=true;
  SENSOR.connected=true; SENSOR.connecting=false; SENSOR.err=''; refreshObs();
  _obsRead();
}
async function connectSensor(){
  if(!SENSOR.supported){ SENSOR.err='このブラウザはWeb Serial非対応です（PCのChrome／Edgeで開いてください）'; refreshObs(); return; }
  if(SENSOR.connected||SENSOR.connecting) return;
  SENSOR.connecting=true; SENSOR.err=''; refreshObs();
  try{
    const port=await navigator.serial.requestPort({filters:[{usbVendorId:0x2E8A}]});
    await _obsOpen(port);
  }catch(e){ SENSOR.connecting=false; SENSOR.err='接続できませんでした（'+(e.message||e)+'）'; refreshObs(); }
}
async function _obsAutoConnect(){
  if(!SENSOR.supported) return;
  try{
    const ports=await navigator.serial.getPorts();
    const port=ports.find(p=>{ const i=p.getInfo&&p.getInfo(); return i&&i.usbVendorId===0x2E8A; })||ports[0];
    if(port){ SENSOR.connecting=true; refreshObs(); await _obsOpen(port); }
  }catch(e){ SENSOR.connecting=false; }
}
if(SENSOR.supported){
  navigator.serial.addEventListener('disconnect',e=>{ if(e.target===_obsPort){ _obsKeep=false; SENSOR.connected=false; refreshObs(); } });
  _obsAutoConnect();
}
fetchCloudObs();   // 起動時に一度、畑の最新観測値を取得しておく
// ── 観測グラフ（1日/1週間/1か月/1年）— GASの ?range= から系列を取得して描画 ──
const OBS_RANGES=[['day','1日'],['week','1週間'],['month','1か月'],['year','1年']];
let _obsChart={range:'day',points:null,err:''};
/* 期間セグメントと系列取得は、畑の観測グラフ・井戸の水質グラフで共用 */
function rangeSegHTML(active,fn){
  return OBS_RANGES.map(r=>{ const on=r[0]===active;
    const st='flex:1;min-width:56px;font-family:inherit;font-size:13px;padding:8px 6px;cursor:pointer;border:2px solid '
      +(on?'var(--gold)':'#4a4030')+';background:'+(on?'var(--gold)':'rgba(231,200,120,.10)')+';color:'+(on?'#221d16':'var(--paper)')+';'+(on?'font-weight:bold;':'');
    return '<button style="'+st+'" onclick="'+fn+'(\''+r[0]+'\')">'+r[1]+'</button>'; }).join('');
}
function loadRangeChart(chart, range, ids, fnName, draw){
  chart.range=range; chart.err='';
  const seg=document.getElementById(ids.seg); if(seg) seg.innerHTML=rangeSegHTML(range,fnName);
  const msg=document.getElementById(ids.msg); if(msg) msg.textContent='読み込み中…';
  gasJsonp('range='+range, d=>{
    if(d && d.points){ chart.points=d.points; chart.err=''; }
    else { chart.points=[]; chart.err='グラフ用データが取得できません。GASを最新コードで再デプロイしてください。'; }
    draw(); }, err=>{ chart.err=err; draw(); });
}
function openObsGraph(){
  const h='<div id="obsRangeSeg" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+rangeSegHTML(_obsChart.range,'obsGraph')+'</div>'
    +'<canvas id="obsChart" width="640" height="320" style="width:100%;height:auto;background:#15120d;border:2px solid #4a4030;display:block"></canvas>'
    +'<div id="obsChartMsg" style="font-size:12px;color:#b7ad97;margin-top:8px;line-height:1.7"></div>';
  openPanel('📈 畑の観測グラフ', h);
  obsGraph(_obsChart.range||'day');
}
function obsGraph(range){ loadRangeChart(_obsChart, range, {seg:'obsRangeSeg',msg:'obsChartMsg'}, 'obsGraph', drawObsChart); }
function drawObsChart(){
  const cvs=document.getElementById('obsChart'); if(!cvs) return;
  const g=cvs.getContext('2d'), W=cvs.width, H=cvs.height;
  g.fillStyle='#15120d'; g.fillRect(0,0,W,H);
  const msg=document.getElementById('obsChartMsg');
  if(_obsChart.err){ if(msg) msg.textContent='⚠ '+_obsChart.err;
    g.fillStyle='#6a6356'; g.font='14px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('—', W/2, H/2); return; }
  const pts=_obsChart.points||[];
  if(!pts.length){ if(msg) msg.textContent='まだこの期間の記録がありません（10分ごとに増えていきます）';
    g.fillStyle='#6a6356'; g.font='14px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('データなし', W/2, H/2); return; }
  const padL=42,padR=44,padT=16,padB=28, x0=padL,x1=W-padR,y0=padT,y1=H-padB;
  const ts=pts.map(p=>p[0]),temps=pts.map(p=>p[1]);
  const tmin=Math.min(...ts),tmax=Math.max(...ts);
  let Tmn=Math.min(...temps),Tmx=Math.max(...temps);
  if(Tmx-Tmn<2){const m=(Tmx+Tmn)/2;Tmn=m-1;Tmx=m+1;}
  Tmn=Math.floor(Tmn-1);Tmx=Math.ceil(Tmx+1);
  const xOf=t=>(tmax===tmin)?(x0+x1)/2:x0+(t-tmin)/(tmax-tmin)*(x1-x0);
  const yT=v=>y1-(v-Tmn)/(Tmx-Tmn)*(y1-y0);
  const yH=v=>y1-v/100*(y1-y0);
  g.strokeStyle='#3a352b';g.lineWidth=1;g.font='10px sans-serif';g.textBaseline='middle';
  for(let i=0;i<=4;i++){ const yy=y0+(y1-y0)*i/4;
    g.beginPath();g.moveTo(x0,yy);g.lineTo(x1,yy);g.stroke();
    g.fillStyle='#e0a060';g.textAlign='right';g.fillText((Tmx-(Tmx-Tmn)*i/4).toFixed(0)+'°',x0-4,yy);
    g.fillStyle='#70a0d0';g.textAlign='left';g.fillText((100-100*i/4).toFixed(0)+'%',x1+4,yy);
  }
  const fmt=(ms)=>{const d=new Date(ms),r=_obsChart.range,p2=n=>('0'+n).slice(-2);
    if(r==='day')return p2(d.getHours())+':'+p2(d.getMinutes());
    if(r==='week'||r==='month')return (d.getMonth()+1)+'/'+d.getDate();
    return (''+d.getFullYear()).slice(2)+'/'+(d.getMonth()+1);};
  g.fillStyle='#8a8378';g.textAlign='center';g.textBaseline='top';
  g.fillText(fmt(tmin),x0,y1+5); g.fillText(fmt(tmax),x1,y1+5);
  g.lineWidth=2;
  g.strokeStyle='#70a0d0';g.beginPath();pts.forEach((p,i)=>{const X=xOf(p[0]),Y=yH(p[2]);i?g.lineTo(X,Y):g.moveTo(X,Y);});g.stroke();
  // 土壌（0〜100%・欠損は線を切る）
  g.strokeStyle='#7cba6a';{let pen=false;g.beginPath();pts.forEach(p=>{const v=p[3];
    if(v==null||isNaN(v)){pen=false;return;} const X=xOf(p[0]),Y=yH(v);
    if(pen)g.lineTo(X,Y);else{g.moveTo(X,Y);pen=true;}});g.stroke();}
  g.strokeStyle='#e0a060';g.beginPath();pts.forEach((p,i)=>{const X=xOf(p[0]),Y=yT(p[1]);i?g.lineTo(X,Y):g.moveTo(X,Y);});g.stroke();
  g.textAlign='left';g.textBaseline='middle';g.font='12px sans-serif';
  g.fillStyle='#e0a060';g.fillText('● 気温',x0+6,y0+6);
  g.fillStyle='#70a0d0';g.fillText('● 湿度',x0+64,y0+6);
  g.fillStyle='#7cba6a';g.fillText('● 土壌',x0+122,y0+6);
  if(msg) msg.textContent=pts.length+'点 ・ '+fmt(tmin)+' 〜 '+fmt(tmax)+'（気温＝自動目盛／湿度・土壌＝0〜100%）';
}
function sensorPages(){
  return [
    '（畑のかたわらで、小さな観測機がランプを点滅させている）<br><br><div id="obsBox">'+obsBoxHTML()+'</div>'
      +'<a href="#" class="more" onclick="closeDlg();openObsGraph();return false;">📈 グラフで見る（1日／1週／1月／1年）</a>',
    'この観測機は、畑に置かれた<b>ラズベリーパイ Pico 2 W</b>の気温・湿度・土壌湿度センサーとつながっている。',
    '気温と湿度は<b>10分ごとにクラウド（スプレッドシート）へ記録</b>され、ここに最新値が映し出される。',
    '（スマホでもPCでも見られる。記録はずっと残るので、畑の空気の移ろいを後から辿れるのだ）'
  ];
}
// ── 井戸（葡萄畑の南）：将来 水温・pH を表示。今は準備中 ──
function refreshWell(){ const el=document.getElementById('wellBox'); if(el) el.innerHTML=wellBoxHTML(); }
function wellBoxHTML(){
  const ready=(CLOUD.wt!=null||CLOUD.ph!=null||CLOUD.wd!=null);
  const wt=(CLOUD.wt!=null)?(Math.round(CLOUD.wt*10)/10+' ℃'):'—（準備中）';
  const ph=(CLOUD.ph!=null)?(Math.round(CLOUD.ph*100)/100):'—（準備中）';
  const wd=(CLOUD.wd!=null)?(Math.round(CLOUD.wd*10)/10+' cm'):'—（準備中）';
  let h='⛲ <b>井戸の水質</b><br>・水温：<b>'+wt+'</b><br>・pH：<b>'+ph+'</b><br>・水深：<b>'+wd+'</b><br>';
  if(ready) h+='<span style="opacity:.7;font-size:12px">🛰 '+_ago(CLOUD.ts)+'・15秒ごとに更新</span>';
  else h+='<span style="opacity:.75;font-size:12px">※ 水温計・pH計・水深計（距離センサー）は準備中。つながると、井戸の温度・pH・水深がここに映ります。</span>';
  return h;
}
function wellPages(){
  return [
    '（葡萄畑の南のへりに、古い石積みの井戸がある。のぞくと、底にひんやりした水の気配。）<br><br><div id="wellBox">'+wellBoxHTML()+'</div>'
      +'<a href="#" class="more" onclick="closeDlg();openWellGraph();return false;">📈 グラフで見る（pH・水深）</a>',
    'この井戸は<b>pH計</b>と<b>水深計</b>につながっている。',
    'ワイン用の葡萄を育てる水の<b>酸性度（pH）と水位</b>を、ここで見守れる。',
    '（水を知ることは、葡萄を知ること。実りは、水からはじまる。）'
  ];
}
// ── 井戸の水質グラフ（pH・水深）── GASの ?range= 系列（7列）から ph=p[5] / wd=p[6] を描画
let _wellChart={range:'day',points:null,err:''};
function openWellGraph(){
  const h='<div id="wellRangeSeg" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+rangeSegHTML(_wellChart.range,'wellGraph')+'</div>'
    +'<canvas id="wellChart" width="640" height="320" style="width:100%;height:auto;background:#15120d;border:2px solid #4a4030;display:block"></canvas>'
    +'<div id="wellChartMsg" style="font-size:12px;color:#b7ad97;margin-top:8px;line-height:1.7"></div>';
  openPanel('📈 井戸の水質グラフ', h);
  wellGraph(_wellChart.range||'day');
}
function wellGraph(range){ loadRangeChart(_wellChart, range, {seg:'wellRangeSeg',msg:'wellChartMsg'}, 'wellGraph', drawWellChart); }
function drawWellChart(){
  const cvs=document.getElementById('wellChart'); if(!cvs) return;
  const g=cvs.getContext('2d'), W=cvs.width, H=cvs.height;
  g.fillStyle='#15120d'; g.fillRect(0,0,W,H);
  const msg=document.getElementById('wellChartMsg');
  if(_wellChart.err){ if(msg) msg.textContent='⚠ '+_wellChart.err;
    g.fillStyle='#6a6356'; g.font='14px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('—',W/2,H/2); return; }
  const all=_wellChart.points||[];
  const pts=all.filter(p=>p[4]!=null||p[5]!=null||p[6]!=null);   // 水温/pH/水深 のどれか
  if(!pts.length){ if(msg) msg.textContent=(all.length?'まだ井戸の記録がありません（10分ごとに増えます。GAS未更新なら再デプロイを）':'まだこの期間の記録がありません');
    g.fillStyle='#6a6356'; g.font='14px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('データなし',W/2,H/2); return; }
  const padL=10,padR=10,padT=24,padB=26, x0=padL,x1=W-padR,y0=padT,y1=H-padB;
  const ts=pts.map(p=>p[0]); const tmin=Math.min(...ts),tmax=Math.max(...ts);
  const xOf=t=>(tmax===tmin)?(x0+x1)/2:x0+(t-tmin)/(tmax-tmin)*(x1-x0);
  // 各線は単位が違うので、それぞれ自動目盛（スパークライン式）・現在値は凡例に
  const series=[
    {i:5,c:'#c89cd8',name:'pH',unit:'',dec:2},
    {i:4,c:'#e0a060',name:'水温',unit:'℃',dec:1},
    {i:6,c:'#6fb0c0',name:'水深',unit:'cm',dec:1}
  ];
  g.strokeStyle='#3a352b';g.lineWidth=1;
  for(let k=0;k<=4;k++){ const yy=y0+(y1-y0)*k/4; g.beginPath();g.moveTo(x0,yy);g.lineTo(x1,yy);g.stroke(); }
  const fmt=(ms)=>{const d=new Date(ms),r=_wellChart.range,p2=n=>('0'+n).slice(-2);
    if(r==='day')return p2(d.getHours())+':'+p2(d.getMinutes());
    if(r==='week'||r==='month')return (d.getMonth()+1)+'/'+d.getDate();
    return (''+d.getFullYear()).slice(2)+'/'+(d.getMonth()+1);};
  g.fillStyle='#8a8378';g.font='10px sans-serif';g.textAlign='left';g.textBaseline='top';
  g.fillText(fmt(tmin),x0,y1+5); g.textAlign='right'; g.fillText(fmt(tmax),x1,y1+5);
  g.lineWidth=2; g.font='11px sans-serif'; g.textBaseline='middle';
  let lx=x0+2;
  for(const s of series){
    const vals=pts.map(p=>p[s.i]).filter(v=>v!=null);
    if(!vals.length) continue;
    let mn=Math.min(...vals), mx=Math.max(...vals);
    if(mx-mn<0.2){const m=(mx+mn)/2;mn=m-0.5;mx=m+0.5;} const pd=(mx-mn)*0.15; mn-=pd; mx+=pd;
    const yOf=v=>y1-(v-mn)/(mx-mn)*(y1-y0);
    g.strokeStyle=s.c; let pen=false; g.beginPath();
    pts.forEach(p=>{ const v=p[s.i]; if(v==null){pen=false;return;} const X=xOf(p[0]),Y=yOf(v); if(pen)g.lineTo(X,Y);else{g.moveTo(X,Y);pen=true;} });
    g.stroke();
    const cur=vals[vals.length-1], lbl='● '+s.name+' '+cur.toFixed(s.dec)+s.unit;
    g.fillStyle=s.c; g.textAlign='left'; g.fillText(lbl, lx, y0-13);
    lx += g.measureText(lbl).width + 12;
  }
  if(msg) msg.textContent=pts.length+'点 ・ '+fmt(tmin)+' 〜 '+fmt(tmax)+'（各線は自動目盛・現在値は上の凡例）';
}
function refreshCellar(){ const el=document.getElementById('cellarBox'); if(el) el.innerHTML=cellarBoxHTML(); }
function cellarBoxHTML(){
  const ready=(CLOUD.ct!=null||CLOUD.ch!=null||CLOUD.vib!=null);
  const ct=(CLOUD.ct!=null)?(Math.round(CLOUD.ct*10)/10+' ℃'):'—（準備中）';
  const ch=(CLOUD.ch!=null)?(Math.round(CLOUD.ch*10)/10+' %'):'—（準備中）';
  const vib=(CLOUD.vib!=null)?(Math.round(CLOUD.vib)+' 回/分'):'—（準備中）';
  let h='🛖 <b>室の貯蔵環境</b><br>・室温：<b>'+ct+'</b><br>・湿度：<b>'+ch+'</b><br>・振動：<b>'+vib+'</b><br>';
  if(ready) h+='<span style="opacity:.7;font-size:12px">🛰 '+_ago(CLOUD.ts)+'・15秒ごとに更新</span>';
  else h+='<span style="opacity:.75;font-size:12px">※ 室の温湿度計・振動センサーは準備中（新しいPicoで実装予定）。つながると、ここに貯蔵環境が映ります。</span>';
  return h;
}
function cellarPages(){
  return [
    '（葡萄畑の南西、山すそをくりぬいた土の室（むろ）がある。入口から、ひんやりと土の匂いが流れてくる。）<br><br><div id="cellarBox">'+cellarBoxHTML()+'</div>',
    'ここは<b>ワインを貯蔵する室</b>。土と山がつくる、年じゅう一定の涼しさ。',
    'やがて<b>室温・湿度・振動</b>を見張るセンサーがつき、ワインが静かに眠る環境を、ここに映す。',
    'この村のいちごやトマトと同じ。葡萄もまた、人の手と自然のあわいで実りになる。',
    '（暗がりに、樽がいくつか、じっと並んでいる。）'
  ];
}
// ── 蒸留所（葡萄畑とレタス畑の間）：将来 ボイラー温度・冷却水温・アルコール度数を表示。今は準備中 ──
function refreshStill(){ const el=document.getElementById('stillBox'); if(el) el.innerHTML=stillBoxHTML(); }
function stillBoxHTML(){
  const ready=(CLOUD.bt!=null||CLOUD.cw!=null||CLOUD.abv!=null);
  const bt=(CLOUD.bt!=null)?(Math.round(CLOUD.bt*10)/10+' ℃'):'—（準備中）';
  const cw=(CLOUD.cw!=null)?(Math.round(CLOUD.cw*10)/10+' ℃'):'—（準備中）';
  const abv=(CLOUD.abv!=null)?(Math.round(CLOUD.abv*10)/10+' %'):'—（準備中）';
  let h='🥃 <b>蒸留の要（かなめ）</b><br>・ボイラー温度：<b>'+bt+'</b><br>・冷却水温：<b>'+cw+'</b><br>・アルコール度数：<b>'+abv+'</b><br>';
  if(ready) h+='<span style="opacity:.7;font-size:12px">🛰 '+_ago(CLOUD.ts)+'・15秒ごとに更新</span>';
  else h+='<span style="opacity:.75;font-size:12px">※ ボイラーの温度計・冷却水の水温計・アルコール度数計は準備中（新しいPicoで実装予定）。つながると、ここに蒸留のようすが映ります。</span>';
  return h;
}
function stillPages(){
  return [
    '（葡萄畑とレタス畑のあいだ、銅の単式蒸留器（ポットスチル）が湯気を上げている。かまどのとろ火が、玉ねぎ形の胴をそっとあたためる。）<br><br><div id="stillBox">'+stillBoxHTML()+'</div>',
    'ここは<b>蒸留所</b>。葡萄からできた酒を静かに沸かし、立ちのぼる香りだけをすくいとる。',
    'やがて<b>ボイラー温度・冷却水温・アルコール度数</b>を見張るセンサーがつき、蒸留のかなめを、ここに映す。',
    '沸かしすぎず、冷やしそこねず。温度のあわいを見極めることが、澄んだ一滴になる。',
    '（葡萄畑の水、井戸の水、室のねむり——そのすべての先に、この一滴がある。）'
  ];
}
// アトリエの屋外台所
function kitchenPages(){
  const got=P.berries+P.grapes+P.lettuce+P.tomato+P.mushroom;
  const base=[
    '（砂漠のはずれ、アトリエの屋外台所。日に焼けた木のカウンターで、鍋がことこと鳴っている）',
    'ここは、織音さんの台所。畑で採れたものが、ここで湯気になる。',
    'トマトを煮て、レタスを刻んで、いちごはそのまま摘まんで。',
    '〈つくる〉のあいだには、いつも〈食べる〉がある。手を動かし、火をかこむ。'];
  base.push(got>0
    ? '（収穫した野菜があるね。E ／ 🍴ボタンで、ここの火を思いながら食べてみよう）'
    : '（鍋からいい匂い。畑で何か収穫してきたら、また寄ってみて）');
  return base;
}
const SNAME={spring:'🌸 春',summer:'☀️ 夏',autumn:'🍁 秋',winter:'❄️ 冬'};
function updateSeasonBtn(){ document.querySelectorAll('#seasonSeg button').forEach(b=>b.classList.toggle('on',b.dataset.s===seasonMode)); }
function cycleSeason(){ seasonMode=SORDER[(SORDER.indexOf(seasonMode)+1)%SORDER.length]; updateSeasonBtn();
  showToast(seasonMode==='auto'?('季節：自動（'+SNAME[curSeason()]+'）'):('季節：'+SNAME[curSeason()])); }
document.querySelectorAll('#seasonSeg button').forEach(b=>b.addEventListener('click',()=>{ seasonMode=b.dataset.s; updateSeasonBtn(); }));

/* settings menu open/close */
const menuEl=document.getElementById('menu'), menuScrim=document.getElementById('menuScrim');
function openMenu(){ menuEl.classList.add('open'); menuScrim.classList.add('open'); renderTreasLog(); }
function closeMenu(){ menuEl.classList.remove('open'); menuScrim.classList.remove('open'); }
document.getElementById('menuBtn').addEventListener('click',()=>menuEl.classList.contains('open')?closeMenu():openMenu());
document.getElementById('menuClose').addEventListener('click',closeMenu);
menuScrim.addEventListener('click',closeMenu);

function wcolor(c){
  if(/舞台/.test(c))return '#b79cf0';
  if(/MV|映像|撮影|映画/.test(c))return '#f08c9c';
  if(/構造|建築|建設|模型/.test(c))return '#8cb4e8';
  if(/空間|展示|美術|インスタ/.test(c))return '#8ce0a8';
  return '#d7cfb6';
}
/* 作品一覧は works.json から読む（index.html を更新したら sync-works.ps1 で再生成） */
let WORKS=null;
async function loadWorks(){
  if(WORKS) return WORKS;
  try{
    const res=await fetch('works.json',{cache:'no-store'});
    if(res.ok){ const d=await res.json(); if(Array.isArray(d)) WORKS=d; }
  }catch(e){ console.warn('works load failed',e); }
  return WORKS;
}
async function openWorksPanel(){
  const works=await loadWorks();
  if(!works){
    openPanel('🏛 美術館 — Works',
      '<p style="font-size:14px;line-height:1.9">作品一覧を読み込めませんでした。</p>'
      +'<a class="more" href="index.html#works-section">本サイトの作品一覧を見る →</a>');
    return;
  }
  let h='', n=0;
  for(const yr of works){
    h+='<div class="wyear"><h3>'+yr.y+'</h3>';
    for(const it of yr.items){ n++;
      const col=wcolor(it.c);
      const chip=it.c?'<span class="wc" style="background:'+col+'22;color:'+col+'">'+it.c+'</span>':'';
      h+='<div class="witem"><span class="wm">'+it.m+'</span>'+chip+'<span class="wt">'+it.t+'</span></div>';
    }
    h+='</div>';
  }
  openPanel('🏛 美術館 — Works ('+n+')',h);
}
function openAppsPanel(){
  let h='<div class="agrid">';
  for(const cat of APPS){
    h+='<div class="acat">'+cat.cat+'</div>';
    for(const a of cat.items)
      h+='<a class="acard" href="'+a.u+'" target="_blank" rel="noopener"><div class="an">'+a.n+'</div><div class="au">'+a.u.replace(/^https?:\/\//,'')+'</div></a>';
  }
  h+='</div>';
  openPanel('🔧 工房 — Apps',h);
}
function openGalleryPanel(){
  let h='<p style="font-size:13px;line-height:1.8;margin-bottom:10px">渡邊織音の3D作品（Sketchfab）。カードを選ぶと、その場で回して鑑賞できます。</p><div class="agrid">';
  SKETCHFAB.forEach((m,i)=> h+='<button class="acard gcard" onclick="galleryShow('+i+')"><div class="an">'+m.name+'</div><div class="au">3Dで見る ▶</div></button>');
  h+='</div><a class="more" href="https://sketchfab.com/watanabeshikine" target="_blank" rel="noopener">Sketchfabのページを開く ↗</a>';
  openPanel('🖼 3Dギャラリー — Sketchfab ('+SKETCHFAB.length+')',h);
}
function galleryShow(i){
  const m=SKETCHFAB[i];
  openPanel('🖼 '+m.name,
   '<div class="gback"><button class="gbackbtn" onclick="openGalleryPanel()">← 一覧へ</button>'
   +'<a class="gext" href="https://sketchfab.com/3d-models/'+m.uid+'" target="_blank" rel="noopener">Sketchfabで開く ↗</a></div>'
   +'<div class="gframe"><iframe title="'+m.name+'" src="https://sketchfab.com/models/'+m.uid+'/embed?ui_theme=dark&autospin=0.2&ui_infos=0" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen mozallowfullscreen webkitallowfullscreen frameborder="0"></iframe></div>');
}
/* newsletter signup → GAS (重複チェック・登録・通知を一括処理) */
const GAS_URL='https://script.google.com/macros/s/AKfycbxc09CWmHQr9pjykGosCwf3hiCGWc5jT2vDZdiLdJ2Z0yUj9ThR1G5p495gNmOYZvAgzg/exec';
/* 焚き火ラジオ（ポッドキャスト）— いまは開局準備中。配信が決まったら下の枠に埋め込み/リンクを差し込む */
function openPodcastPanel(){
  openPanel('🔥 焚き火ラジオ — Podcast',
    `<div style="font-size:14px;line-height:1.95">
       <p>焚き火を囲んで、ぽつり、ぽつりと語るラジオ。<br>夜の村の小さな声を、いつか、ここから配信します。</p>
       <div style="margin:14px 0;padding:16px 14px;border:2px dashed var(--gold);border-radius:4px;text-align:center;color:var(--gold)">
         🎙 ただいま <b>開局準備中</b>…<br>
         <span style="font-size:12px;color:#d8d2c4">近日配信予定</span>
       </div>
       <p style="font-size:12px;color:#b7ad97">エピソードが整い次第、この場でそのまま聴けるようにします。<br>（Spotify / Apple Podcasts / 音声ファイルのいずれにも対応できます）</p>
       <a class="more" href="mailto:watanabeshikine@gmail.com?subject=%E7%84%9A%E3%81%8D%E7%81%AB%E3%83%A9%E3%82%B8%E3%82%AA%E3%81%AE%E9%85%8D%E4%BF%A1%E9%80%9A%E7%9F%A5%E5%B8%8C%E6%9C%9B">配信のお知らせを受け取る →</a>
     </div>`);
}
// ── 裏山の森の音響装置：山録（フィールド録音）──
// 音源を公開できるようになったら MOUNTAIN_TRACKS に { title, src, place, tag } を足すだけで鳴る。
// src は audio/ に置いたファイル（例 'audio/forest-rain.webm'）か、公開URL。
const MFR_URL='https://mountain-field-recorder.vercel.app/';
// 音源リストは audio/manifest.json から自動生成（sync-audio.ps1 が作る）。
// audio/ に録音ファイルを置くだけで自動で並ぶ。ここを手で編集する必要はない。
let MOUNTAIN_TRACKS=[];
async function loadMountainTracks(){
  try{
    const res=await fetch('audio/manifest.json',{cache:'no-store'});
    if(res.ok){ const d=await res.json(); if(Array.isArray(d)) MOUNTAIN_TRACKS=d; }
  }catch(e){ console.warn('manifest load failed',e); }
}
async function openForestSpeakerPanel(){
  await loadMountainTracks();
  let body=`<div style="font-size:14px;line-height:1.95">
    <p>森のなかに、古いスピーカーと小さな録音機。<br>耳をすますと、この土地で録った音が、ぽつりと流れてくる。</p>`;
  if(MOUNTAIN_TRACKS.length){
    body+='<div style="margin:14px 0;display:flex;flex-direction:column;gap:12px">';
    for(const t of MOUNTAIN_TRACKS){
      body+='<div style="border:2px solid #4a4030;padding:10px 12px">'
        +'<div style="color:var(--gold);font-size:13px;margin-bottom:6px">🎧 '+t.title
        +(t.tag?' <span style="opacity:.7;font-size:11px">#'+t.tag+'</span>':'')
        +(t.place?' <span style="opacity:.6;font-size:11px">＠'+t.place+'</span>':'')
        +(t.date?' <span style="opacity:.5;font-size:11px">'+String(t.date).slice(0,10).replace(/-/g,'/')+'</span>':'')+'</div>'
        +'<audio controls preload="none" style="width:100%" src="'+t.src+'"></audio></div>';
    }
    body+='</div>';
  } else {
    body+=`<div style="margin:14px 0;padding:16px 14px;border:2px dashed var(--gold);text-align:center;color:var(--gold)">
        🎙 ただいま <b>音源を準備中</b>…<br>
        <span style="font-size:12px;color:#d8d2c4">山で録った音が、まもなくここに灯ります</span>
      </div>`;
  }
  body+=`<p style="font-size:12px;color:#b7ad97">この音は「<b>山録</b>」というフィールド録音の道具で集めています。<br>録音した端末では、地図の上で録った場所ごとに聴けます。</p>
    <a class="more" href="`+MFR_URL+`" target="_blank" rel="noopener">🗺 山録をひらく（録音した端末で）→</a>
  </div>`;
  openPanel('🔊 裏山の音 — Field Recording', body);
}
function openNewsPanel(){
  openPanel('📜 メルマガ — Newsletter',
    `<form id="nlForm" class="nlform">
       <p>不定期メルマガ「karasuletters」。制作の裏側や活動のお知らせをお届けします。<br>下のフォームから購読登録できます。</p>
       <label>お名前<input id="nlName" type="text" autocomplete="name" required></label>
       <label>メールアドレス<input id="nlEmail" type="email" autocomplete="email" required></label>
       <button id="nlBtn" type="submit">購読する</button>
       <div id="nlError" class="nlerr" hidden></div>
     </form>
     <div id="nlThanks" class="nlthanks" hidden>✉ 登録ありがとうございます！<br>karasuletters の配信をお待ちください。</div>`);
  const f=document.getElementById('nlForm');
  f.addEventListener('submit',async e=>{
    e.preventDefault();
    const name=document.getElementById('nlName').value.trim();
    const email=document.getElementById('nlEmail').value.trim();
    const btn=document.getElementById('nlBtn'), err=document.getElementById('nlError');
    err.hidden=true; btn.disabled=true; btn.textContent='確認中...';
    try{
      const res=await fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain'},
        body:JSON.stringify({action:'register',name,email})});
      const result=await res.json();
      if(result.duplicate){ err.textContent='このメールアドレスはすでに登録されています。';
        err.hidden=false; btn.disabled=false; btn.textContent='購読する'; return; }
      if(!result.ok){ err.textContent='登録に失敗しました。時間をおいてお試しください。';
        err.hidden=false; btn.disabled=false; btn.textContent='購読する'; return; }
      f.style.display='none'; document.getElementById('nlThanks').hidden=false;
    }catch(ex){ err.textContent='通信エラーが発生しました。時間をおいてお試しください。';
      err.hidden=false; btn.disabled=false; btn.textContent='購読する'; }
  });
}

function interact(){
  if(panelOpen){closePanel();return;}
  if(dlgOpen){advance();return;}
  const cx=P.px+TS/2, cy=P.py+TS/2;
  const off={up:[0,-TS],down:[0,TS],left:[-TS,0],right:[TS,0]}[P.dir];
  const fx=cx+off[0], fy=cy+off[1];
  // NPC? (some give a treasure)
  for(const n of NPCS){ if(npcHidden(n))continue; if(Math.abs(fx-(n.px+TS/2))<TS&&Math.abs(fy-(n.py+TS/2))<TS){
    n.dir={up:'down',down:'up',left:'right',right:'left'}[P.dir];
    let pages=n.pages;
    if(n.gives!=null && !TREASURES[n.gives].found){ const t=TREASURES[n.gives]; getTreasure(t);
      pages=n.pages.concat(['（'+t.icon+' <b>'+t.name+'</b> を授かった！ 💎'+treasCount()+'/8）']); }
    openDialog(n.name,'',pages);
    if(n.lively){ startHop(n,3,1);                       // 話しかけたらぴょこっ
      dlgConfirm=()=>startHop(n,5,3); }                  // 話し終わったら元気にぴょんぴょん
    if(n.link) dlgConfirm=()=>window.open(n.link,'_blank','noopener'); // 会話後に告知ページへ
    return; } }
  // animal? (もののけ的に語り、話し終えると走り去って消える)
  for(const a of ANIMALS){ if(animalHidden(a))continue; if(!a.gone&&!a.fleeing&&Math.abs(fx-(a.px+TS/2))<TS&&Math.abs(fy-(a.py+TS/2))<TS){
    a.dir={up:'down',down:'up',left:'right',right:'left'}[P.dir];
    openDialog(ANAME[a.type],'',a.talk);
    dlgConfirm=()=>{ a.fleeing=true; a.fleeT=0;
      const ang=Math.atan2(a.py-P.py, a.px-P.px); a.fvx=Math.cos(ang)*1.7; a.fvy=Math.sin(ang)*1.7; };
    return; } }
  // 雉の親子? (生きることを語り、話し終えると家族そろって走り去って消える)
  if(!PHEASANTS.gone && !PHEASANTS.fleeing)
  for(const bk of [{b:PHEASANTS.lead,kind:'male'}, ...PHEASANTS.followers.map(f=>({b:f,kind:f.kind}))]){
    if(Math.abs(fx-(bk.b.px+TS/2))<TS && Math.abs(fy-(bk.b.py+TS/2))<TS){
      openDialog(PHEASANT_NAME[bk.kind],'',PHEASANT_TALK[bk.kind]);
      dlgConfirm=()=>{ PHEASANTS.fleeing=true; PHEASANTS.fleeT=0;
        const ang=Math.atan2(PHEASANTS.lead.py-P.py, PHEASANTS.lead.px-P.px);
        PHEASANTS.fvx=Math.cos(ang)*1.7; PHEASANTS.fvy=Math.sin(ang)*1.7; };
      return; } }
  // 熊? (人の2倍・話しても消えない)
  if(fx>BEAR.px-6 && fx<BEAR.px+2*TS+6 && fy>BEAR.py-6 && fy<BEAR.py+2*TS+6){
    BEAR.dir={up:'down',down:'up',left:'right',right:'left'}[P.dir]; BEAR.talked=true;
    openDialog('熊','',BEAR.pages);
    dlgConfirm=()=>{ window.open('https://www.google.com/maps/d/u/0/viewer?mid=1FeFnrW_VegLPAKUKQ17eb-DDVYEXZq4&femb=1&ll=35.887473350583754%2C138.2236788534788&z=11','_blank','noopener'); };
    return; }
  // シロサギ? (話し終えると飛び去る)
  if(!HERON.gone && !HERON.flying && Math.abs(fx-(HERON.px+TS/2))<TS+4 && Math.abs(fy-(HERON.py+TS/2))<TS+4){
    openDialog('シロサギ','',HERON.pages);
    dlgConfirm=()=>{ HERON.flying=true; HERON.flyT=0; }; return; }
  // boulder? (話しかけられる古き岩)
  const btc=(fx/TS)|0, btr=(fy/TS)|0;
  // 観測機? (トマト畑のセンサー：将来 raspi の観測データを反映)
  for(const o of OBJS){ if(o.type==='sensor' && btc>=o.x&&btc<o.x+o.w&&btr>=o.y&&btr<o.y+o.h){
    fetchCloudObs(); openDialog('観測機','📡 畑の観測データ', sensorPages()); startObsLive(); return; } }
  for(const o of OBJS){ if(o.type==='well' && btc>=o.x-1&&btc<=o.x+o.w&&btr>=o.y-1&&btr<=o.y+o.h){
    fetchCloudObs(); openDialog('井戸','⛲ 葡萄畑の井戸', wellPages()); startObsLive(); return; } }
  for(const o of OBJS){ if(o.type==='cellar' && btc>=o.x-1&&btc<=o.x+o.w&&btr>=o.y-1&&btr<=o.y+o.h){
    fetchCloudObs(); openDialog('室','🍷 ワインの室', cellarPages()); startObsLive(); return; } }
  for(const o of OBJS){ if(o.type==='still' && btc>=o.x-1&&btc<=o.x+o.w&&btr>=o.y-1&&btr<=o.y+o.h){
    fetchCloudObs(); openDialog('蒸留所','🥃 葡萄畑の蒸留所', stillPages()); startObsLive(); return; } }
  for(const o of OBJS){ if(o.type==='board' && btc>=o.x-1&&btc<=o.x+o.w&&btr>=o.y-1&&btr<=o.y+o.h){
    openGalleryPanel(); return; } }
  // ホタル（夜・6月）に話しかける — 近くにいれば。話し終わると点滅が一時的に速くなる
  if(fireflySeason() && curMode()==='night'){
    const pcx=P.px+TS/2, pcy=P.py+TS/2;
    for(const f of FIREFLIES){ if(Math.hypot(f.ax-pcx,f.ay-pcy)<TS*2.4){
      openDialog('ホタル','', fireflyPages());
      dlgConfirm=()=>{ _ffBoostUntil=Date.now()+2600; };
      return; } }
  }
  // 縄文の環状列石（井戸尻遺跡の名残）
  for(const o of OBJS){ if(o.type==='jomon' && btc>=o.x-1&&btc<=o.x+o.w&&btr>=o.y-1&&btr<=o.y+o.h){
    openDialog('縄文の遺跡','🗿 環状列石', jomonPages()); return; } }
  // 焚き火ラジオ（ポッドキャスト）
  for(const o of OBJS){ if(o.type==='radio' && btc>=o.x-1&&btc<=o.x+o.w&&btr>=o.y-1&&btr<=o.y+o.h){
    openPodcastPanel(); return; } }
  // 裏山の森の音響装置（山録 — フィールド録音）
  for(const o of OBJS){ if(o.type==='forestspk' && btc>=o.x-1&&btc<=o.x+o.w&&btr>=o.y-1&&btr<=o.y+o.h){
    openForestSpeakerPanel(); return; } }
  // アトリエの屋外台所（おさらの音楽：食材をのせるとアンビエントが生まれる）
  for(const o of OBJS){ if(o.type==='kitchen' && btc>=o.x-1&&btc<=o.x+o.w&&btr>=o.y-1&&btr<=o.y+o.h){
    openKitchenPanel(); return; } }
  // 水神の祠（東の池のほとり）
  if(btc>=SHRINE.x-1&&btc<=SHRINE.x+SHRINE.w&&btr>=SHRINE.y-1&&btr<=SHRINE.y+SHRINE.h){
    openDialog('水神の祠','⛩ 水神の祠', shrinePages()); return; }
  for(const b of BOULDERS){ if(btc>=b.x&&btc<b.x+b.w&&btr>=b.y&&btr<b.y+b.h){
    openDialog('古き岩','',
      ['……。',
       '（岩が、かすかに目を開けた気がした）',
       'われは、八ヶ岳が火を噴いた頃から、この地におる岩。',
       'もののけも旅人も、みなここで一息ついてゆく。',
       'きみも、ゆっくりしておゆき。']); return; } }
  // signboard (ワープサークルの案内)?
  if(btc===SIGN.x&&btr===SIGN.y){ openDialog('立て看板','',[SIGN.lines.join('<br>')]); return; }
  // treasure chest? (facing it)
  for(const t of TREASURES){ if(t.type==='chest'&&btc===t.x&&btr===t.y){
    if(getTreasure(t)) showToast(t.icon+' 宝箱だ！ <'+t.name+'> 💎'+treasCount()+'/8');
    else showToast('（からっぽの宝箱）'); return; } }
  // hidden treasure spot? (proximity — water/tree/lava/crop areas; before harvest)
  for(const t of TREASURES){ if(t.type==='spot'&&!t.found){
    const d=Math.hypot((t.x+0.5)*TS-(P.px+TS/2),(t.y+0.5)*TS-(P.py+TS/2));
    if(d<TS*1.6){ getTreasure(t); showToast(t.icon+' 宝を発見！ <'+t.name+'> 💎'+treasCount()+'/8'); return; } } }
  // crop harvest? (いちご / ぶどう / レタス)
  const stc=(fx/TS)|0, str=(fy/TS)|0, here=M[str]&&M[str][stc];
  // 花を摘む（tile 4）— 摘むと手に持つ。20秒ほどで咲きなおす
  if(here===4){ M[str][stc]=0; PICKED.push({c:stc,r:str,at:Date.now()+20000,ripe:4});
    P.flowers++; updateCropHud();
    let msg='🌼 花を摘んだ！  🌼 ×'+P.flowers;
    if(P.flowers===4) msg='💐 両手で抱えるほどに！';
    else if(P.flowers===10) msg='🌸 頭まで花でいっぱい！';
    else if(P.flowers===15) msg='💐 ぜんぶ花束になっちゃった！';
    showToast(msg); return; }
  const crop=CROP[here];
  if(crop){ M[str][stc]=crop.picked; PICKED.push({c:stc,r:str,at:Date.now()+20000,ripe:here});
    P[crop.key]++; P.lastCrop=crop.key; updateCropHud();
    showToast(crop.icon+' '+crop.name+'を収穫した！  (E / 🍴ボタンで食べられる)'); return; }
  // 植物との対話（木・茂み・花・育ち途中の作物が語りかけてくる）
  if(PLANTVOICE[here]){ const v=PLANTVOICE[here]; openDialog(v.who,'',v.pages); return; }
  if(PICKEDTILE.has(here)){ showToast('🌱 まだ実っていない…'); return; }
  // building?
  const tc=(fx/TS)|0, tr=(fy/TS)|0;
  for(const s of SPOTS){ if(tc>=s.x-1&&tc<=s.x+s.w&&tr>=s.y-1&&tr<=s.y+s.h){
    if(s.key==='works'){openWorksPanel();return;}
    if(s.key==='apps'){openAppsPanel();return;}
    if(s.key==='gallery'){openGalleryPanel();return;}
    if(s.key==='news'){openNewsPanel();return;}
    const c=CONTENT[s.key]; openDialog(c.who,c.t,c.pages); return; } }
}

/* ── update ── */
let cam={x:0,y:0};
function moveEnt(ent,dx,dy,spd){
  ent.moving=!!(dx||dy);
  if(dy<0)ent.dir='up';else if(dy>0)ent.dir='down';else if(dx<0)ent.dir='left';else if(dx>0)ent.dir='right';
  if(dx){const nx=ent.px+dx*spd; if(canMove(nx,ent.py,ent))ent.px=nx;}
  if(dy){const ny=ent.py+dy*spd; if(canMove(ent.px,ny,ent))ent.py=ny;}
  ent.frame = ent.moving ? ent.frame+0.16 : 0;
}
function update(){
  updateWeather();   // 富士見の天候（雨・雪・強風の舞い）
  // strawberry regrow
  const now=Date.now();
  for(let i=PICKED.length-1;i>=0;i--) if(now>=PICKED[i].at){ const p=PICKED[i];
    M[p.r][p.c]=p.ripe; PICKED.splice(i,1);
    // 季節連動の畑なら、再生育後に現在の季節の段階へ合わせ直す（冬に完熟が戻るのを防ぐ）
    const se=curSeason();
    if(TOMATO_CELLS.some(x=>x.c===p.c&&x.r===p.r)) applyTomatoSeason(se);
    else if(MUSHROOM_CELLS.some(x=>x.c===p.c&&x.r===p.r)) applyMushroomSeason(se);
    else if(WILDBERRY.some(w=>w[0]===p.c&&w[1]===p.r)) applyWildberrySeason(se);
  }
  // 元気なNPCの跳ねるアクション（会話中も動くよう、ダイアログ中も更新）
  for(const n of NPCS){ if(!n.lively) continue;
    if(n.hopT>0){ n.hopT--; const p=1-n.hopT/n.hopDur; n.hopY=Math.abs(Math.sin(p*Math.PI*n.hopN))*n.hopAmp; }
    else { n.hopY=0; if(!npcHidden(n)){ n.hopCd--; if(n.hopCd<=0){ startHop(n,3,1); n.hopCd=180+rnd()*240; } } } }  // たまにひとりでもぴょこっ
  // heron flying away (runs even during dialog so it leaves after the talk)
  if(HERON.flying && !HERON.gone){ HERON.flyT++; HERON.px+=0.9; HERON.py-=1.1; if(HERON.flyT>92) HERON.gone=true; }
  // fireworks (8つの宝コンプリート時。ダイアログ中も上がり続ける)
  if(now<fwUntil){ fwTimer--; if(fwTimer<=0){ fwTimer=16+(Math.random()*20|0); launchFirework(); } }
  for(let i=FW.length-1;i>=0;i--){ const p=FW[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.03; p.vx*=0.99; p.life-=0.016; if(p.life<=0)FW.splice(i,1); }
  // animals fleeing away & vanishing (runs even during dialog)
  for(const a of ANIMALS){ if(animalHidden(a))continue; if(a.fleeing&&!a.gone){
    a.px+=a.fvx; a.py+=a.fvy; a.frame+=0.4; a.moving=true; a.fleeT++;
    a.dir = Math.abs(a.fvx)>Math.abs(a.fvy) ? (a.fvx<0?'left':'right') : (a.fvy<0?'up':'down');
    if(a.fleeT>90) a.gone=true; } }
  // NPC wander (paused when talking)
  if(!dlgOpen&&!panelOpen) for(const n of NPCS){
    if(n.still){ n.moving=false; continue; }
    n.t--;
    if(n.t<=0){ n.t=60+rnd()*120;
      const r=rnd(); n.mdir = r<.55?null:['up','down','left','right'][(rnd()*4)|0]; }
    let dx=0,dy=0;
    if(n.mdir){const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[n.mdir];
      // stay near home
      if(Math.hypot(n.px-n.hx,n.py-n.hy)<TS*3){dx=d[0];dy=d[1];}else{n.mdir=null;n.t=40;}}
    moveEnt(n,dx,dy,.55);
  }
  // animals wander (a bit wider range)
  if(!dlgOpen&&!panelOpen) for(const a of ANIMALS){
    if(a.fleeing||a.gone||animalHidden(a)) continue;
    a.t--;
    if(a.t<=0){ a.t=50+rnd()*140; const r=rnd(); a.mdir=r<.5?null:['up','down','left','right'][(rnd()*4)|0]; }
    let dx=0,dy=0;
    if(a.mdir){const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[a.mdir];
      if(Math.hypot(a.px-a.hx,a.py-a.hy)<TS*4){dx=d[0];dy=d[1];}else{a.mdir=null;a.t=40;}}
    moveEnt(a,dx,dy,a.type==='rabbit'?.8:.5);
  }
  // bear wander (timid: slow, frequent pauses, stays near the river)
  if(!dlgOpen&&!panelOpen){ BEAR.t--;
    if(BEAR.t<=0){ BEAR.t=120+rnd()*180; BEAR.mdir = rnd()<.6?null:['up','down','left','right'][(rnd()*4)|0]; }
    let dx=0,dy=0;
    if(BEAR.mdir){ const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[BEAR.mdir];
      if(Math.hypot(BEAR.px-BEAR.hx,BEAR.py-BEAR.hy)<TS*3){dx=d[0];dy=d[1];}else{BEAR.mdir=null;BEAR.t=60;} }
    moveEnt(BEAR,dx,dy,0.35);
  }
  if(!dlgOpen&&!panelOpen) updatePheasants();   // 雉の親子が一列で歩く
  if(!dlgOpen&&!panelOpen){
    let dx=0,dy=0;
    if(keys['arrowup']||keys['w']||keys['_up'])dy=-1;
    else if(keys['arrowdown']||keys['s']||keys['_down'])dy=1;
    else if(keys['arrowleft']||keys['a']||keys['_left'])dx=-1;
    else if(keys['arrowright']||keys['d']||keys['_right'])dx=1;
    let base=P.speed;
    if(Date.now()<P.boostUntil) base=P.speed*1.8;
    else if(Date.now()<P.slowUntil) base=P.speed*0.5;
    const ctile=(M[((P.py+TS/2)/TS)|0]||[])[((P.px+TS/2)/TS)|0];
    const inWater=ctile===2, inBrush=(ctile===3||ctile===6), inPaddy=ctile===18, inCrop=CROPTILE.has(ctile), inOnsen=ctile===27;
    moveEnt(P,dx,dy, base*(inWater?0.55:((inBrush||inPaddy||inCrop||inOnsen)?0.6:1)));
    P.swim=inWater; P.inBrush=inBrush; P.inPaddy=inPaddy; P.inCrop=inCrop;
    if(inOnsen && !P.inOnsen){ showToast('♨ 温泉だ！ ほっと一息…'); P.slowUntil=0; P.boostUntil=0; }  // 入ると一息
    P.inOnsen=inOnsen;
    // warp circle: entering it prompts to jump to the service site
    const wc=((P.px+TS/2)/TS)|0, wr=((P.py+TS-2)/TS)|0;
    const onWarp = wc>=WARP.x&&wc<WARP.x+WARP.w&&wr>=WARP.y&&wr<WARP.y+WARP.h;
    if(onWarp && !P.onWarp && !dlgOpen && !panelOpen)
      openConfirm('✨ ワープサークル',
        ['足もとに、淡く光る魔法陣。','サービスサイト（渡邊織音の本サイト）を別タブで開きます。',
         '［ スペース／クリックで開く ・ ✕でやめる ］'],
        ()=>{ window.open(WARP.url,'_blank','noopener'); });
    P.onWarp=onWarp;
  } else P.moving=false;
  // camera
  cam.x=Math.max(0,Math.min(MW*TS-VW*TS, P.px+TS/2-VW*TS/2));
  cam.y=Math.max(0,Math.min(MH*TS-VH*TS, P.py+TS/2-VH*TS/2));
  // location label
  let near=null,nd=1e9;
  for(const s of SPOTS){const d=Math.hypot((s.x+s.w/2)*TS-P.px,(s.y+s.h)*TS-P.py);if(d<nd){nd=d;near=s;}}
  for(const n of NPCS){if(npcHidden(n))continue;const d=Math.hypot(n.px-P.px,n.py-P.py);if(d<nd-4){nd=d+999;}}
  let label;
  if(P.onWarp){ label='✨ <b>ワープサークル</b> — サービスサイトへ'; }
  else if(P.swim){ label='🏊 <b>泳いでいる！</b>'; }
  else if(P.inOnsen){ label='♨ <b>溶岩の露天風呂</b> — ほっと一息'; }
  else if(P.inBrush){ label='🌳 <b>茂みの中</b> — すこしゆっくり'; }
  else if(P.inPaddy){ label='🌾 <b>ちいさな田んぼ</b>'; }
  else if(nd<40){ label=`📍 <b>${near.label}</b> の前 — 調べてみよう`; }
  else {
    const pc=((P.px+TS/2)/TS)|0, pr=((P.py+TS-2)/TS)|0;
    const around=t=>{for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=pr+dr,cc=pc+dc;if(rr>=0&&rr<MH&&cc>=0&&cc<MW&&M[rr][cc]===t)return true;}return false;};
    const here=M[pr]&&M[pr][pc];
    if(Math.hypot(17*TS-(P.px+TS/2),37.5*TS-(P.py+TS/2))<TS*2.2) label='🍳 <b>台所</b> — おさらに食材をのせると音楽が生まれる';
    else if(Math.hypot(21.5*TS-(P.px+TS/2),11.5*TS-(P.py+TS/2))<TS*1.8) label='🎙 <b>焚き火ラジオ</b> — 調べる（準備中）';
    else if(pc>=15&&pc<=22&&pr>=6&&pr<=11) label='🎶 <b>自由の広場</b> — ワイワイ';
    else if(here===12||here===13||around(12)||around(13)) label='🍓 <b>いちご畑</b> — 調べて収穫';
    else if(here===14||here===15||around(14)||around(15)) label='🍇 <b>ぶどう畑</b>（ワイン用）— 調べて収穫';
    else if(here===16||here===17||around(16)||around(17)) label='🥬 <b>レタス畑</b> — 調べて収穫';
    else if([19,20,21,22,23,24].includes(here)||[19,20,21,22,23,24].some(t=>around(t))) label='🍅 <b>トマト畑</b> — 成長6段階・観測機もある';
    else if(here===25||here===26||around(25)||around(26)) label='🍄 <b>きのこの森</b> — いろんなきのこ（調べて収穫）';
    else if([29,30,31].includes(here)||[29,30,31].some(t=>around(t))) label='🍓 <b>野イチゴ</b> — 森の林床に赤と黄（調べて収穫）';
    else if(here===7||around(10)) label='🏜 <b>砂漠</b> を歩いている';
    else if(around(8))       label='🌋 <b>溶岩地帯</b> — 熱い！';
    else if(pc>=PASTURE.x&&pc<=PASTURE.x+PASTURE.w&&pr>=PASTURE.y&&pr<=PASTURE.y+PASTURE.h) label='🐴 <b>南の牧場</b> — ウマが放牧されている';
    else if(Math.hypot((SHRINE.x+1)*TS-P.px,(SHRINE.y+1)*TS-P.py)<TS*2.5) label='⛩ <b>水神の祠</b> のほとり — 調べてみよう';
    else if(here===2||around(2)) label='💧 <b>池のほとり</b>';
    else if(pr>=5&&pr<=11&&pc>=47) label='🌲 <b>裏山の森</b>';
    else if(pr<7||around(11)) label='⛰ <b>八ヶ岳</b> のふもと';
    else label='📍 <b>あわい村</b> を探索中';
  }
  document.getElementById('loc').innerHTML=label;
}

/* ── drawing helpers ── */
function px(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(x,y,w,h);}
function drawTile(c,r,sx,sy){
  const t=M[r][c], V=VEG;
  // grass base under everything（季節で草の色が変わる。冬は雪がちらほら積もる）
  const g=((c*7+r*13)%5);
  function grassBase(){
    px(sx,sy,TS,TS,(c+r)%2?V.g1:V.g2);
    if(g===0)px(sx+3,sy+10,1,2,V.tuft); if(g===2){px(sx+9,sy+5,1,2,V.tuft);px(sx+11,sy+11,1,2,V.tuft);}
    if(g===3)px(sx+5,sy+3,1,2,V.tuft);
    if(V.snow){ const sg=(c*5+r*11)%7;                 // ちらほら積もった雪
      if(sg===0)px(sx+2,sy+11,5,2,'#eef2f8');
      if(sg===3)px(sx+9,sy+12,4,2,'#e6ecf4');
      if(sg===5)px(sx+5,sy+8,3,1,'#f2f6fb'); }
  }
  grassBase();
  if(t===2){ px(sx,sy,TS,TS,'#4f86ab'); px(sx,sy,TS,3,'#5d97bd');
    px(sx+3+((Date.now()/600+c)%6),sy+6,3,1,'#a9d4e6'); px(sx+9,sy+11,2,1,'#a9d4e6'); }
  else if(t===1){ px(sx,sy,TS,TS,'#cbb079'); px(sx,sy,TS,1,'#d8bf8c');
    const k=(c*5+r*3)%4; px(sx+2+k*3,sy+4,2,2,'#bda06a'); px(sx+8,sy+10,2,2,'#bda06a'); }
  else if(t===5){ px(sx,sy,TS,TS,'#8a6a44'); px(sx,sy,TS,2,'#9a774e'); px(sx+2,sy+7,12,1,'#75582f'); }
  else if(t===6){ px(sx+2,sy+5,12,9,V.bush[0]); px(sx+4,sy+4,8,4,V.bush[1]); px(sx+5,sy+8,2,2,V.bush[2]);
    if(V.snow) px(sx+3,sy+4,7,1,'#eef2f8'); }                          // 茂みの上の雪
  else if(t===3){ // tree with shading + trunk（葉が季節で色づく）
    px(sx+6,sy+10,4,6,'#6b4a2c'); px(sx+6,sy+10,1,6,'#7d5836');
    px(sx+2,sy+1,12,11,V.tree[0]); px(sx+3,sy,10,9,V.tree[1]); px(sx+4,sy+1,6,4,V.tree[2]);
    px(sx+10,sy+6,2,4,V.dark);
    if(V.snow){ px(sx+3,sy,8,2,'#eef2f8'); px(sx+6,sy+1,3,1,'#ffffff'); } }   // 枝に積もった雪
  else if(t===4){ // 草花（季節の花。冬は咲かず枯れ草に）
    if(V.flowers){ const cl=V.flowers[(c+r)%4];
      px(sx+5,sy+6,3,3,cl); px(sx+5,sy+5,1,1,'#7a5'); px(sx+10,sy+9,2,2,cl); px(sx+3,sy+10,2,2,V.flowers[0]); }
    else { px(sx+5,sy+8,2,3,'#8f8a6e'); px(sx+10,sy+9,2,2,'#9a9580'); px(sx+5,sy+8,2,1,'#eef2f8'); } }
  else if(t===7){ // sand / desert
    px(sx,sy,TS,TS,'#dcc486'); px(sx,sy,TS,2,'#e6d199');
    const k=(c*5+r*7)%4; px(sx+2+k*3,sy+9,2,1,'#cbb277'); px(sx+9,sy+5,1,1,'#c8af72'); px(sx+5,sy+12,2,1,'#cbb277'); }
  else if(t===9){ // rock / boulder
    px(sx,sy,TS,TS,(c+r)%2?'#dcc486':'#cbb277');
    px(sx+3,sy+5,10,9,'#8b8a86'); px(sx+4,sy+4,8,4,'#a3a29d'); px(sx+5,sy+9,3,3,'#6e6d69'); px(sx+10,sy+11,2,2,'#6e6d69'); }
  else if(t===10){ // cactus
    px(sx,sy,TS,TS,'#dcc486'); px(sx+7,sy+3,3,11,'#3a7d45'); px(sx+4,sy+6,3,4,'#3a7d45'); px(sx+10,sy+5,3,4,'#3a7d45');
    px(sx+7,sy+3,1,11,'#4f9a57'); px(sx+8,sy+5,1,1,'#cdebc6'); }
  else if(t===8){ // lava (animated glow)
    const f=Math.sin(Date.now()/350+(c*1.7+r))*0.5+0.5;
    px(sx,sy,TS,TS,'#3a1410');
    ctx.fillStyle='#e0531e'; ctx.globalAlpha=0.5+0.5*f; ctx.fillRect(sx+1,sy+1,TS-2,TS-2); ctx.globalAlpha=1;
    px(sx+3,sy+4,TS-6,1,'#2a0d0a'); px(sx+2,sy+9,TS-5,1,'#2a0d0a'); px(sx+6,sy+6,3,2,'#ffd27a'); }
  else if(t===11){ // 八ヶ岳 mountain（季節で雪と山肌が変わる）
    const se=curSeason();
    let b1='#6b7486', b2='#5f6878', tp='#7c8597';
    if(se==='autumn'){ b1='#8a6e52'; b2='#7c624a'; tp='#9c7e54'; }   // カラマツの黄葉に染まる山肌
    px(sx,sy,TS,TS,(c+r)%2?b1:b2);
    px(sx,sy,TS,4,tp);
    px(sx+2,sy+6,3,8,'#525a69'); px(sx+10,sy+4,3,10,'#525a69');
    if(se==='winter'){ px(sx,sy,TS,9,'#eef2f8'); px(sx+2,sy+9,3,2,'#dfe6f0'); px(sx+9,sy+10,3,2,'#dfe6f0'); }       // 全山が雪化粧
    else if(se==='spring'){ if(r<2){ px(sx,sy,TS,6,'#e8edf4'); px(sx+3,sy+6,2,2,'#e8edf4'); px(sx+9,sy+7,2,2,'#e8edf4'); } } // 山頂の残雪
    else if(se==='autumn'){ if(r<1) px(sx,sy,TS,3,'#eef2f8'); }      // 頂にうっすら初雪
    else { if(r<1) px(sx,sy,TS,2,'#e8edf4'); } }                     // 夏：わずかな残雪
  else if(t===12){ // ripe strawberry plant
    grassBase();
    px(sx+3,sy+6,10,7,'#2f6b3a'); px(sx+4,sy+5,8,3,'#3a7d45');
    px(sx+5,sy+10,3,3,'#e23b4a'); px(sx+9,sy+9,3,3,'#e23b4a');     // berries
    px(sx+6,sy+11,1,1,'#ffe'); px(sx+10,sy+10,1,1,'#ffe'); }       // seeds
  else if(t===13){ // picked plant (regrowing)
    grassBase();
    px(sx+3,sy+6,10,7,'#2f6b3a'); px(sx+4,sy+5,8,3,'#3a7d45');
    px(sx+7,sy+9,2,2,'#fff'); px(sx+7,sy+9,2,1,'#ffe'); }          // tiny flower
  else if(t===14){ // ripe grapevine
    grassBase();
    px(sx+1,sy+2,14,3,'#3a7d45'); px(sx+2,sy+1,12,2,'#4a8d52');     // trellis leaves
    px(sx+5,sy+6,4,5,'#5b2f7a'); px(sx+6,sy+11,2,2,'#5b2f7a');      // grape cluster
    px(sx+5,sy+6,1,1,'#9a6ab8'); px(sx+7,sy+8,1,1,'#9a6ab8'); }
  else if(t===15){ // picked grapevine
    grassBase();
    px(sx+1,sy+2,14,3,'#3a7d45'); px(sx+7,sy+6,1,6,'#6b4a2c'); }
  else if(t===16){ // ripe lettuce
    grassBase();
    px(sx+3,sy+6,10,7,'#4f9a44'); px(sx+4,sy+5,8,4,'#6cc05a');      // head
    px(sx+6,sy+8,1,3,'#3f8038'); px(sx+9,sy+9,1,2,'#3f8038'); }     // veins
  else if(t===17){ // picked lettuce (sprout)
    grassBase();
    px(sx+6,sy+10,4,2,'#8a6a44'); px(sx+7,sy+8,2,2,'#6cc05a'); }
  else if(t===18){ // 田んぼ (flooded rice paddy)
    px(sx,sy,TS,TS,'#6f93a0'); px(sx,sy,TS,1,'#86a8b4');           // muddy water + sky reflection
    px(sx+3,sy+5,1,7,'#5a9a4c'); px(sx+7,sy+4,1,8,'#5a9a4c'); px(sx+11,sy+6,1,6,'#5a9a4c'); // rice rows
    px(sx+5,sy+9,1,4,'#6cb05a'); px(sx+9,sy+8,1,5,'#6cb05a');
    px(sx+2,sy+12,3,1,'#9cc2cc'); px(sx+10,sy+13,3,1,'#9cc2cc'); } // ripples
  else if(t===19){ // ripe tomato plant
    grassBase();
    px(sx+7,sy+4,2,9,'#5a3d24');                                   // 支柱
    px(sx+3,sy+5,10,7,'#2f6b3a'); px(sx+4,sy+4,8,3,'#3a7d45');     // 葉
    px(sx+5,sy+9,3,3,'#e0402a'); px(sx+9,sy+8,3,3,'#e0402a');      // トマトの実
    px(sx+6,sy+9,1,1,'#ff7a5a'); px(sx+10,sy+8,1,1,'#ff7a5a');     // ハイライト
    px(sx+6,sy+8,1,1,'#3a7d45'); px(sx+10,sy+7,1,1,'#3a7d45'); }   // へた
  else if(t===20){ // 花 — 花期（picked tomato regrowing）
    grassBase();
    px(sx+7,sy+6,2,6,'#5a3d24');
    px(sx+3,sy+6,10,6,'#2f6b3a'); px(sx+4,sy+5,8,3,'#3a7d45');
    px(sx+7,sy+8,2,2,'#e8d24f'); }                                 // 黄色い花
  else if(t===21){ // 枯れ — 枯死した株
    grassBase();
    px(sx+7,sy+5,2,10,'#6b4a2c');                                   // 細い枯れ茎
    px(sx+4,sy+7,4,1,'#6b4a2c'); px(sx+8,sy+9,4,1,'#6b4a2c');      // 枯れ枝
    px(sx+3,sy+8,2,1,'#7a6040'); px(sx+11,sy+10,2,1,'#7a6040');     // 枯れ葉の残骸
    px(sx+5,sy+12,6,2,'#5a3d18'); }                                  // 根元の暗い土
  else if(t===22){ // 苗 — 発芽直後の小さな苗
    grassBase();
    px(sx+7,sy+9,2,5,'#6b8c3a');                                     // 細い茎
    px(sx+5,sy+9,2,2,'#5aa05a'); px(sx+9,sy+10,2,2,'#5aa05a');      // 双葉
    px(sx+6,sy+7,4,2,'#7acc5a'); }                                   // 頂芽の若葉
  else if(t===23){ // 青い実 — 未熟な緑のトマト
    grassBase();
    px(sx+7,sy+4,2,9,'#5a3d24');                                     // 支柱
    px(sx+3,sy+5,10,7,'#2f6b3a'); px(sx+4,sy+4,8,3,'#3a7d45');      // 葉
    px(sx+5,sy+9,3,3,'#3d8c2a'); px(sx+9,sy+8,3,3,'#3d8c2a');       // 青い実
    px(sx+6,sy+9,1,1,'#6abf40'); px(sx+10,sy+8,1,1,'#6abf40');      // 実のハイライト
    px(sx+6,sy+8,1,1,'#3a7d45'); px(sx+10,sy+7,1,1,'#3a7d45'); }    // へた
  else if(t===24){ // 枯れ始め — 完熟後の萎れかけ
    grassBase();
    px(sx+7,sy+4,2,9,'#5a3d24');                                     // 支柱
    px(sx+3,sy+6,10,6,'#7a6a30'); px(sx+4,sy+5,8,3,'#9a8040');      // 黄ばんだ葉
    px(sx+5,sy+9,3,3,'#c03020'); px(sx+9,sy+8,3,3,'#c03020');       // しぼんだ実
    px(sx+6,sy+9,1,1,'#e05040'); px(sx+10,sy+8,1,1,'#e05040');      // わずかなハイライト
    px(sx+4,sy+10,2,1,'#7a6a30'); px(sx+10,sy+11,2,1,'#7a6a30'); }  // 垂れた葉
  else if(t===25){ // いろんなきのこ（収穫できる）
    grassBase();
    px(sx,sy+12,TS,4,'#5a4a38'); px(sx,sy+12,TS,1,'#6b5a44');       // 湿った森の地面
    px(sx+2,sy+8,5,3,'#d23b32'); px(sx+2,sy+7,5,1,'#e8584a');       // 赤いきのこの傘
    px(sx+3,sy+8,1,1,'#fff'); px(sx+5,sy+9,1,1,'#fff');             // 白い斑点
    px(sx+3,sy+11,3,3,'#f0e6d0');                                   // 軸
    px(sx+9,sy+9,4,2,'#9a6a3a'); px(sx+9,sy+8,4,1,'#b5824a');       // 茶色いきのこの傘
    px(sx+10,sy+11,2,3,'#e8dcc0');                                  // 軸
    px(sx+7,sy+12,2,2,'#e8e2d0'); px(sx+7,sy+13,1,1,'#cfc6b0'); }   // 小さな白きのこ
  else if(t===26){ // 収穫後（菌糸が育ちなおす）
    grassBase();
    px(sx,sy+12,TS,4,'#5a4a38'); px(sx,sy+12,TS,1,'#6b5a44');       // 湿った地面
    px(sx+5,sy+12,1,1,'#cfc6b0'); px(sx+9,sy+13,1,1,'#cfc6b0');     // 残った軸
    px(sx+7,sy+11,1,1,'#8a7a5a'); px(sx+3,sy+13,1,1,'#7a6a4a'); }   // 胞子のあと
  else if(t===27){ // 温泉（露天風呂）の湯
    px(sx,sy,TS,TS,'#3a2018');                                      // 黒い岩肌の底
    px(sx+1,sy+1,TS-2,TS-2,'#5fb4b0');                              // 乳青色の湯
    px(sx+1,sy+1,TS-2,2,'#7fcfc8');                                 // 上縁の明るい湯気だまり
    const w=(Date.now()/700+c*1.3+r)%6;
    px(sx+2+w,sy+5,3,1,'#c7eeea'); px(sx+9,sy+10,2,1,'#a9e0db');     // ゆらめく波紋
    px(sx+5,sy+12,3,1,'#aee2dd'); }
  else if(t===28){ // 湯への石畳（溶岩の中の安全な参道）
    px(sx,sy,TS,TS,'#6a605a');                                      // 石畳の目地
    px(sx+1,sy+1,6,6,'#8c837b'); px(sx+9,sy+1,6,6,'#847b73');       // 石スラブ
    px(sx+1,sy+9,6,6,'#827971'); px(sx+9,sy+9,6,6,'#8c837b');
    px(sx+1,sy+1,6,1,'#a39a90'); px(sx+9,sy+9,6,1,'#a39a90'); }     // 角のハイライト
  else if(t===29||t===30){ // 野イチゴ（林床に自生・赤/黄）
    grassBase();
    px(sx+1,sy+11,14,4,'#4a3a26'); px(sx+1,sy+11,14,1,'#5a4632');   // 木陰の落ち葉の地面
    px(sx+3,sy+5,4,4,'#2f6b3a'); px(sx+9,sy+5,4,4,'#2f6b3a');       // 三つ葉
    px(sx+6,sy+4,4,4,'#3a7d45'); px(sx+5,sy+6,1,1,'#4f9a57'); px(sx+10,sy+6,1,1,'#4f9a57');
    const berry=(t===29)?'#e23b4a':'#f2c12e';                       // 赤 or 黄
    const hl   =(t===29)?'#ff7a82':'#ffe89a';
    px(sx+4,sy+10,2,3,berry); px(sx+9,sy+9,3,3,berry);              // 実ふたつ
    px(sx+4,sy+10,1,1,hl); px(sx+9,sy+9,1,1,hl);                    // つや
    px(sx+5,sy+11,1,1,'#fff'); px(sx+10,sy+10,1,1,'#fff'); }        // 種のつぶ
  else if(t===31){ // 野イチゴ（収穫後・葉と白い花だけ）
    grassBase();
    px(sx+1,sy+11,14,4,'#4a3a26'); px(sx+1,sy+11,14,1,'#5a4632');   // 木陰の地面
    px(sx+3,sy+6,4,4,'#2f6b3a'); px(sx+9,sy+6,4,4,'#2f6b3a');       // 三つ葉
    px(sx+6,sy+5,4,4,'#3a7d45');
    px(sx+7,sy+9,2,2,'#fff'); px(sx+7,sy+9,1,1,'#ffe'); }           // 小さな白い花
}
function drawBuilding(s){
  const x=s.x*TS-cam.x, y=s.y*TS-cam.y, w=s.w*TS, h=s.h*TS;
  px(x-3,y+h-2,w+6,4,'rgba(0,0,0,.25)');           // ground shadow
  px(x,y+TS,w,h-TS,s.wall);                          // wall
  px(x,y+TS,w,3,'#fff3'); px(x,y+h-3,w,3,'#0003');   // wall hi/lo
  for(let i=1;i<s.w;i++)px(x+i*TS,y+TS,1,h-TS,'#0001'); // plank lines
  // windows — 夜は室内に灯りがともる
  if(isNight()){
    px(x+5,y+TS+6,6,6,'#ffd86a'); px(x+w-11,y+TS+6,6,6,'#ffd86a');     // 暖色の灯り
    px(x+5,y+TS+8,6,1,'#caa23a'); px(x+w-11,y+TS+8,6,1,'#caa23a');     // 窓の桟
    px(x+8,y+TS+6,1,6,'#caa23a'); px(x+w-8,y+TS+6,1,6,'#caa23a');
  } else {
    px(x+5,y+TS+6,6,6,'#3a5a7a'); px(x+w-11,y+TS+6,6,6,'#3a5a7a');
    px(x+5,y+TS+6,6,1,'#aee'); px(x+w-11,y+TS+6,6,1,'#aee');
  }
  // roof (two-tone, eaves)
  px(x-3,y,w+6,TS,s.roof); px(x-3,y,w+6,3,'#0004'); px(x-3,y+TS-3,w+6,3,'#0003');
  px(x-3,y+TS-2,w+6,2,'#00000044');
  for(let i=0;i<s.w;i++)px(x+i*TS+TS/2,y+2,1,TS-4,'#ffffff14');
  // door
  const dx=x+w/2-7; px(dx,y+h-15,14,15,'#5a3d28'); px(dx+2,y+h-13,10,13,'#3a2718');
  px(dx+9,y+h-8,1,2,'#e7c878');
  // sign
  if(s.icon){ ctx.font='13px serif'; ctx.fillText(s.icon,x+w/2,y+TS-3); }
  if(s.label){ ctx.font='9px monospace'; px(x+w/2-18,y+h+2,36,11,'rgba(20,18,15,.8)');
    ctx.fillStyle='#fff'; ctx.fillText(s.label,x+w/2,y+h+11); }
}
// たまに瞬きする（個体ごとにずらした位相で、約3.4秒に一度パッと目を閉じる）
function isBlinking(off){ return ((Date.now()+(off||0))%3400) < 130; }
function drawChar(x,y,dir,frame,moving,c1,c2,hair,cat,slim,blink){
  const bob=moving?(Math.floor(frame)%2):0, sx=Math.round(x), sy=Math.round(y);
  // slim=細身（整数ピクセルで胴を1pxずつ細く・頭は同じ幅なので髪/ほっぺの位置は不変）
  const bx=slim?4:3, bw=slim?8:10, aL=slim?3:2, aR=slim?12:13;
  px(sx+bx,sy+TS-2,bw,3,'rgba(0,0,0,.28)');          // shadow
  if(cat){ px(sx+4,sy+8+bob,9,5,c1); px(sx+11,sy+5+bob,3,3,c1);  // body+head
    px(sx+12,sy+3+bob,1,2,c1);px(sx+14,sy+3+bob,1,2,c1);         // ears
    px(sx+13,sy+7+bob,1,1,'#3a5'); px(sx+3,sy+9+bob,2,1,c1);     // eye+tail
    return; }
  // legs
  px(sx+5,sy+12+bob,2,3-bob,'#2a2e3a'); px(sx+9,sy+12+bob,2,3-bob,'#2a2e3a');
  // body / cloak
  px(sx+bx,sy+6+bob,bw,7,c1); px(sx+bx,sy+6+bob,bw,1,'#fff2'); px(sx+bx,sy+12+bob,bw,1,'#0003');
  // arms hint
  px(sx+aL,sy+7+bob,1,4,c1); px(sx+aR,sy+7+bob,1,4,c1);
  // head
  px(sx+5,sy+1+bob,6,6,c2); px(sx+5,sy+bob,6,2,hair); px(sx+4,sy+1+bob,1,3,hair); px(sx+11,sy+1+bob,1,3,hair);
  // face by dir（blink=瞬き中は目を閉じる＝目を描かない）
  if(dir==='up'){px(sx+5,sy+bob,6,3,hair);}
  else if(!blink){
    if(dir==='down'){px(sx+6,sy+4+bob,1,1,'#3a2a1a');px(sx+9,sy+4+bob,1,1,'#3a2a1a');}
    else if(dir==='left'){px(sx+6,sy+4+bob,1,1,'#3a2a1a');}
    else {px(sx+9,sy+4+bob,1,1,'#3a2a1a');}
  }
}
/* ── mizu だけ高解像度：2倍のオフスクリーンに精細に描き、高品質縮小で合成 ── */
let MIZU=null;
function paintMizu(g,dir){
  const q=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(x,y,w,h); };
  const SKIN='#ecc79e',SKSH='#d6a87e',HAIR='#211b16',
        DR='#cfc5af',DRL='#e0d7c3',DRSH='#b2a78d',EYE='#27201a',
        CHK='#e7b2aa',MOU='#c08a78',SHOE='#5f5141',LEG='#e3bd95';
  const R=dir==='right', L=dir==='left', UP=dir==='up';
  // 髪（後ろ）：あごラインのボブ
  q(10,1,12,3,HAIR); q(8,3,16,9,HAIR);
  q(8,11,3,6,HAIR);  q(21,11,3,6,HAIR);
  q(9,16,2,2,HAIR);  q(21,16,2,2,HAIR);
  if(!UP){
    q(11,4,10,12,SKIN); q(10,6,1,7,SKIN); q(21,6,1,7,SKIN);   // 顔（角を丸める）
    q(11,15,10,1,SKSH);                                       // あごの陰
    q(10,3,12,3,HAIR); q(10,5,2,4,HAIR); q(20,5,2,4,HAIR);    // 前髪（フレーム）
    q(12,6,2,1,HAIR); q(18,6,2,1,HAIR);                       // 前髪の毛先
    q(14,16,4,2,SKIN); q(14,17,4,1,SKSH);                     // 首
    // 目は blitMizu で「くっきりした点」として上描きする（縮小のにじみを避ける）
    if(R){ q(20,10,1,2,SKSH); q(18,11,2,1,CHK); q(17,13,2,1,MOU); }         // 鼻先・ほっぺ・口
    else if(L){ q(11,10,1,2,SKSH); q(12,11,2,1,CHK); q(13,13,2,1,MOU); }
    else { q(12,11,2,1,CHK); q(18,11,2,1,CHK); q(15,13,2,1,MOU); }          // 正面：ほっぺ・口
  } else {
    q(9,4,14,12,HAIR); q(13,15,6,3,HAIR);                     // 後頭部
  }
  // 体：細身のナチュラルなワンピース
  q(11,18,10,8,DR); q(9,24,14,4,DR);                          // 胴＋Aラインの裾
  q(11,18,10,1,DRL); q(9,27,14,1,DRSH);                       // 襟の光・裾の陰
  q(12,19,1,6,DRL);  q(19,19,1,7,DRSH);                       // 前あての光・脇の陰
  q(9,19,2,6,DR); q(21,19,2,6,DR);                            // 袖
  q(9,24,2,2,SKIN); q(21,24,2,2,SKIN);                        // 手
  q(13,28,2,3,LEG); q(17,28,2,3,LEG);                         // 脚
  q(12,30,3,2,SHOE); q(17,30,3,2,SHOE);                       // くつ
}
function ensureMizu(){ if(MIZU)return; MIZU={};
  for(const d of ['down','up','left','right']){
    const o=document.createElement('canvas'); o.width=32; o.height=32;
    paintMizu(o.getContext('2d'), d); MIZU[d]=o; }
}
function blitMizu(x,y,dir,hop,blink){
  ensureMizu();
  const sx=Math.round(x), sy=Math.round(y), h=Math.round(hop||0);
  // 影は地面に固定（跳ねるとすこし小さく・薄く）
  const shr=Math.min(3,h);
  px(sx+4+(shr>>1),sy+14,8-shr,2,'rgba(0,0,0,'+Math.max(0.12,0.26-h*0.02).toFixed(2)+')');
  const sm=ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled=true;
  ctx.drawImage(MIZU[dir]||MIZU.down, sx, sy-h, 16, 16);       // 2倍→等倍で高品質縮小（跳ねぶん上へ）
  ctx.imageSmoothingEnabled=sm;
  // 目は整数ピクセルの点で上描き（瞬き中は閉じる＝描かない）
  if(blink) return;
  const E='#231b13', ey=sy-h+4;
  if(dir==='left') px(sx+6,ey,1,1,E);
  else if(dir==='right') px(sx+9,ey,1,1,E);
  else if(dir!=='up'){ px(sx+6,ey,1,1,E); px(sx+9,ey,1,1,E); }
}
function drawBoulder(b){
  const x=b.x*TS-cam.x, y=b.y*TS-cam.y, w=b.w*TS, h=b.h*TS;
  px(x-2,y+h-3,w+4,5,'rgba(0,0,0,.28)');        // ground shadow
  px(x+6,y+2,w-12,h-2,'#83827e');               // upper mass
  px(x+3,y+6,w-6,h-6,'#8b8a86');                // lower mass
  px(x+6,y+2,w-12,3,'#b0afaa');                 // top light
  px(x+3,y+6,w-6,3,'#a3a29d');
  px(x+5,y+h-6,w-10,4,'#6e6d69');               // bottom shade
  px(x+(w/2|0),y+7,2,h-9,'#6e6d69');            // crack
  px(x+9,y+10,3,2,'#6e6d69');
  px(x+5,y+h-4,5,2,'#5a7d3a'); px(x+w-11,y+6,4,2,'#5a7d3a'); // moss
}
function drawObj(o){
  const sx=Math.round(o.x*TS-cam.x), sy=Math.round(o.y*TS-cam.y), W=o.w*TS, H=o.h*TS;
  px(sx,sy+H-3,W,4,'rgba(0,0,0,.26)'); // ground shadow
  if(o.type==='kei'){            // 軽トラック（白）
    px(sx+14,sy+5,W-15,6,'#dcd8d0'); px(sx+14,sy+4,W-15,2,'#bbb7af');   // 荷台
    px(sx+1,sy+2,13,9,'#eef0f2'); px(sx+1,sy+2,13,1,'#cfd2d6');         // キャブ
    px(sx+2,sy+3,7,4,'#9cc4d8');                                        // 窓
    px(sx+3,sy+11,4,4,'#1f1f1f'); px(sx+W-9,sy+11,4,4,'#1f1f1f');       // タイヤ
    px(sx+4,sy+12,2,2,'#888'); px(sx+W-8,sy+12,2,2,'#888'); }
  else if(o.type==='fiat'){      // 青いFiat（丸い小型車）
    px(sx+2,sy+6,W-4,6,'#2f6fc0'); px(sx+5,sy+3,W-12,4,'#3a7fd0');      // ボディ＋屋根
    px(sx+6,sy+3,W-15,3,'#c3e2f2');                                     // 窓
    px(sx+2,sy+6,W-4,1,'#5a9fe0'); px(sx+W-4,sy+7,1,2,'#ffe');          // ライト
    px(sx+4,sy+11,4,4,'#1f1f1f'); px(sx+W-9,sy+11,4,4,'#1f1f1f');
    px(sx+5,sy+12,2,2,'#999'); px(sx+W-8,sy+12,2,2,'#999'); }
  else if(o.type==='flat'){      // 背景パネル（描きかけ）＋イーゼル脚
    px(sx+4,sy+9,2,H-9,'#7a5a3a'); px(sx+W-6,sy+9,2,H-9,'#7a5a3a');
    px(sx+3,sy+2,W-6,16,'#e8e2d2'); px(sx+3,sy+2,W-6,2,'#cfc8b6');      // パネル
    px(sx+5,sy+4,W-10,6,'#9cc6e0'); px(sx+5,sy+10,W-10,5,'#7fae66');    // 空＋丘（描きかけ）
    px(sx+W-9,sy+5,2,2,'#e8c84a');                                      // 太陽
    px(sx+6,sy+12,3,1,'#c25a5a'); }                                     // 塗りかけの跡
  else if(o.type==='platform'){  // 舞台の平台
    px(sx+1,sy+5,W-2,6,'#b88a52'); px(sx+1,sy+5,W-2,2,'#c89a62');
    for(let i=1;i*8<W-2;i++)px(sx+i*8,sy+5,1,6,'#9c7042');
    px(sx+2,sy+11,2,3,'#6e4e2a'); px(sx+W-4,sy+11,2,3,'#6e4e2a'); }
  else if(o.type==='scaffold'){  // 単管の枠
    px(sx+2,sy+2,1,12,'#b6b6b6'); px(sx+W-3,sy+2,1,12,'#b6b6b6');
    px(sx+2,sy+4,W-4,1,'#cfcfcf'); px(sx+2,sy+9,W-4,1,'#cfcfcf');
    px(sx+2,sy+2,W-4,1,'#e2e2e2'); }
  else if(o.type==='ladder'){    // 脚立
    px(sx+4,sy+1,1,13,'#caa46a'); px(sx+9,sy+1,1,13,'#caa46a');
    for(let i=0;i<4;i++)px(sx+4,sy+3+i*3,6,1,'#b8905a'); }
  else if(o.type==='lumber'){    // 木材
    px(sx+1,sy+9,13,2,'#c69a5e'); px(sx+1,sy+11,13,2,'#b8895a'); px(sx+2,sy+7,11,2,'#caa264');
    px(sx+1,sy+7,1,6,'#8a6a3a'); px(sx+13,sy+7,1,6,'#8a6a3a'); }
  else if(o.type==='paint'){     // 塗料＋刷毛
    px(sx+2,sy+8,5,5,'#cc4a4a'); px(sx+2,sy+8,5,1,'#e06a6a');
    px(sx+9,sy+9,4,4,'#3a6ac0'); px(sx+9,sy+9,4,1,'#5a8ae0');
    px(sx+6,sy+4,1,4,'#8a6a3a'); px(sx+5,sy+3,3,2,'#e8e2d2'); }
  else if(o.type==='tent'){      // 三角テント（自由の広場）
    const col=o.c||'#c4604a', mid=W/2;
    // back guy-line
    px(sx+mid|0,sy+2,1,H-6,'#caa46a');
    // triangular canopy（横スライスで三角を作る）
    for(let yy=0; yy<H-6; yy++){
      const half=Math.round((yy/(H-6))*(W/2-1));
      px((sx+mid-half)|0, sy+4+yy, half*2||1, 1, col);
    }
    px(sx+2,sy+H-3,W-4,2,'#0003');                 // ground shade
    // shaded right side
    for(let yy=0; yy<H-6; yy++){ const half=Math.round((yy/(H-6))*(W/2-1));
      px((sx+mid)|0, sy+4+yy, Math.max(1,half), 1, 'rgba(0,0,0,.16)'); }
    // entrance flap
    px((sx+mid-3)|0, sy+H-10, 6, 7, '#2a2018');
    px((sx+mid-2)|0, sy+H-9, 1, 6, col); px((sx+mid+1)|0, sy+H-9, 1, 6, col);
    // ridge highlight + top knot
    px((sx+mid-1)|0, sy+3, 2, 2, '#fff5'); px((sx+mid)|0, sy+2, 1, 2, '#caa46a'); }
  else if(o.type==='pit'){       // 竪穴式住居（縄文）
    const mid=W/2, base=H-7;
    px(sx+1,sy+H-7,W-2,6,'#7a5a3a'); px(sx+1,sy+H-7,W-2,1,'#8a6a44');     // 盛り土の土台
    for(let yy=0; yy<base; yy++){ const half=Math.round((yy/base)*(mid-1));  // 茅葺きの円錐
      px((sx+mid-half)|0, sy+3+yy, (half*2)||1, 1, '#a98a52'); }
    for(let yy=0; yy<base; yy++){ const half=Math.round((yy/base)*(mid-1));  // 右側の陰
      px((sx+mid)|0, sy+3+yy, Math.max(1,(half*0.7)|0), 1, 'rgba(0,0,0,.12)'); }
    for(let yy=4; yy<base; yy+=3) px(sx+3,sy+3+yy,W-6,1,'#8a6a3a');        // 茅の段
    px(sx+mid-3,sy+1,3,4,'#5a4028'); px(sx+mid,sy+1,3,4,'#5a4028');        // 棟木（交差）
    px(sx+mid-3,sy+H-12,6,9,'#241a12'); px(sx+mid-2,sy+H-11,4,8,'#15100a'); // 入口の暗がり
    px(sx+mid-4,sy+H-12,1,9,'#4a3422'); px(sx+mid+3,sy+H-12,1,9,'#4a3422'); } // 入口の柱
  else if(o.type==='sensor'){    // 観測機（気象・土壌センサー／将来 raspi 連携）
    const t=Date.now();
    px(sx+7,sy+5,2,9,'#9aa0a6');                                   // 支柱
    px(sx+4,sy+13,8,2,'#6e7278');                                  // 台座
    px(sx+3,sy+5,5,4,'#2c2f36'); px(sx+3,sy+5,5,1,'#454a54');      // 計測ボックス
    const blink=(Math.sin(t/400)>0)?'#5af0a0':'#1f5a3a';
    px(sx+4,sy+6,1,1,blink);                                       // 動作ランプ（点滅）
    px(sx+9,sy+4,4,3,'#2f5a8a'); px(sx+9,sy+4,4,1,'#4a7ab0');      // ソーラーパネル
    px(sx+8,sy+1,1,4,'#9aa0a6'); px(sx+7,sy+1,3,1,'#cfd3d8');      // アンテナ
    // 風杯（くるくる回る）
    const a=t/240, dx=Math.round(Math.cos(a)*2), dy=Math.round(Math.sin(a)*2);
    px(sx+8+dx,sy+1+dy,1,1,'#e8e8e8'); px(sx+8-dx,sy+1-dy,1,1,'#e8e8e8'); }
  else if(o.type==='well'){      // 葡萄畑の南の井戸（小さめ・ゆらぎアニメ・将来 水温・pH 観測）
    const t=Date.now();
    px(sx+2,sy+3,12,1,'#5c2a20'); px(sx+4,sy+1,8,2,'#7a3b2a'); px(sx+6,sy,4,1,'#8a4632');  // 屋根
    px(sx+3,sy+4,1,6,'#6b4f2e'); px(sx+12,sy+4,1,6,'#6b4f2e');     // 柱
    px(sx+4,sy+4,8,1,'#5a4326');                                   // 梁
    const bob=(Math.sin(t/700)>0)?0:1;                            // 桶がゆっくり上下
    px(sx+8,sy+5,1,2+bob,'#b9a07a');                              // ロープ（伸び縮み）
    px(sx+7,sy+7+bob,3,2,'#9a7b4a'); px(sx+7,sy+7+bob,3,1,'#b99a6a'); // 桶
    px(sx+3,sy+10,10,5,'#8a8276'); px(sx+3,sy+10,10,1,'#a59c8e');  // 石積み
    px(sx+6,sy+11,1,4,'#6e675c'); px(sx+9,sy+11,1,4,'#6e675c');
    px(sx+5,sy+11,6,3,'#1e3a4a');                                  // 水面
    const ph=t/350, gx=sx+6+Math.round(Math.sin(ph)*1.5);        // さざ波の光が左右に揺れる
    px(gx,sy+12,2,1,(Math.sin(ph)>0)?'#4a7a8a':'#356576');
    px(sx+5+((t/300|0)%6),sy+11,1,1,'rgba(150,200,220,.55)'); }   // きらめきが水面を渡る
  else if(o.type==='cellar'){    // ワイン貯蔵の室（土のかまくら・山をくりぬいた風）
    px(sx+2,sy+12,12,3,'#6e5238'); px(sx+3,sy+9,10,3,'#7a5e42');   // 土のドーム
    px(sx+4,sy+6,8,3,'#86684a'); px(sx+6,sy+4,4,2,'#8e7050');
    px(sx+5,sy+5,6,1,'#94785a');                                   // 陽の当たる頂
    px(sx+6,sy+3,1,1,'#5a7a3a'); px(sx+9,sy+4,1,1,'#4f6e33'); px(sx+3,sy+9,1,1,'#5a7a3a'); px(sx+12,sy+11,1,1,'#4f6e33'); // 草・苔
    px(sx+6,sy+8,4,7,'#241a12'); px(sx+6,sy+8,4,1,'#3a2a1c');      // 入口（暗いアーチ）
    px(sx+5,sy+9,1,6,'#4a3522'); px(sx+10,sy+9,1,6,'#4a3522');     // 扉枠
    px(sx+7,sy+12,2,2,'#5a2e2a'); px(sx+7,sy+12,2,1,'#6e3a34'); }  // 奥のワイン樽
  else if(o.type==='still'){      // 蒸留所：銅の単式蒸留器（ポットスチル）2x2=32x32
    const t=Date.now();
    // かまど（れんが）＋火
    px(sx+5,sy+23,15,7,'#6e4230'); px(sx+5,sy+23,15,1,'#824d38');   // 火床
    for(let i=0;i<3;i++){ px(sx+6+i*5,sy+24,1,6,'#4a2c20'); }        // れんがの目地
    px(sx+9,sy+26,7,4,'#180d08');                                    // 焚き口
    const f=(Math.sin(t/180)>0);                                     // 炎のゆらぎ
    px(sx+10,sy+27,5,2,f?'#ff9a3a':'#e07a2a');
    px(sx+11,sy+25,1,3,'#ffd24a'); px(sx+13,sy+26,1,2,f?'#ffd24a':'#ff8a3a'); px(sx+9,sy+27,1,1,'#ffb040');
    // 銅の胴（玉ねぎ形）
    px(sx+5,sy+20,15,3,'#b5713a'); px(sx+4,sy+16,17,4,'#b5713a');    // 腹（最大幅）
    px(sx+6,sy+13,13,3,'#b5713a'); px(sx+8,sy+11,9,2,'#a5642f');     // 肩
    px(sx+10,sy+9,5,2,'#7a4a24');                                    // 首の付け根
    px(sx+6,sy+16,3,6,'#d8935a'); px(sx+8,sy+13,2,3,'#d8935a');      // 左の照り
    px(sx+18,sy+16,2,4,'#7a4a24'); px(sx+17,sy+20,3,3,'#7a4a24');    // 右の陰
    // スワンネック（立ち上がって右へ弧を描く）
    px(sx+11,sy+5,3,5,'#b5713a'); px(sx+11,sy+4,9,2,'#b5713a'); px(sx+19,sy+5,2,7,'#a5642f');
    px(sx+11,sy+4,7,1,'#d8935a');                                    // ネックの照り
    // 冷却槽（ワームタブ・木桶）＋らせん管
    px(sx+22,sy+12,9,11,'#6e4a2c'); px(sx+22,sy+12,9,1,'#7e5a38');
    px(sx+22,sy+14,9,1,'#4a3220'); px(sx+22,sy+19,9,1,'#4a3220');    // たが
    px(sx+23,sy+12,7,1,'#3a6a7a');                                   // 冷却水の面
    px(sx+24,sy+15,4,1,'#b5713a'); px(sx+25,sy+17,3,1,'#b5713a'); px(sx+24,sy+19,4,1,'#b5713a'); // らせん管
    px(sx+24,sy+23,1,3,'#b5713a');                                   // 取り出し口
    px(sx+22,sy+26,4,4,'#cfe0e8'); px(sx+23,sy+28,2,2,'#e8d48a');    // 受けびん（澄んだ一滴）
    if(((t/500)|0)%2) px(sx+24,sy+26,1,1,'rgba(220,230,240,.8)');    // したたる雫
    // センサー（気温・水温・度数を見張る／既存機器と同じ意匠）
    px(sx+1,sy+11,4,4,'#2c2f36'); px(sx+1,sy+11,4,1,'#454a54');      // 計測ボックス
    const blink=(Math.sin(t/400)>0)?'#5af0a0':'#1f5a3a';
    px(sx+2,sy+12,1,1,blink);                                        // 動作ランプ
    px(sx+2,sy+8,1,3,'#9aa0a6'); px(sx+1,sy+8,3,1,'#cfd3d8');        // アンテナ
    px(sx+5,sy+13,2,1,'#9aa0a6');                                    // 胴へ伸びるプローブ
    // 立ちのぼる湯気
    px(sx+13+((t/400|0)%2),sy+2,1,1,'rgba(255,255,255,.5)');
    px(sx+16+((t/600|0)%2),sy+1,1,1,'rgba(255,255,255,.35)'); }
  else if(o.type==='board'){     // FAB LABO の掲示板（工房の隣・ギャラリーを開く）
    px(sx+5,sy+13,6,3,'rgba(0,0,0,.28)');                          // 影
    px(sx+7,sy+6,2,9,'#6b4a2c');                                   // 柱
    px(sx+1,sy,14,8,'#caa46a'); px(sx+1,sy,14,1,'#d8b884'); px(sx+1,sy+7,14,1,'#9c7a4a'); // 板
    px(sx+3,sy+2,4,4,'#5a8a6a'); px(sx+4,sy+3,1,1,'#cfe3d4');      // ミニ絵（🖼）
    px(sx+9,sy+2,4,1,'#5a3d24'); px(sx+9,sy+4,3,1,'#5a3d24'); }    // 文字マーク
  else if(o.type==='jomon'){     // 縄文の環状列石（ストーンサークル）
    const cx=sx+W/2, cy=sy+H/2+2, rx=W*0.4, ry=H*0.26;
    px(sx+2,sy+H-7,W-4,6,'#6f5a3c'); px(sx+2,sy+H-7,W-4,1,'#7e6a48');   // 踏み均された土
    ctx.fillStyle='rgba(120,150,90,.16)';                              // 草の輪
    ctx.beginPath(); ctx.ellipse(cx,cy,rx+2,ry+2,0,0,7); ctx.fill();
    const N=8;                                                         // 環状に立つ石
    for(let i=0;i<N;i++){ const ang=(i/N)*Math.PI*2;
      const px0=Math.round(cx+Math.cos(ang)*rx), py0=Math.round(cy+Math.sin(ang)*ry);
      const tall=(Math.sin(ang)>0)?5:3;                               // 手前の石は高く
      px(px0-1,py0-tall,3,tall+2,'#8b8a86');                          // 石身
      px(px0-1,py0-tall,3,1,'#aeaca6');                               // 頭の光
      px(px0-1,py0+1,3,1,'rgba(0,0,0,.22)');                          // 足元の影
      if((i%2)===0) px(px0,py0-tall+1,1,1,'#6f8a5a'); }               // 苔
    px(Math.round(cx)-2,cy-7,4,9,'#9a9994');                          // 中央の立石
    px(Math.round(cx)-2,cy-7,4,1,'#b8b7b2'); px(Math.round(cx)-2,cy+1,4,1,'rgba(0,0,0,.25)');
    px(Math.round(cx),cy-5,1,1,'#6f8a5a'); }                          // 中央石の苔
  else if(o.type==='radio'){     // 焚き火ラジオ（木箱ラジオ＋マイク＋ON AIRランプ）
    px(sx+1,sy+7,9,7,'#8a5a3a'); px(sx+1,sy+7,9,1,'#a06a44');         // 木箱の本体
    px(sx+1,sy+13,9,1,'#5a3a22');                                     // 底の影
    px(sx+2,sy+9,4,4,'#2c241c'); px(sx+2,sy+9,4,1,'#4a3e30');         // スピーカーの網
    px(sx+3,sy+10,1,2,'#3a4a3a'); px(sx+4,sy+10,1,2,'#3a4a3a');       // 網の目
    px(sx+7,sy+9,2,2,'#caa46a'); px(sx+7,sy+12,2,1,'#caa46a');        // チューニングダイヤル
    px(sx+8,sy+1,1,6,'#9aa0a6');                                      // アンテナ
    const on=(Math.sin(Date.now()/360)>0);
    px(sx+8,sy,2,2,on?'#ff4a4a':'#5a2424');                           // ON AIR ランプ（点滅）
    px(sx+13,sy+6,1,8,'#6a6e74'); px(sx+11,sy+13,5,1,'#5a5e64');      // マイクのスタンド＋台座
    px(sx+12,sy+2,3,5,'#2c2f36'); px(sx+12,sy+2,3,1,'#4a505a');       // マイクの頭
    px(sx+13,sy+3,1,3,'#727880'); }                                  // マイクの網
  else if(o.type==='forestspk'){ // 裏山の森：山録の音響装置（スピーカー＋録音機）
    px(sx+7,sy+9,2,7,'#6a4a2e'); px(sx+6,sy+15,4,1,'#4a3420');        // 木の支柱＋根もと
    px(sx+3,sy+1,10,9,'#34302a'); px(sx+3,sy+1,10,1,'#544c40');       // スピーカーの箱
    px(sx+3,sy+9,10,1,'#1f1c17');                                     // 箱の底の影
    px(sx+5,sy+2,6,3,'#1c1814'); px(sx+5,sy+5,6,3,'#1c1814');         // 上下ふたつのコーン
    px(sx+6,sy+3,1,1,'#4a4038'); px(sx+9,sy+3,1,1,'#4a4038');         // コーンの芯
    px(sx+6,sy+6,1,1,'#4a4038'); px(sx+9,sy+6,1,1,'#4a4038');
    const on=(Math.sin(Date.now()/520)>0);
    px(sx+11,sy+8,1,1,on?'#7ad07a':'#2a4a2a');                        // 通電ランプ（緑・点滅）
    if(on){ ctx.fillStyle='rgba(180,210,170,.5)';                     // かすかな音波（右へ）
      ctx.fillRect(sx+14,sy+3,1,4); ctx.fillRect(sx+15,sy+2,1,6); } }
  else if(o.type==='kitchen'){   // 屋外の台所（棚＋カウンター＋コンロ＋鍋）
    px(sx+2,sy-4,W-4,4,'#8a6a44'); px(sx+2,sy-4,W-4,1,'#a07c50');     // 上の棚板
    px(sx+5,sy-3,1,3,'#b8b8b8'); px(sx+4,sy-1,2,1,'#b8b8b8');         // つるしたおたま
    px(sx+8,sy-3,1,3,'#caa060');                                      // 木べら
    px(sx+1,sy+4,W-2,9,'#9a6a3a'); px(sx+1,sy+4,W-2,1,'#b07c44');     // カウンター天板
    px(sx+1,sy+12,W-2,2,'#6a4628');                                   // 脚もとの影
    for(let i=1;i*8<W-2;i++) px(sx+i*8,sy+5,1,8,'#7a5230');           // 板の継ぎ目
    px(sx+4,sy+8,5,3,'#3a2a1a');                                      // コンロの五徳
    const f=Math.round(Math.sin(Date.now()/120)*1.2);
    ctx.fillStyle='#e0531e'; ctx.fillRect(sx+5,sy+6+f,3,3);           // 炎
    ctx.fillStyle='#ffb24a'; ctx.fillRect(sx+6,sy+7+f,1,2);
    px(sx+W-12,sy+5,8,5,'#3a3e44'); px(sx+W-12,sy+5,8,1,'#5a5e64');   // 鍋
    px(sx+W-13,sy+4,10,1,'#6a6e74'); px(sx+W-9,sy+3,2,1,'#8a8e94');   // ふち＋とって
    if((Date.now()%1800)<1000){ const a=0.4*(1-(Date.now()%1800)/1000);  // 鍋の湯気
      ctx.fillStyle='rgba(236,246,245,'+a.toFixed(2)+')'; ctx.fillRect(sx+W-9,sy+1-((Date.now()%1800)/200),2,2); } }
}
function drawBear(){
  const sx=Math.round(BEAR.px-cam.x), sy=Math.round(BEAR.py-cam.y), bob=BEAR.moving?(Math.floor(BEAR.frame)%2):0;
  px(sx+5,sy+28,22,3,'rgba(0,0,0,.26)');                         // wide shadow
  px(sx+7,sy+24+bob,5,6,'#5a3d28'); px(sx+20,sy+24+bob,5,6,'#5a3d28'); // legs
  px(sx+5,sy+12+bob,22,14,'#6b4a32'); px(sx+5,sy+12+bob,22,2,'#7a5638'); px(sx+5,sy+24+bob,22,2,'#4f3522'); // body
  px(sx+8,sy+2+bob,5,5,'#5a3d28'); px(sx+19,sy+2+bob,5,5,'#5a3d28'); // ears
  px(sx+9,sy+3+bob,2,2,'#7a5638'); px(sx+20,sy+3+bob,2,2,'#7a5638');
  px(sx+9,sy+4+bob,14,12,'#6b4a32'); px(sx+9,sy+4+bob,14,2,'#7a5638'); // head
  px(sx+13,sy+11+bob,6,5,'#c8a884'); px(sx+15,sy+13+bob,2,2,'#2a1d12'); // snout + nose
  px(sx+12,sy+8+bob,2,2,'#2a1d12'); px(sx+18,sy+8+bob,2,2,'#2a1d12'); // eyes
  px(sx+12,sy+8+bob,1,1,'#fff'); px(sx+18,sy+8+bob,1,1,'#fff');        // timid catchlight
}
function drawHeron(){
  const sx=Math.round(HERON.px-cam.x), sy=Math.round(HERON.py-cam.y);
  if(!HERON.flying){
    px(sx+5,sy+15,6,1,'rgba(0,0,0,.18)');                  // reflection/shadow
    px(sx+6,sy+11,1,4,'#d8b24a'); px(sx+9,sy+11,1,4,'#d8b24a'); // legs
    px(sx+4,sy+7,8,5,'#f5f5f1'); px(sx+4,sy+7,8,1,'#ffffff');   // body
    px(sx+9,sy+3,1,5,'#f5f5f1'); px(sx+10,sy+2,1,2,'#f5f5f1'); // S-neck
    px(sx+10,sy+1,2,2,'#ffffff');                              // head
    px(sx+12,sy+2,3,1,'#e3b22e');                              // beak
    px(sx+11,sy+1,1,1,'#333');                                 // eye
  } else if(!HERON.gone){
    const up=(Math.floor(HERON.flyT/5)%2);
    ctx.globalAlpha=Math.max(0,1-HERON.flyT/90);
    px(sx+5,sy+6,6,3,'#f5f5f1');                               // body
    px(sx+10,sy+4,2,2,'#ffffff'); px(sx+11,sy+5,3,1,'#e3b22e'); // head + beak forward
    if(up){ px(sx+1,sy+3,4,2,'#ffffff'); px(sx+10,sy+3,4,2,'#ffffff'); }
    else  { px(sx+1,sy+8,4,2,'#eeeeea'); px(sx+10,sy+8,4,2,'#eeeeea'); }
    px(sx+4,sy+9,4,1,'#d8b24a');                               // trailing legs
    ctx.globalAlpha=1;
  }
}
function drawWarp(){
  const x=WARP.x*TS-cam.x, y=WARP.y*TS-cam.y, w=WARP.w*TS, h=WARP.h*TS;
  const cx=x+w/2, cy=y+h/2, t=Date.now()/400;
  for(let i=0;i<3;i++){ const rr=9+i*5+Math.sin(t+i)*1.5;
    ctx.strokeStyle='rgba(120,200,255,'+(0.55-i*0.15)+')'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(cx,cy,rr,rr*0.55,0,0,7); ctx.stroke(); }
  for(let i=0;i<6;i++){ const a=t+i*Math.PI/3;
    px(Math.round(cx+Math.cos(a)*13)-1, Math.round(cy+Math.sin(a)*7)-1, 2,2,'#cde6ff'); }
  px(Math.round(cx)-1,Math.round(cy)-1,2,2,'#eaf6ff');
}
function drawShrine(){
  const sx=Math.round(SHRINE.x*TS-cam.x), sy=Math.round(SHRINE.y*TS-cam.y);
  const W=SHRINE.w*TS, H=SHRINE.h*TS, cx=(sx+W/2)|0;
  px(sx+3,sy+H-4,W-6,5,'rgba(0,0,0,.28)');   // 影
  // 本殿（北側・奥）
  px(cx-7,sy+2,14,2,'#686058');               // 棟（屋根の峰）
  px(cx-9,sy+4,18,2,'#7a7268');              // 屋根の傾斜
  px(cx-10,sy+6,20,1,'#807870');             // 軒先
  px(cx-7,sy+7,14,8,'#8a8278');             // 壁
  px(cx-7,sy+7,14,1,'#a49e92');             // 壁の上縁
  px(cx-3,sy+9,7,5,'#1e1a18');             // 扉（内部の暗がり）
  px(cx-1,sy+6,3,2,'#d4a820');            // 金の鈴
  px(cx,sy+5,1,1,'#f0c840');             // 鈴のハイライト
  // 手水鉢（左手前・手を清める水鉢）
  px(cx-14,sy+14,5,4,'#6a8490');         // 石の鉢
  px(cx-14,sy+15,5,1,'#8ab4b8');        // 水面の反射
  // 鳥居（南側・手前）
  px(cx-12,sy+14,24,2,'#c0b4a2');       // 笠木（上の横木）
  px(cx-11,sy+16,22,1,'#b4a898');       // 島木（下の横木）
  px(cx-11,sy+16,2,12,'#b4a898');       // 左柱
  px(cx+9,sy+16,2,12,'#b4a898');        // 右柱
  px(cx-10,sy+20,20,1,'#c0b8a8');       // 貫（柱の中間の横木）
  // 石段
  px(cx-8,sy+H-8,16,3,'#c0b8ac');       // 上の段
  px(cx-10,sy+H-5,20,4,'#b8b0a4');      // 下の段（手前）
  // 足元の苔・湿気
  px(sx,sy+H-3,4,2,'#5a8a44'); px(sx+W-4,sy+H-4,4,2,'#4a7236');
}
function drawSign(){
  const x=SIGN.x*TS-cam.x, y=SIGN.y*TS-cam.y;
  px(x+5,y+13,6,3,'rgba(0,0,0,.28)');
  px(x+7,y+6,2,8,'#6b4a2c');                 // post
  px(x+2,y,12,8,'#caa46a'); px(x+2,y,12,1,'#d8b884'); px(x+2,y+7,12,1,'#9c7a4a'); // board
  px(x+4,y+2,8,1,'#5a3d24'); px(x+4,y+4,6,1,'#5a3d24'); // text marks
  px(x+11,y+2,1,1,'#7aa0c8');                 // ✨
}
function drawChest(t){
  const x=t.x*TS-cam.x, y=t.y*TS-cam.y;
  px(x+1,y+13,14,3,'rgba(0,0,0,.28)');
  if(t.found){
    px(x+2,y+9,12,5,'#6b4527'); px(x+2,y+9,12,1,'#8a6038');     // body
    px(x+2,y+3,12,4,'#5a3a22'); px(x+2,y+3,12,1,'#7a5230');     // open lid (back)
    px(x+4,y+10,8,2,'#e7c878'); px(x+6,y+10,2,2,'#fff4c2');     // gold remnants
  } else {
    px(x+2,y+7,12,7,'#7a5230'); px(x+2,y+7,12,2,'#8a6038');     // body
    px(x+2,y+5,12,3,'#6b4527'); px(x+2,y+5,12,1,'#9a6e3e');     // lid
    px(x+2,y+9,12,1,'#e7c878');                                  // gold band
    px(x+7,y+8,2,4,'#e7c878'); px(x+7,y+9,2,2,'#c8a850');        // lock
  }
}
function drawFire(x,y){
  const sx=Math.round(x),sy=Math.round(y),t=Date.now()/90;
  px(sx+3,sy+11,10,3,'rgba(0,0,0,.25)');
  px(sx+3,sy+10,10,2,'#6b4a2c'); px(sx+4,sy+9,8,2,'#5a3d24');   // logs
  const f=Math.round(Math.sin(t)*1.2);
  ctx.fillStyle='#e0531e'; ctx.fillRect(sx+5,sy+4+f,6,6);
  ctx.fillStyle='#f0a23a'; ctx.fillRect(sx+6,sy+5+f,4,4);
  ctx.fillStyle='#ffe08a'; ctx.fillRect(sx+7,sy+7+f,2,2);
  px(sx+8,sy+2+Math.round(Math.sin(t*1.7)),1,1,'#ffd27a');      // spark
}
function drawSwimmer(x,y,dir,frame){
  const sx=Math.round(x),sy=Math.round(y),t=Date.now()/200;
  // ripple ring
  ctx.strokeStyle='rgba(220,240,255,.55)';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(sx+8,sy+11,7+Math.sin(t)*1.6,3.2,0,0,7);ctx.stroke();
  // submerged body hint
  px(sx+4,sy+9,8,3,'#3a4a8a');
  // head above water
  px(sx+5,sy+3,6,6,'#e8c39a'); px(sx+5,sy+2,6,2,'#3a2a1a');
  if(dir==='down'){px(sx+6,sy+6,1,1,'#3a2a1a');px(sx+9,sy+6,1,1,'#3a2a1a');}
  else if(dir==='left'){px(sx+6,sy+6,1,1,'#3a2a1a');}
  else if(dir==='right'){px(sx+9,sy+6,1,1,'#3a2a1a');}
  // arms stroking
  const a=Math.floor(frame)%2;
  px(sx+3,sy+8+a,2,2,'#e8c39a'); px(sx+11,sy+9-a,2,2,'#e8c39a');
}
/* ── 入浴（温泉に肩までつかる。頭に手ぬぐい・ほっとした顔・湯にゆられる） ── */
function drawBather(x,y){
  const sx=Math.round(x),sy=Math.round(y),t=Date.now()/520;
  const bob=Math.round(Math.sin(t)*0.7);                  // 湯にゆられてゆらゆら
  // 湯面の波紋（あたたかい乳青）
  ctx.strokeStyle='rgba(207,240,236,.75)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.ellipse(sx+8,sy+12,7+Math.sin(t*1.4)*1.3,3,0,0,7); ctx.stroke();
  // 肩（湯にすこし沈んで色づく）
  px(sx+3,sy+10+bob,10,3,'#5fb4b0'); px(sx+3,sy+10+bob,10,1,'#7fcfc8');
  // 頭（湯の上）
  px(sx+5,sy+4+bob,6,6,'#e8c39a');                         // 顔
  px(sx+4,sy+4+bob,1,3,'#3a2a1a'); px(sx+11,sy+4+bob,1,3,'#3a2a1a'); // もみあげ
  // 頭にのせた手ぬぐい（温泉の定番）
  px(sx+4,sy+2+bob,8,2,'#f2f1ea'); px(sx+4,sy+2+bob,8,1,'#ffffff');
  px(sx+5,sy+1+bob,2,1,'#e6e4da'); px(sx+9,sy+1+bob,2,1,'#e6e4da'); // 端の折り
  // ほっとした顔（とじ目＋ほんのりほっぺ＋小さな口）
  px(sx+6,sy+7+bob,1,1,'#3a2a1a'); px(sx+9,sy+7+bob,1,1,'#3a2a1a'); // とじ目
  px(sx+5,sy+8+bob,1,1,'#e89a90'); px(sx+10,sy+8+bob,1,1,'#e89a90'); // ほっぺ
  px(sx+7,sy+8+bob,2,1,'#b07a6a');                          // 口
  // たまに「ふぅ…」と湯気がひとつ立つ
  if((Date.now()%2600)<900){ const a=0.5*(1-((Date.now()%2600)/900));
    ctx.fillStyle='rgba(236,246,245,'+a.toFixed(2)+')'; ctx.fillRect(sx+11,sy-2+bob-((Date.now()%2600)/120),2,2); }
}
/* ── 摘んだ花を持つ（1〜3:片手 / 4〜:両手で抱える / 10〜:頭が花束 / 15〜:全身が花束） ── */
function drawHeldFlowers(sx,sy,n,bob){
  const COL=['#f4a6c0','#ffd24f','#ffffff','#e88ad0','#7fc6ff','#ff8f6a','#b69cff'], y=sy+bob;
  const fb=(bx,by,ci)=>{ px(sx+bx,y+by,3,3,COL[ci%COL.length]); px(sx+bx+1,y+by+1,1,1,'#fff8'); };  // 花ひとつ
  if(n>=15){                                                    // 体ぜんぶが花束（脚だけ出る）
    px(sx+6,y+12,4,2,'#3a7d45');                                // 根元の茎束
    const S=[[2,1],[5,0],[8,1],[11,1],[3,4],[6,3],[9,4],[12,4],[2,7],[5,6],[8,7],[11,7],[4,9],[7,9],[10,9]];
    S.forEach((s,i)=>fb(s[0],s[1],i));
    px(sx+1,y+8,2,2,'#2f6b3a'); px(sx+13,y+7,2,2,'#2f6b3a');    // はみ出す葉
    return;
  }
  if(n>=10){                                                    // 頭が花束＋胸に抱える花束
    px(sx+2,y+9,2,3,'#e8c39a'); px(sx+12,y+9,2,3,'#e8c39a');    // 両手
    px(sx+4,y+10,8,2,'#3a7d45');                                // 茎束
    fb(3,8,0); fb(6,8,1); fb(9,8,2);                            // 胸の花
    const H=[[3,0],[6,-1],[9,0],[4,3],[7,2],[10,3],[5,5]];      // 頭をおおう花
    H.forEach((s,i)=>fb(s[0],s[1],i+1));
    px(sx+2,y+2,1,1,'#2f6b3a'); px(sx+12,y+1,1,1,'#2f6b3a');    // 葉
    return;
  }
  if(n>=4){                                                     // 両手で抱える花束
    px(sx+2,y+9,2,3,'#e8c39a'); px(sx+12,y+9,2,3,'#e8c39a');    // 両手
    px(sx+4,y+10,8,2,'#3a7d45');                                // 茎束
    fb(3,6,0); fb(6,5,1); fb(9,6,2); fb(5,8,3); fb(9,8,4);      // 花
    px(sx+3,y+9,1,1,'#2f6b3a'); px(sx+11,y+9,1,1,'#2f6b3a');    // 葉
    return;
  }
  // 1〜3：片手に一輪〜小さな花束
  px(sx+10,y+9,3,3,'#e8c39a');                                  // 手
  px(sx+11,y+6,1,5,'#3a7d45');                                  // 茎
  fb(10,4,0);                                                   // 1輪目
  if(n>=2){ px(sx+7,y+7,1,4,'#3a7d45'); fb(6,5,1); }            // 2輪目
  if(n>=3){ px(sx+9,y+7,2,2,COL[2]); }                          // 3輪目
  px(sx+9,y+9,1,1,'#2f6b3a');                                   // 葉
}
function drawAnimal(x,y,dir,frame,moving,type){
  const sx=Math.round(x),sy=Math.round(y),bob=moving?(Math.floor(frame)%2):0;
  const R=dir!=='left';
  if(type==='horse'){            // 一頭のウマ（他より大きく、たてがみ・長い首・尾）
    const co='#8a5630', dk='#6e4424', mane='#3a2616', hoof='#241a12', hi='#a06a3e';
    px(sx+2,sy+14,12,2,'rgba(0,0,0,.24)');                          // 影
    px(sx+4,sy+10,2,4+bob,dk); px(sx+12,sy+10,2,4-bob,dk);          // 前後の脚（歩調）
    px(sx+7,sy+10,2,4-bob,dk); px(sx+10,sy+10,2,4+bob,dk);
    px(sx+4,sy+13+bob,2,1,hoof); px(sx+12,sy+13-bob,2,1,hoof);       // ひづめ
    px(sx+3,sy+5,12,6,co); px(sx+3,sy+5,12,1,hi); px(sx+3,sy+10,12,1,dk); // 胴
    if(R){
      px(sx+11,sy+1,3,5,co);                                        // 首
      px(sx+12,sy-1,4,3,co); px(sx+15,sy+1,1,2,dk);                 // 頭・鼻面
      px(sx+14,sy,1,1,'#1c140d');                                   // 目
      px(sx+13,sy-3,1,2,co); px(sx+11,sy-2,1,2,co);                 // 耳
      px(sx+10,sy-1,2,7,mane); px(sx+11,sy+1,3,1,mane);             // たてがみ
      px(sx+1,sy+5,2,7,mane); px(sx,sy+8,1,3,mane);                 // 尾
    } else {
      px(sx+2,sy+1,3,5,co);
      px(sx,sy-1,4,3,co); px(sx,sy+1,1,2,dk);
      px(sx+1,sy,1,1,'#1c140d');
      px(sx+2,sy-3,1,2,co); px(sx+4,sy-2,1,2,co);
      px(sx+4,sy-1,2,7,mane); px(sx+2,sy+1,3,1,mane);
      px(sx+13,sy+5,2,7,mane); px(sx+15,sy+8,1,3,mane);
    }
    return;
  }
  px(sx+3,sy+13,10,2,'rgba(0,0,0,.22)');
  const C={sheep:['#efe9df','#3c352d','#3c352d'],goat:['#c7b9a0','#9c8f78','#6e6253'],
           rabbit:['#e9e3d7','#e9e3d7','#d2cabb'],deer:['#a9794e','#8a6038','#5e4126'],
           monkey:['#7a5a3a','#caa07a','#5e4126']}[type];
  const body=C[0],head=C[1],leg=C[2];
  px(sx+4,sy+10,1,3-bob,leg);px(sx+6,sy+10,1,3-bob,leg);px(sx+9,sy+10,1,3-bob,leg);px(sx+11,sy+10,1,3-bob,leg);
  px(sx+3,sy+5+bob,9,6,body);
  if(type==='sheep'){ px(sx+2,sy+4+bob,4,4,body);px(sx+6,sy+3+bob,4,4,body);px(sx+9,sy+4+bob,4,4,body); }
  const hx=R?sx+10:sx+2;
  px(hx,sy+4+bob,4,4,head);
  px(R?hx+2:hx+1,sy+6+bob,1,1,'#1c160f');                       // eye
  if(type==='rabbit'){ px(R?hx+1:hx+2,sy+bob,1,4,head); px(R?hx+2:hx+1,sy+1+bob,1,3,'#f0b8c0'); }
  else if(type==='goat'){ px(R?hx+3:hx,sy+3+bob,1,1,'#efe7d6'); px(R?hx:hx+3,sy+8+bob,1,2,head); }
  else if(type==='deer'){ px(R?hx+1:hx+2,sy+bob,1,4,'#d8c9b0'); px(R?hx-1:hx+4,sy+1+bob,1,2,'#d8c9b0');
    px(sx+5,sy+6+bob,1,1,'#e8dcc8'); px(sx+8,sy+7+bob,1,1,'#e8dcc8'); }
  else if(type==='monkey'){ px(R?hx+1:hx+1,sy+6+bob,2,2,'#e9b9a6');          // 赤らんだ顔
    px(R?hx+2:hx+1,sy+6+bob,1,1,'#1c160f');                                  // 目
    px(R?sx+1:sx+12,sy+5+bob,1,4,head); px(R?sx:sx+11,sy+8+bob,2,1,head); }  // 巻きしっぽ
  else if(type==='sheep'){ px(hx,sy+3+bob,4,2,head); }
}
function drawPheasant(x,y,dir,frame,moving,kind){
  const sx=Math.round(x),sy=Math.round(y),bob=moving?(Math.floor(frame)%2):0,R=dir!=='left';
  px(sx+4,sy+13,8,2,'rgba(0,0,0,.22)');                          // 影
  if(kind==='chick'){                                            // 雛（小さくふわふわ）
    px(sx+6,sy+9+bob,4,4,'#d8c070'); px(sx+6,sy+9+bob,4,1,'#e8d68a');
    px(R?sx+9:sx+5,sy+8+bob,2,2,'#e8d68a');                      // 頭
    px(R?sx+10:sx+5,sy+9+bob,1,1,'#2a1d12');                     // 目
    px(R?sx+11:sx+4,sy+9+bob,1,1,'#c8902a');                     // くちばし
    px(sx+6,sy+13,1,1,'#c8902a'); px(sx+9,sy+13,1,1,'#c8902a');  // 脚
    return; }
  px(sx+6,sy+11+bob,1,3,'#c8902a'); px(sx+9,sy+11+bob,1,3,'#c8902a'); // 脚
  if(kind==='hen'){                                              // 雌雉（地味な保護色）
    px(R?sx-1:sx+10,sy+7+bob,4,3,'#7a5a34'); px(R?sx-1:sx+10,sy+8+bob,4,1,'#6b4a2c'); // 短い尾
    px(sx+3,sy+6+bob,8,6,'#9a7a4a'); px(sx+4,sy+5+bob,6,3,'#a98a58'); px(sx+5,sy+8+bob,5,1,'#7a5a34');
    px(sx+4,sy+7+bob,7,1,'#876a40');                             // まだら
    const hx=R?sx+9:sx+3; px(hx,sy+4+bob,3,3,'#8a6a3e');
    px(R?hx+1:hx+1,sy+5+bob,1,1,'#2a1d12'); px(R?hx+3:hx-1,sy+5+bob,1,1,'#c8902a');
    return; }
  // 雄雉（優雅な色合い：玉虫色の頭・赤い顔・白い首輪・銅金の体・長い尾）
  const tx=R?sx-4:sx+10;
  px(tx,sy+5+bob,7,2,'#6b4a2c'); px(tx,sy+7+bob,7,2,'#caa264');  // 長い尾（縞）
  px(tx,sy+6+bob,7,1,'#8a6a3a'); px(R?tx:tx+6,sy+5+bob,1,4,'#5a3d24');
  px(sx+3,sy+6+bob,8,6,'#a6602a'); px(sx+4,sy+5+bob,6,3,'#c47a32'); // 体（銅色）
  px(sx+4,sy+6+bob,6,1,'#e0a24a'); px(sx+5,sy+8+bob,5,1,'#7a4420'); // 金の照り＋腹影
  px(sx+5,sy+7+bob,2,1,'#3a2a18'); px(sx+8,sy+8+bob,1,1,'#3a2a18'); // 斑点
  const hx=R?sx+9:sx+2;
  px(hx,sy+3+bob,3,4,'#1f6b3a'); px(hx,sy+3+bob,3,1,'#2f9d52');   // 玉虫色の頭
  px(R?hx-1:hx+2,sy+6+bob,2,1,'#f0f0e8');                         // 白い首輪
  px(R?hx+2:hx,sy+4+bob,1,2,'#d83a3a');                           // 赤い顔の肉垂
  px(R?hx+1:hx+1,sy+4+bob,1,1,'#101010');                        // 目
  px(R?hx+3:hx-1,sy+4+bob,1,1,'#caa23a');                        // くちばし
}
function render(){
  refreshSeasonPal();   // 現在の季節の植物パレットを反映
  const c0=(cam.x/TS)|0, r0=(cam.y/TS)|0, ox=cam.x%TS, oy=cam.y%TS;
  for(let r=0;r<=VH;r++)for(let c=0;c<=VW;c++){
    const mc=c0+c, mr=r0+r; if(mr<0||mr>=MH||mc<0||mc>=MW)continue;
    drawTile(mc,mr,c*TS-ox,r*TS-oy);
  }
  drawWarp(); // magic circle on the ground (under entities)
  // depth-sorted entities
  const ents=[];
  ents.push({y:(SIGN.y+1)*TS,fn:drawSign});
  ents.push({y:(SHRINE.y+SHRINE.h)*TS,fn:drawShrine});
  DECO.forEach(s=>ents.push({y:(s.y+s.h)*TS,fn:()=>drawBuilding(s)}));
  BOULDERS.forEach(b=>ents.push({y:(b.y+b.h)*TS,fn:()=>drawBoulder(b)}));
  OBJS.forEach(o=>ents.push({y:(o.y+o.h)*TS,fn:()=>drawObj(o)}));
  TREASURES.forEach(t=>{ if(t.type==='chest') ents.push({y:(t.y+1)*TS,fn:()=>drawChest(t)}); });
  SPOTS.forEach(s=>ents.push({y:(s.y+s.h)*TS,fn:()=>drawBuilding(s)}));
  NPCS.forEach(n=>{ if(npcHidden(n))return; ents.push({y:n.py+TS,fn:()=>{
    if(n.hires){ blitMizu(n.px-cam.x,n.py-cam.y,n.dir,n.hopY,isBlinking(n.blinkOff)); return; }   // 高解像度キャラ（跳ねる・瞬き）
    drawChar(n.px-cam.x,n.py-cam.y,n.dir,n.frame,n.moving,n.c1,n.c2,n.hair,n.cat,n.slim,isBlinking(n.blinkOff));
    if(n.female){ const sx=Math.round(n.px-cam.x),sy=Math.round(n.py-cam.y); // 長めの髪
      px(sx+3,sy+2,2,7,n.hair); px(sx+11,sy+2,2,7,n.hair); }
    if(n.bob){ const sx=Math.round(n.px-cam.x),sy=Math.round(n.py-cam.y); // ふんわり短めのボブ
      px(sx+4,sy+1,2,4,n.hair); px(sx+10,sy+1,2,4,n.hair);  // 両サイド（短め）
      px(sx+4,sy,8,1,n.hair);                                // 前髪のふち
      px(sx+4,sy+4,1,1,n.hair); px(sx+11,sy+4,1,1,n.hair); } // 毛先がちょこんと外ハネ
    if(n.cheeks && n.dir!=='up'){ const sx=Math.round(n.px-cam.x),sy=Math.round(n.py-cam.y); // ほんのり自然なほっぺ
      px(sx+5,sy+5,1,1,'#e7b5ad'); px(sx+10,sy+5,1,1,'#e7b5ad'); }
    if(n.mouse){ const sx=Math.round(n.px-cam.x),sy=Math.round(n.py-cam.y); // ネズミの被り物（丸い耳）
      px(sx+2,sy-2,4,4,'#9a9a9a'); px(sx+10,sy-2,4,4,'#9a9a9a');
      px(sx+3,sy-1,2,2,'#c8a0a8'); px(sx+11,sy-1,2,2,'#c8a0a8'); }
    if(n.placard){ const sx=Math.round(n.px-cam.x),sy=Math.round(n.py-cam.y); // 「NO WAR」のプラカード
      px(sx+11,sy-7,2,13,'#8a6a3a');                                          // 棒（持ち手）
      px(sx+1,sy-17,21,10,'#f4f1e8'); px(sx+1,sy-17,21,1,'#d8d2c4'); px(sx+1,sy-8,21,1,'#bcb4a4'); // 板
      px(sx+1,sy-17,1,10,'#d8d2c4'); px(sx+21,sy-17,1,10,'#bcb4a4');          // 板の枠
      ctx.save(); ctx.font='bold 7px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#c0341f'; ctx.fillText('NO WAR', sx+11, sy-12); ctx.restore(); }
  }}); });
  ANIMALS.forEach(a=>{ if(a.gone||animalHidden(a))return; ents.push({y:a.py+TS,fn:()=>{
    const al=a.fleeing?Math.max(0,1-a.fleeT/90):1; if(al<1)ctx.globalAlpha=al;
    drawAnimal(a.px-cam.x,a.py-cam.y,a.dir,a.frame,a.moving,a.type); ctx.globalAlpha=1; }}); });
  if(!HERON.gone) ents.push({y:HERON.py+TS,fn:drawHeron});
  ents.push({y:BEAR.py+2*TS,fn:drawBear});
  if(!PHEASANTS.gone){ const L=PHEASANTS.lead, al=PHEASANTS.fleeing?Math.max(0,1-PHEASANTS.fleeT/90):1;
    ents.push({y:L.py+TS,fn:()=>{ if(al<1)ctx.globalAlpha=al; drawPheasant(L.px-cam.x,L.py-cam.y,L.dir,L.frame,L.moving,'male'); ctx.globalAlpha=1; }});
    PHEASANTS.followers.forEach(f=>ents.push({y:f.py+TS,fn:()=>{ if(al<1)ctx.globalAlpha=al; drawPheasant(f.px-cam.x,f.py-cam.y,f.dir,f.frame,f.moving,f.kind); ctx.globalAlpha=1; }})); }
  PROPS.forEach(p=>ents.push({y:p.y*TS+TS,fn:()=>drawFire(p.x*TS-cam.x,p.y*TS-cam.y)}));
  const wob=Date.now()<P.slowUntil?Math.sin(Date.now()/110)*1.6:0;
  ents.push({y:P.py+TS,fn:()=>{
    if(P.swim){ drawSwimmer(P.px-cam.x+wob,P.py-cam.y,P.dir,P.frame); return; }
    if(P.inOnsen){ drawBather(P.px-cam.x,P.py-cam.y); return; }   // 温泉では湯につかる姿に
    drawChar(P.px-cam.x+wob,P.py-cam.y,P.dir,P.frame,P.moving,'#3a4a8a','#e8c39a','#3a2a1a',false,false,isBlinking(P.blinkOff));
    if(P.flowers>0) drawHeldFlowers(Math.round(P.px-cam.x+wob), Math.round(P.py-cam.y), P.flowers, P.moving?(Math.floor(P.frame)%2):0);  // 摘んだ花を持つ
    if(P.inBrush){ const sx=Math.round(P.px-cam.x+wob), sy=Math.round(P.py-cam.y); // 茂みが手前に
      px(sx+1,sy+11,4,4,'#2f6b3a'); px(sx+10,sy+12,4,3,'#27592f'); px(sx+5,sy+13,5,3,'#3a7d45');
      px(sx+3,sy+13,1,2,'#4f9a57'); px(sx+12,sy+12,1,2,'#4f9a57'); }
  }});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.fn());
  drawOnsenSteam();   // 温泉の湯気（地面・人物の上にゆらめき立ちのぼる）
  // vignette
  const grd=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.height*0.4,cv.width/2,cv.height/2,cv.height*0.8);
  grd.addColorStop(0,'rgba(0,0,0,0)');grd.addColorStop(1,'rgba(0,0,0,0.28)');
  ctx.fillStyle=grd;ctx.fillRect(0,0,cv.width,cv.height);
  applyTint();   // time-of-day color
  drawRainbow();   // 雨の日の虹（雨粒の奥にかかる）
  drawFireflies(); // 川辺のホタル（6月限定）
  drawWeather();   // 富士見のリアルタイム天候（晴・曇・雨・雪・霧・強風）
  drawFog();       // 濃い霧（白い靄が立ちこめる）
  // fireworks on top
  for(const p of FW){ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.col;
    ctx.fillRect(p.x|0,p.y|0,2,2); }
  ctx.globalAlpha=1;
}
let running=false;
function loop(){ if(!running)return; update();render();requestAnimationFrame(loop); }
function startGame(){ document.getElementById('title').classList.add('hide'); startAudio(); if(!running){running=true;loop();} }
/* ── ambient BGM (procedural drone + slow pads, 情景で切り替え) ── */
let audioCtx=null, masterGain=null, audioOn=true, audioStarted=false, noteTimer=null;
const volEl=document.getElementById('vol'), audioBtn=document.getElementById('audioBtn');
function volFromSlider(){ return (volEl.value/100)*0.4; }
function applyVol(){ if(masterGain) masterGain.gain.setTargetAtTime(audioOn?volFromSlider():0, audioCtx.currentTime, 0.2); }
/* ── 情景パレット（3種・プロトタイプ）：ドローンの和音・フィルタ・旋律をひとまとめに ── */
const BGM_PALETTES={
  // ☀️ 高原 — 開いた5度/8度の明るいドローン（昼・朝）
  plateau:{ base:110, filter:{freq:700,q:1.2,lfoRate:0.025,lfoDepth:280},
    partials:[{r:1,type:'triangle',g:0.16},{r:1.5,type:'sine',g:0.10},{r:2,type:'triangle',g:0.08},{r:3,type:'sine',g:0.05}],
    scale:[220,247,330,392,440], note:{peak:0.10,atk:2.2,rel:4.3,gapMin:3500,gapMax:8500,octUp:0.5,octDown:0.0} },
  // 🌆 夕暮れ — 短調の翳り・暗く長い余韻（夕）
  dusk:{ base:98, filter:{freq:480,q:1.4,lfoRate:0.02,lfoDepth:200},
    partials:[{r:1,type:'triangle',g:0.17},{r:1.5,type:'sine',g:0.09},{r:2,type:'triangle',g:0.07},{r:2.4,type:'sine',g:0.05},{r:3,type:'sine',g:0.04}],
    scale:[196,233,262,294,349], note:{peak:0.09,atk:2.8,rel:5.5,gapMin:4500,gapMax:10000,octUp:0.35,octDown:0.0} },
  // 🌌 星夜 — 深いサブ＋まばらな高音のきらめき（夜）
  starry:{ base:73.42, filter:{freq:420,q:1.0,lfoRate:0.015,lfoDepth:240},
    partials:[{r:1,type:'sine',g:0.18},{r:2,type:'sine',g:0.10},{r:3,type:'sine',g:0.05},{r:4.5,type:'sine',g:0.03}],
    scale:[587,659,740,880,988], note:{peak:0.07,atk:1.6,rel:6.5,gapMin:6000,gapMax:13000,octUp:0.0,octDown:0.0} },
};
let bgmMode='auto';                 // 'auto' | 'plateau' | 'dusk' | 'starry'
let curPad=null;                    // 現在鳴っているパッド {gain, palette, stop()}
let bgmDuck=1;                      // 台所の演奏中はBGMをこの割合まで下げる
function autoBgmKey(){ const m=curMode(); return (m==='evening')?'dusk':(m==='night')?'starry':'plateau'; }
function targetBgmKey(){ return bgmMode==='auto'?autoBgmKey():bgmMode; }
function activePalette(){ return BGM_PALETTES[curPad?curPad.palette:targetBgmKey()]; }
/* パレットからドローン・パッドを1つ組み立てる（自前のゲインで包んでクロスフェード可能に） */
function buildPad(key){
  const pal=BGM_PALETTES[key];
  const padGain=audioCtx.createGain(); padGain.gain.value=0; padGain.connect(masterGain);
  const filter=audioCtx.createBiquadFilter(); filter.type='lowpass';
  filter.frequency.value=pal.filter.freq; filter.Q.value=pal.filter.q; filter.connect(padGain);
  const nodes=[];
  pal.partials.forEach((p,i)=>{
    const o=audioCtx.createOscillator(); o.type=p.type; o.frequency.value=pal.base*p.r; o.detune.value=(i-1.5)*4;
    const g=audioCtx.createGain(); g.gain.value=p.g; o.connect(g); g.connect(filter); o.start(); nodes.push(o);
    const lfo=audioCtx.createOscillator(); lfo.frequency.value=0.05+0.03*i;
    const lg=audioCtx.createGain(); lg.gain.value=4; lfo.connect(lg); lg.connect(o.detune); lfo.start(); nodes.push(lfo);
  });
  const flfo=audioCtx.createOscillator(); flfo.frequency.value=pal.filter.lfoRate;
  const fg=audioCtx.createGain(); fg.gain.value=pal.filter.lfoDepth; flfo.connect(fg); fg.connect(filter.frequency); flfo.start(); nodes.push(flfo);
  return { gain:padGain, palette:key, stop(){ nodes.forEach(n=>{try{n.stop();}catch(e){}}); } };
}
/* 情景をクロスフェードで切り替える（継ぎ目を消すのが肝心） */
function crossfadeTo(key, fade){
  if(!audioStarted||!audioCtx) return;
  if(curPad&&curPad.palette===key) return;
  fade=fade||5;
  const t=audioCtx.currentTime, next=buildPad(key);
  next.gain.gain.setValueAtTime(0,t); next.gain.gain.linearRampToValueAtTime(bgmDuck,t+fade);
  if(curPad){ const old=curPad; old.gain.gain.cancelScheduledValues(t);
    old.gain.gain.setValueAtTime(old.gain.gain.value,t); old.gain.gain.linearRampToValueAtTime(0,t+fade);
    setTimeout(()=>old.stop(), (fade+0.5)*1000); }
  curPad=next;
}
/* 目標の情景と現在がずれていれば切り替え（数秒ごと＆手動操作時に呼ぶ） */
function syncBgm(){ if(audioStarted&&audioCtx&&audioCtx.state==='running') crossfadeTo(targetBgmKey()); }
function startAudio(){
  try{
    if(audioStarted){ if(audioCtx.state==='suspended')audioCtx.resume(); return; }
    audioStarted=true;
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain(); masterGain.gain.value=audioOn?volFromSlider():0;
    masterGain.connect(audioCtx.destination);
    crossfadeTo(targetBgmKey(), 2.5);            // 最初の情景を立ち上げる
    setInterval(syncBgm, 4000);                  // 時間帯の移ろいに追従
    scheduleNote();
  }catch(e){ console.warn('audio init failed',e); }
}
function scheduleNote(){
  if(!audioStarted||!audioCtx) return;
  const nt=activePalette().note;
  if(audioOn && audioCtx.state==='running' && bgmDuck>0.5){   // 台所の演奏中はBGMの旋律を休む
    const pal=activePalette(); const sc=pal.scale;
    let f=sc[(Math.random()*sc.length)|0];
    const rr=Math.random(); if(rr<nt.octUp)f*=2; else if(rr>1-nt.octDown)f*=0.5;
    const o=audioCtx.createOscillator(); o.type='sine'; o.frequency.value=f;
    const g=audioCtx.createGain(); g.gain.value=0; o.connect(g);
    const pan=audioCtx.createStereoPanner?audioCtx.createStereoPanner():null;
    if(pan){ pan.pan.value=Math.random()*2-1; g.connect(pan); pan.connect(masterGain); } else g.connect(masterGain);
    const t=audioCtx.currentTime;
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(nt.peak,t+nt.atk); g.gain.linearRampToValueAtTime(0,t+nt.atk+nt.rel);
    o.start(t); o.stop(t+nt.atk+nt.rel+0.1);
  }
  noteTimer=setTimeout(scheduleNote, nt.gapMin+Math.random()*(nt.gapMax-nt.gapMin));
}
audioBtn.addEventListener('click',()=>{ audioOn=!audioOn; audioBtn.textContent=audioOn?'🔊':'🔇';
  if(audioOn&&audioCtx&&audioCtx.state==='suspended')audioCtx.resume(); applyVol(); });
volEl.addEventListener('input',applyVol);
/* BGM情景セグメント（自動／高原／夕暮れ／星夜） */
function updateBgmBtn(){ document.querySelectorAll('#bgmSeg button').forEach(b=>b.classList.toggle('on',b.dataset.b===bgmMode)); }
document.querySelectorAll('#bgmSeg button').forEach(b=>b.addEventListener('click',()=>{ bgmMode=b.dataset.b; updateBgmBtn(); syncBgm(); }));
updateBgmBtn();

/* ══ おさらの音楽（アンビエント・キッチン）：食材をのせると音のレイヤーが重なる ══ */
const KITCHEN={ layers:{}, open:false };
let kitchenBus=null;
// すべて A マイナー・ペンタトニックで揃え、どの組み合わせでも調和する
const KSCALE_HI=[440,523.25,587.33,659.25,783.99];     // いちごのベル
const KSCALE_TW=[880,1046.5,1174.66,1318.5,1567.98];   // 花のきらめき
const KSPEC={
  grapes:{emoji:'🍇',name:'ぶどう',hint:'低いドローン', build(g,layer){
    [55,110].forEach((f,i)=>{ const o=audioCtx.createOscillator(); o.type='sine'; o.frequency.value=f; o.detune.value=i*5-2;
      const og=audioCtx.createGain(); og.gain.value=i?0.13:0.20; o.connect(og); og.connect(g); o.start(); layer.nodes.push(o); }); }},
  mushroom:{emoji:'🍄',name:'きのこ',hint:'土の低音', build(g,layer){
    const lp=audioCtx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=300; lp.Q.value=2; lp.connect(g);
    [-5,7].forEach(d=>{ const o=audioCtx.createOscillator(); o.type='sawtooth'; o.frequency.value=82.41; o.detune.value=d;
      const og=audioCtx.createGain(); og.gain.value=0.06; o.connect(og); og.connect(lp); o.start(); layer.nodes.push(o); });
    const lfo=audioCtx.createOscillator(); lfo.frequency.value=0.07; const lg=audioCtx.createGain(); lg.gain.value=120; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); layer.nodes.push(lfo); }},
  tomato:{emoji:'🍅',name:'トマト',hint:'温かいパルス', build(g,layer){
    const o=audioCtx.createOscillator(); o.type='triangle'; o.frequency.value=164.81;
    const og=audioCtx.createGain(); og.gain.value=0.10; o.connect(og); og.connect(g); o.start(); layer.nodes.push(o);
    const lfo=audioCtx.createOscillator(); lfo.frequency.value=0.8; const lg=audioCtx.createGain(); lg.gain.value=0.08; lfo.connect(lg); lg.connect(og.gain); lfo.start(); layer.nodes.push(lfo); }},
  lettuce:{emoji:'🥬',name:'レタス',hint:'風のパッド', build(g,layer){
    const lp=audioCtx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900; lp.Q.value=1; lp.connect(g);
    [246.94,329.63].forEach(f=>{ const o=audioCtx.createOscillator(); o.type='sine'; o.frequency.value=f;
      const og=audioCtx.createGain(); og.gain.value=0.06; o.connect(og); og.connect(lp); o.start(); layer.nodes.push(o); });
    const lfo=audioCtx.createOscillator(); lfo.frequency.value=0.05; const lg=audioCtx.createGain(); lg.gain.value=500; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); layer.nodes.push(lfo); }},
  berries:{emoji:'🍓',name:'いちご',hint:'甘いベル', build(g,layer){
    const bell=()=>{ if(!layer.alive)return;
      const f=KSCALE_HI[(Math.random()*KSCALE_HI.length)|0], o=audioCtx.createOscillator(); o.type='sine'; o.frequency.value=f;
      const og=audioCtx.createGain(); og.gain.value=0; o.connect(og); og.connect(g);
      const t=audioCtx.currentTime; og.gain.setValueAtTime(0,t); og.gain.linearRampToValueAtTime(0.12,t+0.02); og.gain.exponentialRampToValueAtTime(0.0001,t+1.6);
      o.start(t); o.stop(t+1.7); layer.timer=setTimeout(bell, 1100+Math.random()*1700); };
    bell(); }},
  flowers:{emoji:'🌼',name:'はな',hint:'きらめき', build(g,layer){
    const tw=()=>{ if(!layer.alive)return;
      const f=KSCALE_TW[(Math.random()*KSCALE_TW.length)|0], o=audioCtx.createOscillator(); o.type='sine'; o.frequency.value=f;
      const og=audioCtx.createGain(); og.gain.value=0; o.connect(og);
      const pan=audioCtx.createStereoPanner?audioCtx.createStereoPanner():null;
      if(pan){ pan.pan.value=Math.random()*2-1; og.connect(pan); pan.connect(g); } else og.connect(g);
      const t=audioCtx.currentTime; og.gain.setValueAtTime(0,t); og.gain.linearRampToValueAtTime(0.07,t+0.01); og.gain.exponentialRampToValueAtTime(0.0001,t+1.1);
      o.start(t); o.stop(t+1.2); layer.timer=setTimeout(tw, 1800+Math.random()*2600); };
    tw(); }},
};
function ensureKitchenBus(){ if(!audioStarted) startAudio(); else if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();
  if(audioCtx && !kitchenBus){ kitchenBus=audioCtx.createGain(); kitchenBus.gain.value=1; kitchenBus.connect(masterGain); } }
function kitchenDuck(){ if(!audioCtx||!curPad) { bgmDuck=Object.keys(KITCHEN.layers).length?0.18:1; return; }
  bgmDuck=Object.keys(KITCHEN.layers).length?0.18:1; const t=audioCtx.currentTime;
  curPad.gain.gain.cancelScheduledValues(t); curPad.gain.gain.setValueAtTime(curPad.gain.gain.value,t); curPad.gain.gain.linearRampToValueAtTime(bgmDuck,t+1.0); }
function kitchenStart(key){ try{ ensureKitchenBus(); if(!audioCtx||KITCHEN.layers[key]) return;
    const g=audioCtx.createGain(); g.gain.value=0; g.connect(kitchenBus);
    const layer={ g, nodes:[], timer:null, alive:true };
    const t=audioCtx.currentTime; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(1,t+1.2);
    KSPEC[key].build(g, layer); KITCHEN.layers[key]=layer; kitchenDuck();
  }catch(e){ console.warn('kitchen layer failed',e); } }
function kitchenStop(key){ const layer=KITCHEN.layers[key]; if(!layer) return;
  layer.alive=false; if(layer.timer) clearTimeout(layer.timer);
  const t=audioCtx.currentTime; layer.g.gain.cancelScheduledValues(t); layer.g.gain.setValueAtTime(layer.g.gain.value,t); layer.g.gain.linearRampToValueAtTime(0,t+0.9);
  const ns=layer.nodes, gg=layer.g; setTimeout(()=>{ ns.forEach(n=>{try{n.stop();}catch(e){}}); try{gg.disconnect();}catch(e){} }, 2200);
  delete KITCHEN.layers[key]; kitchenDuck(); }
function kitchenToggle(key){ if(KITCHEN.layers[key]) kitchenStop(key); else kitchenStart(key); }
function kitchenClear(){ Object.keys(KITCHEN.layers).forEach(kitchenStop); }
const KCSS='<style>'
  +'.kintro{font-size:13px;line-height:1.85;margin-bottom:10px}'
  +'.kplate{min-height:92px;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;'
  +'border-radius:50%/34%;background:radial-gradient(ellipse at 50% 38%,#fbf7ee,#e6dcc6);border:3px solid #cdbfa0;'
  +'box-shadow:inset 0 5px 14px rgba(0,0,0,.16);margin:0 auto 14px;width:min(360px,90%);padding:16px}'
  +'.kpi{font-size:30px;animation:kbob 2.2s ease-in-out infinite}'
  +'@keyframes kbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'
  +'.kempty{color:#a59c88;font-size:13px}'
  +'.kpalette{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}'
  +'.kbtn{background:rgba(231,200,120,.08);border:2px solid #4a4030;color:var(--paper);font-family:inherit;'
  +'padding:8px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;border-radius:4px}'
  +'.kbtn .ke{font-size:22px}.kbtn .kc{font-size:10px;color:#b7ad97}.kbtn .kh{font-size:9px;color:#8a8378}'
  +'.kbtn.on{background:var(--gold);color:#221d16;border-color:var(--gold)}.kbtn.on .kc,.kbtn.on .kh{color:#5a4a20}'
  +'.kbtn:disabled{opacity:.4;cursor:default}'
  +'.kfoot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;flex-wrap:wrap}'
  +'.kclear{background:rgba(231,200,120,.1);border:2px solid #4a4030;color:var(--paper);font-family:inherit;font-size:13px;padding:9px 14px;cursor:pointer}'
  +'.knote{font-size:11px;color:#8a8378}</style>';
function renderPlate(){ const el=document.getElementById('kplate'); if(!el)return;
  const ks=Object.keys(KITCHEN.layers);
  el.innerHTML = ks.length ? ks.map((k,i)=>'<span class="kpi" style="animation-delay:'+(i*0.18).toFixed(2)+'s">'+KSPEC[k].emoji+'</span>').join('')
    : '<span class="kempty">（おさらは からっぽ）</span>'; }
function openKitchenPanel(){
  ensureKitchenBus(); KITCHEN.open=true;
  let pal='';
  for(const k of Object.keys(KSPEC)){ const sp=KSPEC[k], have=(P[k]||0)>0, on=!!KITCHEN.layers[k];
    pal+='<button class="kbtn'+(on?' on':'')+'" data-k="'+k+'"'+(have?'':' disabled')+'>'
      +'<span class="ke">'+sp.emoji+'</span>'+sp.name+'<span class="kc">'+(have?('×'+P[k]):'未収穫')+'</span><span class="kh">'+sp.hint+'</span></button>'; }
  openPanel('🍽 おさらの音楽 — Ambient Kitchen',
    KCSS
    +'<p class="kintro">畑で採れた食材を<b>おさら</b>にのせると、その音が重なって<b>アンビエント</b>が生まれる。<br>いくつでも重ねて、自分だけの一皿を。（食材は減りません）</p>'
    +'<div class="kplate" id="kplate"></div>'
    +'<div class="kpalette">'+pal+'</div>'
    +'<div class="kfoot"><button class="kclear" id="kclear">🍽 さげる（全部とる）</button>'
    +'<span class="knote">♪ その場で鳴ります（音量は☰メニューのBGM）</span></div>');
  document.querySelectorAll('#panel .kbtn').forEach(b=>b.addEventListener('click',()=>{ if(b.hasAttribute('disabled'))return;
    kitchenToggle(b.dataset.k); b.classList.toggle('on',!!KITCHEN.layers[b.dataset.k]); renderPlate(); }));
  document.getElementById('kclear').addEventListener('click',()=>{ kitchenClear();
    document.querySelectorAll('#panel .kbtn').forEach(b=>b.classList.remove('on')); renderPlate(); });
  renderPlate();
}
/* どの入口（通常 / ?to=larry 自動開始）でも、最初のユーザー操作でBGMを開始・再開する */
function unlockAudio(){ if(!audioStarted) startAudio(); else if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume(); }
['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,unlockAudio));

if(('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches))
  document.body.classList.add('touch');
/* deep-link spawn: ?to=larry など で最初からその場所に出現してゲーム開始 */
let _autostart=false;
(function(){ const q=new URLSearchParams(location.search);
  const SPN={larry:[48,34,'up'], momo:[11,34,'up'], gallery:[56,9,'up'], bear:[4,18,'up'], mizu:[54,26,'right'], firefly:[8,22,'left'], hotaru:[8,22,'left'],
    berry:[54,8,'up'], ichigo:[54,8,'up'], noichigo:[54,8,'up'],
    speaker:[56,8,'up'], oto:[56,8,'up'], sanroku:[56,8,'up'], forestspk:[56,8,'up']};
  const s=q.get('to')||q.get('spawn'); if(!s)return;
  const pos = SPN[s] || (/^\d+,\d+$/.test(s)?s.split(',').map(Number):null);
  if(pos){ P.px=pos[0]*TS; P.py=pos[1]*TS; if(pos[2])P.dir=pos[2]; _autostart=true; }
  if(s==='firefly'||s==='hotaru'){ try{ timeMode='night'; seasonMode='summer'; _lastSeason=null; refreshSeasonPal(); }catch(e){} }   // ホタルは夏の夜だけなので固定
  if(s==='berry'||s==='ichigo'||s==='noichigo'){ try{ seasonMode='summer'; _lastSeason=null; refreshSeasonPal(); }catch(e){} } })();   // 野イチゴは夏限定なので夏に固定
/* portrait-mobile viewport: fewer tiles -> bigger character, fills the screen */
function setupViewport(){
  const pm = document.body.classList.contains('touch') && window.innerHeight>window.innerWidth;
  document.body.classList.toggle('pm', pm);
  VW = pm?14:28; VH = pm?22:18;
  cv.width=VW*TS; cv.height=VH*TS;
  ctx.imageSmoothingEnabled=false; ctx.textAlign='center';
  if(running) render();
}
addEventListener('resize', setupViewport);
addEventListener('orientationchange', setupViewport);
setupViewport();
updateTimeBtn(); updateSeasonBtn(); updateTreasHud(); updateCropHud(); update();render(); // draw a frame behind title
fetchWeather(); setInterval(fetchWeather, 15*60*1000);   // 富士見の天候を取得し15分ごとに更新
if(_autostart) startGame();
