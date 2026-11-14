import {shapeSleeves} from "./shape-fps-sleeves.mjs";

import fs from 'node:fs';
import {MeshoptDecoder} from '../node_modules/.pnpm/meshoptimizer@0.20.0/node_modules/meshoptimizer/meshopt_decoder.module.js';
await MeshoptDecoder.ready;
for(const name of ['ak47','m4a1','awm']){
 const path=`assets/library/realistic-fps/${name}.glb`,file=fs.readFileSync(path),jl=file.readUInt32LE(12),g=JSON.parse(file.subarray(20,20+jl).toString()),bin=file.subarray(28+jl);
 let chunks=[],length=0;
 function append(b){const offset=length;chunks.push(Buffer.from(b));length+=b.length;const pad=(-length>>>0)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}return offset;}
 for(const v of g.bufferViews){
  const ext=v.extensions?.EXT_meshopt_compression;let data;
  if(ext){data=new Uint8Array(ext.count*ext.byteStride);MeshoptDecoder.decodeGltfBuffer(data,ext.count,ext.byteStride,bin.subarray(ext.byteOffset,ext.byteOffset+ext.byteLength),ext.mode,ext.filter);}
  else data=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);
  v.buffer=0;v.byteOffset=append(data);v.byteLength=data.length;delete v.extensions;
 }
 const decoded=Buffer.concat(chunks);
 const count={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},bytes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
 const attrs=new Set(g.meshes.flatMap(m=>m.primitives.flatMap(p=>Object.entries(Object.assign({},p.attributes,...(p.targets||[]).map((t,i)=>Object.fromEntries(Object.entries(t).map(([k,v])=>[k+'_'+i,v]))))).filter(([k])=>!k.startsWith('JOINTS')).map(([,v])=>v))));
 for(let k=0;k<g.accessors.length;k++)if(g.accessors[k].normalized||[5120,5122].includes(g.accessors[k].componentType))attrs.add(k);
 for(const index of attrs){const a=g.accessors[index];if(a.componentType===5126)continue;const v=g.bufferViews[a.bufferView],n=count[a.type],s=bytes[a.componentType],stride=v.byteStride||n*s,out=Buffer.alloc(a.count*n*4);
 for(let i=0;i<a.count;i++)for(let c=0;c<n;c++){const at=v.byteOffset+(a.byteOffset||0)+i*stride+c*s;let x=a.componentType===5120?decoded.readInt8(at):a.componentType===5121?decoded.readUInt8(at):a.componentType===5122?decoded.readInt16LE(at):a.componentType===5123?decoded.readUInt16LE(at):decoded.readUInt32LE(at);
 if(a.normalized)x=a.componentType===5120?Math.max(-1,x/127):a.componentType===5121?x/255:a.componentType===5122?Math.max(-1,x/32767):x/65535;out.writeFloatLE(x,(i*n+c)*4);}
 a.bufferView=g.bufferViews.length;a.byteOffset=0;a.componentType=5126;delete a.normalized;delete a.min;delete a.max;g.bufferViews.push({buffer:0,byteOffset:append(out),byteLength:out.length});
 }
 if(name==='awm')for(const m of g.materials){delete m.extensions;m.pbrMetallicRoughness.roughnessFactor=.7;}
 if(name==='awm')for(const k of ['extensionsUsed','extensionsRequired'])g[k]=(g[k]||[]).filter(x=>!['KHR_materials_ior','KHR_materials_specular'].includes(x));
 for(const kind of ['images','materials','meshes','animations','skins'])for(const [i,v] of (g[kind]||[]).entries())v.name=(v.name||kind)+'_'+i;
 g.buffers=[{byteLength:length}];for(const k of ['extensionsUsed','extensionsRequired']){g[k]=(g[k]||[]).filter(x=>!['EXT_meshopt_compression','KHR_mesh_quantization'].includes(x));if(!g[k].length)delete g[k];}
 shapeSleeves(g,Buffer.concat(chunks),append);g.buffers[0].byteLength=length;const b=Buffer.concat(chunks);
 let j=Buffer.from(JSON.stringify(g));j=Buffer.concat([j,Buffer.alloc((-j.length>>>0)%4,32)]);const head=Buffer.alloc(20);head.writeUInt32LE(0x46546c67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(28+j.length+b.length,8);head.writeUInt32LE(j.length,12);head.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(b.length,0);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(path,Buffer.concat([head,j,bh,b]));console.log(name,b.length);
}
