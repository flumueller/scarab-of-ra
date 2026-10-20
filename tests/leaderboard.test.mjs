import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {PGlite} from '@electric-sql/pglite';
import {createScoreStore,validateScore} from '../backend/scores.mjs';
import {createScoreApi} from '../backend/http.mjs';
const schema=await readFile(new URL('../db/001-leaderboard.sql',import.meta.url),'utf8');
const score=(overrides={})=>({submissionId:randomUUID(),name:'Adventurer',prestige:100,level:2,status:'dead',...overrides});
async function call(api,{method='GET',body,raw,origin='https://game.example',type='application/json'}={}){
 const req=Readable.from([Buffer.from(raw??(body===undefined?'':JSON.stringify(body)))]);
 req.method=method;req.headers={host:'internal:4173','content-type':type,origin};
 let result;const res={writeHead(status,headers){result={status,headers};},end(data){result.body=JSON.parse(data);}};
 await api(req,res);return result;
}
test('PostgreSQL persists a shared top ten, parameterizes names and handles retry/conflict',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'scarab-postgres-'));let db;
 try{
  db=new PGlite(folder);await db.exec(schema);await db.exec(schema);const store=createScoreStore(db);
  const entry=score({name:"O'Brien <script>"});
  assert.equal((await store.submit(entry)).created,true);assert.equal((await store.submit(entry)).created,false);
  await assert.rejects(store.submit({...entry,prestige:999}),e=>e.status===409);
  assert.equal((await store.list()).length,1);assert.equal((await store.list())[0].name,entry.name);
  for(let i=0;i<15;i++)await store.submit(score({prestige:i*100}));
  const top=await store.list();assert.equal(top.length,10);assert.equal(top[0].prestige,1400);assert.equal(top[9].prestige,500);
  assert.ok(top.every(r=>r.date instanceof Date));assert.equal('submission_id' in top[0],false);
  await db.close();db=new PGlite(folder);
  assert.deepEqual(await createScoreStore(db).list(),top);
 }finally{await db?.close();await rm(folder,{recursive:true,force:true});}
});
test('Validation rejects unfinished games, malformed IDs, excessive names and impossible numeric fields',()=>{
 for(const bad of [null,[],score({status:'playing'}),score({name:' '}),score({name:'a'.repeat(33)}),score({name:'hello\nworld'}),score({prestige:-1}),score({prestige:1.5}),score({prestige:Infinity}),score({level:0}),score({submissionId:'x'})])assert.throws(()=>validateScore(bad),e=>e.status===400);
 assert.equal(validateScore(score({name:'  Flurin  '})).name,'Flurin');
});
test('API supports shared reads, safe retry and bounded requests; failures are explicit',async()=>{
 const db=new PGlite();try{
  await db.exec(schema);const api=createScoreApi(createScoreStore(db),{publicOrigin:'https://game.example'}),entry=score();
  assert.deepEqual((await call(api)).body,{scores:[]});
  assert.equal((await call(api,{method:'POST',body:entry})).status,201);
  assert.equal((await call(api,{method:'POST',body:entry})).status,200);
  assert.equal((await call(api)).body.scores.length,1);
  assert.equal((await call(api,{method:'POST',body:entry,origin:'https://elsewhere.example'})).status,403);
  assert.equal((await call(api,{method:'POST',body:entry,type:'text/plain'})).status,415);
  assert.equal((await call(api,{method:'POST',raw:'{'})).status,400);
  assert.equal((await call(api,{method:'POST',raw:'x'.repeat(2049)})).status,413);
  assert.equal((await call(api,{method:'DELETE'})).status,405);
  await db.close();assert.equal((await call(api)).status,503);
 }finally{if(!db.closed)await db.close();}
});
test('Submission burst protection works without trusting proxy headers',async()=>{
 const api=createScoreApi({submit:async()=>({created:true,score:{}})},{publicOrigin:'https://game.example'});
 for(let i=0;i<60;i++)assert.equal((await call(api,{method:'POST',body:score()})).status,201);
 const limited=await call(api,{method:'POST',body:score()});assert.equal(limited.status,429);assert.equal(limited.headers['Retry-After'],'60');
});
