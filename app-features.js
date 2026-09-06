'use strict';
(() => {
  const WAIT_DEFAULT=6,WAIT_MAX=9999,TICK_MS=1000/60,LOCAL_PALETTES_KEY='pixieverse.savedPalettes.v1';
  let animPlaying=false,animFrameIndex=0,animTicksLeft=0,animRaf=0,animLast=0,animAccum=0;
  const waitOf=f=>C(Math.round(Number(f?.wait)||WAIT_DEFAULT),1,WAIT_MAX);
  const previewFrame=()=>animPlaying?P.frames[animFrameIndex]:fr();

  function ensureFrameWaits(){let changed=false;P.frames.forEach(f=>{const w=waitOf(f);if(f.wait!==w){f.wait=w;changed=true}});return changed}
  function saveWaitMigration(){if(!ensureFrameWaits())return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(P))}catch(e){}}
  function updateAnimButtons(){$('startAnim').disabled=animPlaying||P.frames.length<2;$('stopAnim').disabled=!animPlaying}

  renderFrames=function(){
    ensureFrameWaits();
    let h=$('frames');h.innerHTML='';
    P.frames.forEach((f,i)=>{
      let d=document.createElement('div');d.className='item'+(i===F?' sel':'');
      let r=document.createElement('div');r.className='frameitem';
      let n=document.createElement('div');n.innerHTML='<div class="layername">'+i+' · '+esc(f.name)+(animPlaying&&i===animFrameIndex?' <span class="playing">●</span>':'')+'</div><div class="layerinfo">'+f.sprites.length+' layer(s)</div>';
      let w=document.createElement('label');w.className='framewait';w.innerHTML='wait <input type="number" min="1" max="'+WAIT_MAX+'" step="1" value="'+waitOf(f)+'">';
      let input=w.querySelector('input');input.onclick=e=>e.stopPropagation();input.onchange=e=>{e.stopPropagation();f.wait=waitOf({wait:e.target.value});e.target.value=f.wait;dirty();if(animPlaying&&i===animFrameIndex)animTicksLeft=f.wait};
      r.append(n,w);d.appendChild(r);d.onclick=()=>{F=i;S=0;L=0;render()};h.appendChild(d);
    });
    $('delFrame').disabled=P.frames.length<=1;$('frameUp').disabled=F<=0;$('frameDown').disabled=F>=P.frames.length-1;updateAnimButtons();
  };

  const baseProps=props;
  props=function(){baseProps();if(animPlaying)$('previewInfo').textContent+=' · frame '+animFrameIndex+' · wait '+waitOf(previewFrame())};

  drawScene=function(showSelection=true){
    let c=$('screenCanvas'),g=c.getContext('2d'),arr=previewFrame().sprites;g.fillStyle='#101018';g.fillRect(0,0,256,212);
    for(let y=0;y<212;y++){
      let cand=arr.filter(s=>covers(s,y));if($('limit').checked)cand=cand.slice(0,8);let cols=Array(256).fill(null);
      for(let s of cand){let py=C(Math.floor((y-sy(s))/mg()),0,sz()-1),a=s.lines[py],base=sx(s)+(a.ec?-32:0);for(let x=0;x<256;x++){let px=Math.floor((x-base)/mg());if(px<0||px>=sz()||!s.mask[py][px]||!a.color)continue;if(a.cc){if(cols[x]!==null)cols[x]=(cols[x]|a.color)&15}else if(cols[x]===null)cols[x]=a.color}}
      for(let x=0;x<256;x++)if(cols[x]!==null){g.fillStyle=PAL[cols[x]];g.fillRect(x,y,1,1)}
    }
    if(showSelection&&!animPlaying){let s=layer();g.strokeStyle='rgba(255,255,255,.7)';g.strokeRect(sx(s)+.5,sy(s)+.5,sz()*mg(),sz()*mg());g.strokeStyle='rgba(101,215,192,.5)';g.strokeRect(P.sceneX+.5,P.sceneY+.5,aw(),ah())}
  };

  loadGraph=function(){let c=$('loadCanvas'),g=c.getContext('2d'),mx=0,over=0,frame=previewFrame();g.fillStyle='#10141b';g.fillRect(0,0,180,212);for(let y=0;y<212;y++){let n=frame.sprites.filter(s=>covers(s,y)).length;mx=Math.max(mx,n);if(n>8)over++;g.fillStyle=n>8?'#f3c96b':'#65d7c0';g.fillRect(0,y,Math.min(170,n*16),1)}$('loadInfo').textContent='peak '+mx+'/8\n'+over+' overloaded lines'};
  warnings=function(){let frame=previewFrame(),bad=0;for(let y=0;y<212;y++)if(frame.sprites.filter(s=>covers(s,y)).length>8)bad++;let outside=frame.sprites.filter(s=>s.ox<0||s.oy<0||s.ox+sz()>aw()||s.oy+sz()>ah()).length,a=[];if(bad)a.push('⚠ '+bad+' scanlines exceed 8 sprites');if(outside)a.push(outside+' layer(s) extend outside canvas');$('warn').textContent=a.join(' · ')};

  function redrawAnimation(){drawScene();loadGraph();warnings();renderFrames();props()}
  function tick(){animTicksLeft--;if(animTicksLeft<=0){animFrameIndex=(animFrameIndex+1)%P.frames.length;animTicksLeft=waitOf(previewFrame());redrawAnimation()}}
  function loop(now){if(!animPlaying)return;if(!animLast)animLast=now;animAccum+=Math.min(250,now-animLast);animLast=now;while(animAccum>=TICK_MS){tick();animAccum-=TICK_MS}animRaf=requestAnimationFrame(loop)}
  function startAnimation(){if(animPlaying||P.frames.length<2)return;ensureFrameWaits();animPlaying=true;animFrameIndex=F;animTicksLeft=waitOf(previewFrame());animLast=0;animAccum=0;redrawAnimation();updateAnimButtons();animRaf=requestAnimationFrame(loop);setStatus('Animation playing · 60 Hz')}
  function stopAnimation(redraw=true){if(animRaf)cancelAnimationFrame(animRaf);animRaf=0;animPlaying=false;animLast=animAccum=0;updateAnimButtons();if(redraw){drawScene();loadGraph();warnings();renderFrames();props();setStatus('Animation stopped')}}
  function moveFrame(delta){stopAnimation(false);let n=F+delta;if(n<0||n>=P.frames.length)return;[P.frames[F],P.frames[n]]=[P.frames[n],P.frames[F]];F=n;dirty();render()}

  const baseAddFrame=$('addFrame').onclick,baseDupFrame=$('dupFrame').onclick,baseDelFrame=$('delFrame').onclick;
  $('addFrame').onclick=()=>{stopAnimation(false);ensureFrameWaits();baseAddFrame();ensureFrameWaits()};
  $('dupFrame').onclick=()=>{stopAnimation(false);ensureFrameWaits();baseDupFrame();ensureFrameWaits()};
  $('delFrame').onclick=()=>{stopAnimation(false);baseDelFrame()};
  $('frameUp').onclick=()=>moveFrame(-1);$('frameDown').onclick=()=>moveFrame(1);$('startAnim').onclick=startAnimation;$('stopAnim').onclick=()=>stopAnimation();

  function readSavedPalettes(){try{let a=JSON.parse(localStorage.getItem(LOCAL_PALETTES_KEY)||'[]');return Array.isArray(a)?a.filter(p=>p&&p.id&&p.name&&Array.isArray(p.palette)):[]}catch(e){return[]}}
  function writeSavedPalettes(a){localStorage.setItem(LOCAL_PALETTES_KEY,JSON.stringify(a))}
  function renderSavedPalettes(){let sel=$('savedPalette'),list=readSavedPalettes(),wanted=sel.value;sel.innerHTML='';if(!list.length){let o=document.createElement('option');o.value='';o.textContent='No saved palettes';sel.appendChild(o)}else list.forEach(p=>{let o=document.createElement('option');o.value=p.id;o.textContent=p.name;sel.appendChild(o)});if(list.some(p=>p.id===wanted))sel.value=wanted;$('loadPaletteLocal').disabled=!list.length;$('deletePaletteLocal').disabled=!list.length}
  function savePaletteLocal(){let name=safePaletteName(P.paletteName),list=readSavedPalettes(),old=list.find(p=>p.name.toLowerCase()===name.toLowerCase()),id=old?.id||'pal-'+Date.now().toString(36),item={id,name,palette:normalizePalette(P.palette),savedAt:new Date().toISOString()};list=old?list.map(p=>p.id===id?item:p):[...list,item];writeSavedPalettes(list);renderSavedPalettes();$('savedPalette').value=id;setStatus('Palette saved in tool: '+name)}
  function loadPaletteLocal(){let p=readSavedPalettes().find(x=>x.id===$('savedPalette').value);if(!p)return;P.palette=normalizePalette(p.palette);P.paletteName=p.name;refreshPaletteCache();dirty();render();syncPalettePresetUI();setStatus('Saved palette loaded: '+p.name)}
  function deletePaletteLocal(){let id=$('savedPalette').value,p=readSavedPalettes().find(x=>x.id===id);if(!p)return;if(!confirm('Delete saved palette “'+p.name+'” from this browser?'))return;writeSavedPalettes(readSavedPalettes().filter(x=>x.id!==id));renderSavedPalettes();setStatus('Saved palette deleted: '+p.name)}
  $('savePaletteLocal').onclick=savePaletteLocal;$('loadPaletteLocal').onclick=loadPaletteLocal;$('deletePaletteLocal').onclick=deletePaletteLocal;
  $('palettePreset').onchange=e=>applyPalettePreset(e.target.value);

  saveWaitMigration();renderSavedPalettes();render();
})();
