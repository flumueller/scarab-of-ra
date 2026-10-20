import test from 'node:test';
import assert from 'node:assert/strict';
import {monochromePixels} from '../dist/modern-render.js';
import {materialDot,drawPlaneTexture} from '../dist/stone-render.js';
import {corridorCamera} from '../dist/modern-render.js';
test('Shared scene raster produces opaque black or white, without residual gray',()=>{
 const a=new Uint8ClampedArray([0,0,0,255,100,100,100,255,230,230,230,255,255,255,255,255]);
 monochromePixels(a);assert.deepEqual([...a],[0,0,0,255,0,0,0,255,255,255,255,255,255,255,255,255]);
});
test('Floor and ceiling grain remain much sparser than wall grain',()=>{
 const counts={wall:0,floor:0,ceiling:0};for(let x=0;x<200;x++)for(let y=0;y<200;y++)for(const kind of Object.keys(counts))counts[kind]+=materialDot(x/128,y/128,kind)?1:0;
 assert.ok(counts.wall>counts.floor*4);assert.ok(counts.floor>counts.ceiling);assert.ok(counts.floor/40000<.006);assert.ok(counts.ceiling/40000<.003);
});
test('Plane texture emits only isolated integer screen pixels without mutating game',()=>{
 const g={x:2,y:3},before=JSON.stringify(g),pixels=[];
 drawPlaneTexture({fillRect:(...p)=>pixels.push(p)},corridorCamera(800,400),2,g);
 assert.ok(pixels.length>0);assert.ok(pixels.length<500);
 for(const [x,y,w,h] of pixels){assert.ok(Number.isInteger(x)&&Number.isInteger(y));assert.equal(w,1);assert.equal(h,1);}
 assert.equal(JSON.stringify(g),before);
});
