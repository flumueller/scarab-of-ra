import {installDialogKeyboard} from './dialog-keyboard.js';
import {createSessionStore} from './session.js';
import {mountPresentation,language,presentation,t,itemGerman} from './i18n.js';
import {topicsDE,hintsDE} from './guide-de.js';
import {loadPresentationAssets} from './startup-assets.js';
import {listScores,submitScore} from './leaderboard.js';
import {createNightglassFocus} from './nightglasses.js';
import {mountMap} from './map-dialog.js';
import {mountGuide} from './help-guide.js';
import {eventSound} from './sound-events.js';
import {createAmbience,moved} from './ambience.js';
import {loadModernGraphics} from './modern-assets.js';
import {itemArtPosition} from './item-art.js';
import {drawModernView} from './modern-render.js';
import {createModernHud} from './modern-hud.js';
import {createModeController,isModeShortcut} from './ui-mode.js';
import {createGame,act,captureMessages,label,item,weight,maxSpeed,index,serialize,restore,say,exitChoice,canGo,corridor,throwLimit,ITEMS,refocus} from './engine.js';
import {drawView,loadGraphics,SPRITES} from './render.js';
import {drawMap,mapMetrics,drawMapLegend} from './map-render.js';
const $=s=>document.querySelector(s),modal=$('#modal'),body=$('#dialog-body'),actions=$('#dialog-actions');
installDialogKeyboard(modal);
const display=mountPresentation();
const ambience=createAmbience({onMusicState(state){const button=$('#start-sound');if(button)button.hidden=!(['blocked','paused','error'].includes(state)&&onStartScreen);}});let onStartScreen=true;
const SAVE='scarab-ra-prototype-v2';let g=createGame(),selected=null,peek=0,suspended=false,mapSelected=0,popup=null,sound=true,manual={Help:[],Hint:[]};
let hasBegun=false;
let sessionStorage;try{sessionStorage=window.localStorage;}catch{}
const session=createSessionStore(location.pathname.startsWith('/__')?null:sessionStorage);
const checkpoint=session.load();
if(checkpoint){g=checkpoint.game;suspended=checkpoint.suspended;hasBegun=true;}
let checkpointGeneration=0,sessionConflict=false,sessionActive=false;
function checkpointSession({replace=false}={}){
 if(replace){checkpointGeneration++;sessionConflict=false;}
 if(!hasBegun||!sessionActive||sessionConflict)return;
 const generation=checkpointGeneration,snapshot=JSON.parse(serialize(g)).game,options={begun:hasBegun,suspended,replace};
 const write=()=>{
  if(generation!==checkpointGeneration)return;
  session.save(snapshot,options);
  if(session.conflicted&&!sessionConflict){sessionConflict=true;suspended=true;dialog('Expedition open in another tab',[['Reload',()=>location.reload(),true]]);text('A newer expedition was saved in another tab. Reload to continue that expedition. This tab cannot overwrite it.');}
 };
 if(navigator.locks)navigator.locks.request('scarab-ra-session-write',write).catch(()=>{});else write();
}
window.addEventListener('pagehide',checkpointSession);
document.addEventListener('visibilitychange',()=>{if(document.hidden)checkpointSession();});
// Map notes mutate the game directly without rerendering the main HUD.
document.addEventListener('input',e=>{if(e.target.id==='map-note')checkpointSession();});
let lastView=null,paintFrame=0;
function paintView(canvas,state,look=0){
 lastView=[canvas,state,look];
 if(document.documentElement.dataset.uiMode==='modern')drawModernView(canvas,state,look);
 else{if(canvas.width!==304||canvas.height!==218){canvas.width=304;canvas.height=218;}drawView(canvas,state,look);}
}
function resizeView(){cancelAnimationFrame(paintFrame);paintFrame=requestAnimationFrame(()=>{if(lastView)paintView(...lastView);});}
new ResizeObserver(resizeView).observe($('#view').parentElement);
let preferenceStorage;try{preferenceStorage=window.localStorage;}catch{}
const uiMode=createModeController({root:document.documentElement,button:$('#ui-mode'),hintButton:$('#mode-hint'),storage:preferenceStorage,onChange:()=>{
 dismissMenu();resizeView();
 if(modal.open&&modal.classList.contains('original-map'))placeOriginalDialog(6,26);
 else if(modal.open&&modal.classList.contains('original-glasses'))placeOriginalDialog(189,40);
}});
const modernHud=createModernHud({onMap:map,onThrow:()=>inventoryAction('throw')});
$('#ui-mode').onclick=()=>uiMode.toggle();$('#mode-hint').onclick=()=>uiMode.toggle();
// Separate from gameplay keys: works while paused or in dialogs, but never
// consumes typed letters in notes, names or other editable controls.
window.addEventListener('keydown',e=>{if(isModeShortcut(e)){e.preventDefault();uiMode.toggle();}});

