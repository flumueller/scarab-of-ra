// One foreground cue per action: danger takes priority over routine feedback.
export function eventSound(before,after,messages){
 const text=messages.join('\n');
 if(after.status==='dead'&&before.status!=='dead')return 'death';
 if(after.status==='won'&&before.status!=='won')return 'victory';
 if(after.health<before.health)return 'hurt';
 if(/gust of wind/.test(text))return 'wind';
 if(/torrent of water/.test(text))return 'water';
 if(/safe distance/.test(text))return 'trap';
 if(/monkey stole|Curse of RA|starving|burned all its oil/.test(text))return 'warning';
 if(/crumbles into dust|caught it in the net|animal falls asleep/.test(text))return 'success';
 if(after.level>before.level||after.status==='exit-choice'&&before.status!=='exit-choice')return 'door';
 if(/CRACK!/.test(text))return 'whip';
 if(/dart misses|dart has no effect/.test(text))return 'dart';
 if(/sickening crunch|pole broke|flask of oil shatters/.test(text))return 'break';
 if(/You deposit/.test(text))return 'coins';
 if(/You picked up/.test(text))return 'pickup';
 if(/You dropped|lay the plank/.test(text))return 'drop';
 if(/You eat/.test(text))return 'eat';
 if(/refill your lantern/.test(text))return 'water';
 if(/tend to your wounds|snake bite cure/.test(text))return 'heal';
 if(before.lit!==after.lit)return 'lamp';
 if(/You load/.test(text))return 'load';
 if(/cannot walk through|exit is locked/.test(text))return 'blocked';
 return null;
}
// Soft sine/triangle voices with rounded attacks; pickup is a low, short resonant tap.
export const CUES={
 pickup:[[245,.24,0,220],[490,.18,.018,440]],drop:[[150,.1,0,65]],
 hurt:[[160,.16,0,45]],death:[[220,.16,0],[165,.18,.17],[82,.3,.36]],
 victory:[[330,.12,0],[440,.12,.14],[660,.25,.28]],
 door:[[85,.22,0,130],[65,.12,.24]],blocked:[[90,.07,0]],
 warning:[[440,.09,0],[330,.13,.13]],success:[[392,.09,0],[587,.15,.11]],
 coins:[[660,.18,0],[880,.16,.04]],eat:[[180,.06,0],[220,.06,.09]],
 heal:[[330,.1,0],[495,.16,.12]],lamp:[[240,.06,0,100]],load:[[300,.04,0],[450,.05,.08]],
 dart:[[800,.09,0,130]],whip:[[1100,.1,0,70]],trap:[[700,.05,0,200],[95,.1,.06]],
 break:[[220,.05,0,50],[135,.08,.07,40]],wind:[[180,.35,0,55]],water:[[380,.12,0,110],[270,.15,.1,80]]
};
const activeVoices=new WeakMap();
export function playCue(context,name,volume){
 if(!volume||!CUES[name])return;
 const now=context.currentTime;
 const previous=activeVoices.get(context)||[];for(const gain of previous){gain.gain.cancelAndHoldAtTime(now);gain.gain.setTargetAtTime(.0001,now,.015);}
 const voices=[];activeVoices.set(context,voices);
 for(const [hz,duration,offset=0,end=hz] of CUES[name]){
  const oscillator=context.createOscillator(),gain=context.createGain(),start=now+offset;
  oscillator.type=['hurt','door','drop','trap','break'].includes(name)?'triangle':'sine';
  oscillator.frequency.setValueAtTime(hz,start);oscillator.frequency.exponentialRampToValueAtTime(end,start+duration);
  gain.gain.setValueAtTime(0,now);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*(name==='pickup'?.075:.10),start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  voices.push(gain);oscillator.connect(gain).connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.01);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
 }
}
