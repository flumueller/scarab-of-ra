import {serialize,restore} from './engine.js';
const KEY='scarab-ra-current-expedition-v1';
// Separate from the explicit, consumable saved game. Reading this checkpoint
// never consumes it; terminal expeditions must not revive an earlier checkpoint.
// The browser caller serializes read/check/write with a Web Lock across tabs.
export function createSessionStore(storage){
 let expected;try{expected=storage?.getItem(KEY)||null;}catch{}
 let conflicted=false;
 return {
  get conflicted(){return conflicted;},
  load(){
   try{
    expected=storage?.getItem(KEY)||null;const value=JSON.parse(expected||'null');
    if(!value||value.version!==1||typeof value.suspended!=='boolean'||!['playing','exit-choice'].includes(value.status))return null;
    const game=restore(value.game);
    if(value.status==='exit-choice'&&!['crown','staff','scarab'].every(type=>game.inventory.some(i=>i.type===type)))return null;
    game.status=value.status;game.looking=false;
    return {game,suspended:value.suspended};
   }catch{return null;}
  },
  save(game,{begun=false,suspended=false,replace=false}={}){
   if(!storage||!begun)return false;
   try{
    if(!replace&&(storage.getItem(KEY)||null)!==expected){conflicted=true;return false;}
    // A tombstone prevents an older tab from reviving a finished expedition.
    const value={version:1,revision:globalThis.crypto.randomUUID(),status:game.status,suspended};
    if(['playing','exit-choice'].includes(game.status))value.game=serialize({...game,status:'playing',looking:false});
    const raw=JSON.stringify(value);storage.setItem(KEY,raw);expected=raw;conflicted=false;return true;
   }catch{return false;}
  }
 };
}
