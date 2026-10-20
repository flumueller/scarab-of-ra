import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,serialize} from '../dist/engine.js';
import {createSessionStore} from '../dist/session.js';
function storage(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
test('Reload restores the current expedition, notes and exact simulation state without consuming it',()=>{
 const disk=storage(),store=createSessionStore(disk),g=createGame(12);
 act(g,'turn',1);act(g,'wait');g.notes[0]='My route';g.inventory.reverse();store.save(g,{begun:true});
 const reloaded=createSessionStore(disk).load();assert.equal(serialize(reloaded.game),serialize({...g,looking:false}));assert.equal(reloaded.suspended,false);
 assert.deepEqual(store.load(),reloaded);
 act(g,'wait');act(reloaded.game,'wait');assert.equal(serialize(reloaded.game),serialize({...g,looking:false}));
});
test('Unstarted menus never replace an expedition; explicit saves stay separate',()=>{
 const disk=storage(),store=createSessionStore(disk),g=createGame(13);disk.setItem('scarab-ra-prototype-v2','manual save');
 store.save(g,{begun:true,suspended:true});store.save(createGame(14));
 assert.equal(store.load().game.seed,g.seed);assert.equal(store.load().suspended,true);assert.equal(disk.getItem('scarab-ra-prototype-v2'),'manual save');
 const fresh=createGame(15);store.save(fresh,{begun:true});assert.equal(store.load().game.seed,15);
});
test('Finishing or quitting clears the checkpoint instead of reviving the last turn',()=>{
 for(const status of ['dead','won','quit']){const store=createSessionStore(storage()),g=createGame(16);store.save(g,{begun:true});g.status=status;store.save(g,{begun:true});assert.equal(store.load(),null);}
});
test('The exit decision survives reload and transient nightglass focus does not',()=>{
 const store=createSessionStore(storage()),g=createGame(17);for(const type of ['crown','staff','scarab'])g.inventory.push({type,qty:1});g.status='exit-choice';g.looking=true;
 store.save(g,{begun:true});assert.equal(store.load().game.status,'exit-choice');assert.equal(store.load().game.looking,false);
});
test('Unavailable or corrupt storage cannot stop the game from starting',()=>{
 for(const disk of [undefined,{getItem(){throw Error('denied');},setItem(){throw Error('full');}},{getItem:()=>'{invalid',setItem(){throw Error('full');}}]){
  const store=createSessionStore(disk);assert.equal(store.load(),null);assert.equal(store.save(createGame(1),{begun:true}),false);
 }
});
test('A stale tab cannot overwrite a newer expedition, even on quit or pagehide',()=>{
 const disk=storage(),a=createSessionStore(disk);a.save(createGame(1),{begun:true});
 const b=createSessionStore(disk),stale=b.load().game;
 a.save(createGame(2),{begun:true,replace:true});
 assert.equal(b.save(stale,{begun:true}),false);assert.equal(b.conflicted,true);
 stale.status='quit';assert.equal(b.save(stale,{begun:true}),false);
 assert.equal(createSessionStore(disk).load().game.seed,2);
});
test('A completed expedition leaves a revision that prevents stale resurrection',()=>{
 const disk=storage(),a=createSessionStore(disk),g=createGame(3);a.save(g,{begun:true});
 const b=createSessionStore(disk),old=b.load().game;g.status='dead';a.save(g,{begun:true});
 assert.equal(b.save(old,{begun:true}),false);assert.equal(createSessionStore(disk).load(),null);
 b.save(createGame(4),{begun:true,replace:true});assert.equal(b.conflicted,false);assert.equal(createSessionStore(disk).load().game.seed,4);
});
