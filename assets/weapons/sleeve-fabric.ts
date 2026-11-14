import type { TextureAsset } from '@forgeax/engine/types';

export function sleeveFabric(): TextureAsset {
 const size = 256;
 const data = new Uint8Array(size * size * 4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size*Math.PI*2,v=y/size;
  const patch=Math.sin(u*3+v*21)+Math.sin(u*5-v*32)*.55+Math.sin(u*9+v*46)*.22;
  const shade=patch>.6?[.92,.89,.77]:patch<-.6?[.49,.52,.43]:[.73,.76,.65];
  const weave=Math.sin(x*Math.PI/2)*Math.cos(y*Math.PI/2);
  const thread=.94+.055*weave+.025*Math.sin((x+y)*.45);
  const stitch=y%9<4?.18:0;
  const seam=1-.28*Math.exp(-((x-120)**2)/3)+stitch*Math.exp(-((x-124)**2)/4);
  const drape=1-.12*Math.sin(v*79+Math.sin(u*2))**8;
  const i=(y*size+x)*4;
  for(let c=0;c<3;c++)data[i+c]=Math.min(255,255*shade[c]!*thread*seam*drape);
  data[i+3]=255;
 }
 return {
  kind:'texture',shape:{viewDimension:'2d',extent:{width:size,height:size}},
  format:'rgba8unorm',colorSpace:'linear',mips:{kind:'generate'},data,
 };
}
