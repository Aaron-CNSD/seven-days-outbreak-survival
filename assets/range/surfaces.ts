import type { TextureAsset } from '@forgeax/engine/types';

export function rangeSurface(asphalt: boolean): TextureAsset {
 const size = 256;
 const data = new Uint8Array(size * size * 4);
 const hash = (x: number, y: number) => {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
 };
 const noise = (x: number, y: number, cells: number) => {
  const gx = x * cells / size, gy = y * cells / size;
  const ix = Math.floor(gx), iy = Math.floor(gy);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const u = smooth(gx - ix), v = smooth(gy - iy);
  const a = hash(ix, iy) * (1 - u) + hash((ix + 1) % cells, iy) * u;
  const b = hash(ix, (iy + 1) % cells) * (1 - u) + hash((ix + 1) % cells, (iy + 1) % cells) * u;
  return a * (1 - v) + b * v;
 };
 for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const speckle = hash(x, y);
  const aggregate = noise(x, y, 64);
  const broad = noise(x, y, 5);
  const streak = noise(x, Math.floor(y / 5), 32);
  const value = asphalt
   ? 184 + 41 * aggregate + 24 * speckle + 13 * broad
   : 188 + 27 * broad + 22 * streak + 15 * speckle - (speckle < .025 ? 31 : 0);
  const i = (y * size + x) * 4;
  data.set([value, value, value, 255], i);
 }
 return {
  kind: 'texture', shape: { viewDimension: '2d', extent: { width: size, height: size } },
  format: 'rgba8unorm', colorSpace: 'linear', mips: { kind: 'generate' }, data,
 };
}

// Paint each one-metre tile with discrete texels. Expand texels before the
// engine's linear filtering so the squares stay legible at close range.
export function blockSurface(grass: boolean): TextureAsset {
 const size=128;
 const data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const px=x>>3,py=y>>3;
  let seed=Math.imul(px+87,374761393)^Math.imul(py+43,668265263);
  seed=Math.imul(seed^(seed>>>13),1274126177);
  const shade=.70+((seed>>>24)&255)/850;
  const color=grass?[.69,.91,.58]:[.91,.84,.74];
  const i=(y*size+x)*4;
  data.set([...color.map(c=>c*shade*255),255],i);
 }
 return {kind:'texture',shape:{viewDimension:'2d',extent:{width:size,height:size}},format:'rgba8unorm',colorSpace:'linear',mips:{kind:'generate'},data};
}
