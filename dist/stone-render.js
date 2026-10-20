// Surface decoration only: geometry and visibility still come from viewChain.
// Mortar is world-aligned, never an outline of the individual maze cells.
const DIRECTIONS=[[0,-1],[1,0],[0,1],[-1,0]];
const noise=(a,b)=>{let h=Math.imul(a+73,374761393)^Math.imul(b+91,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
export function stoneSurfaces(chain,dir,camera,g){
 const [dx,dy]=DIRECTIONS[dir],origin=g.x*dx+g.y*dy,across=g.x*(-dy)+g.y*dx;
 const surfaces=[];
 for(const {cell,d,sideForward={}} of chain){
  if(d>5)continue;
  const project=(x,y,z)=>[camera.cx+camera.focal*x/Math.max(.12,z),camera.cy+camera.focal*y/Math.max(.12,z)];
  if(cell.walls[dir]){
   const left=(dir+3)%4,right=(dir+1)%4,reach=(d+1)/(2*Math.max(.12,d));
   // A side passage's back wall can be coplanar with this end wall. Texture
   // them as one surface, just as wallContours omits their internal seam.
   const min=across-(!cell.walls[left]&&!sideForward[left]?reach:.5);
   const max=across+(!cell.walls[right]&&!sideForward[right]?reach:.5);
   surfaces.push({kind:'front',d,seed:Math.round((origin+d+1)*8),min,max,leftCorner:cell.walls[left],rightCorner:cell.walls[right],project:(u,v)=>project(u-across,v-.5,d+1)});
  }
  // Return faces and side-passage back walls share the end-wall plane.
  for(const side of [-1,1]){
   const sd=(dir+side+4)%4;
   if(cell.walls[sd])continue;
   const reach=(d+1)/(2*Math.max(.12,d));
   if(!cell.walls[dir]){
    const extent=sideForward[sd]?.085:Math.max(0,reach-.5);
    if(extent>0)surfaces.push({kind:'front',passage:true,side,d,seed:Math.round((origin+d+1)*8),min:across+(side<0?-.5-extent:.5),max:across+(side<0?-.5:.5+extent),project:(u,v)=>project(u-across,v-.5,d+1)});
   }
  }
  for(const side of [-1,1])if(cell.walls[(dir+side+4)%4])surfaces.push({kind:'side',side,d,seed:Math.round((across+side*.5)*8),min:origin+Math.max(.12,d),max:origin+d+1,project:(u,v)=>project(side*.5,v-.5,u-origin)});
 }
 return surfaces;
}
export function stoneBlocks(min,max,seed){
 const blocks=[],courses=[0,.19,.405,.605,.815,1];
 for(let row=0;row<5;row++){
  const offset=(row%2)*.22+(noise(row,seed)-.5)*.04;
  const joint=col=>col*.44+offset+(noise(col,seed+row*53)-.5)*.13;
  for(let col=Math.floor((min-offset)/.44)-1;col<=Math.ceil((max-offset)/.44);col++){
   const u=joint(col),end=joint(col+1);
   if(end>=min&&u<=max)blocks.push({u,end,top:courses[row],bottom:courses[row+1],row,col});
  }
 }
 return blocks;
}
function path(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));}
export function drawStonework(c,chain,dir,camera,g){
 for(const wall of stoneSurfaces(chain,dir,camera,g).sort((a,b)=>b.d-a.d)){
  const {project,min,max,seed,d}=wall;
  c.save();path(c,[project(min,0),project(max,0),project(max,1),project(min,1)]);c.closePath();c.clip();c.fillStyle='#fff';c.fill();
  drawWallTexture(c,wall,camera,dir,g);
  c.strokeStyle='#000';c.fillStyle='#000';c.lineWidth=.85;c.lineCap='butt';
  const segment=(a,b)=>{path(c,[project(...a),project(...b)]);c.stroke();};
  // Bonded masonry: neighbouring stones share course heights; alternating
  // courses stagger their joints. Individual widths vary without floating seams.
  for(const block of stoneBlocks(min,max,seed)){
   const {u,end,top,bottom,row,col}=block,r=noise(col+seed*17,row);
   const bevel=.005;
   const outline=[[u+bevel,top+.004],[end-bevel,top+.004],[end,top+.009],[end,bottom-.006],[end-bevel,bottom],[u+bevel,bottom],[u,bottom-.006],[u,top+.009],[u+bevel,top+.004]];
   // Wear changes continuously across the wall; ink tapers instead of
   // cutting out entire repeating sinusoidal patches.
   for(let k=0;k<outline.length-1;k++){
    const a=outline[k],b=outline[k+1],pa=project(...a),pb=project(...b);
    const steps=Math.max(1,Math.min(160,Math.ceil(Math.hypot(pb[0]-pa[0],pb[1]-pa[1])/3)));
    for(let q=0;q<steps;q++){
     const t=q/steps,tt=(q+1)/steps,mid=(t+tt)/2;
     const wear=masonryWear(a[0]+(b[0]-a[0])*mid,a[1]+(b[1]-a[1])*mid,seed);
     c.lineWidth=.22+.85*wear;
     segment([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],[a[0]+(b[0]-a[0])*tt,a[1]+(b[1]-a[1])*tt]);
    }
   }
   c.lineWidth=.7;
   if(d<4){
    const start=u+.05+noise(col,row+seed+11)*(end-u-.1),y=top+.05;
    if(r>.84){segment([start,y],[start+.008,y+.018]);segment([start+.008,y+.018],[start+.004,y+.029]);}
    for(let k=0;k<38;k++){
     const q=noise(col*97+k,seed+row*31),z=noise(col*13+k,seed+row*79);
     const point=project(u+.01+q*(end-u-.02),bottom-.004-z*.012);
     c.fillRect(Math.round(point[0]),Math.round(point[1]),1,1);
    }
   }
  }
  c.restore();
 }
}
export function drawContactShadow(c,rect,seed=0){
 const [x,y,w,h]=rect,cx=x+w*.5,cy=y+h*.88,rx=w*.46,ry=Math.max(2,h*.09);
 c.fillStyle='#000';
 for(let yy=Math.floor(cy-ry);yy<cy+ry;yy+=2)for(let xx=Math.floor(cx-rx);xx<cx+rx;xx+=2){
  const r=((xx-cx)/rx)**2+((yy-cy)/ry)**2;
  if(r<1&&noise(xx+seed,yy)<(1-r)*.48)c.fillRect(xx,yy,1,1);
 }
}

