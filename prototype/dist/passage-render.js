// Cast architectural sight lines through the actual maze. These quiet surfaces
// sit behind the main corridor; no objects or unseen map data are revealed.
const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
const grain=(x,y)=>{let h=Math.imul(x+73,374761393)^Math.imul(y+91,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
export function passageHit(g,dir,slope){
 const [dx,dy]=dirs[dir],ox=g.x+.5-dx*.5,oy=g.y+.5-dy*.5,rx=dx-dy*slope,ry=dy+dx*slope;
 let x=g.x,y=g.y;
 for(let k=0;k<40;k++){
  if(x<0||y<0||x>=g.n||y>=g.n)return null;
  const tx=rx===0?Infinity:((rx>0?x+1:x)-ox)/rx,ty=ry===0?Infinity:((ry>0?y+1:y)-oy)/ry;
  const vertical=tx<ty,t=vertical?tx:ty,face=vertical?(rx>0?1:3):(ry>0?2:0);
  if(t>12||t<0)return null;
  const cell=g.cells[y*g.n+x];
  if(cell.walls[face])return {depth:Math.max(.12,t),u:vertical?oy+ry*t:ox+rx*t,p:y*g.n+x,face};
  x+=dirs[face][0];y+=dirs[face][1];
 }
 return null;
}
export function drawPassageBackdrop(c,camera,g,dir){
 c.save();const boundaries=[];
 for(let x=0;x<camera.width;x++){
  const hit=passageHit(g,dir,(x+.5-camera.cx)/camera.focal);if(!hit)continue;
  const scale=camera.focal/hit.depth,top=camera.cy-scale/2,bottom=camera.cy+scale/2;
  boundaries[x]={top,bottom,face:hit.face};
  c.fillStyle='#fff';c.fillRect(x,Math.max(0,Math.floor(top)),1,Math.min(camera.height,bottom)-Math.max(0,Math.floor(top)));
  c.fillStyle='#000';
  for(let y=Math.max(0,Math.ceil(top));y<Math.min(camera.height,bottom);y++){
   const v=(y-top)/scale,row=Math.floor(v*5),joint=Math.abs(v*5-Math.round(v*5))*scale/5;
   const u=hit.u/.48+(row%2)*.5,vertical=Math.abs(u-Math.round(u))*.48*scale;
   const weather=.35+.65*grain(Math.floor(hit.u*9),row+hit.face*19);
   const ink=grain(x,y),seam=Math.min(joint,vertical)<.65;
   const base=Math.max(0,(v-.94)/.06)*.04;
   if(ink<(seam?.42*weather:.004+base))c.fillRect(x,y,1,1);
  }
 }
 // Silhouettes remain continuous even though the material is deliberately faint.
 const outlines=[];
 for(let x=0;x<boundaries.length;x++){
  const current=boundaries[x];if(!current)continue;
  const previous=boundaries[x-1];
  if(previous&&previous.face===current.face&&Math.abs(previous.top-current.top)<3){
   outlines.push([x-1,previous.top,x,current.top],[x-1,previous.bottom,x,current.bottom]);
  }else{
   outlines.push([x,current.top,x,current.bottom]);
   if(previous)outlines.push([x-1,previous.top,x-1,previous.bottom]);
  }
 }
 drawStoneEdges(c,outlines);
 c.restore();
}
export function floorJoint(wx,wy,tolerance){
 const row=Math.floor(wy/.65),offset=(row%2)*.36;
 const horizontal=Math.abs(wy/.65-Math.round(wy/.65))*.65;
 const vertical=Math.abs((wx+offset)/.72-Math.round((wx+offset)/.72))*.72;
 const worn=grain(Math.floor(wx*8),Math.floor(wy*8));
 return Math.min(horizontal,vertical)<tolerance&&worn>.58;
}
export function drawFloorJoints(c,camera,g,dir){
 const [dx,dy]=dirs[dir];c.save();c.fillStyle='#000';
 for(let y=Math.ceil(camera.cy+camera.focal/10);y<camera.height;y+=2){
  const z=camera.focal*.5/(y-camera.cy);
  for(let x=0;x<camera.width;x+=2){const side=(x-camera.cx)*z/camera.focal,wx=g.x+.5+dx*(z-.5)-dy*side,wy=g.y+.5+dy*(z-.5)+dx*side;
   if(floorJoint(wx,wy,z/camera.focal*.72)&&grain(x,y)>.22)c.fillRect(x,y,1,1);
  }
 }c.restore();
}

const courses=[0,.19,.405,.605,.815,1];
export function contourPixels(line){
 let [x,y,xx,yy]=line.map(Math.round);const pixels=[],dx=Math.abs(xx-x),dy=-Math.abs(yy-y),sx=x<xx?1:-1,sy=y<yy?1:-1;let error=dx+dy;
 while(true){pixels.push([x,y]);if(x===xx&&y===yy)break;const e=2*error;if(e>=dy){error+=dy;x+=sx;}if(e<=dx){error+=dx;y+=sy;}}
 return pixels;
}
export function drawStoneEdges(c,lines){
 c.save();c.fillStyle='#000';
 // Integer pixels avoid losing subpixel strokes at the final 1-bit threshold.
 for(const line of lines)for(const [x,y] of contourPixels(line))c.fillRect(x,y,1,1);
 c.restore();
}
// Small inner return faces at an opening: same geometry as wallContours,
// with five stone courses instead of an untextured white strip.
export function drawReturnFaces(c,camera,chain,dir,d){
 const entry=chain.find(a=>a.d===d);if(!entry||entry.cell.walls[dir])return;
 const {cell,sideForward={}}=entry,[nl,nt,,nb]=camera.frame(d+1);
 for(const side of [-1,1]){
  const sd=(dir+side+4)%4;if(cell.walls[sd]||sideForward[sd]||!chain[d+1]||chain[d+1].cell.walls[sd])continue;
  const k=camera.returns[d+1]||0,mirror=x=>side<0?x:camera.width-x;
  const point=(u,v)=>[mirror(nl+k*u),nt+k*u+(nb-nt-2*k*u)*v];
  c.save();c.beginPath();for(const [i,p] of [[0,0],[1,0],[1,1],[0,1]].entries()){const [x,y]=point(...p);i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.clip();c.fillStyle='#fff';c.fill();
  c.strokeStyle='#000';c.lineWidth=.65;
  for(const v of courses.slice(1,-1)){const a=point(0,v),b=point(1,v);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
  c.fillStyle='#000';const left=Math.floor(Math.min(mirror(nl),mirror(nl+k))),right=Math.ceil(Math.max(mirror(nl),mirror(nl+k)));
  for(let x=left;x<right;x+=2)for(let y=Math.floor(nt);y<nb;y+=2)if(grain(x,y)<.035)c.fillRect(x,y,1,1);
  c.restore();
 }
}
