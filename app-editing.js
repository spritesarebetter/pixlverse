'use strict';
(() => {
  let selectionMode=false,selection=null,selectionOwner=null,selecting=false,selectAnchor=null,clipboard=null;
  let selectionDragging=false,selectionDragStart=null,selectionDragOrigin=null,selectionDragData=null,selectionDragBase=null;
  let lastTapAt=0,lastTapPixel='',lastTapPointer='';
  const DOUBLE_TAP_MS=320,HISTORY_LIMIT=80;
  const baseDrawEditor=drawEditor,baseShiftBitmap=shiftBitmap,baseFlip=flip,baseProps=props,baseDirty=dirty;
  let historyState=JSON.stringify(P),undoStack=[],redoStack=[],historyBatch=false,historyBatchPushed=false,historyBatchStart='',historyApplying=false;

  const normalizeSelection=(a,b)=>({x:C(Math.min(a.x,b.x),0,sz()-1),y:C(Math.min(a.y,b.y),0,sz()-1),w:C(Math.abs(a.x-b.x)+1,1,sz()),h:C(Math.abs(a.y-b.y)+1,1,sz())});
  const selectionActive=()=>!!selection&&selectionOwner===F+':'+S;
  const region=()=>selectionActive()?selection:{x:0,y:0,w:sz(),h:sz()};
  const pointInSelection=p=>selectionActive()&&p.x>=selection.x&&p.y>=selection.y&&p.x<selection.x+selection.w&&p.y<selection.y+selection.h;

  function setSpriteSize(value){P.size=+value===8?8:16;L=C(L,0,P.size-1);selection=null;selectionOwner=null;selecting=false;selectionDragging=false;dirty();render();setStatus('Size '+P.size+'×'+P.size)}
  function updateHistoryButtons(){$('undo').disabled=!undoStack.length;$('redo').disabled=!redoStack.length}
  function beginHistoryBatch(){if(historyApplying||historyBatch)return;historyBatch=true;historyBatchPushed=false;historyBatchStart=historyState||JSON.stringify(P)}
  function endHistoryBatch(){historyBatch=false;historyBatchPushed=false;historyBatchStart=''}
  function pushUndo(state){if(!state)return;undoStack.push(state);if(undoStack.length>HISTORY_LIMIT)undoStack.shift()}
  dirty=function(save=true){const next=JSON.stringify(P);if(!historyApplying&&historyState&&next!==historyState){if(historyBatch){if(!historyBatchPushed){pushUndo(historyBatchStart||historyState);redoStack=[];historyBatchPushed=true}}else{pushUndo(historyState);redoStack=[]}historyState=next}else if(!historyState)historyState=next;baseDirty(save);updateHistoryButtons()};
  function restoreHistory(state,label){historyApplying=true;try{P=parseProject(JSON.parse(state));selection=null;selectionOwner=null;selecting=false;selectionDragging=false;clampSelection();refreshPaletteCache();historyState=JSON.stringify(P);baseDirty(true);render();if(typeof refreshPaletteFileMenu==='function')refreshPaletteFileMenu();setStatus(label)}finally{historyApplying=false;updateHistoryButtons()}}
  function undo(){if(!undoStack.length)return;const current=JSON.stringify(P),prev=undoStack.pop();redoStack.push(current);if(redoStack.length>HISTORY_LIMIT)redoStack.shift();restoreHistory(prev,'Undo')}
  function redo(){if(!redoStack.length)return;const current=JSON.stringify(P),next=redoStack.pop();pushUndo(current);restoreHistory(next,'Redo')}

  function updateSelectionButtons(){$('selectTool').classList.toggle('on',selectionMode);$('pencil').classList.toggle('on',!selectionMode&&tool==='pencil');$('eraser').classList.toggle('on',!selectionMode&&tool==='eraser');$('copyPixels').disabled=!selectionActive();$('pastePixels').disabled=!clipboard;updateHistoryButtons()}
  function clearSelection(){selection=null;selectionOwner=null;selecting=false;selectionDragging=false;updateSelectionButtons();drawEditor();setStatus('Selection cleared')}
  const localPixel=e=>layerPoint(editorPoint(e));
  function erasePixel(lp){if(!inLayer(lp))return;layer().mask[lp.y][lp.x]=0;L=lp.y;dirty();render();setStatus('Pixel erased')}

  function syncEditorRailScale(){const stage=$('editorStage'),rail=$('spriteColorRail');if(!stage||!rail)return;const cell=EDITOR_BASE_CELL*editorZoom;stage.style.setProperty('--editor-cell',cell+'px');stage.style.setProperty('--rail-width',(cell*3.65)+'px');rail.style.width=(cell*3.65)+'px';rail.style.height=(sz()*cell)+'px';$('lines').style.height=(sz()*cell)+'px'}
  drawEditor=function(){baseDrawEditor();syncEditorRailScale();if(!selectionActive())return;const c=$('editor'),g=c.getContext('2d'),s=layer(),x=(s.ox+selection.x)*editorCell+.5,y=(s.oy+selection.y)*editorCell+.5,w=selection.w*editorCell,h=selection.h*editorCell;g.save();g.setLineDash([Math.max(2,editorCell*.22),Math.max(2,editorCell*.14)]);g.lineWidth=Math.max(1,editorCell*.07);g.strokeStyle='#fff';g.strokeRect(x,y,w,h);g.lineDashOffset=Math.max(2,editorCell*.18);g.strokeStyle='#101216';g.strokeRect(x,y,w,h);g.restore()};

  function copySelection(){if(!selectionActive())return;const r=selection,m=layer().mask;clipboard={w:r.w,h:r.h,data:Array.from({length:r.h},(_,y)=>Array.from({length:r.w},(_,x)=>m[r.y+y][r.x+x])),sourceX:r.x,sourceY:r.y};updateSelectionButtons();setStatus('Copied selection')}
  function pasteSelection(){if(!clipboard)return;const start=selectionActive()?{x:selection.x,y:selection.y}:{x:clipboard.sourceX,y:clipboard.sourceY},m=layer().mask;for(let y=0;y<clipboard.h;y++)for(let x=0;x<clipboard.w;x++){const dx=start.x+x,dy=start.y+y;if(dx>=0&&dy>=0&&dx<sz()&&dy<sz())m[dy][dx]=clipboard.data[y][x]}selection={x:C(start.x,0,sz()-1),y:C(start.y,0,sz()-1),w:Math.min(clipboard.w,sz()-C(start.x,0,sz()-1)),h:Math.min(clipboard.h,sz()-C(start.y,0,sz()-1))};selectionOwner=F+':'+S;dirty();render();updateSelectionButtons();setStatus('Pasted selection')}
  function moveSelection(dx,dy){if(!selectionActive()){baseShiftBitmap(dx,dy);return}const r=selection,nx=r.x+dx,ny=r.y+dy;if(nx<0||ny<0||nx+r.w>sz()||ny+r.h>sz()){setStatus('Selection is at the sprite edge');return}const m=layer().mask,tmp=Array.from({length:r.h},(_,y)=>Array.from({length:r.w},(_,x)=>m[r.y+y][r.x+x]));for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[r.y+y][r.x+x]=0;for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[ny+y][nx+x]=tmp[y][x];selection={x:nx,y:ny,w:r.w,h:r.h};selectionOwner=F+':'+S;dirty();render()}
  shiftBitmap=(dx,dy)=>moveSelection(dx,dy);
  flip=function(horizontal){if(!selectionActive()){baseFlip(horizontal);return}const r=region(),m=layer().mask,tmp=Array.from({length:r.h},(_,y)=>Array.from({length:r.w},(_,x)=>m[r.y+y][r.x+x]));for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[r.y+y][r.x+x]=horizontal?tmp[y][r.w-1-x]:tmp[r.h-1-y][x];dirty();render()};
  function invertRegion(){const r=region(),m=layer().mask;for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[r.y+y][r.x+x]^=1;dirty();render()}
  function clearRegion(){const r=region(),m=layer().mask;for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)m[r.y+y][r.x+x]=0;dirty();render()}

  function beginSelectionDrag(lp,e){const r=selection;selectionDragging=true;selectionDragStart={x:lp.x,y:lp.y};selectionDragOrigin={...r};selectionDragData=Array.from({length:r.h},(_,y)=>Array.from({length:r.w},(_,x)=>layer().mask[r.y+y][r.x+x]));selectionDragBase=clone(layer().mask);for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)selectionDragBase[r.y+y][r.x+x]=0;beginHistoryBatch();editor.setPointerCapture?.(e.pointerId);editor.style.cursor='move'}
  function dragSelectionTo(lp){if(!selectionDragging)return;const r=selectionDragOrigin;let dx=lp.x-selectionDragStart.x,dy=lp.y-selectionDragStart.y;dx=C(dx,-r.x,sz()-(r.x+r.w));dy=C(dy,-r.y,sz()-(r.y+r.h));const nx=r.x+dx,ny=r.y+dy;if(selection.x===nx&&selection.y===ny)return;layer().mask=clone(selectionDragBase);for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)layer().mask[ny+y][nx+x]=selectionDragData[y][x];selection={x:nx,y:ny,w:r.w,h:r.h};selectionOwner=F+':'+S;dirty();render()}
  function endSelectionDrag(){if(!selectionDragging)return;selectionDragging=false;selectionDragStart=selectionDragOrigin=selectionDragData=selectionDragBase=null;endHistoryBatch();editor.style.cursor='crosshair';setStatus('Selection moved')}

  const editor=$('editor');
  editor.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;const lp=localPixel(e);if(pointInSelection(lp)){e.preventDefault();e.stopImmediatePropagation();beginSelectionDrag(lp,e);return}if(selectionMode){e.preventDefault();e.stopImmediatePropagation();if(!inLayer(lp))return;selecting=true;selectAnchor={x:lp.x,y:lp.y};selection={x:lp.x,y:lp.y,w:1,h:1};selectionOwner=F+':'+S;editor.setPointerCapture?.(e.pointerId);updateSelectionButtons();drawEditor();return}if(!inLayer(lp))return;beginHistoryBatch();const now=performance.now(),key=lp.x+','+lp.y;if(now-lastTapAt<=DOUBLE_TAP_MS&&key===lastTapPixel&&e.pointerType===lastTapPointer){e.preventDefault();e.stopImmediatePropagation();lastTapAt=0;erasePixel(lp);return}lastTapAt=now;lastTapPixel=key;lastTapPointer=e.pointerType},true);
  editor.addEventListener('pointermove',e=>{const lp=localPixel(e);if(selectionDragging){e.preventDefault();e.stopImmediatePropagation();dragSelectionTo({x:C(lp.x,0,sz()-1),y:C(lp.y,0,sz()-1)});return}if(selectionMode&&selecting){e.preventDefault();e.stopImmediatePropagation();const p={x:C(lp.x,0,sz()-1),y:C(lp.y,0,sz()-1)};selection=normalizeSelection(selectAnchor,p);updateSelectionButtons();drawEditor();return}if(e.pointerType==='mouse')editor.style.cursor=pointInSelection(lp)?'move':'crosshair'},true);
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>editor.addEventListener(ev,e=>{if(selectionDragging){e.preventDefault();e.stopImmediatePropagation();endSelectionDrag();return}if(selectionMode&&selecting){e.preventDefault();e.stopImmediatePropagation();selecting=false;updateSelectionButtons();drawEditor();return}endHistoryBatch()},true));

  const basePencil=$('pencil').onclick,baseEraser=$('eraser').onclick;
  $('pencil').onclick=e=>{selectionMode=false;basePencil?.(e);updateSelectionButtons()};$('eraser').onclick=e=>{selectionMode=false;baseEraser?.(e);updateSelectionButtons()};$('selectTool').onclick=()=>{selectionMode=true;updateSelectionButtons();setStatus('Selection tool')};
  $('copyPixels').onclick=copySelection;$('pastePixels').onclick=pasteSelection;$('left').onclick=()=>moveSelection(-1,0);$('right').onclick=()=>moveSelection(1,0);$('up').onclick=()=>moveSelection(0,-1);$('down').onclick=()=>moveSelection(0,1);$('flipH').onclick=()=>flip(true);$('flipV').onclick=()=>flip(false);$('invert').onclick=invertRegion;$('clear').onclick=clearRegion;$('undo').onclick=undo;$('redo').onclick=redo;$('spriteSize').onchange=e=>setSpriteSize(e.target.value);

  window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const key=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&key==='z'){e.preventDefault();e.shiftKey?redo():undo();return}if((e.ctrlKey||e.metaKey)&&key==='y'){e.preventDefault();redo();return}if(e.key==='Escape'&&selectionActive()){e.preventDefault();clearSelection();return}if((e.ctrlKey||e.metaKey)&&key==='c'&&selectionActive()){e.preventDefault();copySelection();return}if((e.ctrlKey||e.metaKey)&&key==='v'&&clipboard){e.preventDefault();pasteSelection();return}if(key==='s'&&!e.ctrlKey&&!e.metaKey){selectionMode=true;updateSelectionButtons();return}if(selectionActive()&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')moveSelection(-1,0);if(e.key==='ArrowRight')moveSelection(1,0);if(e.key==='ArrowUp')moveSelection(0,-1);if(e.key==='ArrowDown')moveSelection(0,1)}});

  $('previewZoomIn').onclick=()=>changePreviewScale(1);$('previewZoomOut').onclick=()=>changePreviewScale(-1);
  const previewCanvas=$('screenCanvas'),previewBox=previewCanvas.closest('.screenbox');
  previewCanvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0&&e.button!==2)return;e.preventDefault();e.stopImmediatePropagation();changePreviewScale(e.button===2?-1:1)},true);
  previewCanvas.oncontextmenu=e=>e.preventDefault();
  previewBox.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();changePreviewScale(e.deltaY<0?1:-1)},{passive:false});
  function updateScanlineVisibility(){const visible=$('showScanline').checked;$('previewPanel').classList.toggle('scanline-hidden',!visible);if(visible)loadGraph()}
  $('showScanline').onchange=updateScanlineVisibility;$('showScanline').checked=false;updateScanlineVisibility();

  const baseRender=render;render=function(){if(selection&&selectionOwner!==F+':'+S){selection=null;selectionOwner=null;selecting=false;selectionDragging=false}baseRender();$('spriteSize').value=String(sz());updateSelectionButtons();syncEditorRailScale()};
  historyState=JSON.stringify(P);$('spriteSize').value=String(sz());updateSelectionButtons();syncEditorRailScale();
})();