// Each output column samples a fixed world-space coordinate. Rotation and
// movement change projection, never the material itself. One shared texture
// repeats across cell boundaries, including coplanar passage back walls.
export function wallTextureU(wall,dir,g,camera,x){
 const [dx,dy]=DIRECTIONS[dir],origin=g.x*dx+g.y*dy,across=g.x*(-dy)+g.y*dx;
 const local=wall.kind==='front'?across+(x-camera.cx)*(wall.d+1)/camera.focal:origin+camera.focal*.5/Math.max(.00001,Math.abs(x-camera.cx));
 const sign=wall.kind==='front'?([1,1,-1,-1][dir]):([-1,1,1,-1][dir]);
 return local*sign;
}
function softNoise(u,v){
 const x=Math.floor(u),y=Math.floor(v),smooth=t=>t*t*(3-2*t),a=smooth(u-x),b=smooth(v-y);
 return (noise(x,y)*(1-a)+noise(x+1,y)*a)*(1-b)+(noise(x,y+1)*(1-a)+noise(x+1,y+1)*a)*b;
}
export function masonryWear(u,v,seed=0){
 const broad=softNoise(u*2.8+seed*.31,v*3.7+seed*.13);
 const detail=softNoise(u*11.1+seed,v*14.3-seed);
 return Math.max(.08,Math.min(1,(broad*.76+detail*.24-.2)*1.7));
}
export function masonryVisible(u,v,seed=0){return masonryWear(u,v,seed)>.45;}
export function materialDot(u,v,kind='wall'){
 const grain=noise(Math.floor(u*8192),Math.floor(v*8192));
 const density=kind==='floor'?.004:kind==='ceiling'?.002:.015+.025*masonryWear(u,v);
 return grain<density*(kind==='wall'?(.3+1.2*masonryWear(u,v)):1);
}
function drawWallTexture(c,wall,camera,dir,g){
 const a=wall.project(wall.min,0),b=wall.project(wall.max,0);
 const left=Math.max(0,Math.floor(Math.min(a[0],b[0]))),right=Math.min(camera.width,Math.ceil(Math.max(a[0],b[0])));
 c.fillStyle='#000';
 for(let x=left;x<right;x+=2){
  const u=wallTextureU(wall,dir,g,camera,x+.5),[dx,dy]=DIRECTIONS[dir];
  const local=wall.kind==='front'?g.x*(-dy)+g.y*dx+(x+.5-camera.cx)*(wall.d+1)/camera.focal:g.x*dx+g.y*dy+camera.focal*.5/Math.max(.00001,Math.abs(x+.5-camera.cx));
  const top=wall.project(local,0)[1],bottom=wall.project(local,1)[1];
  for(let y=Math.max(0,Math.ceil(top));y<Math.min(camera.height,bottom);y+=2){
   const v=(y-top)/(bottom-top);
   const base=.16*Math.exp(-(1-v)/.025);
   const corner=wall.kind==='front'?Math.max(wall.leftCorner?.12*Math.exp(-Math.abs(local-wall.min)/.035):0,wall.rightCorner?.12*Math.exp(-Math.abs(local-wall.max)/.035):0):0;
   if(materialDot(u,v)||noise(Math.floor(u*4096)+53,Math.floor(v*4096))<base+corner)c.fillRect(x,y,1,1);
  }
 }
}
export function drawPlaneTexture(c,camera,dir,g){
 const [dx,dy]=DIRECTIONS[dir];c.fillStyle='#000';
 for(let y=0;y<camera.height;y+=2){
  const delta=y-camera.cy,z=camera.focal*.5/Math.abs(delta);
  if(!Number.isFinite(z)||z>7)continue;
  const kind=delta>0?'floor':'ceiling';
  for(let x=0;x<camera.width;x+=2){
   const side=(x-camera.cx)*z/camera.focal;
   const wx=g.x+dx*z-dy*side,wy=g.y+dy*z+dx*side;
   if(materialDot(wx,wy,kind))c.fillRect(x,y,1,1);
  }
 }
}
