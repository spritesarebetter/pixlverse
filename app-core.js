'use strict';
const DEFAULT_PALETTE=[
  [0,0,0],[0,0,0],[2,5,2],[3,6,3],
  [2,2,6],[4,3,7],[5,3,2],[3,6,7],
  [6,3,2],[7,4,3],[6,5,3],[6,6,4],
  [2,4,2],[5,3,5],[6,6,6],[7,7,7]
];
let PAL=[];
const $=id=>document.getElementById(id), C=(v,a,b)=>Math.max(a,Math.min(b,v)), clone=o=>JSON.parse(JSON.stringify(o));
const STORAGE_KEY='pixieverse', LEGACY_STORAGE_KEY='pixlverse';
let P,F=0,S=0,L=0,K=15,drag=false,tool='pencil',last=null,previewScale=1,editorCell=24;

const mask=()=>Array.from({length:16},()=>Array(16).fill(0));
const attrs=()=>Array.from({length:16},(_,i)=>({color:i<3?15:i<8?6:i<13?8:4,ec:false,cc:false,ic:false}));
const normalizeRgb3=rgb=>Array.from({length:3},(_,i)=>C(Math.round(Number(rgb?.[i])||0),0,7));
const rgb8=rgb=>rgb.map(v=>Math.round(C(v,0,7)*255/7));
const rgb3Hex=rgb=>'#'+rgb8(rgb).map(v=>v.toString(16).padStart(2,'0')).join('');
function refreshPaletteCache(){PAL=P.palette.map(rgb3Hex)}
function normalizePalette(pal){return Array.from({length:16},(_,i)=>normalizeRgb3(Array.isArray(pal?.[i])?pal[i]:DEFAULT_PALETTE[i]))}
function mkLayer(i){return{name:'Layer '+i,ox:0,oy:0,pattern:(P?.size||16)==16?i*4:i,visible:true,mask:mask(),lines:attrs()}}
function mkFrame(i){return{name:'Frame '+i,sprites:[mkLayer(0)]}}
function defaultProject(){P={vdp:'V9938',screen:5,size:16,mag:1,canvasW:16,canvasH:16,sceneX:96,sceneY:80,palette:clone(DEFAULT_PALETTE),paletteName:'Pixieverse · MSX default',frames:[]};P.frames=[mkFrame(0)];F=S=L=0;K=15;refreshPaletteCache()}
function migrate(p){
  if(!p||typeof p!=='object')throw new Error('bad project');
  p.vdp=p.vdp||'V9938';p.screen=+p.screen||5;p.size=+p.size===8?8:16;p.mag=+p.mag===2?2:1;
  p.canvasW=C(+p.canvasW||16,8,256);p.canvasH=C(+p.canvasH||16,8,212);p.palette=normalizePalette(p.palette);
  const first=p.frames?.[0]?.sprites?.[0];p.sceneX=Number.isFinite(+p.sceneX)?+p.sceneX:(Number.isFinite(+first?.x)?+first.x:96);p.sceneY=Number.isFinite(+p.sceneY)?+p.sceneY:(Number.isFinite(+first?.y)?+first.y:80);
  if(!Array.isArray(p.frames)||!p.frames.length)p.frames=[{name:'Frame 0',sprites:[mkLayer(0)]}];
  p.frames.forEach((f,fi)=>{f.name=f.name||'Frame '+fi;if(!Array.isArray(f.sprites)||!f.sprites.length)f.sprites=[mkLayer(0)];f.sprites=f.sprites.slice(0,32);f.sprites.forEach((s,i)=>{s.name=s.name||'Layer '+i;s.ox=Number.isFinite(+s.ox)?+s.ox:(Number.isFinite(+s.x)?+s.x-p.sceneX:0);s.oy=Number.isFinite(+s.oy)?+s.oy:(Number.isFinite(+s.y)?+s.y-p.sceneY:0);s.pattern=C(+s.pattern||0,0,255);s.visible=s.visible!==false;if(!Array.isArray(s.mask))s.mask=mask();while(s.mask.length<16)s.mask.push(Array(16).fill(0));s.mask=s.mask.slice(0,16).map(r=>{r=Array.isArray(r)?r.slice(0,16):[];while(r.length<16)r.push(0);return r.map(v=>v?1:0)});if(!Array.isArray(s.lines))s.lines=attrs();while(s.lines.length<16)s.lines.push({color:15,ec:false,cc:false,ic:false});s.lines=s.lines.slice(0,16).map(a=>({color:C(+a.color||0,0,15),ec:!!a.ec,cc:!!a.cc,ic:!!a.ic}));delete s.x;delete s.y})});
  return p;
}
function fresh(){defaultProject();dirty(false);render();setStatus('New project')}
const fr=()=>P.frames[F], layer=()=>fr().sprites[S], sz=()=>+P.size, mg=()=>+P.mag, aw=()=>+P.canvasW, ah=()=>+P.canvasH;
function setStatus(t){$('status').textContent=t}
function dirty(save=true){setStatus('Modified');if(save)try{localStorage.setItem(STORAGE_KEY,JSON.stringify(P))}catch(e){}}
function clampSelection(){F=C(F,0,P.frames.length-1);S=C(S,0,fr().sprites.length-1);L=C(L,0,sz()-1);K=C(K,0,15)}

