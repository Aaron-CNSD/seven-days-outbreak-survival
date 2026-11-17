import { VoxelMesh } from '../weapons/voxel-builder.ts';
import { WEAPON_NAMESPACE } from '../weapons/weapon-scene.ts';
/** Normalized frontage; center six metres stay open for entrances. One shared mesh per cluster. */
export function streetModel(style:number){
 const m=new VoxelMesh(WEAPON_NAMESPACE);
 for(const side of [-1,1]){
  const x=side*7,z=12;
  // Low concrete barricades and a collapsed fence, away from the doorway.
  m.box([x,.4,z+2],[3,.8,.65],'concreteDark');
  for(let i=0;i<3;i++)m.box([x-1+i,.82,z+2],[.45,.05,.7],i%2?'steelDark':'sand');
  m.box([x,.4,z-1],[3,.1,1.4],'rust',.45);
  for(let i=0;i<5;i++)m.box([x-1.3+i*.65,.55,z-1],[.06,.7,1.4],'steelDark',.45);
  // Pallets, crates, bins and broken masonry give each frontage a different silhouette.
  const h=.6+style*.2;
  m.box([x+side*1.8,h/2,z],[1.1,h,1],'woodDark');
  m.box([x+side*1.8,h+.08,z],[1.2,.15,1.1],'wood');
  for(const dx of [-.4,.4])m.box([x+side*1.8+dx,h/2,z+.51],[.08,h,.04],'steelDark');
  m.box([x-side*1.2,.55,z],[.8,1.1,.8],style%2?'oliveDark':'rust');
  m.box([x-side*1.2,1.12,z],[.9,.1,.9],'steelDark',.2);
  for(let i=0;i<9;i++){
   const rx=x-1.5+(i*7%11)*.3,rz=z+3+(i*5%7)*.22;
   m.box([rx,.09+(i%3)*.06,rz],[.2+(i%3)*.13,.18,.35],i%3?'concreteDark':'rust',0,i*.7);
  }
  // Recessed storm-drain grate and broken curb stones are actual geometry.
  m.box([x,.025,z+5.2],[1.3,.05,.65],'groove');
  for(let j=0;j<7;j++)m.box([x-.55+j*.18,.075,z+5.2],[.065,.10,.6],'steelDark');
  for(let j=0;j<4;j++)m.box([x-1.4+j*.85,.14,z+6],[.7,.28,.35],'concreteLight',0,j===2?.22:0,j===2?.12:0);
  m.box([x+.5,.09,z+6.5],[.55,.18,.42],'concreteDark',0,.6);
  // Dry weed clumps, no transparent foliage or additional lights.
  for(let i=0;i<4;i++){const wx=x-1.5+i, wz=z+4.5;
   m.box([wx,.2,wz],[.035,.4,.22],'sandDark',0,0,.25);
   m.box([wx+.1,.13,wz],[.03,.26,.18],'oliveDark',0,0,-.3);
  }
 }
 return m.mesh();
}
