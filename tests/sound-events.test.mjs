import test from 'node:test';
import assert from 'node:assert/strict';
import {eventSound,playCue,CUES} from '../dist/sound-events.js';
import {createGame,act,captureMessages} from '../dist/engine.js';
test('Sound cues follow actual events, with damage taking priority',()=>{
 const g=createGame(4),before={...g};
 assert.equal(eventSound(before,g,captureMessages(g,()=>act(g,'info','lantern'))),null);
 assert.equal(eventSound(before,g,['You picked up key.']),'pickup');
 assert.equal(eventSound(before,{...g,health:80},['You picked up key.']),'hurt');
 assert.equal(eventSound(before,{...g,status:'dead',health:0},[]),'death');
 assert.equal(eventSound(before,g,['A gust of wind blows through the corridor!']),'wind');
 assert.equal(eventSound(before,g,['A torrent of water washes your map clean!']),'water');
 assert.equal(eventSound(before,{...g,level:g.level+1},[]),'door');
 assert.equal(eventSound(before,g,['You have nothing to put the oil in.']),null);
});
test('Message capture works when the journal is full and never stores sound state',()=>{
 const g=createGame(4);g.messages=Array(22).fill('old');
 for(let i=0;i<2;i++){const m=captureMessages(g,()=>act(g,'info','food'));assert.equal(m.length,1);assert.match(m[0],/restore satiety/);}
 assert.equal(g.messages.length,22);assert.equal(Object.keys(g).some(k=>/sound|event|listener/i.test(k)),false);
});
test('All retro cues have bounded envelopes, mute is silent, and nodes are released',()=>{
 let count=0,disconnected=0;const param={cancelAndHoldAtTime(){},setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
 const nodes=[];const context={currentTime:0,destination:{},createOscillator(){count++;const n={frequency:param,connect(n){return n;},start(){},stop(t){assert.ok(t<1);},disconnect(){disconnected++;}};nodes.push(n);return n;},createGain(){return {gain:param,connect(n){return n;},disconnect(){disconnected++;}};}};
 playCue(context,'hurt',0);assert.equal(count,0);
 for(const cue of Object.keys(CUES))playCue(context,cue,.3);
 assert.ok(count>20);for(const node of nodes)node.onended();assert.equal(disconnected,count*2);
});
