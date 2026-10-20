// Original-code evidence and known limits: ../../docs/originalvergleich.md.
import {generateMaze} from './maze.js';
import {TYPES,ITEMS} from './item-types.js';
import {itemPurpose} from './item-info.js';
export {ITEMS};
export const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export const TUNING=Object.freeze({digestTicks:200,oilTicks:150,stepTicks:s=>11-s});
const RELICS=['staff','scarab','crown'];
const BEASTS=['lioness','monkey','cobra','mummy'];
export function random(g){let x=g.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;g.rng=x>>>0;return g.rng/4294967296;}
const rand=(g,n)=>n>0?Math.floor(random(g)*n):0;
const messageListeners=new WeakMap();
export function captureMessages(g,perform){const messages=[];messageListeners.set(g,messages);try{perform();}finally{messageListeners.delete(g);}return messages;}
export function say(g,s){messageListeners.get(g)?.push(s);g.messages.push(s);g.messages=g.messages.slice(-22);}
export function item(g,t){if(typeof t!=='string')return undefined;const [type,id]=t.split('@');return g.inventory.find(i=>i.type===type&&(id===undefined||String(i.id)===id));}
export function index(g){return g.y*g.n+g.x;}
export function weight(g){return g.inventory.reduce((n,i)=>n+ITEMS[i.type].weight*i.qty,0)+(item(g,'lantern')?Math.round(g.oil/6.25)*3:0);}
export function maxSpeed(g){return Math.max(1,10-Math.floor(weight(g)/160));}
export function label(i){return (i.broken?'broken ':'')+(ITEMS[i.type].unit?`${i.qty} ${ITEMS[i.type].unit} ${ITEMS[i.type].name}`:ITEMS[i.type].name);}
export function canGo(g,d=g.dir,p=index(g)){return !g.cells[p].walls[d];}
const neighbor=(g,p,d)=>p+DIRS[d][0]+DIRS[d][1]*g.n;
const exits=(g,p)=>[0,1,3,2].filter(d=>canGo(g,d,p)); // Original N,E,W,S order.
const traps=c=>c.traps||(c.trap?[c.trap]:[]);
function add(g,i){const exists=(ITEMS[i.type].flags&0x4000)&&g.inventory.find(a=>a.type===i.type&&!!a.broken===!!i.broken);if(exists)exists.qty+=i.qty;else{g.nextId=(g.nextId||0)+1;g.inventory.push({...i,id:g.nextId});}}
function remove(g,i,n=1){i.qty-=n;if(i.qty<=0)g.inventory.splice(g.inventory.indexOf(i),1);}
function take(g,i,n){const result={...i,qty:n};remove(g,i,n);if(i.type==='lantern'){g.lit=false;g.oilClock=0;}return result;}
function dead(g,message){if(g.status!=='playing')return;g.health=Math.max(0,g.health);g.status='dead';g.deathMessage=message;g.prestige-=Math.floor(g.prestige/4);say(g,message);}
export function damage(g,n,message){if(g.status!=='playing')return;g.health=Math.max(0,g.health-n);g.interrupts++;if(message)say(g,message);if(!g.health)dead(g,'You have died from your wounds!');}
export function createGame(seed=Date.now()){
 const g={rng:(seed>>>0)||1,seed:seed>>>0,level:0,x:0,y:0,dir:2,speed:5,ticks:0,digestAt:200,healAt:75,oilClock:0,spawnedRelics:[],claimedRelics:[],poisons:[],animals:[],interrupts:0,health:100,hunger:0,oil:100,lit:true,prestige:0,bank:0,gunLoad:0,inventory:[{type:'lantern',qty:1},{type:'food',qty:16}],messages:[],status:'playing'};
 nextLevel(g);say(g,'Welcome to the Great Pyramid of RA!');say(g,'Find the key to the exit.');return g;
}
export function stockCount(g,area){return area<10?0:Math.floor(area/20)+Math.floor(area/10)-rand(g,Math.floor(area/10));}
export function eligibleTypes(depth){return TYPES.filter(t=>t.frequency>0&&depth>=t.minDepth&&depth<=t.maxDepth);}
export function spawnAnimal(g,type,p,state){const a={type,p,qty:1,state:state||(type==='mummy'||rand(g,2)?'awake':'asleep'),dir:rand(g,4),tracking:type==='mummy',fleeing:false,carrying:[],nextAt:g.ticks+ITEMS[type].interval};g.animals.push(a);return a;}
export function distances(g,start=index(g)){const d=Array(g.cells.length).fill(Infinity),queue=[start];d[start]=0;for(let i=0;i<queue.length;i++){const p=queue[i];for(const dir of exits(g,p)){const q=neighbor(g,p,dir);if(d[q]===Infinity){d[q]=d[p]+1;queue.push(q);}}}return d;}
export function spawnGuardian(g){if(g.guardianSpawned)return;const ds=distances(g),far=ds.map((d,p)=>d>Math.floor(g.n/2)*2?p:-1).filter(p=>p>=0);if(!far.length)return;spawnAnimal(g,'mummy',far[rand(g,far.length)],'awake');g.guardianSpawned=true;say(g,'The Curse of RA has awakened a Guardian.');}
function mazeMessage(g,p){
 if(rand(g,10)===0)return ['Kilroy was here!','<-- This way to the Great Egress!','The Pharoah is a Phink!!',"’ware the Lioness",'xyzzy','Why did it have to be snakes?!?'][rand(g,6)];
 const fromStart=distances(g,0),toExit=distances(g,g.exit);let onPath=fromStart[p]+toExit[p]===fromStart[g.exit];
 if(rand(g,5)===0)onPath=!onPath;return onPath?'This is the path to the exit':"This isn’t the path to the exit";
}
// CODE 9:092c: wall objects occupy one closed, unoccupied face.
// CODE 30:01a4/01d2 reserves the entrance and exit faces first.
export function availableWallFaces(g,p){
 const c=g.cells[p];
 return [0,1,3,2].filter(dir=>c.walls[dir]&&!(p===0&&dir===0)&&!(p===g.exit&&dir===2)&&c.depositDir!==dir&&!c.writing?.[dir]&&!c.decorations?.some(a=>a.dir===dir));
}
export function bankWall(g,p){
 const c=g.cells[p];
 if(!c.deposit)return undefined;
 // Older saves only recorded a cell-wide boolean. Resolve without RNG changes.
 return c.depositDir??availableWallFaces(g,p)[0];
}
export function nextLevel(g){
 if(g.level)g.prestige+=g.n*g.n*10;g.level++;g.n=Math.min(g.level+2,20);g.cells=generateMaze(g.n,n=>rand(g,n));
 g.x=0;g.y=0;g.dir=2;g.animals=[];g.guardianSpawned=false;g.guardianTrigger=null;g.known=Array(g.cells.length).fill(0);g.visited=Array(g.cells.length).fill(false);g.explored=Array(g.cells.length).fill(false);g.explored[0]=true;g.notes={};g.oriented=true;g.mapDestroyed=false;g.exit=g.cells.length-1;
 const area=g.cells.length,place=(type,qty=1)=>g.cells[rand(g,area)].items.push({type,qty});
 place('key');
 for(const type of RELICS)if(!g.spawnedRelics.includes(type)&&(g.n===15||rand(g,225)<Math.floor(area/4))){place(type);g.spawnedRelics.push(type);}
 for(let x=0;x<g.n;x+=3)for(let y=0;y<g.n;y+=3){const q=rand(g,9),xx=x+q%3,yy=y+Math.floor(q/3);if(xx<g.n&&yy<g.n)g.cells[yy*g.n+xx].benchmark=true;}
 const count=stockCount(g,area),eligible=eligibleTypes(g.level+2),total=eligible.reduce((n,t)=>n+t.frequency,0);
 g.stockedCount=count;
 for(let k=0;k<count;k++){
  let roll=rand(g,total),t=eligible[0];for(const candidate of eligible){roll-=candidate.frequency;if(roll<0){t=candidate;break;}}
  const p=rand(g,area),c=g.cells[p],qty=t.minQuantity+rand(g,t.maxQuantity-t.minQuantity+1);
  if(BEASTS.includes(t.type))spawnAnimal(g,t.type,p);
  else if(['spear','wind','poisontrap','water'].includes(t.type)){let q=p;while(traps(g.cells[q]).length)q=(q+1)%area;const target=g.cells[q];target.traps=[{type:t.type,visible:false,sprung:false,covered:false}];target.trap=target.traps[0];}
  else if(t.type==='deposit'){const walls=availableWallFaces(g,p);if(walls.length){c.deposit=true;c.depositDir=walls[rand(g,walls.length)];}}
  else if(t.type==='message'){c.writing??={};const walls=availableWallFaces(g,p);if(walls.length)c.writing[walls[rand(g,walls.length)]]=mazeMessage(g,p);}
  else c.items.push({type:t.type,qty});
 }
 for(let k=0;k<2+2*count;k++){const p=rand(g,area),c=g.cells[p],walls=availableWallFaces(g,p);if(walls.length){c.decorations??=[];const dir=walls[rand(g,walls.length)];if(!c.decorations.some(a=>a.dir===dir))c.decorations.push({dir,picture:1000+rand(g,9)});}}
 if(item(g,'scarab'))g.guardianTrigger=rand(g,area);
 danger(g);mapHere(g);benchmark(g);say(g,'The door creaks open… and slams shut after you pass through.');
}
export function corridor(g,dir=g.dir,start=index(g)){const result=[];let p=start;while(canGo(g,dir,p)){p=neighbor(g,p,dir);result.push(p);}return result;}
export function mapCorridor(g){if(!g.oriented)return;for(const p of [index(g),...corridor(g).slice(0,g.lit?7:2)])g.known[p]=Math.max(g.known[p],g.visited[p]?2:1);}
export function mapHere(g){const p=index(g);if(g.speed<=5){if(!g.oriented&&((g.mapDestroyed&&p===0)||(!g.mapDestroyed&&g.visited[p]))){g.oriented=true;g.mapDestroyed=false;say(g,'You have found your place on the map again.');}if(g.oriented){g.visited[p]=true;g.known[p]=2;if(g.speed<=3)mapCorridor(g);}}else g.oriented=false;}
function benchmark(g){const c=g.cells[index(g)];if(c.benchmark&&!c.benchmarkVisited){c.benchmarkVisited=true;g.prestige+=50;}}
function dropCarried(g,a){g.cells[a.p].items.push(...a.carrying);a.carrying=[];}
function wake(g,a){
 // CODE 2:056a–05ce: already-awake animals keep their scheduled move.
 if(a.state==='awake')return;
 a.state='awake';a.nextAt=g.ticks+ITEMS[a.type].interval;
 if(rand(g,2)===0&&a.type!=='mummy'){a.tracking=true;a.fleeing=true;}
}
function sleep(g,a){if(a.type==='mummy')return false;a.state='asleep';dropCarried(g,a);return true;}
function attack(g,a){
 g.interrupts++;
 if(a.type==='lioness')damage(g,rand(g,15),'The lioness claws you!');
 if(a.type==='cobra'){damage(g,5,'The cobra bites you!');g.poisons.push({at:g.ticks+75});}
 if(a.type==='mummy')damage(g,item(g,'scarab')?30:g.health,'The Guardian strikes!');
 if(a.type==='monkey'){
  if(a.carrying.length&&rand(g,3)===0)g.cells[a.p].items.push(a.carrying.pop());
  if(g.inventory.length){const i=g.inventory[rand(g,g.inventory.length)],loot=take(g,i,i.qty);a.carrying.push(loot);say(g,`The monkey stole your ${ITEMS[loot.type].name}!`);}
 }
 if(a.type!=='mummy'){a.tracking=true;a.fleeing=true;}
}
function wanderDir(g,a){const choices=exits(g,a.p);if(!choices.length)return null;if(!canGo(g,a.dir,a.p)||choices.length>2){a.dir=rand(g,4);while(!canGo(g,a.dir,a.p))a.dir=(a.dir+1)%4;}return a.dir;}
function moveAnimal(g,a,ds,forceWander=false){
 let dir=null;
 if(!forceWander&&(a.tracking||a.type==='mummy')){let best=ds[a.p];for(const d of exits(g,a.p)){const distance=ds[neighbor(g,a.p,d)];if(a.fleeing?distance>best:distance<best){best=distance;dir=d;}}}
 else dir=wanderDir(g,a);
 if(dir===null)return;
 const p=neighbor(g,a.p,dir);
 if(g.animals.some(b=>b!==a&&b.p===p&&b.state==='awake')){if(a.type!=='mummy'){a.tracking=false;a.fleeing=false;a.dir=rand(g,4);}return;}
 if(p===index(g)){attack(g,a);return;}
 a.p=p;a.dir=dir;
 if(a.type==='mummy')return;
 if(a.tracking){if(rand(g,a.fleeing?100:20)===0){a.tracking=false;a.fleeing=false;}}
 else if(rand(g,100)===0)a.tracking=true;
 else if(rand(g,40)===0)dropCarried(g,a);
}
function encounter(g){
 if(g.guardianTrigger===index(g)){g.guardianTrigger=null;spawnGuardian(g);}
 for(const a of g.animals.filter(a=>a.p===index(g))){
  if(a.state==='netted')continue;
  if(a.state==='asleep'){if(rand(g,TUNING.stepTicks(g.speed))!==0)continue;wake(g,a);say(g,`You woke the ${a.type}!`);}
  else if(rand(g,2)===0)attack(g,a);
  if(g.status==='playing')moveAnimal(g,a,distances(g),true);
 }
}
export function advance(g,n,interruptible=false){
 const end=g.ticks+n,interrupts=g.interrupts;
 while(g.ticks<end&&g.status==='playing'){
  g.ticks++;
  if(g.lit&&item(g,'lantern')&&++g.oilClock>=150){g.oilClock=0;g.oil=Math.max(0,g.oil-6.25);if(!g.oil){g.lit=false;say(g,'Your lantern has burned all its oil!');}}
  if(g.ticks>=g.digestAt){g.digestAt+=200;g.hunger=Math.min(100,g.hunger+6.25);if(g.hunger===87.5)say(g,'You are starving!');if(g.hunger===100)dead(g,'You have died of hunger!');}
  if(g.status!=='playing')break;
  if(g.ticks>=g.healAt){g.health=Math.min(100,g.health+1);g.healAt=g.ticks+112-rand(g,75);}
  for(const p of [...g.poisons])if(g.ticks>=p.at){damage(g,1);if(rand(g,100)===0)g.poisons.splice(g.poisons.indexOf(p),1);else p.at=g.ticks+112-rand(g,75);}
  let ds;for(const a of g.animals)if(g.status==='playing'&&a.state==='awake'&&g.ticks>=a.nextAt){a.nextAt=g.ticks+ITEMS[a.type].interval;ds??=distances(g);moveAnimal(g,a,ds);}
  if(interruptible&&g.interrupts!==interrupts)break;
 }
 return g.status==='playing'&&g.ticks===end&&(!interruptible||g.interrupts===interrupts);
}
function toggleLantern(g){if(g.oil&&rand(g,2)===0){g.oil-=6.25;say(g,'You spill a pint of oil.');}g.lit=!g.lit&&g.oil>0;g.oilClock=0;say(g,g.lit?'Your lantern is on.':'Your lantern is off.');}
export function triggerTrap(g,t,remote=false){
 if(t.sprung)return;t.visible=true;t.sprung=true;
 if(remote){say(g,`You sprang the ${ITEMS[t.type||'spear'].name} at a safe distance.`);return;}
 if(!t.type||t.type==='spear')damage(g,20-rand(g,10),'OUCH!!! You have been hit by a spear trap!');
 if(t.type==='wind'){say(g,'A gust of wind blows through the corridor!');if(g.lit)toggleLantern(g);}
 if(t.type==='poisontrap'){damage(g,5,'A poisoned dart strikes you!');g.poisons.push({at:g.ticks+75});}
 if(t.type==='water'){g.known.fill(0);g.visited.fill(false);g.visited[0]=true;g.known[0]=2;g.notes={};g.oriented=index(g)===0;g.mapDestroyed=!g.oriented;say(g,'A torrent of water washes your map clean!');}
}
function danger(g){
 const c=g.cells[index(g)];
 if(!c.items.some(i=>i.type==='plank'&&!i.broken)){
  for(const t of traps(c))if(!t.sprung&&!t.covered&&rand(g,15)>=TUNING.stepTicks(g.speed))triggerTrap(g,t);
 }
 encounter(g);
}
function lookForTraps(g,ticks){for(const p of corridor(g))for(const t of traps(g.cells[p]))if(!t.visible&&rand(g,50)<ticks){t.visible=true;say(g,'You spot a hidden trap.');}}
function discover(g){const c=g.cells[index(g)];for(const i of c.items)say(g,`You found ${label(i)}.`);for(const t of traps(c)){if(!t.visible)continue;say(g,`You found ${t.sprung?'a sprung':'a'} ${ITEMS[t.type||'spear'].name}.`);}if(c.deposit)say(g,'You found a deposit box of the Bank of RA.');if(c.writing?.[g.dir])say(g,`The wall reads: ${c.writing[g.dir]}`);if(index(g)===g.exit)say(g,'The exit door has a keyhole. Face South to unlock it.');}
function work(g,n,message){const done=advance(g,n,true);if(!done&&g.status==='playing')say(g,message||'You were interrupted!');return done;}
function quantity(i,n){return Number.isFinite(n)?Math.max(0,Math.min(i.qty,Math.floor(n))):i.qty;}
export function throwLimit(g,i,qty=1){return Math.min(corridor(g).length,Math.max(0,Math.trunc((21-Math.trunc(ITEMS[i.type].weight*qty/16))/3)+1));}
function melonBreaks(g,i){i.handled=(i.handled||0)+1;if(i.handled<=2&&rand(g,3)!==0){damage(g,1+rand(g,5),'The overripe melon explodes, scattering seeds everywhere!');return true;}return false;}
function pickup(g,arg){
 const c=g.cells[index(g)],selected=typeof arg==='object'?arg:null;let changed=false;
 const candidates=selected?[c.items.find((i,p)=>i.type===selected.type&&(selected.floorIndex===undefined||p===selected.floorIndex))].filter(Boolean):[...c.items];
 for(const i of candidates){
  if(g.status!=='playing')break;
  const capacity=ITEMS[i.type].weight?Math.floor((1599-weight(g))/ITEMS[i.type].weight):i.qty;
  const n=Math.min(quantity(i,selected?.qty),Math.max(0,capacity));
  if(!n){say(g,'You are carrying too much weight to pick that up.');continue;}
  const got={...i,qty:n};i.qty-=n;if(i.qty===0)c.items.splice(c.items.indexOf(i),1);changed=true;
  if(got.type==='melon'&&melonBreaks(g,got)){advance(g,1);continue;}
  add(g,got);say(g,`You picked up ${label(got)}.`);
  if(RELICS.includes(got.type)&&!g.claimedRelics.includes(got.type)){g.claimedRelics.push(got.type);g.prestige+=1000;if(got.type==='scarab')spawnGuardian(g);}
  advance(g,1);
 }
 for(const t of traps(c))t.covered=c.items.some(i=>i.type==='plank'&&!i.broken);
 g.speed=Math.min(g.speed,maxSpeed(g));if(!changed)say(g,'There is nothing here you can pick up.');return changed;
}
function use(g,i,arg){
 const type=i.type,n=quantity(i,arg.qty),c=g.cells[index(g)];if(i.broken){say(g,"That's useless — it's broken.");return false;}
 if(type==='key'){
  if(index(g)!==g.exit||g.dir!==2){say(g,'There is nothing here to unlock. Face the exit door.');return false;}
  if(RELICS.every(t=>item(g,t))){g.status='exit-choice';say(g,'You spy a passage leading to sunlight.');return true;}
  remove(g,i);if(g.status==='playing')nextLevel(g);return true;
 }
 if(type==='lantern'){toggleLantern(g);mapHere(g);return true;}
 if(type==='food'){
  const portions=Math.min(n,Math.round(g.hunger/6.25));if(!portions){say(g,"You really aren't hungry right now.");return false;}
  const start=g.ticks;work(g,portions,'Your meal was interrupted.');if(g.inventory.includes(i)){const eaten=Math.min(i.qty,g.ticks-start);remove(g,i,eaten);g.hunger=Math.max(0,g.hunger-eaten*6.25);}say(g,'You eat some food.');return true;
 }
 if(type==='oil'){
  if(!item(g,'lantern')){say(g,'You have nothing to put the oil in.');return false;}
  const amount=Math.min(n,Math.round((100-g.oil)/6.25));if(!amount){say(g,'Your lantern is already full.');return false;}
  remove(g,i,amount);g.oil+=amount*6.25;say(g,'You refill your lantern.');return true;
 }
 if(type==='aid'){if(work(g,30,'You were interrupted while tending your wounds.')){g.health=Math.min(100,g.health+rand(g,10));if(rand(g,10)===0)remove(g,i);say(g,'You tend to your wounds.');}return true;}
 if(type==='cure'){if(g.poisons.length)g.poisons.shift();if(rand(g,10)===0)remove(g,i);say(g,'You take some snake bite cure.');return true;}
 if(type==='compass'){say(g,`You are facing ${['North','East','South','West'][g.dir]}.`);return true;}
 if(type==='plank'){if(!canGo(g)){say(g,'Leaning the plank against the wall seems pointless.');return false;}const target=g.cells[neighbor(g,index(g),g.dir)];target.items.push(take(g,i,1));for(const t of traps(target)){t.covered=true;}say(g,'You lay the plank ahead of you.');advance(g,1);return true;}
 if(type==='gold'){if(!c.deposit){say(g,'There is no deposit box here.');return false;}remove(g,i,n);g.bank+=n;g.prestige+=5*n;say(g,`You deposit ${n} ounces of gold in the Bank of RA.`);return true;}
 if(type==='darts'){if(!item(g,'gun')){say(g,'You have no dart gun.');return false;}const count=Math.min(n,6-(item(g,'gun').load||0));if(!count){say(g,'The gun is already loaded.');return false;}remove(g,i,count);item(g,'gun').load=(item(g,'gun').load||0)+count;say(g,`You load ${count} darts.`);return true;}
 if(type==='gun'){if(!i.load){say(g,'The dart gun is empty.');return false;}i.load--;if(!work(g,2))return true;const line=corridor(g);for(let k=0;k<line.length;k++){const a=g.animals.find(a=>a.p===line[k]&&a.state!=='netted');if(a&&rand(g,Math.floor((k+2)/2)+1)===0){say(g,sleep(g,a)?'The animal falls asleep.':'The dart has no effect on the Guardian.');return true;}}say(g,'The dart misses.');return true;}
 if(type==='whip'){if(!work(g,2))return true;const visible=new Set([0,1,2,3].flatMap(d=>corridor(g,d)));for(const a of g.animals)if(visible.has(a.p)&&a.type!=='mummy'){if(a.state==='asleep')wake(g,a);if(a.state==='awake'&&rand(g,3)===0){a.tracking=true;a.fleeing=true;}}say(g,'CRACK!');return true;}
 if(type==='pole'){
  if(!canGo(g)){say(g,"Poking the wall doesn't help.");return false;}
  const p=neighbor(g,index(g),g.dir),a=g.animals.find(a=>a.p===p&&a.state==='awake')||g.animals.find(a=>a.p===p);
  if(a){if(a.state==='asleep'){wake(g,a);say(g,`You woke the ${a.type}!`);}else if(a.state==='awake'&&a.type!=='mummy'){a.tracking=true;a.fleeing=!!rand(g,2);say(g,"It's definitely paying attention to you now…");}else say(g,'Poking it does not help.');}
  else if(rand(g,10)===0){i.broken=true;say(g,'Oops — your pole broke!');}
  else{const t=traps(g.cells[p]).find(t=>!t.sprung);if(t&&rand(g,t.visible?3:8)===0)triggerTrap(g,t,true);else say(g,'Nothing happens.');}return true;
 }
 if(type==='charcoal'){
  if(!c.walls[g.dir]){say(g,"You can't write a message in mid-air!");return false;}
  if(bankWall(g,index(g))===g.dir||c.writing?.[g.dir]||c.decorations?.some(a=>a.dir===g.dir)){say(g,'Sorry, this wall is full.');return false;}
  if(!arg.text)return false;if(rand(g,10)===0){remove(g,i);say(g,'Your charcoal crumbled in your hand.');return true;}
  if(work(g,20,'You were interrupted while writing.')){c.writing??={};c.writing[g.dir]=String(arg.text).slice(0,32);say(g,'You mark the wall.');}return true;
 }
 if(type==='net')return throwItem(g,i,{...arg,distance:arg.distance||1});
 if(type==='glasses'){if(work(g,4,'You were interrupted while focusing.')){lookForTraps(g,1);g.looking=true;say(g,'The distant corridor comes into focus.');}return true;}
 if(type==='melon'){remove(g,i);g.hunger=Math.max(0,g.hunger-6.25);say(g,'You eat the small melon.');advance(g,1);return true;}
 say(g,'That item has no use here.');return false;
}
function throwItem(g,i,arg){
 const n=quantity(i,arg.qty),distance=Math.floor(Number(arg.distance));
 if(!n||!Number.isFinite(distance)||distance<1||distance>throwLimit(g,i,n)){say(g,"You can't throw it that far.");return false;}
 const p=corridor(g)[distance-1],thrown=take(g,i,n);let elapsed=['oil','lantern','gold','scarab'].includes(thrown.type);let a=g.animals.find(a=>a.p===p&&a.state==='awake')||g.animals.find(a=>a.p===p&&a.state==='asleep');
 if(thrown.type==='oil'){if(a?.state==='asleep')wake(g,a);say(g,'The flask of oil shatters, splashing oil everywhere.');return true;}
 if(thrown.type==='net'){
  elapsed=true;if(!work(g,2)){g.cells[index(g)].items.push(thrown);return true;}
  a=g.animals.find(a=>a.p===p&&a.state!=='netted');
  if(a&&a.type!=='mummy'&&rand(g,Math.floor(distances(g)[p]/2)+1)===0){a.state='netted';dropCarried(g,a);g.prestige+=150;say(g,'You caught it in the net!');return true;}
  if(a?.type==='mummy'){say(g,'The net slides off the Guardian.');g.cells[p].items.push(thrown);return true;}say(g,'The net misses.');
 }
 if(a?.type==='mummy'&&thrown.type==='scarab'){g.animals.splice(g.animals.indexOf(a),1);g.prestige+=500;g.cells[p].items.push(thrown);say(g,'The Guardian crumbles into dust!');return true;}
 if(a?.type==='monkey'&&thrown.type==='gold'&&Math.floor(rand(g,n)/16)>0){wake(g,a);a.carrying.push(thrown);a.tracking=true;a.fleeing=true;say(g,'The monkey takes the gold and runs.');return true;}
 let hit=false;
 if(a){if(a.state==='asleep')wake(g,a);hit=rand(g,ITEMS[thrown.type].weight*n)>4&&rand(g,distance)===0;if(hit&&a.type!=='mummy'){a.tracking=true;a.fleeing=true;}say(g,hit?'You hit it!':'Duffer — you missed completely!');}
 if(!hit&&ITEMS[thrown.type].breakable){thrown.broken=true;say(g,'You hear a sickening crunch.');}
 g.cells[p].items.push(thrown);
 if(!elapsed)advance(g,1);return true;
}
export function refocus(g){lookForTraps(g,1);return work(g,1,'You were interrupted while looking.');}
export function act(g,action,arg){
 if(g.status!=='playing')return false;g.looking=false;let elapsed=0;
 if(action==='speed'){const n=Number(arg);if(!Number.isFinite(n))return false;g.speed=Math.max(1,Math.min(maxSpeed(g),Math.floor(n)));return true;}
 if(action==='move'){const d=arg===-1?(g.dir+2)%4:g.dir;if(!canGo(g,d)){say(g,index(g)===g.exit&&d===2?'The exit is locked. Use the key.':'You cannot walk through a wall.');return false;}g.x+=DIRS[d][0];g.y+=DIRS[d][1];elapsed=TUNING.stepTicks(g.speed);g.explored[index(g)]=true;discover(g);}
 else if(action==='turn'){if(![-1,1,2].includes(arg))return false;g.dir=(g.dir+arg+4)%4;elapsed=Math.abs(arg)===2?2:1;}
 else if(action==='wait')elapsed=1;
 else if(action==='map'){if(g.speed>5){say(g,'You are moving too fast to map.');return false;}mapHere(g);mapCorridor(g);elapsed=0;}
 else if(action==='pickup'){if(!pickup(g,arg))return false;elapsed=0;}
 else if(['use','drop','info','throw'].includes(action)){
  const options=typeof arg==='object'&&arg?arg:{type:arg},i=item(g,options.type);if(!i)return false;
  if(action==='info'){say(g,`${label(i)} · ${ITEMS[i.type].weight*i.qty} ounces in weight${i.type==='lantern'?` · ${g.oil/6.25} pints oil · ${g.lit?'on':'off'}`:i.type==='gun'?` · ${i.load||0} darts loaded`:''}. ${itemPurpose(i)}`);return true;}
  if(action==='use')return use(g,i,options);
  if(action==='throw')return throwItem(g,i,options);
  const n=quantity(i,options.qty);if(!n)return false;const dropped=take(g,i,n);if(dropped.type!=='melon'||!melonBreaks(g,dropped))g.cells[index(g)].items.push(dropped);say(g,`You dropped ${label(dropped)}.`);elapsed=1;
 }else return false;
 if(elapsed&&g.status==='playing'){if(['move','turn','wait'].includes(action))lookForTraps(g,elapsed);advance(g,elapsed);if(g.status==='playing'&&['move','turn'].includes(action)){mapHere(g);benchmark(g);danger(g);}}return true;
}
export function exitChoice(g,leave){if(g.status!=='exit-choice')return;if(leave){g.status='won';const gold=item(g,'gold')?.qty||0;g.bank+=gold;g.prestige+=g.n*g.n*10+gold*5+RELICS.reduce((n,t)=>n+(item(g,t)?.broken?1000:4000),0);say(g,'A Heroic Adventurer returns to the light of day!');}else{g.status='playing';const key=item(g,'key');if(key)remove(g,key);nextLevel(g);}}
export function serialize(g){return JSON.stringify({version:3,game:g});}
export function restore(s){
 const v=JSON.parse(s),g=v?.game;
 const invalid=()=>{throw Error('Invalid saved game');};
 const integer=(n,min,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const object=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
 const list=(xs,check)=>Array.isArray(xs)&&xs.every(check);
 const bool=n=>typeof n==='boolean';
 const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
 const validItem=i=>object(i)&&Object.hasOwn(ITEMS,i.type)&&integer(i.qty,1)&&
  (i.id===undefined||integer(i.id,1))&&(i.broken===undefined||bool(i.broken))&&
  (i.load===undefined||integer(i.load,0,6))&&(i.handled===undefined||integer(i.handled,0));
 if(![2,3].includes(v?.version)||!object(g)||g.status!=='playing'||!integer(g.n,3,20))invalid();
 const area=g.n*g.n,position=p=>integer(p,0,area-1);
 if(!integer(g.x,0,g.n-1)||!integer(g.y,0,g.n-1)||!integer(g.dir,0,3)||!position(g.exit)||
  !integer(g.level,1)||!integer(g.speed,1,10)||!integer(g.rng,1,0xffffffff)||
  !['ticks','digestAt','healAt','oilClock'].every(k=>integer(g[k],0))||
  !['health','hunger','oil'].every(k=>finite(g[k],0,100))||
  !Number.isFinite(g.prestige)||!integer(g.bank,0)||!bool(g.lit)||!bool(g.oriented)||
  !list(g.inventory,validItem)||!list(g.messages,m=>typeof m==='string')||
  !object(g.notes)||!Object.entries(g.notes).every(([p,n])=>position(Number(p))&&typeof n==='string')||
  !list(g.spawnedRelics,r=>RELICS.includes(r)))invalid();
 for(const [key,check] of [['known',n=>integer(n,0,2)],['visited',bool],['explored',bool]]){
  if(!list(g[key],check)||g[key].length!==area)invalid();
 }
 const validTrap=t=>object(t)&&(t.type===undefined||['spear','wind','poisontrap','water'].includes(t.type))&&
  ['visible','sprung','covered'].every(k=>t[k]===undefined||bool(t[k]));
 if(!list(g.cells,c=>object(c)&&list(c.walls,bool)&&c.walls.length===4&&list(c.items,validItem)&&
  (c.trap==null||validTrap(c.trap))&&(c.traps===undefined||list(c.traps,validTrap))&&
  (c.depositDir===undefined||integer(c.depositDir,0,3))&&
  (c.writing===undefined||object(c.writing)&&Object.entries(c.writing).every(([d,t])=>integer(Number(d),0,3)&&typeof t==='string'))&&
  (c.decorations===undefined||list(c.decorations,d=>object(d)&&integer(d.dir,0,3)&&integer(d.picture,1000,1008))))||g.cells.length!==area)invalid();
 // Closed boundaries and reciprocal passages keep corridor scans and BFS bounded.
 for(let p=0;p<area;p++)for(let d=0;d<4;d++){
  const x=p%g.n+DIRS[d][0],y=Math.floor(p/g.n)+DIRS[d][1];
  if(x<0||y<0||x>=g.n||y>=g.n){if(!g.cells[p].walls[d])invalid();}
  else if(g.cells[p].walls[d]!==g.cells[y*g.n+x].walls[(d+2)%4])invalid();
 }
 if(distances(g,0).some(d=>!Number.isFinite(d)))invalid();
 if(v.version===2){g.animals=[];g.poisons=[];g.claimedRelics=g.inventory.filter(i=>RELICS.includes(i.type)).map(i=>i.type);g.interrupts=0;g.gunLoad=0;g.guardianSpawned=false;g.guardianTrigger=null;}
 if(!integer(g.interrupts,0)||!bool(g.guardianSpawned)||(g.guardianTrigger!==null&&!position(g.guardianTrigger))||
  !list(g.claimedRelics,r=>RELICS.includes(r))||
  !list(g.animals,a=>object(a)&&BEASTS.includes(a.type)&&position(a.p)&&integer(a.dir,0,3)&&
   ['awake','asleep','netted'].includes(a.state)&&integer(a.nextAt,0)&&list(a.carrying,validItem))||
  !list(g.poisons,p=>object(p)&&integer(p.at,0)))invalid();
 for(const c of g.cells)if(c.traps?.length)c.trap=c.traps[0];
 return g;
}
