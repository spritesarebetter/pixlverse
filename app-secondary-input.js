'use strict';
(() => {
  const c=$('editorLayer');let drag2=false,last2=null,erase2=false,changed2=false;
  const point=e=>{const r=c.getBoundingClientRect();return{x:C(Math.floor((e.clientX-r.left)/r.width*sz()),0,sz()-1),y:C(Math.floor((e.clientY-r.top)/r.height*sz()),0,sz()-1)}};
  function paint(a,b,v){let x0=a.x,y0=a.y,x1=b.x,y1=b.y,dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,er=dx+dy;for(;;){layer().mask[y0][x0]=v;if(x0===x1&&y0===y1)break;const e2=2*er;if(e2>=dy){er+=dy;x0+=sx}if(e2<=dx){er+=dx;y0+=sy}}}
  c.oncontextmenu=e=>e.preventDefault();
  c.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0&&e.button!==2)return;if($('selectTool').classList.contains('on'))return;e.preventDefault();const p=point(e);drag2=true;last2=p;erase2=e.button===2||tool==='eraser';changed2=true;L=p.y;paint(p,p,erase2?0:1);c.setPointerCapture?.(e.pointerId);drawEditor();drawScene()});
  c.addEventListener('pointermove',e=>{if(!drag2)return;e.preventDefault();const p=point(e);paint(last2,p,erase2?0:1);last2=p;L=p.y;drawEditor();drawScene()});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>c.addEventListener(ev,()=>{if(!drag2)return;drag2=false;last2=null;if(changed2){dirty();render()}changed2=false}));
})();
