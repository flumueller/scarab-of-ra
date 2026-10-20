// Enhanced artwork is opt-in to the modern renderer; source dimensions and
// placement still come from the unchanged Macintosh assets.
const images={};
export const modernGraphic=key=>images[key];
export async function loadModernGraphics(){
 const files={PICT_2000:'door-pixel.png',PICT_2001:'door-pixel.png',sprite_20075:'key-pixel.png'};
 await Promise.all(Object.entries(files).map(([key,file])=>new Promise(resolve=>{
  const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>{console.warn('Modern artwork unavailable:',file);resolve();};im.src='assets/'+file;
 })));
 await loadReliefAtlas();
}


// Detect the ink bounds inside each atlas cell, retaining white separation.
// Canvas extraction keeps all nine reliefs at their native generated resolution.
async function loadReliefAtlas(){
 await new Promise(resolve=>{
  const atlas=new Image();atlas.onerror=()=>{console.warn('Relief atlas unavailable');resolve();};
  atlas.onload=()=>{
   const source=document.createElement('canvas');source.width=atlas.width;source.height=atlas.height;
   const c=source.getContext('2d',{willReadFrequently:true});c.drawImage(atlas,0,0);
   const pixels=c.getImageData(0,0,atlas.width,atlas.height).data;
   for(let i=0;i<9;i++){
    const left=Math.floor(i%3*atlas.width/3),right=Math.floor((i%3+1)*atlas.width/3),top=Math.floor(Math.floor(i/3)*atlas.height/3),bottom=Math.floor((Math.floor(i/3)+1)*atlas.height/3);
    let x0=right,y0=bottom,x1=left,y1=top;
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const p=(y*atlas.width+x)*4;if(pixels[p]<120&&pixels[p+1]<120&&pixels[p+2]<120){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
    if(x1<x0)continue;
    x0=Math.max(left,x0-2);y0=Math.max(top,y0-2);x1=Math.min(right-1,x1+2);y1=Math.min(bottom-1,y1+2);
    const tile=document.createElement('canvas');tile.width=x1-x0+1;tile.height=y1-y0+1;
    tile.getContext('2d').drawImage(atlas,x0,y0,tile.width,tile.height,0,0,tile.width,tile.height);images['PICT_'+(1000+i)]=tile;
   }resolve();
  };atlas.src='assets/reliefs-engraved-atlas.png';
 });
}
