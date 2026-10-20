// CODE 21:003e–0062: equal integer cells inside the 296×296 map item.
export const MAP_SIZE=296;
export function mapMetrics(n){const step=Math.trunc((MAP_SIZE-2)/n);return {step,extent:step*n+2};}
// QuickDraw's ltGray and gray patterns, anchored in map/dialog coordinates.
export function mapShade(state,x,y){return state===2?255:state===1?((x%4===(y%2)*2)?0:255):((x+y)%2?255:0);}
export function mapPixels(g,selected=-1){
 const pixels=new Uint8Array(MAP_SIZE*MAP_SIZE).fill(255),{step}=mapMetrics(g.n);
 const put=(x,y,v)=>{if(x>=0&&y>=0&&x<MAP_SIZE&&y<MAP_SIZE)pixels[y*MAP_SIZE+x]=v;};
 const rect=(x,y,w,h,v)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(xx,yy,typeof v==='function'?v(xx,yy):v);};
 const line=(x,y,xx,yy)=>{const dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1;let e=dx+dy;for(;;){rect(x,y,2,2,0);if(x===xx&&y===yy)break;const k=2*e;if(k>=dy){e+=dy;x+=sx;}if(k<=dx){e+=dx;y+=sy;}}};
 // Paint all fills first, then all walls. Shared edges occupy the same pixels,
 // rather than two adjacent CSS borders; endpoints cannot leave cell seams.
 for(let p=0;p<g.cells.length;p++){const x=p%g.n*step,y=Math.floor(p/g.n)*step;rect(x,y,step+2,step,(xx,yy)=>mapShade(g.known[p],xx,yy));}
 for(let p=0;p<g.cells.length;p++){
  const x=p%g.n*step,y=Math.floor(p/g.n)*step;
  if(g.known[p]){
   const [top,right,bottom,left]=g.cells[p].walls;
   if(top)line(x,y,x+step,y);if(right)line(x+step,y,x+step,y+step);
   if(bottom)line(x,y+step,x+step,y+step);if(left)line(x,y,x,y+step);
  }
  if(g.notes[p]){line(x+Math.trunc(step/2),y+1,x+Math.trunc(step/2),y+step-1);line(x,y+Math.trunc(step*3/4),x+step,y+Math.trunc(step/4));line(x,y+Math.trunc(step/4),x+step,y+Math.trunc(step*3/4));}
 }
 const oval=(p,inset,stroke,invert=false)=>{
  const x=p%g.n*step+2+inset,y=Math.floor(p/g.n)*step+2+inset,w=step-2-inset*2,cx=x+w/2,cy=y+w/2,r=w/2;
  for(let yy=y;yy<y+w;yy++)for(let xx=x;xx<x+w;xx++){
   const d=(xx+.5-cx)**2+(yy+.5-cy)**2;
   if(d<=r*r&&(!stroke||d>=(r-stroke)**2))put(xx,yy,invert?255-pixels[yy*MAP_SIZE+xx]:0);
  }
 };
 if(g.oriented)oval(g.y*g.n+g.x,0,2);
 if(selected>=0)oval(selected,Math.trunc(step/4),0,true);
 return pixels;
}
export function drawMap(canvas,g,selected){
 canvas.width=canvas.height=MAP_SIZE;const c=canvas.getContext('2d'),p=mapPixels(g,selected),im=c.createImageData(MAP_SIZE,MAP_SIZE);
 for(let i=0;i<p.length;i++){im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=p[i];im.data[i*4+3]=255;}
 c.putImageData(im,0,0);
}
export function drawMapLegend(canvas){
 canvas.width=20;canvas.height=58;const c=canvas.getContext('2d'),im=c.createImageData(20,58);
 for(let y=0;y<58;y++)for(let x=0;x<20;x++){
  const v=x===0||x===19||y===0||y===19||y===38||y===57?0:mapShade(y<19?2:y<38?1:0,x,y),i=(y*20+x)*4;
  im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
 }c.putImageData(im,0,0);
}
