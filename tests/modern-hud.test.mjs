import test from 'node:test';import assert from 'node:assert/strict';
import {minimapMarker,drawMinimap} from '../dist/modern-hud.js';
test('Minimap marker follows player position and all four directions without changing state',()=>{const g={n:3,x:2,y:1,dir:0,oriented:true};for(let dir=0;dir<4;dir++){g.dir=dir;const before=JSON.stringify(g),m=minimapMarker(g);assert.equal(m.angle,dir*90);assert.equal(m.direction,['N','E','S','W'][dir]);assert.equal(m.x,245/296*100);assert.equal(m.y,147/296*100);assert.equal(JSON.stringify(g),before);}g.oriented=false;assert.equal(minimapMarker(g),null);});
test('Minimap does not disclose walls of unknown cells and distinguishes mapped states',()=>{const calls=[],c={fillRect(...rect){calls.push([this.fillStyle,...rect]);}},canvas={getContext:()=>c};const g={n:3,known:[2,1,0],cells:Array.from({length:3},()=>({walls:[true,true,true,true]}))};drawMinimap(canvas,g);assert.equal(canvas.width,296);assert.equal(calls.filter(r=>r[0]==='#000').length,8);assert.ok(calls.some(r=>r[0]==='#ddd'));assert.ok(calls.some(r=>r[0]==='#777'));});

import {minimapDoors,groupedNews} from '../dist/modern-hud.js';
test('Door badges distinguish entrance/exit and never reveal an unknown exit',()=>{
 const g={n:3,exit:8,known:[2,0,0,0,0,0,0,0,0]};
 assert.deepEqual(minimapDoors(g).map(d=>d.label),['IN']);
 g.known[8]=1;const doors=minimapDoors(g);assert.deepEqual(doors.map(d=>d.label),['IN','OUT']);assert.equal(doors[0].y,0);assert.ok(doors[1].y>99);
});
test('Journal groups consecutive repeats without altering history or merging unrelated events',()=>{
 const messages=['Wall','Wall','Key','Wall'],before=[...messages];
 assert.deepEqual(groupedNews(messages),[{message:'Wall',count:2},{message:'Key',count:1},{message:'Wall',count:1}]);assert.deepEqual(messages,before);
});

test('Minimap walls have uniform two-pixel thickness at fractional display scales and shared edges overlap',()=>{
 for(const size of [95,139,191,237]){
  const walls=[],c={fillRect(...r){if(this.fillStyle==='#000')walls.push(r);}},canvas={clientWidth:size,clientHeight:size,getContext:()=>c};
  drawMinimap(canvas,{n:3,known:[2,2],cells:[{walls:[true,true,true,true]},{walls:[true,true,true,true]}]});
  assert.equal(canvas.width,size);
  for(const [x,y,w,h] of walls){assert.equal(Math.min(w,h),2);for(const v of [x,y,w,h])assert.ok(Number.isInteger(v));}
  assert.deepEqual(walls[1],walls[7],'adjacent cells share identical edge pixels');
  assert.equal(walls[0][0]+walls[0][2],walls[1][0]+2,'corner endpoints join without gaps');
 }
});
