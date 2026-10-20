import test from 'node:test';
import assert from 'node:assert/strict';
import {passageHit,floorJoint} from '../dist/passage-render.js';
import {wallScene} from './wall-scenes.mjs';
test('Architectural backdrop hits only real walls through open passages',()=>{
 for(const kind of ['left','right','both','return']){const g=wallScene(kind),before=JSON.stringify(g);for(let i=-30;i<=30;i++){const hit=passageHit(g,g.dir,i/10);assert.ok(hit);assert.equal(g.cells[hit.p].walls[hit.face],true);assert.ok(hit.depth>0&&Number.isFinite(hit.u));}assert.equal(JSON.stringify(g),before);}
});
test('Central backdrop meets the established corridor end plane',()=>{const g=wallScene('both',2);assert.equal(passageHit(g,g.dir,0).depth,3);});
test('Floor joints leave most of the floor untouched and stay deterministic',()=>{let ink=0;for(let i=0;i<1000;i++){const x=i/317,y=(i%93)/37,a=floorJoint(x,y,.003);assert.equal(a,floorJoint(x,y,.003));ink+=a;}assert.ok(ink>0&&ink<40);});

test('Structural contours remain continuous at fractional pixel positions',async()=>{
 const {contourPixels}=await import('../dist/passage-render.js');
 for(const line of [[30.4,10.3,30.4,210.7],[30.8,10.1,30.8,210.1],[2.3,8.8,220.9,113.2]]){
  const pixels=contourPixels(line);assert.deepEqual(pixels[0],line.slice(0,2).map(Math.round));assert.deepEqual(pixels.at(-1),line.slice(2).map(Math.round));
  for(let i=1;i<pixels.length;i++)assert.equal(Math.max(Math.abs(pixels[i][0]-pixels[i-1][0]),Math.abs(pixels[i][1]-pixels[i-1][1])),1);
 }
});
