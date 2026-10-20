import {wallScene} from './wall-scenes.mjs';
import {createGame,spawnAnimal} from '../dist/engine.js';
export function scenario(name='tools'){
 const g=createGame(901);g.n=5;g.level=3;g.x=0;g.y=0;g.dir=2;g.exit=24;
 g.cells=Array.from({length:25},()=>({walls:[true,true,true,true],items:[]}));
 const path=[];for(let x=0;x<5;x++)for(let j=0;j<5;j++)path.push((x%2?4-j:j)*5+x);
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],d=b-a===5?2:b-a===-5?0:1;g.cells[a].walls[d]=false;g.cells[b].walls[(d+2)%4]=false;}
 g.known=Array(25).fill(0);g.known[0]=2;g.visited=Array(25).fill(false);g.visited[0]=true;g.explored=[...g.visited];g.animals=[];g.poisons=[];g.messages=[];g.prestige=0;g.health=100;g.healAt=100000;g.notes={};g.guardianSpawned=false;g.guardianTrigger=null;
 if(name==='tools'||name==='hud'){
  g.inventory.push(...['plank','net','gun','darts','pole','aid','cure','glasses','charcoal','whip','gold'].map((type,k)=>({type,qty:type==='gold'?40:type==='darts'?6:1,id:100+k})));
  g.cells[0].items=[{type:'food',qty:8},{type:'gold',qty:20}];g.cells[0].deposit=true;g.cells[10].trap={type:'spear',visible:true,sprung:false};spawnAnimal(g,'monkey',15,'asleep');
 }
 if(name==='hud'){g.health=82;g.hunger=36;g.oil=71;}
 if(name==='reliefs'){g.dir=0;g.x=0;g.y=1;g.cells[5].walls[0]=true;g.cells[5].decorations=[{dir:0,picture:1005},{dir:1,picture:1006}];}
 if(name==='dark'){g.oil=0;g.lit=false;}
 if(name==='art'){g.dir=0;g.cells[0].decorations=[{dir:1,picture:1004}];g.cells[5].items=[{type:'key',qty:1}];}
 if(name==='guardian'){g.inventory.push({type:'scarab',qty:1});spawnAnimal(g,'mummy',10,'awake');g.guardianSpawned=true;}
 if(name==='junction'||name==='end-junction'){Object.assign(g,wallScene(name==='end-junction'?'both':'return'));if(name==='end-junction'){for(const p of [16,18]){g.cells[p].walls[2]=false;g.cells[p+g.n].walls[0]=false;}}g.known=Array(g.n*g.n).fill(0);g.known[g.y*g.n+g.x]=2;g.visited=Array(g.n*g.n).fill(false);g.explored=[...g.visited];}
 if(name==='side-door'){g.dir=1;}
 if(name==='map-lines')g.known.fill(2);
 return g;
}
