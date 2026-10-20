import {vesselPalette} from './colour.js';
// Stable ink stipple follows the vessel sides and liquid surface, never flickers.
export function drawVessel(canvas,value,{kind='health',colour=false}={}){
 const level=Math.max(0,Math.min(100,value));const palette=vesselPalette(kind,colour),key=`${level}:${kind}:${colour}`;if(canvas.dataset.level===key)return;canvas.dataset.level=key;
 const size=360;canvas.width=canvas.height=size;const c=canvas.getContext('2d'),y=size*(1-level/100),radius=9;
 c.fillStyle=palette.empty;c.fillRect(0,0,size,size);
 if(level>0){
  c.save();c.beginPath();c.rect(0,y,size,size-y);if(level<100)c.ellipse(size/2,y,size/2,radius,0,0,Math.PI*2);c.clip();c.fillStyle=palette.liquid;c.fillRect(0,0,size,size);
  let seed=4291;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  c.fillStyle=palette.ink;
  for(let i=0;i<18000;i++){
   const x=rand()*size,py=rand()*size,edge=Math.hypot((x-180)/180,(py-180)/180);
   const surface=level<100?Math.exp(-Math.abs(py-y)/6):0;
   const density=.015+.46*Math.max(0,(edge-.60)/.40)**2+.28*surface;
   if(rand()<density){const r=.5+rand()*.65;c.beginPath();c.arc(x,py,r,0,Math.PI*2);c.fill();}
  }
  c.restore();
 }
 // Engraved glass reflection remains subtle over both empty and filled portions.
 c.strokeStyle=palette.shine;c.lineWidth=3;c.lineCap='round';c.beginPath();c.arc(180,180,162,Math.PI*1.19,Math.PI*1.30);c.stroke();
 c.lineWidth=1.3;c.beginPath();c.arc(180,180,165,Math.PI*.08,Math.PI*.20);c.stroke();
}
