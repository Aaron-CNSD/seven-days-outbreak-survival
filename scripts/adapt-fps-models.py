"""Adapt public GLBs to the engine's PNG texture contract; preserve source bytes."""
import json,struct,io,shutil
from pathlib import Path
from PIL import Image
root=Path('assets/library/realistic-fps'); original=Path('.assetlib/originals/realistic-fps')
for source in root.glob('*.glb'):
 saved=original/source.name
 if not saved.exists():shutil.copy2(source,saved)
 b=saved.read_bytes();jl=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+jl]);binary=bytearray(b[28+jl:])
 for im in g.get('images',[]):
  if im.get('mimeType')!='image/webp':continue
  if 'uri' in im:raw=(root/im['uri']).read_bytes()
  else:
   v=g['bufferViews'][im['bufferView']];o=v.get('byteOffset',0);raw=binary[o:o+v['byteLength']]
  output=io.BytesIO();Image.open(io.BytesIO(raw)).save(output,format='PNG');png=output.getvalue()
  while len(binary)%4:binary.append(0)
  im.pop('uri',None);im['mimeType']='image/png';im['bufferView']=len(g['bufferViews'])
  g['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(png)});binary.extend(png)
 for tex in g.get('textures',[]):
  ext=tex.get('extensions',{}).pop('EXT_texture_webp',None)
  if ext:tex['source']=ext['source']
  if not tex.get('extensions'):tex.pop('extensions',None)
 for key in ['extensionsRequired','extensionsUsed']:
  g[key]=[x for x in g.get(key,[]) if x!='EXT_texture_webp']
 while len(binary)%4:binary.append(0)
 g['buffers'][0]['byteLength']=len(binary)
 data=json.dumps(g,separators=(',',':')).encode();data+=b' '*((-len(data))%4)
 source.write_bytes(struct.pack('<III',0x46546c67,2,28+len(data)+len(binary))+struct.pack('<II',len(data),0x4e4f534a)+data+struct.pack('<II',len(binary),0x004e4942)+binary)
 print(source,len(binary))
