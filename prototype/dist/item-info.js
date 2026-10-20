// Describe the effects implemented by the game, including passive relics.
const PURPOSES={
 food:'Eat to restore satiety; throw to feed animals.',
 glasses:'Use to see farther down the corridor.',
 lantern:'Lights the corridors while burning oil. Use to switch on or off.',
 oil:'Use to refill your lantern.',
 gold:'Deposit at the Bank of RA for prestige, or throw to distract monkeys.',
 key:'Unlocks this level’s exit. Face the exit door and use it.',
 darts:'Use to load your dart gun.',
 gun:'Fires anaesthetic darts to put animals to sleep. Load with darts first.',
 plank:'Lay over the square ahead to cross traps safely.',
 pole:'Probe the square ahead to spring traps safely or poke animals.',
 charcoal:'Use to leave a short message on an empty wall.',
 aid:'Use to tend wounds and recover some health.',
 cure:'Use to cure one dose of snake venom.',
 net:'Throw at an animal to capture it. Does not stop Guardians.',
 whip:'Crack to scare animals away; may also wake sleeping animals.',
 staff:'One of three relics needed to escape. Carry all three to the exit.',
 scarab:'Throw at a Guardian to destroy it. Also one of three relics needed to escape.',
 crown:'One of three relics needed to escape. Carry all three to the exit.',
 melon:'Eat to restore a little satiety.',
 compass:'Use to check which direction you are facing.'
};
export function itemPurpose(item){
 const purpose=PURPOSES[item.type]||'No special use.';
 return item.broken?`Broken — cannot be used. Normally: ${purpose}`:purpose;
}
