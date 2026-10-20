import {t} from './i18n.js';
import {bankWall} from './engine.js';
import {DIRS,ITEMS} from './engine.js';
// Original A5-$dd8 width table; QuickDraw clips a 302² projection at y=84.
export const WIDTHS=[302,240,120,60,30,16,8,4,2,1,1,1,1,1,1,1,1,1,1,1,1];
export const SPRITES={key:20075,lantern:20076,food:20070,oil:20079,compass:20043,gold:20071,plank:20080,aid:20065,crown:20111,staff:20047,scarab:20044,glasses:20078,pole:20095,charcoal:20067,cure:20087,net:20035,whip:20164,melon:20182,darts:20066,gun:20082,lioness:20106,monkey:20109,cobra:20038,mummy:20088};
const images={};
export const graphic=key=>images[key];
export async function loadGraphics(){const ids=[...Object.values(SPRITES),20074,20077,20064,20049,20050,20051];const keys=[...ids.map(n=>'sprite_'+n),...[2000,2001,2300,2301,2600,2601,134,135,136,20046,20201,1000,1001,1002,1003,1004,1005,1006,1007,1008].map(n=>'PICT_'+n)];await Promise.all([...new Set(keys)].map(key=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>reject(Error('Missing original graphic: '+key));im.src='assets/'+key+'.png';})));}
const frame=d=>{const w=WIDTHS[Math.min(d,20)],l=Math.trunc((302-w)/2);return [l,l-84,l+w,l+w-84];};
// Integer Bresenham lines, rather than anti-aliased Canvas strokes.
export function pixelLine(c,x,y,xx,yy){x=Math.round(x);y=Math.round(y);xx=Math.round(xx);yy=Math.round(yy);const dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1;let err=dx+dy;c.fillStyle='#000';for(;;){c.fillRect(x,y,1,1);if(x===xx&&y===yy)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}}
function fill(c,p){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle='#fff';c.fill();}
function asset(c,key,x,y,w,h){const im=images[key];if(im&&(w===undefined||w>0)&&(h===undefined||h>0))c.drawImage(im,Math.trunc(x),Math.trunc(y),Math.max(1,Math.trunc(w??im.width)),Math.max(1,Math.trunc(h??im.height)));}
export function spriteRect(w,h,d){const depth=d+1,div=2**Math.max(0,depth-2);w=Math.trunc(w/div);h=Math.trunc(h/div);const width=WIDTHS[Math.min(depth,20)],prev=WIDTHS[Math.min(depth-1,20)];const top=302-(Math.trunc((302-width)/2)+Math.trunc((width-prev)/4))-Math.trunc(3*h/4)-84;return [Math.trunc((302-w)/2),top,w,h];}
// CODE 2:3cbc–3f82: side-specific door artwork is doubled before reduction.
export function wallPictureRect(w,h,d,side,specific=false){
 const div=2**d,front=side===0;
 h=Math.trunc(h*(front?1:specific?2:1)/div);
 w=Math.trunc((front?w:specific?w*2:Math.trunc(w/4))/div);
 let x=Math.trunc((302-w)/2);const y=151-Math.trunc(h/2)-84;
 const prev=WIDTHS[d],next=WIDTHS[d+1],offset=Math.trunc((prev-next)/8);
 if(side===3)x=Math.trunc((302-prev)/2)+offset-(d===0?(specific?60:15):0);
 if(side===1)x=Math.trunc((302-next)/2)+next+offset+(d===0&&!specific?15:0);
 return [x,y,w,h];
}
// Original A5-$dba: the short return walls visible inside side passages.
const RETURNS=[25,13,7,4,2,1,0,0,0,0,0,0,0,0,0];
export function viewChain(g,dir){
 const a=[];let p=g.y*g.n+g.x;
 for(let d=0;d<20;d++){
  const cell=g.cells[p],sideForward={};
  for(const side of [-1,1]){
   const sd=(dir+side+4)%4,[dx,dy]=DIRS[sd],x=p%g.n+dx,y=Math.floor(p/g.n)+dy;
   // A side passage's far wall is coplanar with the front wall only
   // when that neighbouring cell is closed in the viewing direction.
   sideForward[sd]=!cell.walls[sd]&&x>=0&&x<g.n&&y>=0&&y<g.n&&!g.cells[y*g.n+x].walls[dir];
  }
  a.push({cell,p,d,sideForward});if(cell.walls[dir])break;p+=DIRS[dir][0]+DIRS[dir][1]*g.n;
 }
 return a;
}
// CODE 2:307c–3a7a. Each side depends on the current cell, the cell
// ahead, the cell behind, AND the side neighbour. Mirroring the same
// contour rules avoids asymmetric missing edges at junctions.
export function wallContours(chain,dir,projection={frame,width:302,returns:RETURNS},onlyDepth){
 const frame=projection.frame,returns=projection.returns,width=projection.width;
 const lines=[],add=(...p)=>lines.push(p);
 for(const {cell,d,sideForward={}} of chain){
  if(onlyDepth!==undefined&&d!==onlyDepth)continue;
  const [l,t,,b]=frame(d),[nl,nt,nr,nb]=frame(d+1),frontOpen=!cell.walls[dir];
  if(!frontOpen){add(nl,nt,nr,nt);add(nl,nb,nr,nb);}
  for(const side of [-1,1]){
   const sd=(dir+side+4)%4,sideOpen=!cell.walls[sd];
   const aheadOpen=frontOpen&&chain[d+1]&&!chain[d+1].cell.walls[sd];
   const behindOpen=d>0&&!chain[d-1].cell.walls[sd];
   const offset=behindOpen?(returns[d]||0):0,returnWidth=returns[d]||0;
   const edge=(x,y,xx,yy)=>add(side<0?x:width-x,y,side<0?xx:width-xx,yy);
   if(!sideOpen){
    edge(l,t,nl,nt);edge(l,b,nl,nb);
    if(!frontOpen||aheadOpen)edge(nl,nt,nl,nb);
   }else if(sideForward[sd]){
    // A passage continues forward beside us: show its return wall,
    // including the outside vertical edge missing in the old renderer.
    edge(nl,nt,nl,nb);
    if(frontOpen){edge(nl,nb,nl-returnWidth,nb);edge(nl-returnWidth,nb,nl-returnWidth,nt);edge(nl-returnWidth,nt,nl,nt);}
   }else{
    edge(l+offset,nt,nl,nt);edge(l+offset,nb,nl,nb);
    // No seam between the front wall and the coplanar wall beside it.
    if(frontOpen){
     edge(nl,nt,nl,nb);
     if(aheadOpen){const k=returns[d+1]||0;edge(nl,nb,nl+k,nb-k);edge(nl+k,nb-k,nl+k,nt+k);edge(nl+k,nt+k,nl,nt);}
    }
   }
  }
 }
 return lines;
}
export function drawView(canvas,g,peek=0){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#fff';c.fillRect(0,0,304,218);const dir=(g.dir+peek+4)%4,chain=viewChain(g,dir);
 for(let j=chain.length-1;j>=0;j--){const {cell,d}=chain[j],[l,t,r,b]=frame(d),[nl,nt,nr,nb]=frame(d+1);if(cell.walls[dir]){c.fillStyle='#fff';c.fillRect(nl,nt,nr-nl,nb-nt);}for(const side of [-1,1]){const x=side<0?l:r,nx=side<0?nl:nr;if(cell.walls[(dir+side+4)%4])fill(c,[[x,t],[nx,nt],[nx,nb],[x,b]]);else fill(c,[[x,nt],[nx,nt],[nx,nb],[x,nb]]);}}
 for(const line of wallContours(chain,dir))pixelLine(c,...line);
 for(let j=chain.length-1;j>=0;j--){const {cell,p,d}=chain[j];
  // Wall pictures and front/oblique entrance/exit doors use the supplied PICTs.
  const decorations=[...(cell.decorations||[])];if(p===0)decorations.push({dir:0,picture:2000});if(p===g.exit)decorations.push({dir:2,picture:2001});
  for(const dec of decorations){const rel=(dec.dir-dir+4)%4;if(rel===2)continue;let id=dec.picture;if(id>=2000){if(rel===3)id+=300;if(rel===1)id+=600;}const im=images['PICT_'+id];if(!im)continue;const [x,y,w,h]=wallPictureRect(im.width,im.height,d,rel,id>=2300);asset(c,'PICT_'+id,x,y,w,h);}
  // Wall messages use the original facing wall; font outlines remain an approximation.
  const inscription=cell.writing?.[dir]||(bankWall(g,p)===dir?t('Bank of RA - Gold Deposit'):null);
  if(inscription&&cell.walls[dir]&&d<4){const size=Math.max(2,Math.trunc(12/2**d));c.fillStyle='#000';c.font=`${size}px Chicago,monospace`;c.textAlign='center';c.fillText(inscription,151,67,Math.max(1,WIDTHS[d+1]-8));}
  if(d>0&&d<=10){const animals=(g.animals||[]).filter(a=>a.p===p);let obj=animals.find(a=>a.state==='awake')||animals[0]||cell.items.reduce((a,i)=>!a||ITEMS[i.type].weight*i.qty>ITEMS[a.type].weight*a.qty?i:a,null);let key;
   if(obj){let id=SPRITES[obj.type];if(obj.state==='asleep')id={lioness:20074,monkey:20077,cobra:20064}[obj.type]||id;if(obj.state==='netted')id={lioness:20049,monkey:20050,cobra:20051}[obj.type]||id;key='sprite_'+id;}
   else{const trap=(cell.traps||(cell.trap?[cell.trap]:[])).find(t=>t.visible);if(trap)key=trap.sprung?'PICT_20201':'PICT_20046';}
   if(key&&images[key]){const im=images[key];asset(c,key,...spriteRect(im.width,im.height,d));}
  }
  // Layer haze far-to-near so closer objects remain in front of distant darkness.
  const depth=d+1,lit=g.lit,stage=lit?(depth%3===0?depth/3:0):depth-2;
  if(stage>=1&&stage<=3){const im=images['PICT_'+(133+stage)];c.save();c.globalCompositeOperation='multiply';asset(c,'PICT_'+(133+stage),Math.trunc((302-im.width)/2),Math.trunc((302-im.height)/2)-84);c.restore();}
 }
 if(!g.lit){c.fillStyle='#000';for(let y=0;y<218;y++)for(let x=0;x<304;x++)if((x+3*y)%8===0)c.fillRect(x,y,1,1);}
 // Keep the monochrome framebuffer strictly bilevel, including polygon joins.
 const pixels=c.getImageData(0,0,304,218);for(let i=0;i<pixels.data.length;i+=4){const v=pixels.data[i]<128?0:255;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;}c.putImageData(pixels,0,0);
}