function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function close(){modal.close();peek=0;g.looking=false;render();}
function dialog(title,buttons){modal.classList.remove('original-map','original-glasses','expedition-intro','help-guide','modern-map');modal.removeAttribute('style');dismissMenu();peek=0;paintView($('#view'),g);$('#dialog-title').textContent=title;body.replaceChildren();actions.replaceChildren();for(const [name,fn,primary] of buttons){const b=el('button',name,primary?'primary':'');b.onclick=fn;b.autofocus=!!primary;actions.append(b);}if(!modal.open)modal.showModal();}
function text(s,cls){body.append(el('p',s,cls));}
function originalLabel(i){if(language()==='de'){const name=itemGerman(ITEMS[i.type].name),broken=i.broken?' (kaputt)':'';if(['food','gold','oil'].includes(i.type))return `${i.qty} ${i.type==='oil'?'Pint':i.qty===1?'Unze':'Unzen'} ${name}${broken}`;return `${name}${i.qty>1?' ×'+i.qty:''}${broken}`;}if(i.type==='food')return `${i.qty} ounce${i.qty===1?'':'s'} of food`;if(i.type==='oil')return `${i.qty} pint${i.qty===1?'':'s'} of oil`;if(i.type==='gold')return `${i.qty} ounce${i.qty===1?'':'s'} of gold`;if(['crown','staff','scarab'].includes(i.type))return 'the '+label(i);return (i.qty>1?i.qty+' ':/^[aeiou]/i.test(ITEMS[i.type].name)?'an ':'a ')+label(i)+(i.qty>1?'s':'');}
function render(){paintView($('#view'),g,peek);const inv=$('#inventory'),inventoryScroll=inv.scrollTop,inventoryHorizontal=inv.scrollLeft;inv.replaceChildren();if(!item(g,selected))selected=null;for(const i of g.inventory){const inventoryKey=i.type+(i.id?'@'+i.id:'');const b=el('button',undefined,'item');b.setAttribute('aria-label',originalLabel(i));b.title=originalLabel(i);const icon=el('img',undefined,'item-icon');icon.src=`assets/sprite_${SPRITES[i.type]}.png`;icon.alt='';b.append(icon);const artPosition=itemArtPosition(i.type);if(artPosition){const art=el('span',undefined,'item-art');art.setAttribute('aria-hidden','true');art.style.backgroundPosition=`${artPosition.x}% ${artPosition.y}%`;b.classList.add('has-item-art');b.append(art);}b.append(el('span',originalLabel(i),'item-name'),el('span',String(i.qty),'item-quantity'));if(i.broken)b.classList.add('broken');b.setAttribute('role','option');b.setAttribute('aria-selected',inventoryKey===selected);b.onclick=()=>{selected=inventoryKey;render();};b.ondblclick=()=>inventoryAction('use',inventoryKey);b.draggable=true;b.ondragstart=e=>e.dataTransfer.setData('text/plain',inventoryKey);b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();const moved=item(g,e.dataTransfer.getData('text/plain'));if(!moved||moved===i)return;g.inventory.splice(g.inventory.indexOf(moved),1);g.inventory.splice(g.inventory.indexOf(i),0,moved);render();};inv.append(b);}for(let empty=g.inventory.length;empty<16;empty++){const slot=el('div',undefined,'modern-only empty-slot');slot.setAttribute('aria-hidden','true');inv.append(slot);}inv.scrollTop=inventoryScroll;inv.scrollLeft=inventoryHorizontal;for(const id of ['use','info','drop'])$('#'+id).disabled=!selected||suspended||g.status!=='playing';$('#pickup').disabled=!g.cells[index(g)].items.length||suspended||g.status!=='playing';$('#prestige').textContent=g.prestige;$('#gold').textContent=g.bank;$('#health').value=g.health;$('#hunger').value=100-g.hunger;$('#weight').value=weight(g);$('#speed').replaceChildren();for(let i=1;i<=maxSpeed(g);i++){const o=el('option',i);o.value=i;o.selected=i===g.speed;$('#speed').append(o);}$('#compass-arrow').textContent=item(g,'compass')?['↑','→','↓','←'][g.dir]:'';const news=$('#news');news.replaceChildren(...g.messages.map(s=>el('p',s)));news.scrollTop=news.scrollHeight;for(const b of document.querySelectorAll('[data-action],[data-peek]'))b.disabled=suspended||g.status!=='playing';modernHud.render(g,item(g,selected),suspended,item(g,selected)?originalLabel(item(g,selected)):'');checkpointSession();}
function run(action,arg){if(onStartScreen||suspended||modal.open)return;dismissMenu();const before={x:g.x,y:g.y,health:g.health,status:g.status,level:g.level,lit:g.lit};const messages=captureMessages(g,()=>act(g,action,arg));if(sound){const cue=eventSound(before,g,messages);if(cue)ambience.effect(cue);else if(action==='move'&&moved(before,g))ambience.step();}peek=0;render();if(g.looking)nightglasses();else if(g.status==='exit-choice')endingChoice();else if(g.status==='dead')endDialog(false);}
function newGame(){leaveStart();g=createGame();selected=null;suspended=false;checkpointSession({replace:true});close();showIntro();}
function notes(){dialog('Browser prototype',[['OK',close,true]]);text('Original mode retains the 512 × 342 layout, extracted graphics and Help/Hints. Press O for the modern fullscreen HUD with item slots, a minimap and optional news.');text('Implemented from the 1.4 program: level growth, weighted depth-dependent stocking, four trap types, animal movement and tracking, Guardians, poison, tools, quantities, throwing, interruptible actions and relic/gold scoring.');text('The random sequence differs from QuickDraw. Some dialog layouts, wall inscriptions, the substitute system font and event ordering still need controlled emulator comparisons; this is not a claim of perfect equivalence.');text('Arrows/WASD move and turn; Q/E/R peek; X turns around; Space waits; G picks up; U uses; T throws; I inspects; M opens the map.');}
function about(){dialog('About Scarab of RA',[['OK',close,true]]);const pic=el('img');pic.src='assets/PICT_1000.png';pic.style.cssText='float:left;margin:0 20px 15px 0;image-rendering:pixelated;width:74px;height:94px';body.append(pic);text('Scarab of RA');text('Original version 1.4');text('Copyright © 1987–1992 by Rick Holzgrafe. Semicolon Software.');text('Browser reconstruction prototype. Original artwork and reference text preserved for this private study.');}
function status(){dialog('Full Status',[['Resume',close,true],['Save Game…',save]]);text(`You have penetrated to level ${g.level} of the Great Pyramid of RA.`);text(`Prestige: ${g.prestige}. Gold in the Bank of RA: ${g.bank} ounces.`);text(`Health: ${Math.round(g.health)}%. Hunger: ${Math.round(g.hunger)}%. Weight: ${weight(g)} ounces.`);text(`Lantern: ${g.oil/6.25} pints of oil, ${g.lit?'lit':'unlit'}.`);text(g.poisons.length?`Poisoned: ${g.poisons.length} active dose(s).`:'No poison in your system.');}
function save(){if(g.status!=='playing'||suspended)return;try{localStorage.setItem(SAVE,serialize(g));suspended=true;dialog('Saved Game',[['Resume Game',resume,true],['New Game',newGame]]);text('Your expedition has been saved. You can close this browser tab. Resuming consumes the saved game.');render();}catch{dialog('Cannot save',[['Resume',close,true]]);text('Local storage is unavailable. Your expedition is still in memory.');}}
function resume(){
 const previous=g,wasSuspended=suspended,previousSelection=selected;
 try{
  const raw=localStorage.getItem(SAVE);if(!raw)throw Error();
  const restored=restore(raw);say(restored,'Welcome back to the Great Pyramid of RA!');
  g=restored;suspended=false;selected=null;
  // Keep the saved copy until the restored expedition has rendered successfully.
  render();leaveStart();close();localStorage.removeItem(SAVE);checkpointSession({replace:true});
 }catch{
  g=previous;suspended=wasSuspended;selected=previousSelection;
  dialog('Cannot open saved game',[['Back',close,true],['New Game',newGame]]);
  text('The saved game could not be opened. Your saved copy has been kept.');
  render();
 }
}
function map(){if(suspended)return;if(uiMode.mode==='modern'){dialog('Expedition map',[['Close map',close,true]]);modal.classList.add('modern-map');mountMap(body,g);return;}mapSelected=index(g);dialog('Map',[['Put Map Away',close,true]]);const layout=el('div',undefined,'map-layout'),side=el('div'),grid=el('div',undefined,'map-grid');const tracks=Array(g.n).fill(`${mapMetrics(g.n).step}px`).join(' ');grid.style.gridTemplateColumns=tracks;grid.style.gridTemplateRows=tracks;side.append(el('p',g.oriented?'You are here':'You are lost!','legend'));side.append(el('p','Notes pointer\nMapped and walked\nMapped, not walked\nUnmapped','legend'));const legendCanvas=el('canvas',undefined,'map-legend-patterns');legendCanvas.setAttribute('aria-hidden','true');drawMapLegend(legendCanvas);side.append(legendCanvas);const note=el('textarea');note.id='map-note';note.setAttribute('aria-label','Map notes');note.placeholder='Your notes here.';note.maxLength=300;side.append(note);let original=g.notes[mapSelected]||'';const cancel=el('button','Cancel New Note');cancel.onclick=()=>{g.notes[mapSelected]=original;note.value=original;draw();};side.append(cancel);const draw=()=>{const canvas=el('canvas');canvas.setAttribute('aria-hidden','true');grid.replaceChildren(canvas);drawMap(canvas,g,mapSelected);for(let p=0;p<g.cells.length;p++){const b=el('button',undefined,'map-cell'+(g.known[p]===2?' walked':g.known[p]===1?' known':'')+(mapSelected===p?' selected':''));b.setAttribute('aria-label',`Square ${p%g.n+1}, ${Math.floor(p/g.n)+1}${g.known[p]===2?', mapped and walked':g.known[p]===1?', mapped, not walked':', unmapped'}${p===index(g)&&g.oriented?', you are here':''}`);b.onclick=()=>{mapSelected=p;original=g.notes[p]||'';note.value=original;draw();};grid.append(b);}};note.value=original;note.oninput=()=>{g.notes[mapSelected]=note.value;draw();};draw();layout.append(side,grid);body.append(layout);modal.classList.add('original-map');placeOriginalDialog(6,26);}
// Layout at the chosen integer zoom; never magnify a composited dialog bitmap.
function placeOriginalDialog(x,y){if(uiMode.mode==='modern'&&modal.classList.contains('original-glasses')){modal.removeAttribute('style');return;}if(uiMode.mode==='modern'){const isMap=modal.classList.contains('original-map'),w=isMap?500:134,h=isMap?310:106,z=innerWidth>=1040&&innerHeight>=700&&isMap?2:Math.min(1,(innerWidth-24)/w);modal.style.cssText=`left:${Math.max(0,(innerWidth-w*z)/2)/z}px;top:${Math.max(12,(innerHeight-h*z)/2)/z}px;zoom:${z};transform:none;`;return;}const r=$('.mac').getBoundingClientRect(),scale=Math.max(1,Math.round(r.width/512));modal.style.cssText=`left:${Math.round(r.left)/scale+x}px;top:${Math.round(r.top)/scale+y}px;zoom:${scale};transform:none;`;}
window.addEventListener('resize',()=>{if(modal.open&&modal.classList.contains('original-map'))placeOriginalDialog(6,26);else if(modal.open&&modal.classList.contains('original-glasses'))placeOriginalDialog(189,40);});
for(const bar of document.querySelectorAll('[data-scroll-target]')){
 const target=$('#'+bar.dataset.scrollTarget),step=bar.dataset.scrollTarget==='news'?15:16;
 for(const [selector,amount] of [['.scroll-up',-step],['.scroll-down',step],['.scroll-track',()=>target.clientHeight-step]]){
  const button=bar.querySelector(selector);let delay,repeat;
  const scroll=()=>{target.scrollTop+=typeof amount==='function'?amount():amount;};
  const stop=()=>{clearTimeout(delay);clearInterval(repeat);};
  button.onclick=scroll;
  button.onpointerdown=e=>{if(e.button!==0)return;stop();button.setPointerCapture(e.pointerId);delay=setTimeout(()=>{scroll();repeat=setInterval(scroll,70);},350);};
  button.onpointerup=stop;button.onpointercancel=stop;button.onlostpointercapture=stop;window.addEventListener('blur',stop);
 }
}
function currentManual(){return language()==='de'?{Help:topicsDE.map(([title,,art,sections])=>({title,text:sections.map(([h,p])=>h+'\n'+p).join('\n\n')})),Hint:hintsDE}:manual;}
function showHelp(section,chapter){dialog(language()==='de'?`${section==='Help'?'Hilfe':'Hinweise'}: ${chapter.title}`:`${section==='Help'?'Help':'Hints'} on ${chapter.title}`,[['OK',close,true]]);text(chapter.text,'original-help');}
function endingChoice(){dialog('Scarab of RA',[['Yes',()=>{exitChoice(g,true);if(sound)ambience.effect('victory');render();endDialog(true);},true],['No',()=>{exitChoice(g,false);if(sound)ambience.effect('door');close();}]]);text('You spy a passage leading to sunlight. Are you ready to end your adventure now?');}
async function scoreList(){
 dialog('Dean’s List',[['OK',close,true]]);
 const content=el('div');content.setAttribute('aria-live','polite');content.append(el('p','Loading the shared leaderboard…'));body.append(content);
 try{
  const rows=await listScores();if(!content.isConnected||!modal.open)return;
  content.replaceChildren();
  if(!rows.length)content.append(el('p','The Top Scores list is empty.'));
  for(const [k,r] of rows.entries()){const row=el('p',language()==='de'?`${k+1}. ${r.name} — ${r.prestige} Ansehenspunkte — Ebene ${r.level} (${t(r.status)})`:`${k+1}. ${r.name} — ${r.prestige} points — level ${r.level} (${r.status})`);row.translate=false;content.append(row);}
  content.append(el('p','Shared by all players.'));
 }catch{
  if(!content.isConnected||!modal.open)return;
  content.replaceChildren(el('p','The shared leaderboard could not be loaded. Please try again.'));
  const retry=el('button','Try again');retry.onclick=scoreList;content.append(retry);
 }
}
function endDialog(won){
 const expedition=g;let sending=false;
 dialog('Full Status',[['New Game',newGame],['See Map',map],['Record Score',async()=>{
  if(sending||expedition.scoreRecorded)return;
  const name=input.value.trim()||'Adventurer';
  if(/[\x00-\x1f\x7f]/.test(name)){feedback.textContent='Please enter a name without control characters.';return;}
  sending=true;record.disabled=true;input.disabled=true;feedback.textContent='Saving your score…';
  try{
   // Keep the same payload on retries, even if the first response was lost.
   expedition.scoreSubmission??={submissionId:crypto.randomUUID(),name,prestige:expedition.prestige,level:expedition.level,status:expedition.status};
   await submitScore(expedition.scoreSubmission);expedition.scoreRecorded=true;
   if(feedback.isConnected&&modal.open&&g===expedition)scoreList();
  }catch{
   if(feedback.isConnected&&modal.open){feedback.textContent='Your score could not be confirmed. Try again; it will not be recorded twice.';record.disabled=false;}
  }finally{sending=false;}
 },true]]);
 text(won?'A Heroic Adventurer returns to the light of day!':(g.deathMessage||g.messages.at(-1)));
 text(`You reached level ${g.level} with ${g.prestige} prestige points.`);
 const input=el('input');input.maxLength=32;input.placeholder='Adventurer';input.setAttribute('aria-label','Your name');
 if(expedition.scoreSubmission){input.value=expedition.scoreSubmission.name;input.disabled=true;}
 body.append(input);
 const feedback=el('p');feedback.setAttribute('role','status');body.append(feedback);
 const record=actions.lastElementChild;record.disabled=!!expedition.scoreRecorded;
 if(expedition.scoreRecorded)feedback.textContent='Your score is already on the shared leaderboard.';
}

