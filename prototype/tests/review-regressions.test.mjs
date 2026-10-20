import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createGame,act,index,serialize,restore,spawnAnimal} from '../dist/engine.js';

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
// Exercise the actual UI handlers with failing storage/rendering boundaries.
const resumeSource=app.slice(app.indexOf('function resume(){'),app.indexOf('\nfunction map()'));
function resumeHarness({raw=serialize(createGame(42)),failRender=false,failRemove=false}={}){
 const previous=createGame(9),calls=[];
 const context={g:previous,suspended:true,selected:'food',SAVE:'save',restore,
  localStorage:{getItem:()=>raw,removeItem(){calls.push('remove');if(failRemove)throw Error('storage');raw=null;}},
  say(){},render(){calls.push('render');if(failRender&&context.g!==previous)throw Error('render');},
  leaveStart(){calls.push('leave');},close(){calls.push('close');},newGame(){},
  dialog(){calls.push('error');},text(){},checkpointSession(){}};
 runInNewContext(resumeSource+'\nresume();',context);
 return {context,previous,calls,raw};
}
test('Resume retains the saved copy and current expedition if rendering fails',()=>{
 const r=resumeHarness({failRender:true});assert.ok(r.raw);assert.equal(r.context.g,r.previous);
 assert.equal(r.context.suspended,true);assert.equal(r.context.selected,'food');assert.ok(!r.calls.includes('remove'));
});
test('Resume rejects corrupt saves without consuming them or replacing the live game',()=>{
 const g=createGame(1);g.x=999;const raw=serialize(g),r=resumeHarness({raw});
 assert.equal(r.raw,raw);assert.equal(r.context.g,r.previous);assert.ok(r.calls.includes('error'));assert.ok(!r.calls.includes('remove'));
});
test('Resume consumes a valid save only after rendering and completing the UI transition',()=>{
 const r=resumeHarness();assert.equal(r.raw,null);assert.notEqual(r.context.g,r.previous);
 assert.deepEqual(r.calls,['render','leave','close','remove']);assert.equal(r.context.suspended,false);
 const failed=resumeHarness({failRemove:true});assert.ok(failed.raw);assert.equal(failed.context.g,failed.previous);
});
test('Escape cannot dismiss an unresolved exit choice or suspended save dialog',()=>{
 const source=app.match(/modal.addEventListener\('cancel',[^\n]*?\}\);/)[0];
 for(const [status,suspended,expected] of [['exit-choice',false,true],['playing',true,true],['playing',false,false],['dead',false,false]]){
  let prevented=false;runInNewContext(source,{g:{status},suspended,modal:{addEventListener(type,handler){handler({preventDefault(){prevented=true;}});}}});
  assert.equal(prevented,expected);
 }
});
test('Save validation rejects invalid positions, topology, items, maps and event data',()=>{
 const mutations=[g=>g.x=999,g=>g.dir=4,g=>g.exit=-1,g=>g.cells[0].walls[0]=false,
  g=>{const d=g.cells[0].walls.findIndex(w=>!w);g.cells[0].walls[d]=true;},
  g=>g.cells.forEach(c=>c.walls.fill(true)),g=>g.inventory.push({type:'toString',qty:1}),
  g=>g.cells[0].items.push({type:'food',qty:-1}),g=>g.known.pop(),g=>g.visited=null,
  g=>g.notes=null,g=>g.health=null,g=>g.messages=[null],g=>g.poisons=[{at:'later'}],
  g=>{spawnAnimal(g,'cobra',0);g.animals[0].p=999;},g=>g.cells[0].decorations=[null]];
 for(const mutate of mutations){const g=createGame(1);mutate(g);assert.throws(()=>restore(serialize(g)),/Invalid saved game/);}
 assert.throws(()=>restore('null'),/Invalid saved game/);
});
test('Version two saves migrate without rerolling the maze or random state',()=>{
 const g=createGame(17);for(const k of ['animals','poisons','claimedRelics','interrupts','guardianSpawned','guardianTrigger'])delete g[k];
 const restored=restore(JSON.stringify({version:2,game:g}));assert.deepEqual(restored.cells,g.cells);assert.equal(restored.rng,g.rng);
 assert.deepEqual(restored.animals,[]);assert.deepEqual(restored.poisons,[]);assert.equal(restored.status,'playing');
});
test('A plank protects against traps while preserving Guardian triggers and animal encounters',()=>{
 const g=createGame(1);g.cells[index(g)].items.push({type:'plank',qty:1});
 g.cells[index(g)].traps=[{type:'spear',visible:true,sprung:false}];g.guardianTrigger=index(g);
 act(g,'turn',1);assert.equal(g.guardianSpawned,true);assert.equal(g.guardianTrigger,null);assert.equal(g.cells[index(g)].traps[0].sprung,false);
 const a=spawnAnimal(g,'cobra',index(g),'awake');a.nextAt=10000;
 act(g,'turn',1);assert.notEqual(a.p,index(g),'the animal still encounters the player and leaves the square');
});
test('Picking one floor item cannot also pick another item whose index shifted',()=>{
 for(const type of ['gun','food']){
  const g=createGame(42);g.animals=[];g.cells[index(g)].items=[{type,qty:1,load:1},{type,qty:1,load:5}];
  act(g,'pickup',{type,qty:1,floorIndex:0});
  assert.equal(g.cells[index(g)].items.length,1);assert.equal(g.cells[index(g)].items[0].load,5);
 }
});
test('The primary pickup button respects the entered quantity and rejects invalid amounts',()=>{
 const source=app.slice(app.indexOf('function pickupDialog(){'),app.indexOf('\nfunction nightglasses()'));
 for(const amount of ['3','0','17','1.5']){
  let actions,chosen,invalid=false;const inputs=[];
  const context={suspended:false,modal:{open:false},g:{status:'playing',cells:[{items:[{type:'food',qty:16}]}]},index:()=>0,dialog:(_,b)=>actions=b,close(){},run:(...args)=>chosen=args,label:()=> 'food',ITEMS:{food:{name:'food'}},actions:{lastElementChild:{focus(){}}},body:{append(){}},el(tag){const n={append(){},setAttribute(){},reportValidity(){invalid=true;},click(){this.onclick();}};if(tag==='input')inputs.push(n);return n;}};
  runInNewContext(source+';pickupDialog();',context);inputs[0].value=amount;actions[1][1]();
  if(amount==='3'){assert.equal(chosen[0],'pickup');assert.equal(chosen[1].qty,3);assert.equal(chosen[1].floorIndex,0);}else{assert.equal(chosen,undefined);assert.equal(invalid,true);}
 }
});
