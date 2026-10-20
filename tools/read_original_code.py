"""Inspect an exact CODE range, annotate A5 calls and STRS pointers."""
from pathlib import Path
import sys,struct
sys.path.insert(0,'/private/tmp/scarab-inspect/python')
from capstone import *
r=Path(__file__).resolve().parents[1]/'reference/resources';jt=(r/'CODE_0.bin').read_bytes();strings=(r/'STRS_0.bin').read_bytes()
seg=int(sys.argv[1]);start=int(sys.argv[2],16) if len(sys.argv)>2 else 4;b=(r/f'CODE_{seg}.bin').read_bytes();end=int(sys.argv[3],16) if len(sys.argv)>3 else len(b)
m=Cs(CS_ARCH_M68K,CS_MODE_BIG_ENDIAN|CS_MODE_M68K_000);m.skipdata=True
for i in m.disasm(b[start:end],start):
 a=''
 if len(i.bytes)>=4 and i.bytes[:2]==b'\x4e\xad':
  off=struct.unpack_from('>H',i.bytes,2)[0]
  if 16<=off-18<=len(jt)-8:
   target,_,s,_=struct.unpack_from('>4H',jt,off-18);a=f' -> CODE {s}:{target+4:04x}'
 if len(i.bytes)>=6 and i.bytes[:2] in [b'\x2f\x3c',b'\x2e\xbc']:
  p=struct.unpack_from('>I',i.bytes,2)[0]
  if p<len(strings) and (not p or strings[p-1]==0):a+=' '+repr(strings[p:strings.find(b'\0',p)].decode('macroman'))
 print(f'{i.address:04x}: {i.mnemonic:10s} {i.op_str}{a}')
