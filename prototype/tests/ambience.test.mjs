import test from 'node:test';
import assert from 'node:assert/strict';
import {moved} from '../dist/ambience.js';
import {darkPixel,darkCoverage} from '../dist/modern-render.js';
import {stoneSurfaces,masonryVisible} from '../dist/stone-render.js';
import {corridorCamera} from '../dist/modern-render.js';
test('Footsteps only follow actual displacement, never turns or blocked movement',()=>{assert.equal(moved({x:1,y:2},{x:1,y:2,dir:3}),false);assert.equal(moved({x:1,y:2},{x:2,y:2}),true);assert.equal(moved({x:1,y:2},{x:1,y:1}),true);});
test('Unlit stipple darkens the full view while concentrating darkness in the distance',()=>{let all=0,centre=0;for(let y=0;y<400;y++)for(let x=0;x<800;x++)all+=darkPixel(x,y,800,400);for(let y=160;y<192;y++)for(let x=384;x<416;x++)centre+=darkPixel(x,y,800,400);assert.ok(all/320000>.35);assert.ok(centre/1024>all/320000);assert.ok(centre/1024>.70);});
test('Forward side passage has a textured return matching the contour width',()=>{const camera=corridorCamera(1440,600),cell={walls:[false,false,true,true]},surface=stoneSurfaces([{cell,d:1,sideForward:{1:true}}],0,camera,{x:0,y:0}).find(s=>s.passage);assert.ok(surface);assert.equal(surface.side,1);assert.ok(Math.abs(surface.project(surface.max,0)[0]-surface.project(surface.min,0)[0]-camera.returns[1])<1e-8);});
test('Masonry includes stable white areas and visible ink',()=>{const sample=[];for(let i=0;i<1000;i++)sample.push(masonryVisible(i/200,(i%30)/30,17));assert.ok(sample.includes(true)&&sample.includes(false));assert.deepEqual(sample,sample.map((_,i)=>masonryVisible(i/200,(i%30)/30,17)));});

test('Menu music attempts autoplay on load and pauses on leaving the menu',async()=>{
 const saved={Audio:globalThis.Audio,document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage};let plays=0,pauses=0;
 globalThis.Audio=class {play(){plays++;return Promise.resolve();}pause(){pauses++;}};
 globalThis.document={body:{append(){}},hidden:false,addEventListener(){}};globalThis.window={addEventListener(){}};globalThis.localStorage={getItem(){return null;}};
 try{const {createAmbience}=await import('../dist/ambience.js');const audio=createAmbience();audio.menu(true);assert.equal(plays,1);audio.menu(false);assert.equal(pauses,1);}finally{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});

test('Darkness has a continuous gradient and stable non-repeating stipple',()=>{
 const densities=[];for(let x=0;x<400;x++)densities.push(darkCoverage(x,176,800,400));
 assert.equal(new Set(densities).size,400);
 for(let i=1;i<densities.length;i++)assert.ok(Math.abs(densities[i]-densities[i-1])<.003);
 let differences=0;for(let x=100;x<300;x++){assert.equal(darkPixel(x,100,800,400),darkPixel(x,100,800,400));differences+=darkPixel(x,100,800,400)!==darkPixel(x+4,100,800,400);}
 assert.ok(differences>20,'No repeated 4px Bayer tile');
});

test('Blocked menu autoplay retries on user interaction and stale failures cannot undo it',async()=>{
 const saved={Audio:globalThis.Audio,document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage};
 const states=[],attempts=[],events={};let pauses=0;
 globalThis.Audio=class{play(){return new Promise((resolve,reject)=>attempts.push({resolve,reject}));}pause(){pauses++;}};
 globalThis.document={body:{append(){}},hidden:false,addEventListener(){}};
 globalThis.window={addEventListener(name,handler){events[name]=handler;}};globalThis.localStorage={getItem:()=>null,setItem(){}};
 try{
  const {createAmbience}=await import('../dist/ambience.js');const audio=createAmbience({onMusicState:s=>states.push(s)});
  audio.menu(true);attempts[0].reject(Object.assign(Error('autoplay'),{name:'NotAllowedError'}));await Promise.resolve();await Promise.resolve();
  assert.equal(audio.musicState,'blocked');
  events.pointerdown({});assert.equal(attempts.length,2,'a menu gesture retries blocked autoplay');
  attempts[1].resolve();await Promise.resolve();assert.equal(audio.musicState,'playing');
  audio.set('music',.5);audio.menu(false);attempts[2].reject(Error('interrupted'));await Promise.resolve();await Promise.resolve();
  assert.equal(audio.musicState,'paused');assert.ok(pauses>0);
  audio.set('music',0);assert.equal(audio.musicState,'off');assert.ok(states.includes('playing'));
 }finally{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});

test('Interrupted playback is retryable and a media failure reloads before retry',async()=>{
 const saved={Audio:globalThis.Audio,document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage};let media,loads=0;
 globalThis.Audio=class{constructor(){media=this;}play(){return this.abort?Promise.reject(Object.assign(Error('interrupted'),{name:'AbortError'})):Promise.resolve();}pause(){}load(){loads++;this.error=null;}};
 globalThis.document={body:{append(){}},hidden:false,addEventListener(){}};globalThis.window={addEventListener(){}};globalThis.localStorage={getItem:()=>null,setItem(){}};
 try{const {createAmbience}=await import('../dist/ambience.js');const audio=createAmbience();media.abort=true;audio.menu(true);await Promise.resolve();await Promise.resolve();assert.equal(audio.musicState,'paused');media.abort=false;media.error={code:2};audio.set('music',.25);await Promise.resolve();assert.equal(loads,1);assert.equal(audio.musicState,'playing');}
 finally{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
