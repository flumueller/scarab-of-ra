import {playCue} from './sound-events.js';
export function moved(before,after){return before.x!==after.x||before.y!==after.y;}
export function createAmbience({onMusicState=()=>{}}={}){
 let prefs={music:.25,effects:.3};try{Object.assign(prefs,JSON.parse(localStorage.getItem('scarab-audio')||'{}'));}catch{}
 for(const key of ['music','effects'])prefs[key]=Math.max(0,Math.min(1,Number(prefs[key])||0));
 const music=new Audio('assets/menu-music-aac.m4a');music.id='menu-audio';music.hidden=true;document.body.append(music);music.loop=true;music.preload='auto';music.volume=prefs.music;
 let context,menu=false,musicState='paused',attempt=0;
 const state=value=>{musicState=value;onMusicState(value);};
 function sync(){
  const request=++attempt;music.volume=prefs.music;
  if(!menu||!prefs.music||document.hidden){music.pause();state(prefs.music?'paused':'off');return;}
  if(music.error)music.load();
  music.play().then(()=>{if(request===attempt)state('playing');}).catch(error=>{
   if(request!==attempt)return;
   state(error.name==='NotAllowedError'?'blocked':error.name==='AbortError'?'paused':'error');
  });
 }
 // Retry blocked autoplay on the first user gesture in the menu.
 const unlock=()=>{if(menu&&musicState!=='playing')sync();};
 window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',sync);
 music.addEventListener?.('error',()=>{if(menu)state('error');});
 return {prefs,get musicState(){return musicState;},effect(name){if(!name||!prefs.effects||document.hidden)return;try{context??=new AudioContext();context.resume().catch(()=>{});playCue(context,name,prefs.effects);}catch{}},set(key,value){if(!['music','effects'].includes(key))return;prefs[key]=Math.max(0,Math.min(1,Number(value)||0));try{localStorage.setItem('scarab-audio',JSON.stringify(prefs));}catch{}sync();},menu(value){menu=value;sync();},step(){
  if(!prefs.effects||document.hidden)return;
  try{context??=new AudioContext();context.resume().catch(()=>{});const now=context.currentTime,duration=.16,buffer=context.createBuffer(1,context.sampleRate*duration,context.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*7);
   const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=450+Math.random()*200;gain.gain.setValueAtTime(prefs.effects*.24,now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(filter).connect(gain).connect(context.destination);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }catch{}
 }};
}
