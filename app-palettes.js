'use strict';
(() => {
  const KEY='pixieverse.savedPalettes';
  const menu=$('paletteFileSelect');
  function readSaved(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(p=>p&&typeof p.name==='string'&&Array.isArray(p.palette)&&p.palette.length===16):[]}catch(e){return[]}}
  function writeSaved(list){localStorage.setItem(KEY,JSON.stringify(list))}
  function selectedSaved(){const value=menu.value;if(!value.startsWith('saved:'))return null;const id=value.slice(6);return readSaved().find(p=>p.id===id)||null}
  function option(value,label,group){const o=document.createElement('option');o.value=value;o.textContent=label;group.appendChild(o)}
  window.refreshPaletteFileMenu=function(preferred=''){
    const current=preferred||menu.value;menu.innerHTML='';
    const built=document.createElement('optgroup');built.label='Built-in';Object.entries(PALETTE_PRESETS).forEach(([key,p])=>option('preset:'+key,p.label,built));menu.appendChild(built);
    const saved=readSaved();if(saved.length){const own=document.createElement('optgroup');own.label='Saved';saved.forEach(p=>option('saved:'+p.id,p.name,own));menu.appendChild(own)}
    option('load','Load…',menu);
    const valid=[...menu.options].some(o=>o.value===current);if(valid)menu.value=current;else{const preset=Object.entries(PALETTE_PRESETS).find(([,p])=>p.label===P.paletteName);const local=saved.find(p=>p.name===P.paletteName&&JSON.stringify(p.palette)===JSON.stringify(P.palette));menu.value=local?'saved:'+local.id:preset?'preset:'+preset[0]:'load'}
    $('deletePaletteLocal').disabled=!menu.value.startsWith('saved:');
  };
  function applySaved(p){P.palette=normalizePalette(p.palette);P.paletteName=p.name;refreshPaletteCache();dirty();render();refreshPaletteFileMenu('saved:'+p.id);setStatus('Palette loaded: '+p.name)}
  function saveLocal(){const name=safePaletteName(P.paletteName),list=readSaved(),existing=list.find(p=>p.name.toLowerCase()===name.toLowerCase()),id=existing?.id||('pal-'+Date.now().toString(36)),item={id,name,palette:normalizePalette(P.palette)},next=existing?list.map(p=>p.id===id?item:p):[...list,item];writeSaved(next);P.paletteName=name;refreshPaletteFileMenu('saved:'+id);setStatus('Palette saved: '+name)}
  function deleteLocal(){const p=selectedSaved();if(!p)return;if(!confirm('Delete saved palette “'+p.name+'”?'))return;writeSaved(readSaved().filter(x=>x.id!==p.id));refreshPaletteFileMenu();setStatus('Palette deleted: '+p.name)}
  menu.onchange=()=>{const value=menu.value;$('deletePaletteLocal').disabled=!value.startsWith('saved:');if(value==='load'){$('paletteFile').click();return}if(value.startsWith('preset:')){applyPalettePreset(value.slice(7));return}if(value.startsWith('saved:')){const p=selectedSaved();if(p)applySaved(p)}};
  $('savePaletteLocal').onclick=saveLocal;$('deletePaletteLocal').onclick=deleteLocal;refreshPaletteFileMenu();
})();
