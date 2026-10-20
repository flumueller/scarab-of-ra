"""Readable 68000 disassembly with original THINK C function names.
Dependency: capstone, used for inspection only.
"""
from pathlib import Path
import sys,re
sys.path.insert(0,'/private/tmp/scarab-inspect/python')
from capstone import Cs,CS_ARCH_M68K,CS_MODE_BIG_ENDIAN,CS_MODE_M68K_000
root=Path(__file__).resolve().parents[1];out=root/'reference/disassembly';out.mkdir(exist_ok=True)
md=Cs(CS_ARCH_M68K,CS_MODE_BIG_ENDIAN|CS_MODE_M68K_000);md.skipdata=True
for path in (root/'reference/resources').glob('CODE_*.bin'):
 b=path.read_bytes(); markers=[]
 for m in re.finditer(b'\x4e\x75([\x81-\xbf])',b):
  n=m.group(1)[0]&127;name=b[m.end():m.end()+n]
  if re.fullmatch(rb'[A-Za-z_][A-Za-z_0-9]*',name):markers.append((m.start()+2,m.end()+n,name.decode()))
 start=0;parts=[]
 for stop,end,name in markers:
  parts.append(f'\nFUNCTION {name} [CODE {path.stem[5:]} 0x{start:x}..0x{stop:x}]\n')
  for i in md.disasm(b[start:stop],start):parts.append(f'{i.address:04x}: {i.bytes.hex():20s} {i.mnemonic:12s} {i.op_str}')
  start=(end+1)&~1
  while start+2<=len(b) and b[start:start+2]==b'\0\0':start+=2
 (out/(path.stem+'.txt')).write_text('\n'.join(parts))
print('Disassembled resource files:',len(list(out.glob('*.txt'))))
