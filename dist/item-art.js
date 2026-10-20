// Atlas order is verified against the generated 5 × 4 illustration sheet.
export const ITEM_ART=['lantern','food','oil','key','gold','plank','net','gun','darts','pole','aid','cure','glasses','charcoal','whip','staff','scarab','crown','melon','compass'];
export function itemArtPosition(type){const i=ITEM_ART.indexOf(type);return i<0?null:{x:(i%5)*25,y:Math.floor(i/5)*100/3};}
