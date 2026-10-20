"""Rasterize the existing ChicagoFLF approximation onto a 12px grid.
This is not an extraction of the Macintosh system font. Integer-cell contours
avoid host font smoothing; retain the original attribution in README.
"""
import sys
sys.path.insert(0,'/private/tmp/scarab-inspect/python')
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
root=Path(__file__).resolve().parents[1];assets=root/'prototype/dist/assets'
f=ImageFont.truetype(str(assets/'ChicagoFLF.ttf'),12);chars=list(range(32,256))+[0x2026,0x2019,0x2018,0x201c,0x201d,0x2013,0x2014,0x2190,0x2191,0x2192,0x2193,0x2713,0xf8ff]
order=['.notdef']+[f'uni{c:04X}' for c in chars];glyphs={};metrics={}
for name,cp in zip(order,[63]+chars):
 im=Image.new('1',(24,24));d=ImageDraw.Draw(im);d.fontmode='1';d.text((1,16),chr(cp),font=f,fill=1,anchor='ls');pen=TTGlyphPen(None)
 for y in range(24):
  x=0
  while x<24:
   if not im.getpixel((x,y)):x+=1;continue
   start=x
   while x<24 and im.getpixel((x,y)):x+=1
   left=(start-1)*100;right=(x-1)*100;top=(16-y)*100;bottom=top-100
   pen.moveTo((left,bottom));pen.lineTo((left,top));pen.lineTo((right,top));pen.lineTo((right,bottom));pen.closePath()
 glyphs[name]=pen.glyph();metrics[name]=(round(f.getlength(chr(cp)))*100,0)
fb=FontBuilder(1200,isTTF=True);fb.setupGlyphOrder(order);fb.setupCharacterMap(dict(zip(chars,order[1:])));fb.setupGlyf(glyphs);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=1200,descent=-300);fb.setupNameTable({'familyName':'Chicago Grid','styleName':'Regular','uniqueFontIdentifier':'ScarabChicagoGrid1','fullName':'Chicago Grid','psName':'ChicagoGrid'});fb.setupOS2(sTypoAscender=1200,sTypoDescender=-300,usWinAscent=1200,usWinDescent=300);fb.setupPost();fb.setupMaxp();fb.save(assets/'ChicagoGrid.ttf');print('Created 12px grid font')
