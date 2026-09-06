'use strict';
(() => {
  let selectionMode=false,selection=null,selectionOwner=null,selecting=false,selectAnchor=null,clipboard=null;
  let lastTapAt=0,lastTapPixel='',lastTapPointer='';
  const DOUBLE_TAP_MS=320;
  const PREVIEW_STEP=.1,PREVIEW_MIN=.1,PREVIEW_MAX=8;
  const EDITOR_STEP=.1,EDITOR_MIN=.1,EDITOR_MAX=8;

  const baseDrawEditor=drawEditor;
  const baseShiftBitmap=shiftBitmap;
  const baseFlip=flip;
  const baseProps=props;

  const normalizeSelection=(a,b)=>({
    x:C(Math.min(a.x,b.x),0,sz()-1),
    y:C(Math.min(a.y,b.y),0,sz()-1),
    w:C(Math.abs(a.x-b.x)+1,1,sz()),
    h:C(Math.abs(a.y-b.y)+1,1,sz())
  });
  const selectionActive=()=>!!selection&&selectionOwner===F+':'+S;
  const region=()=>selectionActive()?selection:{x:0,y:0,w:sz(),h:sz()};

  function syncSpriteSizeModel(save=false){
    const n=+P.size===8?8:16;
    let changed=P.size!==n||P.canvasW!==n||P.canvasH!==n;
    P.size=n;P.canvasW=n;P.canvasH=n;
    L=C(L,0,n-1);
    const ui=$('spriteSize');if(ui)ui.value=String(n);
    if(changed&&save){dirty();}
    return changed;
  }
  function setSpriteSize(value){
    const n=+value===8?8:16;
    P.size=n;P.canvasW=n;P.canvasH=n;L=C(L,0,n-1);
    selection=null;selectionOwner=null;selecting=false;selectAnchor=null;
    dirty();render();setStatus('Sprite size '+n+'×'+n);
  }

  function updateSelectionButtons(){
    $('selectTool').classList.toggle('on',selectionMode);
    $('pencil').classList.toggle('on',!selectionMode&&tool==='pencil');
    $('eraser').classList.toggle('on',!selectionMode&&tool==='eraser');
    $('copyPixels').disabled=!selectionActive();
    $('pastePixels').disabled=!clipboard;
    $('selectionInfo').textContent=selectionActive()?`${selection.w}×${selection.h}`:'none';
  }
  function clearSelection(){selection=null;selectionOwner=null;selecting=false;selectAnchor=null;updateSelectionButtons();drawEditor();setStatus('Selection cleared')}
  function localPixel(e){return layerPoint(editorPoint(e))}
  function erasePixel(lp){
    if(!inLayer(lp))return;
    layer().mask[lp.y][lp.x]=0;L=lp.y;dirty();render();setStatus('Pixel erased');
  }

  drawEditor=function(){
    baseDrawEditor();
    if(!selectionActive())return;
    const c=$('editor'),g=c.getContext('2d'),s=layer();
    const x=(s.ox+selection.x)*editorCell+.5,y=(s.oy+selection.y)*editorCell+.5;
    const w=selection.w*editorCell,h=selection.h*editorCell;
    g.save();g.setLineDash([Math.max(2,editorCell*.22),Math.max(2,editorCell*.14)]);g.lineWidth=Math.max(1,editorCell*.07);
    g.strokeStyle='#fff';g.strokeRect(x,y,w,h);g.lineDashOffset=Math.max(2,editorCell*.18);g.strokeStyle='#101216';g.strokeRect(x,y,w,h);g.restore();
  };

  const editor=$('editor');
  editor.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    const lp=localPixel(e);
    if(selectionMode){
      e.preventDefault();e.stopImmediatePropagation();
      if(!inLayer(lp)){setStatus('Selection must start inside the selected layer');return}
      selecting=true;selectAnchor={x:lp.x,y:lp.y};selection={x:lp.x,y:lp.y,w:1,h:1};selectionOwner=F+':'+S;
      editor.setPointerCapture?.(e.pointerId);updateSelectionButtons();drawEditor();return;
    }
    if(!inLayer(lp))return;
    const now=performance.now(),key=lp.x+','+lp.y;
    if(now-lastTapAt<=DOUBLE_TAP_MS&&key===lastTapPixel&&e.pointerType===lastTapPointer){
      e.preventDefault();e.stopImmediatePropagation();lastTapAt=0;lastTapPixel='';erasePixel(lp);return;
    }
    lastTapAt=now;lastTapPixel=key;lastTapPointer=e.pointerType;
  },true);
  editor.addEventListener('pointermove',e=>{
    if(!selectionMode||!selecting)return;
    e.preventDefault();e.stopImmediatePropagation();
    let lp=localPixel(e);lp={x:C(lp.x,0,sz()-1),y:C(lp.y,0,sz()-1)};selection=normalizeSelection(selectAnchor,lp);updateSelectionButtons();drawEditor();
  },true);
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>editor.addEventListener(ev,e=>{
    if(!selectionMode||!selecting)return;
    e.preventDefault();e.stopImmediatePropagation();selecting=false;updateSelectionButtons();drawEditor();setStatus('Selected '+selection.w+'×'+selection.h+' pixels');
  },true));

  function copySelection(){
    if(!selectionActive())return;
    const r=selection,m=layer().mask;
    clipboard={w:r.w,h:r.h,data:Array.from({length:r.h},(_,y)=>Array.from({length:r.w},(_,x)=>m[r.y+y][r.x+x])),sourceX:r.x,sourceY:r.y};
    updateSelectionButtons();setStatus('Copied '+r.w+'×'+r.h+' pixels');
  }
  function pasteSelection(){
    if(!clipboard)return;
    const start=selectionActive()?{x:selection.x,y:selection.y}:{x:clipboard.sourceX,y:clipboard.sourceY};
    const m=layer().mask;
    for(let y=0;y<clipboard.h;y++)for(let x=0;x<clipboard.w;x++){
      const dx=start.x+x,dy=start.y+y;if(dx>=0&&dy>=0&&dx<sz()&&dy<sz())m[dy][dx]=clipboard.data[y][x];
    }
    selection={x:C(start.x,0,sz()-1),y:C(start.y,0,sz()-1),w:Math.min(clipboard.w,sz()-C(start.x,0,sz()-1)),h:Math.min(clipboard.h,sz()-C(start.y,0,sz()-1))};selectionOwner=F+':'+S;
    dirty();render();updateSelectionButtons();setStatus('Pasted '+clipboard.w+'×'+clipboard.h+' pixels');
  }

  function moveSelection(dx,dy){
    if(!selectionActive()){baseShiftBitmap(dx,dy);return}
    const r=selection,nx=r.x+dx,ny=r.y+dy;
    if(nx<0||ny<0||nx+r.w>sz()||ny+r.h>sz()){setStatus('Selection is at the sprite edge');return}
    const m=layer().mask,tmp=Array.from({length:r.h},(_,y)=>Array.from({length:r.w},(_,x)=>m[r.y+y][r.x+x]));
    for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[r.y+y][r.x+x]=0;
    for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[ny+y][nx+x]=tmp[y][x];
    selection={x:nx,y:ny,w:r.w,h:r.h};selectionOwner=F+':'+S;
    dirty();render();setStatus('Moved selection to '+nx+','+ny);
  }
  shiftBitmap=function(dx,dy){moveSelection(dx,dy)};
  flip=function(horizontal){
    if(!selectionActive()){baseFlip(horizontal);return}
    const r=region(),m=layer().mask,tmp=Array.from({length:r.h},(_,y)=>Array.from({length:r.w},(_,x)=>m[r.y+y][r.x+x]));
    for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[r.y+y][r.x+x]=horizontal?tmp[y][r.w-1-x]:tmp[r.h-1-y][x];
    dirty();render();setStatus(horizontal?'Flipped selection horizontally':'Flipped selection vertically');
  };
  function invertRegion(){const r=region(),m=layer().mask;for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[r.y+y][r.x+x]^=1;dirty();render();setStatus(selectionActive()?'Inverted selection':'Inverted layer')}
  function clearRegion(){const r=region(),m=layer().mask;for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[r.y+y][r.x+x]=0;dirty();render();setStatus(selectionActive()?'Cleared selection':'Cleared layer')}

  const basePencil=$('pencil').onclick,baseEraser=$('eraser').onclick;
  $('pencil').onclick=e=>{selectionMode=false;basePencil?.(e);updateSelectionButtons()};
  $('eraser').onclick=e=>{selectionMode=false;baseEraser?.(e);updateSelectionButtons()};
  $('selectTool').onclick=()=>{selectionMode=true;updateSelectionButtons();setStatus('Selection tool · drag a rectangle on the selected layer')};
  $('copyPixels').onclick=copySelection;$('pastePixels').onclick=pasteSelection;$('clearSelection').onclick=clearSelection;
  $('left').onclick=()=>moveSelection(-1,0);$('right').onclick=()=>moveSelection(1,0);$('up').onclick=()=>moveSelection(0,-1);$('down').onclick=()=>moveSelection(0,1);
  $('flipH').onclick=()=>flip(true);$('flipV').onclick=()=>flip(false);$('invert').onclick=invertRegion;$('clear').onclick=clearRegion;

  window.addEventListener('keydown',e=>{
    if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    if(e.key==='Escape'&&selectionActive()){e.preventDefault();clearSelection();return}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'&&selectionActive()){e.preventDefault();copySelection();return}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'&&clipboard){e.preventDefault();pasteSelection();return}
    if(e.key.toLowerCase()==='s'&&!e.ctrlKey&&!e.metaKey){selectionMode=true;updateSelectionButtons();setStatus('Selection tool');return}
    if(selectionActive()&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault();
      if(e.key==='ArrowLeft')moveSelection(-1,0);
      if(e.key==='ArrowRight')moveSelection(1,0);
      if(e.key==='ArrowUp')moveSelection(0,-1);
      if(e.key==='ArrowDown')moveSelection(0,1);
    }
  });

  function applyEditorScalePercent(){
    editorZoom=Math.round(C(editorZoom,EDITOR_MIN,EDITOR_MAX)*10)/10;
    const c=$('editor'),cssCell=EDITOR_BASE_CELL*editorZoom,w=aw()*cssCell,h=ah()*cssCell;
    c.style.setProperty('width',w+'px','important');c.style.setProperty('height',h+'px','important');
    c.style.setProperty('min-width',w+'px');c.style.setProperty('min-height',h+'px');$('editorZoom').textContent=Math.round(editorZoom*100)+'%';
  }
  applyEditorScale=applyEditorScalePercent;
  changeEditorZoom=function(delta){
    const c=$('editor'),wrap=$('editorWrap'),oldW=Math.max(c.getBoundingClientRect().width,1),oldH=Math.max(c.getBoundingClientRect().height,1);
    const cx=(wrap.scrollLeft+wrap.clientWidth/2)/oldW,cy=(wrap.scrollTop+wrap.clientHeight/2)/oldH;
    editorZoom=Math.round(C(editorZoom+delta*EDITOR_STEP,EDITOR_MIN,EDITOR_MAX)*10)/10;applyEditorScalePercent();
    requestAnimationFrame(()=>{const nw=c.getBoundingClientRect().width,nh=c.getBoundingClientRect().height;wrap.scrollLeft=Math.max(0,cx*nw-wrap.clientWidth/2);wrap.scrollTop=Math.max(0,cy*nh-wrap.clientHeight/2)});
    setStatus('Editor zoom '+Math.round(editorZoom*100)+'%');
  };

  function applyPreviewScalePercent(){
    previewScale=Math.round(C(previewScale,PREVIEW_MIN,PREVIEW_MAX)*10)/10;
    const c=$('screenCanvas');c.style.width=(256*previewScale)+'px';c.style.height=(212*previewScale)+'px';$('previewZoom').textContent=Math.round(previewScale*100)+'%';
  }
  applyPreviewScale=applyPreviewScalePercent;
  changePreviewScale=function(delta){previewScale=Math.round(C(previewScale+delta*PREVIEW_STEP,PREVIEW_MIN,PREVIEW_MAX)*10)/10;applyPreviewScalePercent();setStatus('Preview zoom '+Math.round(previewScale*100)+'%')};
  savePreviewImage=function(){
    drawScene(false);const src=$('screenCanvas'),out=document.createElement('canvas');
    out.width=Math.max(1,Math.round(src.width*previewScale));out.height=Math.max(1,Math.round(src.height*previewScale));
    const g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,0,0,out.width,out.height);
    out.toBlob(blob=>{if(blob)dl(blob,'pixieverse-screen'+P.screen+'-'+Math.round(previewScale*100)+'pct.png','image/png');drawScene(true)},'image/png');
  };
  $('previewZoomIn').onclick=()=>changePreviewScale(1);$('previewZoomOut').onclick=()=>changePreviewScale(-1);$('saveImage').onclick=savePreviewImage;
  const screen=$('screenCanvas'),box=screen.closest('.screenbox');
  screen.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0&&e.button!==2)return;
    e.preventDefault();e.stopImmediatePropagation();changePreviewScale(e.button===2?-1:1);
  },true);
  box.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();changePreviewScale(e.deltaY<0?1:-1)},{passive:false});
  screen.oncontextmenu=e=>e.preventDefault();

  function updateScanlineVisibility(){const visible=$('showScanline').checked;$('previewPanel').classList.toggle('scanline-hidden',!visible);if(visible)loadGraph()}
  $('showScanline').onchange=updateScanlineVisibility;$('showScanline').checked=false;updateScanlineVisibility();

  lineTable=function(){
    const h=$('lines');h.innerHTML='';L=C(L,0,sz()-1);$('lineBadge').textContent='';
    for(let i=0;i<sz();i++){
      const a=layer().lines[i],r=document.createElement('div');r.className='colorrow'+(i===L?' sel':'');
      const num=document.createElement('input');num.className='linecolor';num.type='text';num.inputMode='numeric';num.maxLength=2;num.value=String(a.color).padStart(2,'0');num.title='Palette index 00–15';
      const sw=document.createElement('button');sw.className='linecolorswatch';sw.style.background=PAL[a.color];sw.title='Select this line color';
      const or=document.createElement('input');or.type='checkbox';or.className='orbox';or.checked=!!a.cc;or.title='OR / combine color';
      num.onclick=e=>{e.stopPropagation();L=i};
      num.onfocus=()=>{L=i;num.select()};
      num.onchange=()=>{a.color=C(parseInt(num.value,10)||0,0,15);K=a.color;L=i;num.value=String(a.color).padStart(2,'0');dirty();render()};
      sw.onclick=e=>{e.stopPropagation();L=i;K=a.color;render()};
      or.onclick=e=>e.stopPropagation();or.onchange=()=>{a.cc=or.checked;L=i;dirty();render()};
      r.onclick=()=>{L=i;K=a.color;render()};r.append(num,sw,or);h.appendChild(r);
    }
  };

  props=function(){baseProps();const ui=$('spriteSize');if(ui)ui.value=String(sz())};
  if($('spriteSize'))$('spriteSize').onchange=e=>setSpriteSize(e.target.value);

  const baseRender=render;
  render=function(){
    syncSpriteSizeModel(false);
    if(selection&&selectionOwner!==F+':'+S){selection=null;selectionOwner=null;selecting=false;selectAnchor=null}
    baseRender();updateSelectionButtons();if($('spriteSize'))$('spriteSize').value=String(sz());
  };

  if(syncSpriteSizeModel(true))setStatus('Canvas synchronized to sprite size');
  applyEditorScalePercent();applyPreviewScalePercent();updateSelectionButtons();render();
})();
