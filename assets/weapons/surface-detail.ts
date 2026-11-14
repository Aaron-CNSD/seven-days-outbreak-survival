import type { TextureAsset } from '@forgeax/engine/types';

// Tileable, deterministic material microstructure. Normal maps are linear data.
export function surfaceDetail(surface: string, normal: boolean): TextureAsset {
 const size=256, heights=new Float32Array(size*size), data=new Uint8Array(size*size*4);
 const hash=(x:number,y:number)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
 const cloth=surface==='sleeve'||surface==='cloth';
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=hash(x,y);
  heights[y*size+x]=cloth?.07*Math.sin(x*Math.PI/2)*Math.cos(y*Math.PI/2):surface==='metal'?.015*grain+.025*Math.sin(y*Math.PI/4):.11*grain+.045*Math.sin(x*Math.PI/16)*Math.cos(y*Math.PI/16);
 }
 const h=(x:number,y:number)=>heights[((y+size)%size)*size+(x+size)%size]!;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const offset=(y*size+x)*4;
  if(normal){
   const dx=(h(x-1,y)-h(x+1,y))*2,dy=(h(x,y-1)-h(x,y+1))*2, length=Math.hypot(dx,dy,1);
   data.set([(dx/length*.5+.5)*255,(dy/length*.5+.5)*255,(1/length*.5+.5)*255,255],offset);
  }else{
   // glTF convention: green = roughness multiplier, blue = metalness multiplier.
   const wear=hash(Math.floor(x/8),Math.floor(y/8));
   const rough=surface==='metal'?.68+.30*wear:cloth?.9+.1*wear:.75+.25*wear;
   data.set([255,rough*255,255,255],offset);
  }
 }
 return {kind:'texture',shape:{viewDimension:'2d',extent:{width:size,height:size}},format:'rgba8unorm',colorSpace:'linear',mips:{kind:'generate'},data};
}
