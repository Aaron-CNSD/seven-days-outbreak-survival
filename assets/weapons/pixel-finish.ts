import type { TextureAsset } from '@forgeax/engine/types';

export const PIXEL_FINISHES = ['field-cloth','field-webbing','walnut','blued-steel'] as const;
type Finish = typeof PIXEL_FINISHES[number];

// Author at 24×24 logical pixels, expanded before filtering to keep hard edges.
export function pixelFinish(finish: Finish): TextureAsset {
 const size=192, data=new Uint8Array(size*size*4);
 const hash=(x:number,y:number)=>{
  const n=Math.imul(x+73,374761393)^Math.imul(y+139,668265263);
  return ((Math.imul(n^(n>>>13),1274126177)>>>24)&255)/255;
 };
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x>>3,v=y>>3;
  const cluster=hash(u>>2,v>>2);
  const grain=hash(u>>1,v>>1);
  let rgb:number[];
  switch(finish){
   case 'field-cloth':{
    const camouflage=hash((u+Math.floor(v/4))>>2,v>>2);
    const color=camouflage<.24?[.063,.080,.038]:camouflage>.76?[.235,.218,.108]:[.138,.162,.074];
    const shade=.78+.17*cluster+.10*grain;
    rgb=color.map(c=>c*shade*(u===1||u===22?.70:1));
    break;
   }
   case 'field-webbing':{
    const shade=.62+.24*cluster+.14*grain;
    const seam=u===1||u===22;
    rgb=seam?[.105,.103,.073]:[.059*shade,.061*shade,.047*shade];
    break;
   }
   case 'walnut':{
    const streak=hash((v+Math.floor(u/6))%24,u>>3);
    const shade=.60+.35*streak+.10*cluster;
    rgb=[shade,shade*.61,shade*.69];
    break;
   }
   case 'blued-steel':{
    const wear=(u===0||u===23||v===0||v===23)&&cluster>.66;
    const shade=wear?.96:.64+.19*cluster+.10*grain;
    rgb=[shade*.72,shade*.83,shade];
    break;
   }
  }
  const offset=(y*size+x)*4;
  data.set([...rgb.map(c=>Math.round(Math.min(1,c)*255)),255],offset);
 }
 return {kind:'texture',shape:{viewDimension:'2d',extent:{width:size,height:size}},format:'rgba8unorm',colorSpace:'linear',mips:{kind:'generate'},data};
}
