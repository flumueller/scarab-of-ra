import test from 'node:test';
import assert from 'node:assert/strict';
import {createNightglassFocus} from '../dist/nightglasses.js';
import {act,index,refocus} from '../dist/engine.js';
import {scenario} from './scenarios.mjs';
function hallway(length=12){
 const g=scenario('empty');g.n=length;g.exit=length*length-1;
 g.cells=Array.from({length:length*length},(_,p)=>({walls:[true,p%length===length-1,true,p%length===0],items:[]}));
 g.x=0;g.y=0;g.dir=1;g.inventory.push({type:'glasses',qty:1});return g;
}
test('Original initial focus stops before floor objects and animals, at seven empty cells or a wall',()=>{
 for(const kind of ['item','animal','empty','wall']){
  const g=hallway(kind==='wall'?4:12),before=index(g);
  if(kind==='item')g.cells[3].items.push({type:'key',qty:1});
  if(kind==='animal')g.animals.push({type:'cobra',p:3});
  const focus=createNightglassFocus(g);assert.equal(focus.cell,kind==='empty'?7:kind==='wall'?3:2);assert.equal(index(g),before);
 }
});
test('Original near/far limits retain the separate distance counter and do not spend time at the boundary',()=>{
 const g=hallway(),focus=createNightglassFocus(g);
 assert.ok(focus.shift(1));assert.ok(focus.shift(1));assert.equal(focus.cell,9);assert.equal(focus.shift(1),false);
 while(focus.shift(-1)){}assert.equal(focus.cell,2);assert.equal(focus.canShift(-1),false);assert.equal(g.ticks,0);
 const blocked=hallway();blocked.cells[1].items.push({type:'key',qty:1});const close=createNightglassFocus(blocked);
 assert.equal(close.cell,0);assert.equal(close.canShift(-1),false);assert.ok(close.shift(1));assert.ok(close.shift(1));assert.equal(close.cell,2);assert.ok(close.shift(-1));assert.equal(close.cell,1);assert.equal(close.shift(-1),false);
});
test('First focusing discovers traps with one-tick probability after four ticks, without moving or mapping',()=>{
 const g=scenario('empty');g.inventory.push({type:'glasses',qty:1});g.cells[5].traps=[{type:'spear',visible:false,sprung:false}];g.rng=1;
 const known=[...g.known],p=index(g);act(g,'use','glasses');assert.equal(g.ticks,4);assert.equal(g.looking,true);assert.equal(g.cells[5].traps[0].visible,true);assert.equal(index(g),p);assert.deepEqual(g.known,known);
 assert.equal(refocus(g),true);assert.equal(g.ticks,5);assert.equal(index(g),p);
});
test('An interruption prevents opening the glasses and refocusing can end the session',()=>{
 const g=scenario('empty');g.inventory.push({type:'glasses',qty:1});g.poisons=[{at:1}];act(g,'use','glasses');assert.equal(g.looking,false);assert.equal(g.ticks,1);
 g.poisons=[{at:2}];assert.equal(refocus(g),false);assert.equal(g.ticks,2);
});
