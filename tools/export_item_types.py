"""Export the verified 33-type table for the browser. Run extract_game_data.py first."""
import json,struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]
keys='lioness monkey food glasses lantern oil gold spear message deposit key darts gun plank pole charcoal aid cure wind poisontrap net whip water cobra picture benchmark staff scarab crown melon compass mummy makemummy'.split()
names={'glasses':'pair of nightglasses','darts':'dart','gun':'anaesthetic dart gun','pole':'ten-foot pole','charcoal':'piece of charcoal','cure':'bottle of snake bite cure','melon':'small melon','aid':'first aid kit','net':'net','whip':'bullwhip','staff':'Staff of RA','scarab':'Scarab of RA','crown':'Crown of RA','spear':'spear trap','wind':'wind trap','poisontrap':'poison dart trap','water':'water trap','deposit':'deposit box'}
b=(root/'reference/extracted/a5-globals.bin').read_bytes()
rows=json.loads((root/'reference/item-data.json').read_text())
for row,key in zip(rows,keys):
 row['type']=key;row['name']=names.get(key,key)
 row['interval']=struct.unpack_from('>h',b,len(b)-0x15d0+60*row['id']+10)[0]
 row['breakable']=bool(row['flags']&0x200000)
 if key in ['food','oil','gold']:row['unit']='pints' if key=='oil' else 'ounces'
(root/'dist/item-types.js').write_text('// Extracted from Scarab 1.4 DATA/ZERO, 33 records at A5-$15d0.\nexport const TYPES='+json.dumps(rows,indent=2)+';\nexport const ITEMS=Object.fromEntries(TYPES.map(t=>[t.type,t]));\n')
