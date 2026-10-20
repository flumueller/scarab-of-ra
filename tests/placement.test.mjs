import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,nextLevel,availableWallFaces,bankWall} from '../dist/engine.js';
test('wall objects never overlap doors or each other over 400 generated levels',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame(seed);
  for(let level=0;level<10;level++){
   g.cells.forEach((c,p)=>{
    const faces=[...(p===0?[0]:[]),...(p===g.exit?[2]:[]),...Object.keys(c.writing||{}).map(Number),...(c.deposit?[bankWall(g,p)]:[]),...(c.decorations||[]).map(x=>x.dir)];
    assert.equal(new Set(faces).size,faces.length);
    for(const dir of faces)assert.ok(c.walls[dir]);
   });nextLevel(g);
  }
 }
});
test('legacy bank resolves to a free wall, without changing random state',()=>{
 const g=createGame(4);g.cells[0].deposit=true;g.cells[0].decorations=[];const seed=g.rng;
 assert.notEqual(bankWall(g,0),0);assert.equal(g.rng,seed);
 assert.ok(availableWallFaces(g,0).includes(bankWall(g,0)));
});
