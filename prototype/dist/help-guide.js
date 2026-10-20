import {language,itemGerman} from './i18n.js';
import {topicsDE} from './guide-de.js';
import {ITEMS} from './item-types.js';
import {SPRITES} from './render.js';
const TOPICS=[
 ['Your expedition','The way back to sunlight',['crown','staff','scarab'],[
 ['Your goal','Find the Crown, Staff and Scarab of RA. Carry all three to an exit to escape the pyramid.'],
 ['One level at a time','Each floor is a maze. Find its key, stand at the exit and face the door to unlock it. Doors close behind you: you cannot return to an earlier floor.'],
 ['Stay alive','Keep an eye on health, satiety and lamp oil. Explore carefully and use the equipment left by earlier expeditions.']]],
 ['Movement','Explore at your own pace',[],[
 ['Move and turn','Use the arrow keys or WASD. Up / W steps forward; Down / S steps backward. Left and Right turn you on the spot. X turns you around.'],
 ['Look without moving','Hold Q, E or R to peek left, right or behind. Release to face forward again. The hollow arrows do the same.'],
 ['Wait and speed','Space waits one tick. Use the speed control to choose your pace: slower movement helps mapping and trap detection; faster movement can leave you disoriented.']]],
 ['Map & navigation','Keep your bearings',['compass','charcoal'],[
 ['Read the map','Press M or click the minimap. Walked areas, seen corridors and unexplored space are shown differently. IN marks the entrance; OUT marks the exit.'],
 ['Make a reliable map','At speed 5 or below you map your route. At speed 3 or below you also map the visible corridor. Moving faster can make you lose your place.'],
 ['Leave a reminder','Select a square in the map to add a note. Charcoal lets you write on an empty wall. A compass tells you which direction you face.']]],
 ['Inventory & tools','Choose the right equipment',['lantern','key','plank'],[
 ['Pick up','Stand on the item’s square and click Pick Up or press G. Choose a quantity when prompted.'],
 ['Inspect and use','Select an inventory item. Get Info / I explains its purpose and weight; Use / U activates it. Drop leaves it at your feet. Throw / T sends it down the corridor.'],
 ['Travel light','Heavy equipment limits your maximum speed. Some tools are fragile and can break when thrown. A plank covers the square ahead so you can cross traps safely.']]],
 ['Health, food & light','Watch your supplies',['food','oil','aid','cure'],[
 ['Health and poison','Health slowly recovers, but injuries and poison can overwhelm you. A first aid kit tends wounds. Snake bite cure removes one dose of venom.'],
 ['Satiety','Eat food or a melon before your satiety runs out. Food can also be thrown to distract animals.'],
 ['Lamp oil','Your lantern burns oil while lit. Use oil to refill it, or use the lantern to switch it on or off. Without light, exploring becomes much harder.']]],
 ['Animals','Share the corridors carefully',['lioness','cobra','monkey'],[
 ['Lioness','Can maul you, then retreat. Keep enough health in reserve.'],
 ['Cobra','Its bite poisons you. Repeated bites are especially dangerous; carry snake bite cure when possible.'],
 ['Monkey','Steals an inventory item and runs away. You may need to chase it to recover your equipment.'],
 ['Tools and caution','Move slowly past sleepers. Food, a bullwhip, a net or anaesthetic darts can help with animals. These tools do not stop Guardians.']]],
 ['Traps','The pyramid has its own defences',['pole','plank'],[
 ['Look ahead','Slow movement improves your chance of spotting hidden traps. A ten-foot pole can trigger a trap in the square ahead from a safe distance.'],
 ['Four hazards','Spears injure you; poisoned darts add venom. Wind can change your lantern’s state. Water can wash your map clean.'],
 ['Cross safely','Place a plank ahead over a trap before stepping onto it. A trap that has already sprung will not strike again.']]],
 ['Relics & Guardians','The price of the Scarab',['scarab','mummy'],[
 ['The three relics','Keep the Crown, Staff and Scarab for your escape. Finding them also earns prestige.'],
 ['The curse','Carrying the Scarab can awaken a Guardian. It is relentless and much more dangerous than an animal.'],
 ['Your defence','Throw the Scarab at a Guardian to destroy it, then recover the Scarab. Ordinary animal defences will not save you.']]],
 ['Gold & prestige','A successful expedition',['gold'],[
 ['Bank of RA','Use gold while standing at a deposit box to bank it and earn five prestige points per ounce. Deposit boxes are rare: they first become eligible on level 5.'],
 ['Other rewards','Exploration, finding relics and overcoming dangers earn prestige. Carry all three relics to an exit to finish, or choose to explore deeper.'],
 ['A costly mistake','Death costs a quarter of your prestige. Banked gold has already been scored and is not counted twice at the end.']]],
 ['Menus & saving','Pause and return later',[],[
 ['Save your expedition','Open Game → Save Game. Resume saved game restores the saved expedition in this browser.'],
 ['Settings','Adjust menu music and sound effects, show or hide the journal, switch the interface style or use fullscreen.'],
 ['Read the journal','The news box reports discoveries, injuries and item information. Open Help whenever you need a reminder.']]]
];
function node(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
export function mountGuide(host,manual){
 const layout=node('div',null,'guide-layout'),nav=node('nav',null,'guide-nav'),article=node('article',null,'guide-article');nav.setAttribute('aria-label','Help topics');article.tabIndex=0;
 const buttons=[];
 function select(button,title,subtitle,art,sections){
  for(const b of buttons){b.removeAttribute('aria-current');}button.setAttribute('aria-current','page');
  article.replaceChildren(node('p',subtitle,'guide-kicker'),node('h2',title));
  if(art.length){const strip=node('div',null,'guide-illustrations');for(const type of art){const figure=node('figure'),img=node('img');img.src=`assets/sprite_${SPRITES[type]}.png`;img.alt=language()==='de'?itemGerman(ITEMS[type]?.name||type):type==='mummy'?'Guardian':ITEMS[type]?.name||type;figure.append(img,node('figcaption',img.alt));strip.append(figure);}article.append(strip);}
  for(const [heading,copy] of sections){const section=node('section');if(heading)section.append(node('h3',heading));for(const para of copy.split(/\n+/).map(s=>s.trim()).filter(Boolean)){section.append(node('p',para.replace(/^•\s*/,''),para.startsWith('•')?'guide-bullet':''));}article.append(section);}article.scrollTop=0;
 }
 nav.append(node('p','FIELD GUIDE','guide-nav-label'));
 for(const [title,sub,art,sections] of (language()==='de'?topicsDE:TOPICS)){const b=node('button',title);b.type='button';b.onclick=()=>select(b,title,sub,art,sections);buttons.push(b);nav.append(b);}
 const hints=node('details'),summary=node('summary','Hints & tactics');hints.append(summary,node('p','Contains spoilers.','guide-hint-note'));
 for(const chapter of manual.Hint){const b=node('button',chapter.title);b.type='button';b.onclick=()=>select(b,chapter.title,'NOTES FROM EARLIER EXPEDITIONS',/Lion/.test(chapter.title)?['lioness']:/Cobra/.test(chapter.title)?['cobra']:/Monkey/.test(chapter.title)?['monkey']:/Guardian/.test(chapter.title)?['mummy']:[],[['',chapter.text]]);buttons.push(b);hints.append(b);}nav.append(hints);layout.append(nav,article);host.append(layout);buttons[0].click();
}
