import test from 'node:test';
import assert from 'node:assert/strict';
import {stoneSurfaces} from '../dist/stone-render.js';
import {corridorCamera} from '../dist/modern-render.js';
import {viewChain,wallContours} from '../dist/render.js';
import {wallScene} from './wall-scenes.mjs';

test('Stone surfaces cover closed walls and passage backs without occluding open corridors',()=>{
 for(const name of ['left','right']){
  const g=wallScene(name),dir=2,camera=corridorCamera(1440,600),chain=viewChain(g,dir);
  const before=JSON.stringify(g),contours=wallContours(chain,dir,camera);
  const surfaces=stoneSurfaces(chain,dir,camera,g);
  for(const s of surfaces){
   const cell=chain[s.d].cell;
   if(s.passage){
    assert.equal(cell.walls[(dir+s.side+4)%4],false);
    const across=g.x*[1,0,-1,0][dir]+g.y*[0,1,0,-1][dir];
    assert.ok(s.side<0?s.max<=across-.5:s.min>=across+.5,'Passage faces must not occlude the forward corridor');
   }else assert.equal(cell.walls[s.kind==='front'?dir:(dir+s.side+4)%4],true);
   for(const u of [s.min,s.max])for(const v of [0,1])assert.ok(s.project(u,v).every(Number.isFinite));
   if(s.kind==='front')assert.equal(s.project(s.min,1)[1],camera.frame(s.d+1)[3]);
  }
  assert.deepEqual(wallContours(chain,dir,camera),contours);
  assert.equal(JSON.stringify(g),before);
 }
});
test('Side masonry stays anchored in world space when advancing along the same wall',()=>{
 const camera=corridorCamera(1440,600),cell={walls:[true,true,false,true]},g={x:2,y:1};
 const before=stoneSurfaces([{cell,d:2}],2,camera,g).find(s=>s.side===-1);
 const after=stoneSurfaces([{cell,d:1}],2,camera,{...g,y:2}).find(s=>s.side===-1);
 assert.equal(before.min,after.min);assert.equal(before.max,after.max);assert.equal(before.seed,after.seed);
 assert.notDeepEqual(before.project(before.min,.5),after.project(after.min,.5));
});

test('Coplanar end wall and side-passage back wall share texture without an artificial corner',()=>{
 const camera=corridorCamera(1440,600),cell={walls:[true,true,true,false]};
 const surface=stoneSurfaces([{cell,d:1,sideForward:{3:false}}],0,camera,{x:0,y:0}).find(s=>s.kind==='front');
 assert.ok(surface.min<-.5);assert.equal(surface.leftCorner,false);
});

test('Masonry courses share boundaries, vary widths and remain stable across view crops',async()=>{
 const {stoneBlocks}=await import('../dist/stone-render.js');
 const blocks=stoneBlocks(-2,2,17),crop=stoneBlocks(-.5,.5,17);
 for(let row=0;row<5;row++){
  const course=blocks.filter(b=>b.row===row);
  for(let i=1;i<course.length;i++)assert.equal(course[i-1].end,course[i].u);
  assert.ok(new Set(course.map(b=>(b.end-b.u).toFixed(4))).size>2);
 }
 for(const b of crop)assert.deepEqual(b,blocks.find(a=>a.row===b.row&&a.col===b.col));
});

test('World texture coordinates agree when a wall changes from side to front after turning',async()=>{
 const {wallTextureU}=await import('../dist/stone-render.js');
 const camera=corridorCamera(1440,600),g={x:3,y:2},cell={walls:[true,true,true,true]};
 // East wall: looking north sees it on the right, turning east sees it in front.
 const side=stoneSurfaces([{cell,d:0}],0,camera,g).find(s=>s.side===1);
 const front=stoneSurfaces([{cell,d:0}],1,camera,g).find(s=>s.kind==='front');
 const worldY=1.8;
 assert.ok(Math.abs(wallTextureU(side,0,g,camera,side.project(-worldY,.5)[0])-worldY)<1e-9);
 assert.ok(Math.abs(wallTextureU(front,1,g,camera,front.project(worldY,.5)[0])-worldY)<1e-9);
});

test('Per-depth contours partition the original geometry for correct occlusion',()=>{const g=wallScene('left'),chain=viewChain(g,2),camera=corridorCamera(1440,600);assert.deepEqual(chain.flatMap(({d})=>wallContours(chain,2,camera,d)),wallContours(chain,2,camera));});

test('Stone wear changes continuously rather than creating hard white patches',async()=>{
 const {masonryWear}=await import('../dist/stone-render.js');
 for(let i=-200;i<200;i++){const u=i/73,v=(i+200)/401;assert.ok(Math.abs(masonryWear(u,v,5)-masonryWear(u+.0001,v,5))<.005);}
});

test('Closed front walls end at their corner instead of extending texture into a continuing side passage',()=>{
 const camera=corridorCamera(1440,600),cell={walls:[true,false,true,true]},g={x:0,y:0};
 const surfaces=stoneSurfaces([{cell,d:1,sideForward:{1:true}}],0,camera,g);
 assert.equal(surfaces.filter(s=>s.passage).length,0);
 assert.equal(surfaces.find(s=>s.kind==='front').max,.5);
});
