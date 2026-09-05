'use strict';
const PAL=['#000000','#000000','#3eb849','#74d07d','#5955e0','#8076f1','#b95e51','#65dbef','#db6559','#ff897d','#ccc35e','#ded087','#3aa241','#b766b5','#cccccc','#ffffff'];
const $=id=>document.getElementById(id), C=(v,a,b)=>Math.max(a,Math.min(b,v)), clone=o=>JSON.parse(JSON.stringify(o));
let P,F=0,S=0,L=0,drag=false,tool='pencil',last=null,previewScale=1,editorCell=24;

const mask=()=>Array.from({length:16},()=>Array(16).fill(0));
const attrs=()=>Array.from({length:16},(_,i)=>({color:i<3?15:i<8?6:i<13?8:4,ec:false,cc:false,ic:false}));
function mkLayer(i){return{name:'Layer '+i,ox:0,oy:0,pattern:(P?.size||16)==16?i*4:i,visible:true,mask:mask(),lines:attrs()}}
function mkFrame(i){return{name:'Frame '+i,sprites:[mkLayer(0)]}}
function defaultProject(){P={vdp:'V9938',screen:5,size:16,mag:1,canvasW:16,canvasH:16,sceneX:96,sceneY:80,frames:[]};P.frames=[mkFrame(0)];F=S=L=0}
function migrate(p){
  if(!p||typeof p!=='object')throw new Error('bad project');
  p.vdp=p.vdp||'V9938';p.screen=+p.screen||5;p.size=+p.size===8?8:16;p.mag=+p.mag===2?2:1;
  p.canvasW=C(+p.canvasW||16,8,256);p.canvasH=C(+p.canvasH||16,8,212);
  const first=p.frames?.[0]?.sprites?.[0];p.sceneX=Number.isFinite(+p.sceneX)?+p.sceneX:(Number.isFinite(+first?.x)?+first.x:96);p.sceneY=Number.isFinite(+p.sceneY)?+p.sceneY:(Number.isFinite(+first?.y)?+first.y:80);
  if(!Array.isArray(p.frames)||!p.frames.length)p.frames=[{name:'Frame 0',sprites:[mkLayer(0)]}];
  p.frames.forEach((f,fi)=>{f.name=f.name||'Frame '+fi;if(!Array.isArray(f.sprites)||!f.sprites.length)f.sprites=[mkLayer(0)];f.sprites=f.sprites.slice(0,32);f.sprites.forEach((s,i)=>{s.name=s.name||'Layer '+i;s.ox=Number.isFinite(+s.ox)?+s.ox:(Number.isFinite(+s.x)?+s.x-p.sceneX:0);s.oy=Number.isFinite(+s.oy)?+s.oy:(Number.isFinite(+s.y)?+s.y-p.sceneY:0);s.pattern=C(+s.pattern||0,0,255);s.visible=s.visible!==false;if(!Array.isArray(s.mask))s.mask=mask();while(s.mask.length<16)s.mask.push(Array(16).fill(0));s.mask=s.mask.slice(0,16).map(r=>{r=Array.isArray(r)?r.slice(0,16):[];while(r.length<16)r.push(0);return r.map(v=>v?1:0)});if(!Array.isArray(s.lines))s.lines=attrs();while(s.lines.length<16)s.lines.push({color:15,ec:false,cc:false,ic:false});s.lines=s.lines.slice(0,16).map(a=>({color:C(+a.color||0,0,15),ec:!!a.ec,cc:!!a.cc,ic:!!a.ic}));delete s.x;delete s.y})});
  return p;
}
function fresh(){defaultProject();dirty(false);render();setStatus('New project')}
const fr=()=>P.frames[F], layer=()=>fr().sprites[S], sz=()=>+P.size, mg=()=>+P.mag, aw=()=>+P.canvasW, ah=()=>+P.canvasH;
function setStatus(t){$('status').textContent=t}
function dirty(save=true){setStatus('Modified');if(save)try{localStorage.pixlverse=JSON.stringify(P)}catch(e){}}
function clampSelection(){F=C(F,0,P.frames.length-1);S=C(S,0,fr().sprites.length-1);L=C(L,0,sz()-1)}

