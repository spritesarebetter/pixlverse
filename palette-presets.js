'use strict';
// Preset RGB values come from palette extensions shipped in aseprite/aseprite.
// Pixlverse quantizes their 8-bit RGB values to V9938/V9958 3-bit RGB on apply.
const PALETTE_PRESETS={
  msx:{label:'Pixlverse · MSX default',source:'Pixlverse',rgb3:DEFAULT_PALETTE},
  db16:{label:'Aseprite · DawnBringer DB16',source:'Aseprite / DawnBringer',rgb8:[
    [20,12,28],[68,36,52],[48,52,109],[78,74,78],[133,76,48],[52,101,36],[208,70,72],[117,113,97],
    [89,125,206],[210,125,44],[133,149,161],[109,170,44],[210,170,153],[109,194,202],[218,212,94],[222,238,214]
  ]},
  arne16:{label:'Aseprite · Arne16',source:'Aseprite / Arne Niklas Jansson',rgb8:[
    [0,0,0],[157,157,157],[255,255,255],[190,38,51],[224,111,139],[73,60,43],[164,100,34],[235,137,49],
    [247,226,107],[47,72,78],[68,137,26],[163,206,39],[27,38,50],[0,87,132],[49,162,242],[178,220,239]
  ]},
  jmp:{label:'Aseprite · JMP (MSX-inspired)',source:'Aseprite / Arne Niklas Jansson',rgb8:[
    [0,0,0],[25,16,40],[70,175,69],[161,214,133],[69,62,120],[118,100,254],[131,49,41],[158,194,232],
    [220,83,75],[225,141,121],[214,185,123],[233,216,161],[33,108,75],[211,101,200],[175,170,185],[245,244,235]
  ]},
  pico8:{label:'Aseprite · PICO-8',source:'Aseprite / Joseph White',rgb8:[
    [0,0,0],[29,43,83],[126,37,83],[0,135,81],[171,82,54],[95,87,79],[194,195,199],[255,241,232],
    [255,0,77],[255,163,0],[255,236,39],[0,228,54],[41,173,255],[131,118,156],[255,119,168],[255,204,170]
  ]},
  c64:{label:'Aseprite · Commodore 64',source:'Aseprite hardware palettes',rgb8:[
    [0,0,0],[255,255,255],[136,57,50],[103,182,189],[139,63,150],[85,160,73],[64,49,141],[191,206,114],
    [139,84,41],[87,66,0],[184,105,98],[80,80,80],[120,120,120],[148,224,137],[120,105,196],[159,159,159]
  ]}
};
const rgb8To3=rgb=>Array.from({length:3},(_,i)=>C(Math.round(C(Number(rgb?.[i])||0,0,255)*7/255),0,7));
function presetRgb3(key){const p=PALETTE_PRESETS[key];if(!p)return null;return clone(p.rgb3||p.rgb8.map(rgb8To3))}
function palettesEqual(a,b){if(!Array.isArray(a)||!Array.isArray(b)||a.length!==16||b.length!==16)return false;for(let i=0;i<16;i++)for(let c=0;c<3;c++)if(+a[i][c]!==+b[i][c])return false;return true}
function matchingPalettePreset(){for(const key of Object.keys(PALETTE_PRESETS))if(palettesEqual(P.palette,presetRgb3(key)))return key;return 'custom'}
function syncPalettePresetUI(adoptName=false){
  const sel=$('palettePreset');if(!sel)return;
  const key=matchingPalettePreset();sel.value=key;
  if(adoptName&&key!=='custom')P.paletteName=PALETTE_PRESETS[key].label;
  if(!P.paletteName)P.paletteName=key!=='custom'?PALETTE_PRESETS[key].label:'Custom palette';
  const name=$('paletteName');if(name&&document.activeElement!==name)name.value=P.paletteName;
}
function applyPalettePreset(key){
  if(key==='custom')return;
  const next=presetRgb3(key);if(!next)return;
  P.palette=next;P.paletteName=PALETTE_PRESETS[key].label;refreshPaletteCache();dirty();render();syncPalettePresetUI();
  setStatus(PALETTE_PRESETS[key].label+' applied · quantized to MSX RGB3');
}
function markPaletteCustom(){P.paletteName='Custom palette';dirty();syncPalettePresetUI()}
function safePaletteName(name){return String(name||'pixlverse-palette').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,64)||'pixlverse-palette'}
function paletteGplText(){
  const name=safePaletteName(P.paletteName);
  const rows=P.palette.map((rgb,i)=>{const v=rgb8(rgb);return `${String(v[0]).padStart(3)} ${String(v[1]).padStart(3)} ${String(v[2]).padStart(3)} Color ${i}`});
  return `GIMP Palette\nName: ${name}\nColumns: 8\n# Pixlverse V9938/V9958 palette (RGB3)\n${rows.join('\n')}\n`;
}
function savePaletteGpl(){const name=safePaletteName(P.paletteName).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'pixlverse-palette';dl(paletteGplText(),name+'.gpl','text/plain')}
function parseHexColor(v){const m=String(v||'').trim().match(/^#?([0-9a-f]{6})$/i);if(!m)return null;const n=parseInt(m[1],16);return [(n>>16)&255,(n>>8)&255,n&255]}
function normalizeImportedColor(value){
  if(typeof value==='string'){const h=parseHexColor(value);return h?rgb8To3(h):null}
  if(Array.isArray(value)){const v=value.slice(0,3).map(Number);if(v.length<3||v.some(n=>!Number.isFinite(n)))return null;return Math.max(...v)<=7?normalizeRgb3(v):rgb8To3(v)}
  if(value&&typeof value==='object'){const v=[value.r,value.g,value.b].map(Number);if(v.some(n=>!Number.isFinite(n)))return null;return Math.max(...v)<=7?normalizeRgb3(v):rgb8To3(v)}
  return null;
}
function parsePaletteJson(text){
  const j=JSON.parse(text),raw=Array.isArray(j)?j:(j.palette||j.colors);if(!Array.isArray(raw))throw new Error('No palette array found');
  const colors=raw.map(normalizeImportedColor).filter(Boolean);return {name:!Array.isArray(j)&&j.name?String(j.name):'Imported palette',colors};
}
function parsePaletteGpl(text){
  if(!/^\s*GIMP Palette\b/m.test(text))throw new Error('Not a GIMP Palette file');
  const name=(text.match(/^Name:\s*(.+)$/mi)||[])[1]?.trim()||'Imported palette',colors=[];
  for(const line of text.split(/\r?\n/)){const m=line.match(/^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s+|$)/);if(!m)continue;colors.push(rgb8To3([+m[1],+m[2],+m[3]]))}
  return {name,colors};
}
async function loadPaletteFromFile(file){
  if(!file)return;const text=await file.text();let parsed;
  try{parsed=/^\s*[\[{]/.test(text)?parsePaletteJson(text):parsePaletteGpl(text)}catch(err){throw new Error('Could not read palette: '+err.message)}
  if(!parsed.colors.length)throw new Error('Palette contains no readable colors');
  const old=clone(P.palette),next=Array.from({length:16},(_,i)=>parsed.colors[i]||old[i]||clone(DEFAULT_PALETTE[i]));
  P.palette=next;P.paletteName=parsed.name;K=C(K,0,15);refreshPaletteCache();dirty();render();syncPalettePresetUI();
  const extra=parsed.colors.length>16?' · first 16 of '+parsed.colors.length+' used':parsed.colors.length<16?' · '+parsed.colors.length+' loaded, remaining entries kept':'';
  setStatus('Palette loaded: '+parsed.name+extra+' · quantized to MSX RGB3');
}
