from pathlib import Path
import struct, binascii
root=Path(__file__).resolve().parents[1]
p=root/'reference/original/Scarab14.sea.hqx'
out=root/'reference/extracted'
out.mkdir(parents=True,exist_ok=True)
alphabet='!"#$%&\'()*+,-012345689@ABCDEFGHIJKLMNPQRSTUVXYZ[`abcdefhijklmpqr'
s=p.read_text().split(':')[1]
bits=0; n=0; packed=bytearray()
for c in s:
 if c.isspace(): continue
 bits=(bits<<6)|alphabet.index(c); n+=6
 if n>=8:
  n-=8; packed.append((bits>>n)&255)
raw=bytearray(); i=0
while i<len(packed):
 c=packed[i]; i+=1
 if c!=0x90: raw.append(c); continue
 count=packed[i]; i+=1
 if count==0: raw.append(0x90)
 else: raw.extend([raw[-1]]*(count-1))
length=raw[0]; name=bytes(raw[1:1+length]).decode('mac_roman'); end=length+20
header=bytes(raw[:end]); typ,creator,flags,dl,rl=struct.unpack('>4s4sHII',raw[length+2:end])
print(dict(name=name,type=typ.decode('mac_roman'),creator=creator.decode('mac_roman'),data_length=dl,resource_length=rl))
o=end
for label,start,size in [('header',0,end),('data',end+2,dl),('resource',end+2+dl+2,rl)]:
 part=bytes(raw[start:start+size]); expected=struct.unpack('>H',raw[start+size:start+size+2])[0]
 print(label,'CRC valid:',binascii.crc_hqx(part,0)==expected)
 if label!='header': (out/('archive-'+label+'.bin')).write_bytes(part)
