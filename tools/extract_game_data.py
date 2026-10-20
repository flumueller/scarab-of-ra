"""Expand THINK C DATA/ZERO as CODE 1:00a0 does; decode the type table.
Offsets are A5-relative and verified against CODE 9:0bc4 and CODE 30:049e.
"""
from pathlib import Path
import struct,json
root=Path(__file__).resolve().parents[1];r=root/'reference/resources'
b=(r/'DATA_0.bin').read_bytes();z=(r/'ZERO_0.bin').read_bytes();out=bytearray();j=0
for i in range(0,len(b),2):
 word=b[i:i+2];out+=word
 if word==b'\0\0':
  n=struct.unpack_from('>H',z,j)[0];j+=2;out+=bytes(n)
assert j==len(z)
assert len(out)==struct.unpack_from('>I',(r/'CODE_0.bin').read_bytes(),4)[0]
(root/'reference/extracted/a5-globals.bin').write_bytes(out)
s=(r/'STRS_0.bin').read_bytes();base=len(out);rows=[]
for k in range(33):
 p=base-0x15d0+60*k;v=struct.unpack_from('>10h',out,p);ptr=struct.unpack_from('>I',out,p+20)[0]
 rows.append(dict(id=k,name=s[ptr:s.find(b'\0',ptr)].decode('macroman'),frequency=v[0],minQuantity=v[1],maxQuantity=v[2],weight=v[3],minDepth=v[6],maxDepth=v[7],flags=struct.unpack_from('>I',out,p+16)[0]))
(root/'reference/item-data.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Decoded 33 original type records; expanded globals:',len(out))
