"""Decode the monochrome QuickDraw bitmap PICTs from the original archive.
Only handles observed v1 opcodes; fails rather than silently skipping drawing.
"""
from pathlib import Path
import struct,json
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
out=root/'dist/assets';out.mkdir(exist_ok=True)
def decode(data):
 pos=10
 def take(n):
  nonlocal pos
  b=data[pos:pos+n];pos+=n
  assert len(b)==n
  return b
 def u16():return struct.unpack('>H',take(2))[0]
 def rect():return struct.unpack('>hhhh',take(8))
 top,left,bottom,right=struct.unpack_from('>hhhh',data,2)
 im=Image.new('1',(right-left,bottom-top),1)
 while pos<len(data):
  op=take(1)[0]
  if op==0xff:break
  if op==0:continue
  if op==0x11:assert take(1)==b'\x01'
  elif op==0xa0:take(2)
  elif op==0xa1:take(2);take(u16())
  elif op==1:
   n=u16();take(n-2)
  elif op in (0x90,0x98,0x91,0x99):
   rowbytes=u16();assert rowbytes<0x8000
   bt,bl,bb,br=rect();src=rect();dst=rect();mode=u16();assert mode in (0,1,2,3)
   if op in (0x91,0x99):n=u16();take(n-2)
   rows=[]
   for y in range(bb-bt):
    if op in (0x98,0x99) and rowbytes>=8:
     size=u16() if rowbytes>250 else take(1)[0];packed=take(size);row=bytearray();i=0
     while i<len(packed):
      n=packed[i];i+=1
      if n<=127:row.extend(packed[i:i+n+1]);i+=n+1
      elif n>=129:row.extend([packed[i]]*(257-n));i+=1
     assert len(row)==rowbytes,(len(row),rowbytes)
     rows.append(bytes(row))
    else:rows.append(take(rowbytes))
   bitmap=Image.frombytes('1',(rowbytes*8,bb-bt),b''.join(bytes(x^255 for x in r) for r in rows))
   st,sl,sb,sr=src;dt,dl,db,dr=dst
   bitmap=bitmap.crop((sl-bl,st-bt,sr-bl,sb-bt)).resize((dr-dl,db-dt),Image.Resampling.NEAREST)
   assert mode==0,('unsupported blend',mode)
   im.paste(bitmap,(dl-left,dt-top))
  else:raise ValueError(f'Unsupported opcode {op:02x} at {pos-1}')
 return im
rows=[]
for p in sorted((root/'reference/resources').glob('PICT_*.bin')):
 im=decode(p.read_bytes());im.save(out/(p.stem+'.png'));rows.append((p.stem,im))
# Contact sheet for faithful resource mapping.
w=800;cellw=100;cellh=130
sheet=Image.new('RGB',(w,((len(rows)+7)//8)*cellh),'#ddd');draw=ImageDraw.Draw(sheet)
for i,(name,im) in enumerate(rows):
 x=(i%8)*cellw;y=(i//8)*cellh
 im.thumbnail((90,105),Image.Resampling.NEAREST);sheet.paste(im,(x+(100-im.width)//2,y+20));draw.text((x+4,y+3),name,fill='black')
sheet.save(root/'reference/pict-contact-sheet.png')
print(f'Decoded {len(rows)} PICT images; all drawing opcodes handled.')
