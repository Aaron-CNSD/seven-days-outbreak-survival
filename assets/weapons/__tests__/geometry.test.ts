import {expect,it} from 'vitest';
import {createModels} from '../models.pack.ts';
it('keeps detailed weapon geometry finite, non-degenerate and within a mobile triangle budget',()=>{
 for(const [index,assembly] of createModels().entries()){
  let triangles=0;
  for(const group of [assembly.body,assembly.mag,assembly.bolt,assembly.hands,assembly.support]){
   const mesh=group.mesh(),p=mesh.attributes!.position as Float32Array,n=mesh.attributes!.normal as Float32Array;
   triangles+=mesh.indices!.length/3;
   expect(mesh.submeshes!.length).toBeLessThanOrEqual(4);
   expect((mesh.attributes!.color as Float32Array).length).toBe(p.length/3*4);
   expect(Array.from(p).every(Number.isFinite)).toBe(true);
   expect(Array.from(n).every(Number.isFinite)).toBe(true);
   for(let i=0;i<mesh.indices!.length;i+=3){
    const [ia,ib,ic]=Array.from(mesh.indices!.slice(i,i+3));
    const ab=[0,1,2].map(k=>p[ib!*3+k]!-p[ia!*3+k]!),ac=[0,1,2].map(k=>p[ic!*3+k]!-p[ia!*3+k]!);
    const area=Math.hypot(ab[1]!*ac[2]!-ab[2]!*ac[1]!,ab[2]!*ac[0]!-ab[0]!*ac[2]!,ab[0]!*ac[1]!-ab[1]!*ac[0]!);
    expect(area).toBeGreaterThan(1e-12);
   }
  }
  expect(triangles).toBeGreaterThan(index === 7 ? 1000 : 5000);
  expect(triangles).toBeLessThan(120000);
  console.log(['AK-47','AWM','Glock 17','SCAR-L','MP5 A3','M4A1','M870','战术刀'][index],assembly.parts,'pieces',triangles,'triangles');
 }
});
