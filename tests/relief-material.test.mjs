import test from 'node:test';
import assert from 'node:assert/strict';
import {reliefSurface,reliefStrength} from '../dist/relief-material.js';
import {stoneBlocks} from '../dist/stone-render.js';
test('Relief ink is worn away at mortar while remaining visible inside stone',()=>{
 const blocks=stoneBlocks(-.5,.5,7),b=blocks.find(b=>b.row===2),u=(b.u+b.end)/2,v=(b.top+b.bottom)/2;
 const middle=reliefStrength(u,v,7,blocks);
 assert.ok(middle>.3);assert.ok(reliefStrength(u,b.top,7,blocks)<middle*.1);assert.ok(reliefStrength(b.u,v,7,blocks)<middle*.1);
});
test('Approaching a relief keeps its material coordinates and seed unchanged',()=>{
 const g={x:2,y:1},a=reliefSurface(g,2,2,0,.3),b=reliefSurface({...g,y:2},2,1,0,.3);
 assert.deepEqual(a,b);
 const sideA=reliefSurface(g,2,2,1,.3),sideB=reliefSurface({...g,y:2},2,1,1,.3);assert.deepEqual(sideA,sideB);
});
test('Relief wear varies smoothly and deterministically across stone',()=>{
 const blocks=stoneBlocks(-1,1,3),samples=[];
 for(let i=0;i<100;i++){const u=-.4+i*.008,v=.1;const a=reliefStrength(u,v,3,blocks);assert.equal(a,reliefStrength(u,v,3,blocks));assert.ok(a>=0&&a<=1);samples.push(a);}
 assert.ok(Math.max(...samples)-Math.min(...samples)>.2);
});