function render(){clampSelection();['vdp','screen','size','mag','canvasW','canvasH','sceneX','sceneY'].forEach(id=>$(id).value=P[id]);renderFrames();renderLayers();props();lineTable();palette();drawEditor();drawScene();loadGraph();warnings();applyPreviewScale()}
function renderFrames(){let h=$('frames');h.innerHTML='';P.frames.forEach((f,i)=>{let d=document.createElement('div');d.className='item'+(i===F?' sel':'');d.textContent=i+' · '+f.name;d.onclick=()=>{F=i;S=0;L=0;render()};h.appendChild(d)});$('delFrame').disabled=P.frames.length<=1}
function renderLayers(){let h=$('layers');h.innerHTML='';fr().sprites.forEach((s,i)=>{let d=document.createElement('div');d.className='item'+(i===S?' sel':'');let r=document.createElement('div');r.className='itemrow';let eye=document.createElement('button');eye.className='eye';eye.textContent=s.visible?'●':'○';eye.title=s.visible?'Hide layer':'Show layer';eye.onclick=e=>{e.stopPropagation();s.visible=!s.visible;dirty();render()};let n=document.createElement('div');n.innerHTML='<div class="layername">#'+i+' '+esc(s.name)+'</div><div class="layerinfo">x'+signed(s.ox)+' y'+signed(s.oy)+' · pat '+s.pattern+'</div>';let tag=document.createElement('span');tag.className='badge';tag.textContent=i===0?'TOP':'';r.append(eye,n,tag);d.appendChild(r);d.onclick=()=>{S=i;L=0;render()};h.appendChild(d)});$('addLayer').disabled=fr().sprites.length>=32;$('layerDel').disabled=fr().sprites.length<=1}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function signed(v){return v>=0?'+'+v:String(v)}
function props(){let s=layer();$('name').value=s.name;$('pattern').value=s.pattern;$('layerX').value=s.ox;$('layerY').value=s.oy;$('visible').checked=s.visible;$('title').textContent='Composite sprite editor · '+fr().name;$('canvasInfo').textContent=aw()+'×'+ah()+' artboard · selected #'+S+' '+s.name+' · '+sz()+'×'+sz()+' hardware layer';$('previewInfo').textContent=P.vdp+' · SCREEN '+P.screen+' · composite @ '+P.sceneX+','+P.sceneY+' · sprite '+mg()+'×'}
function palette(){let h=$('palette');h.innerHTML='';PAL.forEach((c,i)=>{let b=document.createElement('button');b.className='sw'+(layer().lines[L].color===i?' on':'');b.style.background=c;b.title='Color '+i;b.onclick=()=>{layer().lines[L].color=i;dirty();render()};h.appendChild(b)})}
function lineTable(){let h=$('lines');h.innerHTML='';L=C(L,0,sz()-1);$('lineBadge').textContent='line '+L;for(let i=0;i<sz();i++){let a=layer().lines[i],r=document.createElement('div');r.className='linerow'+(i===L?' sel':'');r.innerHTML='<span>'+String(i).padStart(2,'0')+'</span><select>'+PAL.map((_,j)=>'<option value="'+j+'"'+(a.color===j?' selected':'')+'>'+j+'</option>').join('')+'</select><input title="EC" type="checkbox" '+(a.ec?'checked':'')+'><input title="CC" type="checkbox" '+(a.cc?'checked':'')+'><input title="IC" type="checkbox" '+(a.ic?'checked':'')+'>';r.onclick=e=>{if(e.target.tagName==='DIV'||e.target.tagName==='SPAN'){L=i;render()}};let q=r.querySelectorAll('input'),sel=r.querySelector('select');sel.onchange=()=>{a.color=+sel.value;L=i;dirty();render()};['ec','cc','ic'].forEach((k,j)=>q[j].onchange=()=>{a[k]=q[j].checked;L=i;dirty();render()});h.appendChild(r)}}