function render(){clampSelection();refreshPaletteCache();['vdp','screen','size','mag','canvasW','canvasH','sceneX','sceneY'].forEach(id=>$(id).value=P[id]);renderFrames();renderLayers();props();lineTable();palette();drawEditor();drawScene();loadGraph();warnings();applyPreviewScale()}
function renderFrames(){let h=$('frames');h.innerHTML='';P.frames.forEach((f,i)=>{let d=document.createElement('div');d.className='item'+(i===F?' sel':'');d.textContent=i+' · '+f.name;d.onclick=()=>{F=i;S=0;L=0;render()};h.appendChild(d)});$('delFrame').disabled=P.frames.length<=1}
function renderLayers(){let h=$('layers');h.innerHTML='';fr().sprites.forEach((s,i)=>{let d=document.createElement('div');d.className='item'+(i===S?' sel':'');let r=document.createElement('div');r.className='itemrow';let eye=document.createElement('button');eye.className='eye';eye.textContent=s.visible?'●':'○';eye.title=s.visible?'Hide layer':'Show layer';eye.onclick=e=>{e.stopPropagation();s.visible=!s.visible;dirty();render()};let n=document.createElement('div');n.innerHTML='<div class="layername">#'+i+' '+esc(s.name)+'</div><div class="layerinfo">x'+signed(s.ox)+' y'+signed(s.oy)+' · pat '+s.pattern+'</div>';let tag=document.createElement('span');tag.className='badge';tag.textContent=i===0?'TOP':'';r.append(eye,n,tag);d.appendChild(r);d.onclick=()=>{S=i;L=0;render()};h.appendChild(d)});$('addLayer').disabled=fr().sprites.length>=32;$('layerDel').disabled=fr().sprites.length<=1}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function signed(v){return v>=0?'+'+v:String(v)}
function props(){let s=layer();$('name').value=s.name;$('pattern').value=s.pattern;$('layerX').value=s.ox;$('layerY').value=s.oy;$('visible').checked=s.visible;$('title').textContent='Composite sprite editor · '+fr().name;$('canvasInfo').textContent=aw()+'×'+ah()+' artboard · selected #'+S+' '+s.name+' · '+sz()+'×'+sz()+' hardware layer';$('previewInfo').textContent=P.vdp+' · SCREEN '+P.screen+' · composite @ '+P.sceneX+','+P.sceneY+' · sprite '+mg()+'×'}
function updatePaletteEditor(){
  const rgb=P.palette[K], out=rgb8(rgb), hex=PAL[K];
  $('paletteIndex').textContent='Color '+K;$('paletteChip').style.background=hex;$('paletteHex').textContent=hex.toUpperCase();$('paletteRgb8').textContent='RGB '+out.join(', ');
  $('palR').value=rgb[0];$('palG').value=rgb[1];$('palB').value=rgb[2];
}
function palette(){let h=$('palette');h.innerHTML='';PAL.forEach((c,i)=>{let b=document.createElement('button');b.className='sw'+(layer().lines[L].color===i?' on':'')+(K===i?' editing':'');b.style.background=c;b.title='Color '+i+' · '+c.toUpperCase();b.onclick=()=>{K=i;layer().lines[L].color=i;dirty();render()};h.appendChild(b)});updatePaletteEditor()}
function setPaletteComponent(channel,value){P.palette[K][channel]=C(Math.round(Number(value)||0),0,7);refreshPaletteCache();dirty();let sw=$('palette').children[K];if(sw){sw.style.background=PAL[K];sw.title='Color '+K+' · '+PAL[K].toUpperCase()}updatePaletteEditor();drawEditor();drawScene()}
function resetPaletteColor(){P.palette[K]=clone(DEFAULT_PALETTE[K]);refreshPaletteCache();dirty();render()}
function resetPaletteAll(){P.palette=clone(DEFAULT_PALETTE);refreshPaletteCache();dirty();render()}
function lineTable(){let h=$('lines');h.innerHTML='';L=C(L,0,sz()-1);$('lineBadge').textContent='line '+L;for(let i=0;i<sz();i++){let a=layer().lines[i],r=document.createElement('div');r.className='linerow'+(i===L?' sel':'');r.innerHTML='<span>'+String(i).padStart(2,'0')+'</span><select>'+PAL.map((_,j)=>'<option value="'+j+'"'+(a.color===j?' selected':'')+'>'+j+'</option>').join('')+'</select><input title="EC" type="checkbox" '+(a.ec?'checked':'')+'><input title="CC" type="checkbox" '+(a.cc?'checked':'')+'><input title="IC" type="checkbox" '+(a.ic?'checked':'')+'>';r.onclick=e=>{if(e.target.tagName==='DIV'||e.target.tagName==='SPAN'){L=i;render()}};let q=r.querySelectorAll('input'),sel=r.querySelector('select');sel.onchange=()=>{a.color=+sel.value;K=a.color;L=i;dirty();render()};['ec','cc','ic'].forEach((k,j)=>q[j].onchange=()=>{a[k]=q[j].checked;L=i;dirty();render()});h.appendChild(r)}}