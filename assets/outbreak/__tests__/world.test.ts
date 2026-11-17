import { buildingParts, designSignature, facadeModel } from '../architecture.ts';
import { expect,it } from 'vitest';
import { BUILDINGS,WORLD_BOUNDS,KINDS,dimensions,DESTINATIONS,DESIGN_VARIANTS,buildingScale } from '../layout.ts';
import { buildingModel } from '../models.ts';
it('provides at least 30 square kilometres and 500 non-overlapping reachable buildings',()=>{
 expect((WORLD_BOUNDS.maxX-WORLD_BOUNDS.minX)*(WORLD_BOUNDS.maxZ-WORLD_BOUNDS.minZ)).toBeGreaterThanOrEqual(30e6);
 expect(BUILDINGS.length).toBeGreaterThanOrEqual(1660);
 for(let i=0;i<BUILDINGS.length;i++){const a=BUILDINGS[i]!,[w,d]=dimensions(a.kind);expect(Math.abs(a.x)+w/2).toBeLessThan(3000);expect(Math.abs(a.z)+d/2).toBeLessThan(2500);
  for(let j=i+1;j<BUILDINGS.length;j++){const b=BUILDINGS[j]!,[bw,bd]=dimensions(b.kind);if(!(Math.abs(a.x-b.x)>(w+bw)/2+2||Math.abs(a.z-b.z)>(d+bd)/2+2))throw new Error('Overlapping buildings '+a.id+' / '+b.id);}
 }
});
it('every layout has an open entrance and a connected furnished interior',()=>{
 for(const kind of KINDS)for(let v=0;v<DESIGN_VARIANTS;v++){
  const m=buildingModel(kind,v),[w,d]=dimensions(kind);
  const blocked=(x:number,z:number)=>m.solids.some(s=>s.p[1]-s.s[1]/2<1.7&&s.p[1]+s.s[1]/2>.2&&Math.abs(x-s.p[0])<s.s[0]/2+.39&&Math.abs(z-s.p[2])<s.s[2]/2+.39);
  const queue:[[number,number]]=[[0,d/2+1]],seen=new Set<string>();let reached=false;
  for(let i=0;i<queue.length;i++){const [x,z]=queue[i]!,key=x+','+z;if(seen.has(key)||blocked(x,z)||Math.abs(x)>w/2+2||Math.abs(z)>d/2+2)continue;seen.add(key);if(z<-d/4&&Math.abs(x)>3)reached=true;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx!,z+dz!]);}
  expect(reached,kind+' '+v+' has reachable rear rooms').toBe(true);expect(m.inside.indices!.length).toBeGreaterThan(1000);
 }
});
it('travel destinations do not spawn inside walls or furniture',()=>{
 for(const d of DESTINATIONS.slice(1))for(const b of BUILDINGS){if(Math.hypot(d.x-b.x,d.z-b.z)>55)continue;const m=buildingModel(b.kind,b.variant);const scale=buildingScale(b);expect(m.solids.some(s=>s.p[1]-s.s[1]/2<1.7&&s.p[1]+s.s[1]/2>.2&&Math.abs(d.x-b.x-s.p[0]*scale[0])<s.s[0]*scale[0]/2+.4&&Math.abs(d.z-b.z-s.p[2]*scale[2])<s.s[2]*scale[2]/2+.4),d.name).toBe(false);}
});

it('all 1660 buildings have distinct assembled designs, independently of location or identifier',()=>{
 expect(new Set(BUILDINGS.map(designSignature)).size).toBe(BUILDINGS.length);
 const signatures=BUILDINGS.map(b=>JSON.stringify(buildingParts(b).map(p=>({key:p.key,scale:p.scale,local:p.p.map((v,i)=>v-(i===0?b.x:i===2?b.z:0))}))));
 expect(new Set(signatures).size).toBe(BUILDINGS.length);
 // Even removing size and location, the actual visible module combination is unique.
 expect(new Set(BUILDINGS.map(b=>buildingParts(b).map(p=>p.key).join('|'))).size).toBe(BUILDINGS.length);
 expect(new Set(BUILDINGS.map(b=>b.variant)).size).toBe(12);
});

it('facade embellishments leave the full central entrance clear even on single storeys',()=>{
 for(let style=0;style<8;style++){
  const vertices=facadeModel(style).attributes.position as Float32Array;
  for(let i=0;i<vertices.length;i+=3)expect(Math.abs(vertices[i]!)>=2.5||vertices[i+1]!>10).toBe(true);
 }
});
