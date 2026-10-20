"""Export the original Mac resource fork without executing the game."""
from pathlib import Path
import struct, json, hashlib
root=Path(__file__).resolve().parents[1]
p=root/'reference/extracted/Scarab of RA 1.4.rsrc'
b=p.read_bytes()
u16=lambda b,o:struct.unpack_from('>H',b,o)[0]
u32=lambda b,o:struct.unpack_from('>I',b,o)[0]
assert u32(b,0)==0x00051607, 'Expected AppleDouble'
for i in range(u16(b,24)):
 ident,off,size=struct.unpack_from('>III',b,26+i*12)
 if ident==2: fork=b[off:off+size]; break
else: raise ValueError('Missing resource fork')
(root/'reference/extracted/game-resource-fork.bin').write_bytes(fork)
doff,moff,dlen,mlen=struct.unpack_from('>IIII',fork)
assert doff+dlen<=len(fork) and moff+mlen<=len(fork)
types=moff+u16(fork,moff+24); names=moff+u16(fork,moff+26)
out=root/'reference/resources'; out.mkdir(exist_ok=True)
rows=[]; texts=[]
for i in range(u16(fork,types)+1):
 o=types+2+8*i; typ=fork[o:o+4].decode('mac_roman'); count=u16(fork,o+4)+1; refs=types+u16(fork,o+6)
 for j in range(count):
  r=refs+j*12; rid=struct.unpack_from('>h',fork,r)[0]; noff=u16(fork,r+2)
  name=None if noff==65535 else fork[names+noff+1:names+noff+1+fork[names+noff]].decode('mac_roman')
  dataoff=doff+int.from_bytes(fork[r+5:r+8],'big'); size=u32(fork,dataoff); data=fork[dataoff+4:dataoff+4+size]; assert len(data)==size
  safe=''.join(c if c.isalnum() else '_' for c in typ); filename=f'{safe}_{rid}.bin'; (out/filename).write_bytes(data)
  rows.append(dict(type=typ,id=rid,name=name,size=size,file=filename,sha256=hashlib.sha256(data).hexdigest()))
  decoded=[]
  if typ in ('Help','Hint','TEXT'): decoded=[data.decode('mac_roman').replace('\r','\n')]
  elif typ=='STRS': decoded=[s.decode('mac_roman').replace('\r','\n') for s in data.split(b'\0') if s]
  elif typ=='STR ': decoded=[data[1:1+data[0]].decode('mac_roman')]
  elif typ=='STR#':
   pos=2
   for k in range(u16(data,0)):
    n=data[pos]; pos+=1; decoded.append(data[pos:pos+n].decode('mac_roman')); pos+=n
  if decoded: texts.append(f'=== {typ} {rid} {name or ""} ===\n'+'\n'.join(decoded))
(root/'reference/resource-inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
(root/'reference/original-texts.txt').write_text('\n\n'.join(texts))
from collections import Counter
print(json.dumps(dict(Counter(r['type'] for r in rows)),indent=2)); print('Total resources:',len(rows))
