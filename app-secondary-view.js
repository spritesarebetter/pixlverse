'use strict';
(() => {
  const secondary=$('editorLayer'),primary=$('editor');
  function syncSizes(){
    const r=primary.getBoundingClientRect();if(!r.width||!r.height)return;
    secondary.style.width=r.width+'px';secondary.style.height=r.height+'px';secondary.style.minWidth=r.width+'px';secondary.style.minHeight=r.height+'px';
    const cell=r.height/sz(),rail=$('spriteColorRail');
    $('editorStage').style.setProperty('--editor-cell',cell+'px');
    rail.style.height=r.height+'px';$('lines').style.height=r.height+'px';
    const rw=Math.max(54,cell*2.05);rail.style.width=rw+'px';$('editorStage').style.setProperty('--rail-width',rw+'px');
  }
  function drawSecondary(){
    const n=sz(),scale=editorRenderScale(),c=secondary,g=c.getContext('2d'),s=layer();c.width=n*scale;c.height=n*scale;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      g.fillStyle=(x+y)%2?'#171b22':'#20252d';g.fillRect(x*scale,y*scale,scale,scale);
      if(s.mask[y][x]&&s.lines[y].color){g.fillStyle=PAL[s.lines[y].color];g.fillRect(x*scale+1,y*scale+1,scale-2,scale-2)}
    }
    g.strokeStyle='rgba(255,255,255,.09)';g.lineWidth=1;
    for(let x=0;x<=n;x++){g.beginPath();g.moveTo(x*scale+.5,0);g.lineTo(x*scale+.5,c.height);g.stroke()}
    for(let y=0;y<=n;y++){g.beginPath();g.moveTo(0,y*scale+.5);g.lineTo(c.width,y*scale+.5);g.stroke()}
    g.strokeStyle='rgba(101,215,192,.65)';g.strokeRect(2,L*scale+2,n*scale-4,scale-4);syncSizes();
  }
  const oldDraw=drawEditor;drawEditor=function(){oldDraw();drawSecondary();syncSizes()};
  const oldRender=render;render=function(){oldRender();syncSizes()};
  new ResizeObserver(syncSizes).observe(primary);drawSecondary();
})();
