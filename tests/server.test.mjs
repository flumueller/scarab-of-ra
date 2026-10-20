import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createGameServer} from '../backend/server.mjs';
test('Production serves the game and API but never development scenarios or backend files',async()=>{
 const server=createGameServer({store:{list:async()=>[]},publicOrigin:'https://game.example'});
 server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/Scarab of RA/);
  const list=await fetch(base+'/api/scores');assert.deepEqual(await list.json(),{scores:[]});
  assert.equal((await fetch(base+'/healthz')).status,200);
  for(const path of ['/__scenario','/__scenarios.js','/__render-check','/backend/database.mjs','/.env','/%2e%2e%2fserver.mjs'])assert.equal((await fetch(base+path)).status,404,path);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  const head=await fetch(base+'/engine.js',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 }finally{await new Promise(resolve=>server.close(resolve));}
});
