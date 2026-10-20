import {de,itemNames,patterns} from './de.js';
export const preferenceKey='scarab-presentation';
let prefs={language:'en',colour:false};
try{const saved=JSON.parse(globalThis.localStorage?.getItem(preferenceKey)||'{}');prefs={language:saved.language==='de'?'de':'en',colour:saved.colour===true};}catch{}
export function language(){return prefs.language;}
export function presentation(){return {...prefs};}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const rules=patterns.map(([en,de])=>[new RegExp('^'+en.split(/\{\d+\}/).map(escape).join('(.+?)')+'$'),de]);
const plurals={'pair of nightglasses':'Nachtferngläser','lantern':'Laternen','key':'Schlüssel','dart':'Betäubungspfeile','anaesthetic dart gun':'Betäubungsgewehre','plank':'Bretter','ten-foot pole':'Zehnfussstangen','piece of charcoal':'Stücke Holzkohle','first aid kit':'Verbandskästen','bottle of snake bite cure':'Flaschen Gegengift','net':'Fangnetze','bullwhip':'Peitschen','small melon':'kleine Melonen','compass':'Kompasse'};
function german(s,depth=0){
 if(depth>8)return s;
 if(Object.hasOwn(de,s))return de[s];
 // Never translate the game's title; item labels use itemGerman explicitly.
 if(s!=='Scarab of RA'&&Object.hasOwn(itemNames,s))return itemNames[s];
 let m;
 if((m=s.match(/^FACING ([NESW]) · MAP \[M\]$/)))return `BLICK ${m[1]==='E'?'O':m[1]} · KARTE [M]`;
 if((m=s.match(/^Square (\d+), (\d+)(.*)$/)))return `Feld ${m[1]}, ${m[2]}`+m[3].replace(', mapped and walked',', kartiert und betreten').replace(', mapped, not walked',', kartiert, nicht betreten').replace(', unmapped',', nicht kartiert').replace(', unexplored',', unerforscht').replace(', seen',', gesehen').replace(', explored',', erkundet').replace(', you are here',', du bist hier');

 if((m=s.match(/^(\d+) (ounce|ounces|pint|pints)(?: of)? (food|oil|gold)$/)))return `${m[1]} ${m[2].startsWith('pint')?'Pint':m[1]==='1'?'Unze':'Unzen'} ${itemNames[m[3]]}`;
 if((m=s.match(/^(?:a |an |the )(.*)$/))&&itemGerman(m[1])!==m[1])return itemGerman(m[1]);
 if((m=s.match(/^(\d+) (.+)$/))){for(const [en,plural] of Object.entries(plurals))if(m[2]===en+'s'||m[2]===en)return `${m[1]} ${m[1]==='1'?itemNames[en]:plural}`;}
 if(s.startsWith('broken '))return `${itemGerman(s.slice(7))} (kaputt)`;
 // Inscriptions and names supplied by players remain verbatim.
 if(s.startsWith('The wall reads: '))return 'An der Wand steht: '+s.slice(16);
 if(s.startsWith('You can go '))return 'Du kannst gehen: '+s.slice(11,-1).split(', ').map(x=>german(x)).join(', ')+'.';
 for(const [regex,out] of rules){m=s.match(regex);if(m)return out.replace(/\{(\d+)\}/g,(_,n)=>itemNames[m[Number(n)+1]]||german(m[Number(n)+1],depth+1));}
 if(s.includes(' · ')&&s.includes(' ounces in weight')){
  const [details,...purpose]=s.split('. ');
  const translated=details.split(' · ').map((part,i)=>i===0?itemGerman(part):part.replace(/ ounces in weight/,' Unzen Gewicht').replace(/ pints oil/,' Pint Öl').replace(/ darts loaded/,' geladene Betäubungspfeile').replace(/^on$/,'an').replace(/^off$/,'aus')).join(' · ');
  return translated+'. '+german(purpose.join('. '),depth+1);
 }
 if(s.endsWith(':')&&Object.hasOwn(de,s.slice(0,-1)))return de[s.slice(0,-1)]+':';
 return s;
}
export function itemGerman(s){return itemNames[s]||german(s);}
export function t(value){if(typeof value!=='string'||prefs.language!=='de')return value;const s=value.trim();return value.replace(s,german(s));}
// The engine and saved messages stay in their original language so switching
// locale cannot change sound dispatch, game rules or saved-game compatibility.
// Translate only DOM presentation; remember each original for lossless switching.
export function mountPresentation(root=document.documentElement){
 const originals=new WeakMap(),attributes=new WeakMap();
 function translate(node){
  if(node.nodeType===3){if(node.parentElement?.closest('script,style,textarea,[translate="no"]'))return;const previous=originals.get(node),source=previous&&node.data===previous.output?previous.source:node.data,output=t(source);originals.set(node,{source,output});if(node.data!==output)node.data=output;return;}
  if(node.nodeType!==1||node.matches('script,style,[translate="no"]'))return;
  const old=attributes.get(node)||{};
  for(const key of ['title','aria-label','placeholder','alt'])if(node.hasAttribute(key)){const value=node.getAttribute(key),source=old[key]&&value===old[key].output?old[key].source:value,output=t(source);old[key]={source,output};if(value!==output)node.setAttribute(key,output);}
  attributes.set(node,old);for(const child of node.childNodes)translate(child);
 }
 const observer=new MutationObserver(records=>{observer.disconnect();for(const r of records){if(r.type==='childList')for(const node of r.addedNodes)translate(node);else translate(r.target);}observe();});
 const observe=()=>observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','alt']});
 function refresh(){observer.disconnect();root.lang=prefs.language;root.dataset.colour=prefs.colour?'sandstone':'mono';translate(root);observe();}
 refresh();return {refresh,set(update){prefs={...prefs,...update};prefs.language=prefs.language==='de'?'de':'en';prefs.colour=prefs.colour===true;try{localStorage.setItem(preferenceKey,JSON.stringify(prefs));}catch{}refresh();}};
}