function inventoryAction(action,type=selected){
 if(suspended||modal.open||g.status!=='playing')return;const i=item(g,type);if(!i)return;const inventoryKey=type;type=i.type;
 if(action==='use'&&type==='net')action='throw';
 const needsQuantity=i.qty>1&&(action==='drop'||action==='throw'||['food','oil','darts','gold'].includes(type));
 const writing=action==='use'&&type==='charcoal';
 if(!needsQuantity&&action!=='throw'&&!writing){run(action,inventoryKey);return;}
 let qty,distance,message;
 dialog(action==='throw'?'Throw':writing?'Write on the wall':'How many?',[['Cancel',close],['OK',()=>{
  const amount=qty?Number(qty.value):1;if(!Number.isInteger(amount)||amount<1||amount>i.qty){qty?.reportValidity();return;}
  const steps=distance?Number(distance.value):undefined;if(distance&&(!Number.isInteger(steps)||steps<1||steps>throwLimit(g,i,amount))){distance.reportValidity();return;}
  const textValue=message?.value.trim();if(writing&&!textValue){message.reportValidity();return;}
  close();run(action,{type:inventoryKey,qty:needsQuantity?amount:undefined,distance:steps,text:textValue});
 },true]]);
 text(label(i));
 if(needsQuantity){const l=el('label','Quantity ');qty=el('input');qty.type='number';qty.min=1;qty.max=i.qty;qty.value=action==='throw'?1:i.qty;qty.required=true;qty.setAttribute('aria-label','Quantity');l.append(qty);body.append(l);}
 if(action==='throw'){const l=el('label','Distance in steps ');distance=el('input');distance.type='number';distance.min=1;distance.max=throwLimit(g,i,Number(qty?.value||1));distance.value=1;distance.required=true;distance.setAttribute('aria-label','Distance in steps');l.append(distance);body.append(l);const hint=el('p');const update=()=>{distance.max=throwLimit(g,i,Number(qty?.value||1));hint.textContent=`Maximum: ${distance.max} steps with this quantity.`;};if(qty)qty.oninput=update;update();body.append(hint);}
 if(writing){message=el('input');message.maxLength=32;message.required=true;message.setAttribute('aria-label','Wall message');body.append(message);}
}
function pickupDialog(){
 if(suspended||modal.open||g.status!=='playing')return;
 const objects=g.cells[index(g)].items;if(objects.length===1&&objects[0].qty===1){run('pickup');return;}
 const pickupRows=[];
 dialog('Pick Up',[['Cancel',close],[objects.length===1?'Pick Up':'Pick Up All',()=>{if(pickupRows.length===1)pickupRows[0].click();else{close();run('pickup');}},true]]);
 if(!objects.length){actions.lastElementChild.disabled=true;text('There is nothing here you can pick up.');return;}
 for(const i of objects){const row=el('p'),b=el('button',label(i)),q=el('input');q.type='number';q.min=1;q.max=i.qty;q.value=i.qty;q.required=true;q.setAttribute('aria-label',`Quantity of ${ITEMS[i.type].name}`);b.onclick=()=>{const qty=Number(q.value);if(!Number.isInteger(qty)||qty<1||qty>i.qty){q.reportValidity();return;}close();run('pickup',{type:i.type,qty,floorIndex:objects.indexOf(i)});};q.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();if(!e.repeat)b.click();}};pickupRows.push(b);row.append(b,q);body.append(row);}
 actions.lastElementChild.focus();
}
function nightglasses(){
 const focus=createNightglassFocus(g),controls=[];
 const redraw=()=>{const p=focus.cell;paintView($('#view'),{...g,x:p%g.n,y:Math.floor(p/g.n)});for(const [button,delta] of controls)button.disabled=!focus.canShift(delta);};
 const shift=delta=>{if(!focus.shift(delta))return;if(!refocus(g)){close();if(g.status==='dead')endDialog(false);return;}render();redraw();};
 dialog('Nightglasses',[['Done',close,true]]);modal.classList.add('original-glasses');
 for(const [label,delta,picture] of [['Look Farther',1,129],['Look Nearer',-1,133]]){const row=el('div'),b=el('button');b.setAttribute('aria-label',label);const img=el('img');img.src=`assets/PICT_${picture}.png`;img.alt='';b.append(img);b.onclick=()=>shift(delta);controls.push([b,delta]);row.append(el('span',label),b);body.append(row);}
 placeOriginalDialog(189,40);redraw();
}
function dismissMenu(){popup?.remove();popup=null;}
function menu(anchor,entries){const was=popup?.dataset.anchor===anchor.id;dismissMenu();if(was)return;popup=el('div',undefined,'menu-popup');popup.dataset.anchor=anchor.id;popup.setAttribute('role','menu');const r=anchor.getBoundingClientRect();popup.style.left=r.left+'px';popup.style.top=r.bottom+'px';for(const entry of entries){if(!entry){popup.append(el('hr'));continue;}const [name,fn,disabled]=entry,b=el('button',name);b.setAttribute('role','menuitem');b.disabled=!!disabled;b.onclick=()=>{dismissMenu();fn();};popup.append(b);}document.body.append(popup);const rect=popup.getBoundingClientRect();if(rect.right>innerWidth)popup.style.left=Math.max(0,innerWidth-rect.width-4)+'px';}
$('#gameMenu').onclick=e=>menu(e.currentTarget,[['Main Menu',showStart],['Full Status…',status],['Top Scores…',scoreList],null,[sound?'✓ Sound':'Sound',()=>{sound=!sound;}],null,['Save Game…',save,suspended||g.status!=='playing'],['Resume Saved Game…',resume],null,['New Game…',()=>{dialog('New Game',[['Cancel',close],['New Game',newGame,true]]);text('End this expedition and begin another?');}],['Quit…',()=>{dialog('Full Status',[['Resume',close,true],['Quit',()=>{g.status='quit';say(g,'You have asked to resign.');render();endDialog(false);}]]);text(`If you quit now, you will have ${g.prestige} prestige points.`);}]]);
$('#editMenu').onclick=e=>menu(e.currentTarget,[['Undo',()=>{},true],null,['Cut',()=>{},true],['Copy',()=>{},true],['Paste',()=>{},true],['Clear',()=>{},true]]);
$('#mapMenu').onclick=e=>menu(e.currentTarget,[['See Map…       M',map],['Add To Map',()=>run('map')],null,['Which Way Can I Go?',()=>{const names=['forward','right','backward','left'];const dirs=names.filter((_,i)=>canGo(g,(g.dir+i)%4));say(g,'You can go '+dirs.join(', ')+'.');render();}]]);
$('#speedMenu').onclick=e=>menu(e.currentTarget,[["Slowest          1",()=>run('speed',1)],["Map Everything   3",()=>run('speed',3)],["Map Route        5",()=>run('speed',5)],["Fastest          F",()=>run('speed',maxSpeed(g))],null,['Set Speed…',()=>{dialog('How Fast?',[['Cancel',close],['OK',()=>{act(g,'speed',body.querySelector('input').value);close();},true]]);const inp=el('input');inp.type='number';inp.min=1;inp.max=maxSpeed(g);inp.value=g.speed;inp.setAttribute('aria-label','Speed');body.append(inp);}]]);
$('#inventoryMenu').onclick=e=>menu(e.currentTarget,[['Drop',()=>inventoryAction('drop'),!selected],['Get Info         I',()=>run('info',selected),!selected],['Throw            T',()=>inventoryAction('throw'),!selected],['Use              U',()=>inventoryAction('use'),!selected]]);
$('#helpMenu').onclick=e=>{if(uiMode.mode==='modern'){dialog('Expedition field guide',[['Close',close,true]]);modal.classList.add('help-guide');mountGuide(body,currentManual());return;}menu(e.currentTarget,[...currentManual().Help.map(ch=>[ch.title,()=>showHelp('Help',ch)]),null,['Hints…',()=>{dialog('Hints',[['Close',close,true]]);for(const ch of currentManual().Hint){const b=el('button',ch.title);b.onclick=()=>showHelp('Hint',ch);body.append(b);}}]]);};$('#hintsMenu').onclick=e=>menu(e.currentTarget,currentManual().Hint.map(ch=>[ch.title,()=>{dialog('Hints',[['Cancel',close],['Yes',()=>showHelp('Hint',ch),true]]);text('Do you really want a hint?');}]));
for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>run(b.dataset.action,Number(b.dataset.value)||undefined);
function clearPeek(){if(peek){peek=0;render();}}
for(const b of document.querySelectorAll('[data-peek]')){b.onpointerdown=e=>{if(modal.open||suspended||g.status!=='playing')return;e.preventDefault();dismissMenu();b.setPointerCapture(e.pointerId);peek=Number(b.dataset.peek);render();};b.onpointerup=clearPeek;b.onpointercancel=clearPeek;b.onlostpointercapture=clearPeek;}
$('#pickup').onclick=pickupDialog;$('#use').onclick=()=>inventoryAction('use');$('#info').onclick=()=>run('info',selected);$('#drop').onclick=()=>inventoryAction('drop');$('#speed').onchange=e=>run('speed',e.target.value);$('#about').onclick=about;$('#prototypeNotes').onclick=notes;$('#scale').onclick=()=>document.body.classList.toggle('small');
window.addEventListener('pointerdown',e=>{if(popup&&!popup.contains(e.target)&&!e.target.closest('.menubar'))dismissMenu();});
window.addEventListener('keydown',e=>{if(onStartScreen)return;if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(e.key==='Escape'){dismissMenu();return;}if(modal.open){if(e.key.toLowerCase()==='m'&&$('#map-note')){e.preventDefault();close();}return;}const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(e.repeat||suspended||g.status!=='playing')return;const peeks={q:-1,e:1,r:2};if(k in peeks){peek=peeks[k];render();return;}const keys={arrowup:['move',1],w:['move',1],arrowdown:['move',-1],s:['move',-1],arrowleft:['turn',-1],a:['turn',-1],arrowright:['turn',1],d:['turn',1],x:['turn',2],' ':['wait'],g:['pickup'],u:['use',selected],i:['info',selected],'1':['speed',1],'3':['speed',3],'5':['speed',5],f:['speed',maxSpeed(g)]};if(k==='t'){e.preventDefault();inventoryAction('throw');}else if(k==='u'){e.preventDefault();inventoryAction('use');}else if(k==='g'){e.preventDefault();pickupDialog();}else if(keys[k]){e.preventDefault();run(...keys[k]);}else if(k==='m')map();});window.addEventListener('keyup',e=>{if(['q','e','r'].includes(e.key.toLowerCase()))clearPeek();});window.addEventListener('blur',clearPeek);modal.addEventListener('close',()=>{if(modal.open)return;peek=0;g.looking=false;render();});modal.addEventListener('cancel',e=>{if(suspended||g.status==='exit-choice')e.preventDefault();});
const screen=el('section',undefined,'start-screen');screen.id='start-screen';screen.hidden=true;screen.setAttribute('aria-label','Main menu');
screen.innerHTML=`<div class="start-content"><img class="start-logo" src="assets/menu-logo.png" alt="Scarab of RA"><nav aria-label="Start navigation"><button id="start-continue">Enter the pyramid</button><button id="start-new">New expedition</button><button id="start-load">Resume saved game</button><button id="start-scores">Top Scores</button><button id="start-settings">Settings</button></nav><p>AN EXPEDITION INTO THE GREAT PYRAMID</p><div class="start-sound-slot"><button id="start-sound" hidden>Play sound</button></div><footer class="start-credits"><span>Original game · Semicolon Software</span><span>© 1987–1992 Rick Holzgrafe</span></footer></div>`;document.body.append(screen);
$('#start-sound').onclick=()=>ambience.menu(true);
$('#start-continue').onclick=()=>{if(suspended){resume();return;}const first=!hasBegun;leaveStart();if(g.status==='exit-choice')endingChoice();else if(first)showIntro();};$('#start-new').onclick=()=>{if(hasBegun){dialog('New expedition',[['Cancel',close],['Begin',()=>{hasBegun=true;newGame();},true]]);text('End the current expedition and start again?');}else{hasBegun=true;newGame();}};$('#start-load').onclick=resume;$('#start-scores').onclick=scoreList;$('#start-settings').onclick=settings;
const settingsButton=el('button','Settings','modern-only');settingsButton.id='settingsMenu';settingsButton.onclick=settings;$('.menubar').insertBefore(settingsButton,$('#mode-hint'));
await Promise.all([loadGraphics(),loadModernGraphics(),loadPresentationAssets(),
 (async()=>{try{manual=await (await fetch('assets/manual.json',{signal:AbortSignal.timeout(8000)})).json();}catch{console.warn('Original manual unavailable');}})()
]);render();
if(!location.pathname.startsWith('/__'))showStart();
else{onStartScreen=false;$('.desktop').inert=false;document.documentElement.dataset.screen='game';}

