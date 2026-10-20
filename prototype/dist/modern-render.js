import {colourScene,fillMaterial} from './colour.js';
import {t,presentation} from './i18n.js';
import {passageHit,drawPassageBackdrop,drawFloorJoints,drawReturnFaces,drawStoneEdges,contourPixels} from './passage-render.js';
import {reliefSurface,weatheredRelief} from './relief-material.js';
import {modernGraphic} from './modern-assets.js';
import {bankWall} from './engine.js';
import {ITEMS} from './engine.js';
import {stoneSurfaces,drawStonework,drawContactShadow,drawPlaneTexture} from './stone-render.js';
import {graphic,SPRITES,viewChain,wallContours} from './render.js';

const sceneBuffers=new WeakMap(),materialBuffers=new WeakMap();
// One logical screen pixel is shared by contours, sprites and material grain.
export function monochromePixels(data){
 for(let p=0;p<data.length;p+=4){const value=data[p]*.2126+data[p+1]*.7152+data[p+2]*.0722<170?0:255;data[p]=data[p+1]=data[p+2]=value;data[p+3]=255;}
 return data;
}
// Square corridor cross-sections, viewed through a fixed vertical field of view.
// Width only changes the horizontal field of view, never the size of the tunnel.
export function corridorCamera(width,height){
 const cx=width/2,cy=height*.44,focal=height*.82;
 const size=d=>focal/Math.max(.12,d);
 const frame=d=>{const s=size(d);return [cx-s/2,cy-s/2,cx+s/2,cy+s/2];};
 return {width,height,cx,cy,focal,frame,returns:Array.from({length:21},(_,d)=>size(d+1)*.085)};
}
export function floorObjectRect(camera,w,h,depth){
 const scale=Math.min(2,camera.focal/(240*(depth+.5)));
 const width=w*scale,height=h*scale;
 const foot=camera.cy+camera.focal/(2*(depth+.5));
 return [camera.cx-width/2,foot-height*.75,width,height];
}
// The threshold shares the wall/floor plane, including in oblique views.
export function doorColumn(camera,depth,side,u,aspect=.55){
 const doorHeight=.88,doorWidth=doorHeight*aspect;
 const z=side===0?depth+1:depth+.86+(u-.5)*Math.min(.24,doorWidth);
 const x=side===0?(u-.5)*doorWidth:(side===3?-.5:.5);
 return {x:camera.cx+camera.focal*x/z,top:camera.cy+camera.focal*(.5-doorHeight)/z,bottom:camera.cy+camera.focal*.5/z};
}
function drawDoor(c,camera,im,depth,side,aspect=im.width/im.height){
 const a=doorColumn(camera,depth,side,0,aspect),b=doorColumn(camera,depth,side,1,aspect);
 if(side===0){c.drawImage(im,Math.round(a.x),Math.round(a.top),Math.round(b.x-a.x),Math.round(a.bottom-a.top));}
 else{
 // Sample each output column once: overlapping antialiased clip strips would
 // turn black artwork gray and introduce seams when it is reduced.
 const span=Math.min(.24,.88*aspect);
 for(let x=Math.max(0,Math.floor(Math.min(a.x,b.x)));x<Math.min(camera.width,Math.ceil(Math.max(a.x,b.x)));x++){
  const z=camera.focal*.5/Math.abs(x+.5-camera.cx),u=(z-depth-.86)/span+.5;
  const sx=Math.min(im.width-1,Math.max(0,Math.floor(u*im.width)));
  const top=Math.round(camera.cy-camera.focal*.38/z),bottom=Math.round(camera.cy+camera.focal*.5/z);
  c.drawImage(im,sx,0,1,im.height,x,top,1,bottom-top);
 }
 }
 // Projected silhouette is drawn after resampling: compressed side artwork
 // must not lose its frame when thresholded to one-bit ink.
 c.fillStyle='#000';
 for(const edge of doorOutline(camera,depth,side,aspect))for(const [x,y] of contourPixels(edge))c.fillRect(x,y,2,2);
}
export function doorOutline(camera,depth,side,aspect=.55){
 const a=doorColumn(camera,depth,side,0,aspect),b=doorColumn(camera,depth,side,1,aspect);
 return [[a.x,a.top,a.x,a.bottom],[b.x,b.top,b.x,b.bottom],[a.x,a.top,b.x,b.top],[a.x,a.bottom,b.x,b.bottom]];
}
// Relief ink shares the wall's perspective and lets its grain show through.
function drawRelief(c,camera,key,depth,side,original,g,dir){
 const height=Math.min(.9,original.height/240),width=original.width/240;
 const im=weatheredRelief(modernGraphic(key)||original,key,reliefSurface(g,dir,depth,side,width),width,height);
 c.save();c.globalCompositeOperation='multiply';c.imageSmoothingEnabled=true;
 if(side===0){const scale=camera.focal/(depth+1);c.drawImage(im,camera.cx-width*scale/2,camera.cy-height*scale/2,width*scale,height*scale);}
 else{
  const sign=side===3?-1:1,z0=depth+.55-width/2,z1=depth+.55+width/2;
  const a=camera.cx+sign*camera.focal*.5/Math.max(.12,z0),b=camera.cx+sign*camera.focal*.5/Math.max(.12,z1);
  for(let x=Math.max(0,Math.floor(Math.min(a,b)));x<Math.min(camera.width,Math.ceil(Math.max(a,b)));x++){
   const z=camera.focal*.5/Math.abs(x+.5-camera.cx),u=(z-z0)/(z1-z0),sx=Math.max(0,Math.min(im.width-1,Math.floor((side===3?u:1-u)*im.width)));
   const top=camera.cy-camera.focal*height/(2*z),h=camera.focal*height/z;c.drawImage(im,sx,0,1,im.height,x,top,1,h);
  }
 }c.restore();
}
function stamp(c,key,rect){const im=modernGraphic(key)||graphic(key);if(im){c.save();c.imageSmoothingEnabled=!!modernGraphic(key);if(/^PICT_100[0-8]$/.test(key))c.globalCompositeOperation='multiply';c.drawImage(im,...rect.map(Math.round));c.restore();}}
export function drawModernView(canvas,g,peek=0){
 const bounds=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(bounds.width)),h=Math.max(1,Math.round(bounds.height));
 const ratio=Math.min(3,globalThis.devicePixelRatio||1),bw=Math.round(w*ratio),bh=Math.round(h*ratio);
 if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}
 let buffer=sceneBuffers.get(canvas);if(!buffer){buffer=document.createElement('canvas');sceneBuffers.set(canvas,buffer);}if(buffer.width!==w||buffer.height!==h){buffer.width=w;buffer.height=h;}
 const c=buffer.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;
 c.fillStyle='#fff';c.fillRect(0,0,w,h);
 const camera=corridorCamera(w,h),dir=(g.dir+peek+4)%4,chain=viewChain(g,dir);
 let material;
 if(presentation().colour){
  let mask=materialBuffers.get(canvas);if(!mask){mask=document.createElement('canvas');materialBuffers.set(canvas,mask);}if(mask.width!==w||mask.height!==h){mask.width=w;mask.height=h;}
  material=mask.getContext('2d',{willReadFrequently:true});material.fillStyle='rgb(80,0,0)';material.fillRect(0,0,w,h);
  // Include side-passage walls from the same visibility raycast as the ink.
  material.fillStyle='rgb(160,0,0)';for(let x=0;x<w;x++){const hit=passageHit(g,dir,(x+.5-camera.cx)/camera.focal);if(hit){const size=camera.focal/hit.depth;material.fillRect(x,camera.cy-size/2,1,size);}}
 }
 drawPlaneTexture(c,camera,dir,g);
 drawFloorJoints(c,camera,g,dir);
 drawPassageBackdrop(c,camera,g,dir);
 for(let j=chain.length-1;j>=0;j--){
  const {cell,p,d}=chain[j],front=camera.frame(d+1),near=camera.frame(d),size=front[2]-front[0];
  drawStonework(c,[chain[j]],dir,camera,g);
  if(material)for(const wall of stoneSurfaces([chain[j]],dir,camera,g)){const {project,min,max}=wall;fillMaterial(material,[project(min,0),project(max,0),project(max,1),project(min,1)],160);}
 drawReturnFaces(c,camera,chain,dir,d);
 drawStoneEdges(c,wallContours(chain,dir,camera,d));

  const decorations=[...(cell.decorations||[])];if(p===0)decorations.push({dir:0,picture:2000});if(p===g.exit)decorations.push({dir:2,picture:2001});
  for(const dec of decorations){
   const rel=(dec.dir-dir+4)%4;if(rel===2)continue;
   if(dec.picture===2000||dec.picture===2001){const im=graphic('PICT_'+dec.picture);if(im){c.save();c.imageSmoothingEnabled=true;drawDoor(c,camera,modernGraphic('PICT_'+dec.picture)||im,d,rel,im.width/im.height);if(material){const a=doorColumn(camera,d,rel,0,im.width/im.height),b=doorColumn(camera,d,rel,1,im.width/im.height);fillMaterial(material,[[a.x,a.top],[b.x,b.top],[b.x,b.bottom],[a.x,a.bottom]],240);}c.restore();}continue;}
   if(dec.picture>=1000&&dec.picture<=1008){const key='PICT_'+dec.picture,im=graphic(key);if(im)drawRelief(c,camera,key,d,rel,im,g,dir);continue;}
   let id=dec.picture;if(id>=2000){if(rel===3)id+=300;if(rel===1)id+=600;}
   const im=graphic('PICT_'+id);if(!im)continue;
   const ph=Math.min(size*.9,im.height*size/240),pw=rel===0?im.width*size/240:Math.min(Math.abs(front[0]-near[0])*.65,ph*.35);
   const x=rel===0?camera.cx-pw/2:rel===3?front[0]-pw*1.25:front[2]+pw*.25;
   stamp(c,'PICT_'+id,[x,camera.cy-ph/2,pw,ph]);
  }
  const inscription=cell.writing?.[dir]||(bankWall(g,p)===dir?t('Bank of RA - Gold Deposit'):null);
  if(inscription&&cell.walls[dir]&&d<4){c.fillStyle='#000';c.font=`${Math.max(6,Math.min(22,size*.07))}px Chicago,monospace`;c.textAlign='center';c.fillText(inscription,camera.cx,camera.cy,size*.8);}
  if(d>0&&d<=10){
   const animals=(g.animals||[]).filter(a=>a.p===p);
   const obj=animals.find(a=>a.state==='awake')||animals[0]||cell.items.reduce((a,i)=>!a||ITEMS[i.type].weight*i.qty>ITEMS[a.type].weight*a.qty?i:a,null);
   let key;if(obj){let id=SPRITES[obj.type];if(obj.state==='asleep')id={lioness:20074,monkey:20077,cobra:20064}[obj.type]||id;if(obj.state==='netted')id={lioness:20049,monkey:20050,cobra:20051}[obj.type]||id;key='sprite_'+id;}
   else{const trap=(cell.traps||(cell.trap?[cell.trap]:[])).find(t=>t.visible);if(trap)key=trap.sprung?'PICT_20201':'PICT_20046';}
   const im=graphic(key);if(im){const rect=floorObjectRect(camera,im.width,im.height,d);if(key==='sprite_20075'){const extra=1.45;rect[0]-=rect[2]*(extra-1)/2;rect[1]-=rect[3]*(extra-1)*.5;rect[2]*=extra;rect[3]*=extra;}if(obj)drawContactShadow(c,rect,p);stamp(c,key,rect);}
  }
  // Stable screen-resolution stipple: no magnification of the old haze bitmap.
  // Draw between depth layers so nearer objects remain in front of distant haze.
  if(g.lit&&d>0&&(d+1)%3===0){
   const radius=camera.focal/(d+.5),step=2;c.fillStyle='#000';
   for(let y=Math.max(0,Math.floor(camera.cy-radius));y<Math.min(h,camera.cy+radius);y+=step){
    for(let x=Math.max(0,Math.floor(camera.cx-radius));x<Math.min(w,camera.cx+radius);x+=step){
     const r=((x-camera.cx)**2+(y-camera.cy)**2)/(radius*radius);
     const hash=((Math.imul(x+17,374761393)^Math.imul(y+31,668265263)^Math.imul(d,1274126177))>>>0);
     if(r<1&&hash%101<(1-r)*55)c.fillRect(x+(hash%2),y+((hash>>>8)%2),1,1);
    }
   }
  }
 }
 if(!g.lit){c.fillStyle='#000';for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(darkPixel(x,y,w,h))c.fillRect(x,y,1,1);}}
 const pixels=c.getImageData(0,0,w,h);monochromePixels(pixels.data);if(material)colourScene(pixels.data,material.getImageData(0,0,w,h).data);c.putImageData(pixels,0,0);
 const output=canvas.getContext('2d');output.setTransform(1,0,0,1,0,0);output.imageSmoothingEnabled=false;output.drawImage(buffer,0,0,bw,bh);

}

// The old fine stipple, made denser. A single smooth field avoids the
// concentric thresholds of ordered dithering and overlapping darkness layers.
export function darkCoverage(x,y,w,h){
 const r2=((x-w/2)/(w*.5))**2+((y-h*.44)/(h*.65))**2;
 return .25+.49*Math.exp(-2*r2);
}
export function darkPixel(x,y,w,h){
 let hash=Math.imul(x+17,374761393)^Math.imul(y+31,668265263);
 hash=Math.imul(hash^(hash>>>13),1274126177);
 const grain=((hash^(hash>>>16))>>>0)/4294967295;
 return grain<darkCoverage(x,y,w,h);
}
