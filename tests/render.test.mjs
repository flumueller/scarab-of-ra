import test from 'node:test';
import assert from 'node:assert/strict';
import {spriteRect,wallContours,pixelLine,SPRITES,viewChain} from '../dist/render.js';
import {readFile} from 'node:fs/promises';

test('Original adjacent sprites retain every source pixel before later depth reductions',()=>{
 assert.deepEqual(spriteRect(60,43,1),[121,125,60,43]);
 assert.deepEqual(spriteRect(59,50,1),[121,120,59,50]);
 assert.deepEqual(spriteRect(60,43,2).slice(2),[30,21]);
 assert.deepEqual(spriteRect(59,50,2).slice(2),[29,25]);
 assert.deepEqual(spriteRect(60,43,3).slice(2),[15,10]);
});
test('Straight coplanar walls have no vertical seams between cells',()=>{
 const chain=Array.from({length:4},(_,d)=>({d,cell:{walls:[false,true,d===3,true]}}));
 const vertical=wallContours(chain,2).filter(([x,y,xx,yy])=>x===xx&&y!==yy);
 assert.equal(vertical.length,2); // Only the two edges of the far wall.
 const crossing=structuredClone(chain);crossing[1].cell.walls[1]=false;
 assert.ok(wallContours(crossing,2).filter(([x,y,xx,yy])=>x===xx&&y!==yy).length>2);
});
test('Contour rasterization writes integer black pixels without antialiasing',()=>{
 const pixels=[];const ctx={fillRect:(...r)=>pixels.push(r)};
 pixelLine(ctx,0,0,7,3);assert.equal(ctx.fillStyle,'#000');assert.equal(pixels.length,8);
 assert.deepEqual(pixels[0],[0,0,1,1]);assert.deepEqual(pixels.at(-1),[7,3,1,1]);
 assert.ok(pixels.every(p=>p.every(Number.isInteger)));
});
test('Every mapped original object and creature graphic exists',async()=>{
 for(const id of [...Object.values(SPRITES),20074,20077,20064,20049,20050,20051]){
  const png=await readFile(new URL(`../dist/assets/sprite_${id}.png`,import.meta.url));
  assert.equal(png.readUInt32BE(0),0x89504e47);
 }
});

// CODE 2:349c–367c: a closed front with an open side has no vertical
// seam unless the side neighbour itself continues forward.
import {wallScene} from './wall-scenes.mjs';
const verticals=g=>wallContours(viewChain(g,g.dir),g.dir).filter(([x,y,xx,yy])=>x===xx&&y!==yy);
test('Side junction in front of a continuous end wall keeps its near edge, without a false far seam',()=>{
 const g=wallScene('left');
 assert.deepEqual(verticals(g),[[31,-53,31,187],[44,174,44,-40],[211,7,211,127]]);
});
test('Both side openings retain outer edges and remove both coplanar seams',()=>{
 assert.deepEqual(verticals(wallScene('both')),[[31,-53,31,187],[44,174,44,-40],[271,-53,271,187],[258,174,258,-40]]);
});
test('Deeper junctions retain their edges under haze',()=>{
 assert.deepEqual(verticals(wallScene('left',2)),[[31,-53,31,187],[44,174,44,-40],[91,7,91,127],[98,120,98,14],[181,37,181,97]]);
});
test('Side neighbours continuing forward reveal the original narrow return wall',()=>{
 const g=wallScene('return'),lines=wallContours(viewChain(g,g.dir),g.dir);
 assert.ok(lines.some(l=>JSON.stringify(l)===JSON.stringify([6,187,6,-53])));
 assert.ok(lines.some(l=>JSON.stringify(l)===JSON.stringify([31,187,6,187])));
});
test('Left and right junctions are exact mirrored contours',()=>{
 const normalize=ls=>ls.map(l=>JSON.stringify(l[0]<l[2]||(l[0]===l[2]&&l[1]<l[3])?l:[l[2],l[3],l[0],l[1]])).sort();
 const left=wallContours(viewChain(wallScene('left'),2),2).map(([x,y,xx,yy])=>[302-x,y,302-xx,yy]);
 const right=wallContours(viewChain(wallScene('right'),2),2);
 assert.deepEqual(normalize(left),normalize(right));
});
