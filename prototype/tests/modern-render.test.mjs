import test from 'node:test';
import assert from 'node:assert/strict';
import {corridorCamera,floorObjectRect} from '../dist/modern-render.js';
import {viewChain,wallContours} from '../dist/render.js';
import {wallScene} from './wall-scenes.mjs';
test('Wider viewport reveals more space without enlarging or cropping corridor cross-sections',()=>{
 const a=corridorCamera(900,668),b=corridorCamera(1440,668);
 for(let d=1;d<10;d++){
  const [l,t,r,bt]=a.frame(d),[ll,tt,rr,bb]=b.frame(d);
  assert.ok(Math.abs((r-l)-(rr-ll))<1e-10);assert.equal(t,tt);assert.equal(bt,bb);assert.ok(Math.abs(ll-l-270)<1e-10);
  assert.ok(Math.abs((r-l)-(bt-t))<1e-10);
 }
 assert.ok(a.frame(0)[0]<0&&b.frame(0)[2]>1440);
 assert.ok(b.frame(1)[1]>0&&b.frame(1)[3]<668);
});
test('Modern junction contours retain mirrored openings at widescreen aspect',()=>{
 const camera=corridorCamera(1440,668);
 const normalize=ls=>ls.map(l=>l[0]<l[2]||(l[0]===l[2]&&l[1]<l[3])?l:[l[2],l[3],l[0],l[1]]).map(l=>l.map(v=>Math.round(v*1000)).join(',')).sort();
 const left=wallContours(viewChain(wallScene('left'),2),2,camera).map(([x,y,xx,yy])=>[1440-x,y,1440-xx,yy]);
 const right=wallContours(viewChain(wallScene('right'),2),2,camera);
 assert.deepEqual(normalize(left),normalize(right));
});
test('Ground artwork keeps aspect, remains below horizon and shrinks with distance',()=>{
 const c=corridorCamera(1440,668),near=floorObjectRect(c,60,43,1),far=floorObjectRect(c,60,43,3);
 assert.ok(near[2]<=120);assert.ok(near[1]>c.cy);assert.ok(far[2]<near[2]);
 assert.ok(Math.abs(near[2]/near[3]-60/43)<1e-10);
});

import {doorColumn} from '../dist/modern-render.js';
test('Door thresholds lie on the floor/wall junction for both sides at every distance',()=>{
 const c=corridorCamera(1440,668);
 for(const depth of [0,1,2,5])for(const u of [0,.25,.5,.75,1]){
  const left=doorColumn(c,depth,3,u),right=doorColumn(c,depth,1,u);
  assert.ok(Math.abs(left.bottom-c.cy-(c.cx-left.x))<1e-9);
  assert.ok(Math.abs(right.bottom-c.cy-(right.x-c.cx))<1e-9);
  assert.ok(Math.abs(left.x+right.x-c.width)<1e-9);
  const front=doorColumn(c,depth,0,u);assert.equal(front.bottom,c.frame(depth+1)[3]);
 }
});

import {doorOutline} from '../dist/modern-render.js';
test('Door silhouette closes both jambs, lintel and threshold in front and side views',()=>{
 const camera=corridorCamera(1440,668);
 for(const side of [0,1,3])for(const depth of [0,1,3]){
  const [a,b,top,bottom]=doorOutline(camera,depth,side);
  assert.deepEqual(top,[a[0],a[1],b[0],b[1]]);
  assert.deepEqual(bottom,[a[2],a[3],b[2],b[3]]);
  assert.ok(a[3]>a[1]&&b[3]>b[1]);
 }
});