function settings(){
 dialog('Settings',[['Done',close,true]]);
 const languageLabel=el('label','Language','audio-setting'),languageSelect=el('select');languageSelect.id='language-setting';languageSelect.setAttribute('aria-label','Language');
 for(const [value,name] of [['en','English'],['de','Deutsch']]){const option=el('option',name);option.value=value;option.selected=language()===value;languageSelect.append(option);}
 languageSelect.onchange=()=>{display.set({language:languageSelect.value});render();settings();$('#language-setting').focus();};languageLabel.append(languageSelect);body.append(languageLabel);
 const colourLabel=el('label','Subtle colour','audio-setting'),colourSelect=el('select');colourSelect.id='colour-setting';colourSelect.setAttribute('aria-label','Subtle colour');
 for(const [value,name] of [['mono','Black and white'],['sandstone','Warm sandstone']]){const option=el('option',name);option.value=value;option.selected=(presentation().colour?'sandstone':'mono')===value;colourSelect.append(option);}
 colourSelect.onchange=()=>{display.set({colour:colourSelect.value==='sandstone'});render();};colourLabel.append(colourSelect);body.append(colourLabel);
 for(const [key,name] of [['music','Menu music'],['effects','Sound effects']]){const label=el('label',name,'audio-setting'),input=el('input');input.type='range';input.min=0;input.max=1;input.step=.05;input.value=ambience.prefs[key];input.setAttribute('aria-label',name);input.oninput=()=>ambience.set(key,input.value);label.append(input);body.append(label);}
 for(const [name,id] of [['Switch Original / Modern','ui-mode'],['Show / hide journal','toggle-news'],['Fullscreen','fullscreen']]){const b=el('button',name);b.onclick=()=>{if(id==='fullscreen')close();$('#'+id).click();};body.append(b);}
}
function leaveStart(){sessionActive=true;document.documentElement.dataset.screen='game';hasBegun=true;onStartScreen=false;$('#start-screen').hidden=true;$('.desktop').inert=false;ambience.menu(false);checkpointSession();}
function showStart(){dismissMenu();if(modal.open)modal.close();onStartScreen=true;document.documentElement.dataset.screen='menu';$('.desktop').inert=true;$('#start-screen').hidden=false;ambience.menu(true);$('#start-continue').hidden=!['playing','exit-choice'].includes(g.status);$('#start-continue').textContent=hasBegun?'Continue expedition':'Enter the pyramid';$('#start-new').hidden=!hasBegun;try{$('#start-load').hidden=!localStorage.getItem(SAVE);}catch{$('#start-load').hidden=true;}$('#start-continue').focus();}

function showIntro(){
 dialog('The Great Pyramid of RA', [['Enter the pyramid',close,true]]);
 modal.classList.add('expedition-intro');
 const logo=el('img',undefined,'intro-emblem');logo.src='assets/menu-logo.png';logo.alt='Scarab of RA';body.append(logo);
 text('BENEATH THE SANDS','intro-kicker');
 text('A violent sandstorm has uncovered the lost Great Pyramid of RA. Other expeditions have entered its ancient halls. None have returned.');
 text('With a lantern and a little food, you slip inside. The stone door closes behind you. The only way forward is deeper into the pyramid.');
 const goal=el('section',undefined,'intro-goal');goal.append(el('h3','Find the three sacred relics'),el('p','Recover the Crown, the Staff and the Scarab of RA. Carry all three to an exit to find your way back to sunlight.'));body.append(goal);
 text('Find each level’s key to unlock the next door. Watch your health, food and lamp oil — and beware the Guardians awakened by the Scarab.');
 text('Move with the arrows or WASD · G to pick up · I for item info','intro-controls');
}
