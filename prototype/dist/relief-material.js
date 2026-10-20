import {stoneBlocks,masonryWear} from './stone-render.js';
const directions=[[0,-1],[1,0],[0,1],[-1,0]],cache=new Map();
export function reliefSurface(g,dir,depth,side,width){
 const [dx,dy]=directions[dir],origin=g.x*dx+g.y*dy,across=g.x*(-dy)+g.y*dx;
 const centre=side===0?across:origin+depth+.55;
 const seed=Math.round((side===0?origin+depth+1:across+(side===3?-.5:.5))*8);
 return {centre,seed,min:centre-width/2,max:centre+width/2,reverse:side===1};
}
export function reliefStrength(u,v,seed,blocks){
 let seam=1;
 for(const b of blocks){
  if(u<b.u-.015||u>b.end+.015||v<b.top-.015||v>b.bottom+.015)continue;
  seam=Math.min(seam,Math.abs(u-b.u),Math.abs(u-b.end),Math.abs(v-b.top),Math.abs(v-b.bottom));
 }
 const t=Math.min(1,seam/.012),edge=t*t*(3-2*t);
 const weather=.53+.46*masonryWear(u*1.7,v*1.3,seed+13);
 return weather*(.025+.975*edge);
}
// A material pass, not a replacement motif: remove ink according to the
// same mortar geometry and world-anchored wear that forms the stone beneath.
export function weatheredRelief(image,key,surface,width,height){
 const id=[key,surface.centre,surface.seed,surface.reverse,width,height].join(':');if(cache.has(id))return cache.get(id);
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
 const pixels=c.getImageData(0,0,canvas.width,canvas.height),blocks=stoneBlocks(surface.min,surface.max,surface.seed);
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const p=(y*canvas.width+x)*4;if(pixels.data[p]>240)continue;
  const fraction=(x+.5)/canvas.width,u=surface.centre+((surface.reverse?1-fraction:fraction)-.5)*width,v=.5+((y+.5)/canvas.height-.5)*height;
  const strength=reliefStrength(u,v,surface.seed,blocks);
  let hash=Math.imul(x+surface.seed*37,374761393)^Math.imul(y+91,668265263);hash=Math.imul(hash^(hash>>>13),1274126177);
  if(((hash^(hash>>>16))>>>0)/4294967295>strength){pixels.data[p]=pixels.data[p+1]=pixels.data[p+2]=255;}
 }
 c.putImageData(pixels,0,0);if(cache.size>=96)cache.delete(cache.keys().next().value);cache.set(id,canvas);return canvas;
}
