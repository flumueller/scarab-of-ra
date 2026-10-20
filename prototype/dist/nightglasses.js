import {corridor,index} from './engine.js';

// CODE 3:0036–00e0 initializes both the virtual position and a separate
// distance counter. The counter is not always equal to the view offset:
// stopping before an object increments it; reaching a wall does not.
export function createNightglassFocus(g){
 const line=[index(g),...corridor(g)];let position=0,counter=0;
 while(counter<7&&position+1<line.length){
  const p=line[position+1];
  if(g.cells[p].items.length||g.animals.some(a=>a.p===p)){counter++;break;}
  position++;counter++;
 }
 counter--;
 return {
  get cell(){return line[position];},
  // CODE 3:010c and 0156: allow farther at counter <=7, nearer at >1.
  canShift(delta){return delta===1?counter<=7&&position+1<line.length:delta===-1&&counter>1&&position>0;},
  shift(delta){if(!this.canShift(delta))return false;position+=delta;counter+=delta;return true;}
 };
}
