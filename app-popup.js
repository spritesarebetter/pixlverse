'use strict';
(() => {
  const popup=$('palettePopup');
  function place(rect){
    popup.hidden=false;popup.style.visibility='hidden';
    const w=Math.min(320,popup.offsetWidth||300),h=Math.min(window.innerHeight-16,popup.offsetHeight||420);
    let left=rect.right+6;if(left+w>window.innerWidth-8)left=Math.max(8,rect.left-w-6);
    const top=Math.max(8,Math.min(rect.top,window.innerHeight-h-8));
    popup.style.left=left+'px';popup.style.top=top+'px';popup.style.visibility='visible';
  }
  function openForLine(i,anchor){L=C(i,0,sz()-1);K=layer().lines[L].color;palette();updatePaletteEditor();drawEditor();place(anchor.getBoundingClientRect())}
  function close(){popup.hidden=true}
  document.addEventListener('pointerdown',e=>{if(popup.hidden)return;if(popup.contains(e.target)||e.target.classList?.contains('linecolorswatch'))return;close()},true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!popup.hidden)close()});

  lineTable=function(){
    const h=$('lines');h.innerHTML='';L=C(L,0,sz()-1);
    for(let i=0;i<sz();i++){
      const a=layer().lines[i],r=document.createElement('div');r.className='colorrow'+(i===L?' sel':'');
      const sw=document.createElement('button');sw.className='linecolorswatch';sw.style.background=PAL[a.color];sw.title='Color '+String(a.color).padStart(2,'0');
      const or=document.createElement('input');or.type='checkbox';or.className='orbox';or.checked=!!a.or;or.title='OR / combine color';
      sw.onclick=e=>{e.stopPropagation();openForLine(i,sw)};
      or.onclick=e=>e.stopPropagation();or.onchange=()=>{a.or=or.checked;L=i;dirty();render()};
      r.onclick=()=>{L=i;K=a.color;render()};r.append(sw,or);h.appendChild(r);
    }
  };

  const oldProps=props;props=function(){oldProps();$('title').textContent='Sprite editor'};
  render();
})();
