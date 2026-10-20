import test from 'node:test';import assert from 'node:assert/strict';
import {MAP_SIZE,mapMetrics,mapPixels,mapShade} from '../dist/map-render.js';
import {act,index} from '../dist/engine.js';import {scenario} from './scenarios.mjs';
const fixture=()=>({n:6,x:0,y:0,oriented:false,notes:{},known:Array(36).fill(2),cells:Array.from({length:36},()=>({walls:[true,true,true,true]}))});
const pixel=(p,x,y)=>p[y*MAP_SIZE+x];
test('Original map cells use floor((296-2)/n), leaving space for the two-pixel pen',()=>{for(let n=3;n<=20;n++){const {step,extent}=mapMetrics(n);assert.equal(step,Math.floor(294/n));assert.equal(extent,step*n+2);assert.ok(extent<=296);}});
test('Outer and shared walls have the same two-pixel width without cell-join gaps',()=>{
 const g=fixture(),p=mapPixels(g),s=49;
 for(const x of [0,s,2*s,6*s])for(let y=0;y<296;y++)assert.equal(pixel(p,x,y),0);
 for(const y of [0,s,2*s,6*s])for(let x=0;x<296;x++)assert.equal(pixel(p,x,y),0);
 for(const x of [0,s,2*s,6*s]){assert.equal(pixel(p,x,20),0);assert.equal(pixel(p,x+1,20),0);if(x+2<296)assert.equal(pixel(p,x+2,20),255);}
});
test('Open corridors have no artificial cell borders',()=>{const g=fixture();g.cells[0].walls[1]=false;g.cells[1].walls[3]=false;const p=mapPixels(g);assert.equal(pixel(p,49,20),255);assert.equal(pixel(p,50,20),255);});
test('Walked, mapped-only and unknown states have distinct monochrome fill densities',()=>{
 for(const [state,black] of [[2,0],[1,16],[0,32]]){let n=0;for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(mapShade(state,x,y)===0)n++;assert.equal(n,black);}
 const g=fixture();g.known[1]=1;g.known[2]=0;const p=mapPixels(g);assert.equal(pixel(p,60,10),0);assert.equal(pixel(p,61,10),255);assert.equal(pixel(p,120,10),0);assert.equal(pixel(p,121,10),255);
});
test('Speed five maps walked cells; looking alone leaves the corridor unmapped',()=>{const g=scenario('empty');act(g,'turn',2);act(g,'turn',2);assert.equal(g.known[5],0);act(g,'move',1);assert.equal(g.known[5],2);assert.equal(g.known[10],0);});
test('Speed three maps a viewed corridor, then walking changes only the entered square to white',()=>{const g=scenario('empty');act(g,'speed',3);act(g,'turn',2);act(g,'turn',2);assert.equal(g.known[5],1);assert.equal(g.visited[5],false);assert.equal(g.known[10],1);act(g,'move',1);assert.equal(index(g),5);assert.equal(g.known[5],2);assert.equal(g.visited[5],true);assert.equal(g.known[10],1);});
test('Add To Map at speed five records visible cells without marking them walked',()=>{const g=scenario('empty');act(g,'map');assert.equal(g.known[5],1);assert.equal(g.visited[5],false);assert.equal(g.known[0],2);});
