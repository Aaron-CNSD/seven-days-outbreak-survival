import { VoxelMesh } from '../weapons/voxel-builder.ts';
import { AssetGuid } from '@forgeax/engine/pack/guid';
import { ColliderShapeValue, RigidBodyTypeValue } from '@forgeax/engine/physics';
import type { PackageId } from '@forgeax/engine/pack/source';
import type { SceneEntity } from '@forgeax/engine/types';
export const TARGETS=[{x:0,z:-2.6,d:10},{x:-6,z:-12.6,d:20},{x:4,z:-22.6,d:30},{x:-3,z:-32.6,d:40}];
export const WALLS=[{p:[-13.5,3,-13],s:[1,6,52]},{p:[13.5,3,-17],s:[1,6,44]},{p:[0,3,-38.5],s:[28,6,1]},{p:[0,3,12.5],s:[28,6,1]}];
export function rangeMeshes(ns:PackageId){
 const yard=new VoxelMesh(ns),target=new VoxelMesh(ns),mark=new VoxelMesh(ns);
 for(const w of WALLS){const p=w.p as [number,number,number],s=w.s as [number,number,number];yard.box(p,s,'concrete');}

 // Seeded surface wear authored in the native mesh, batched into four materials.
 let seed=4187;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const floor=(x:number,z:number,w:number,d:number,m:NonNullable<Parameters<VoxelMesh['box']>[2]>,h=.003)=>yard.quad([x-w/2,h,z+d/2],[x+w/2,h,z+d/2],[x+w/2,h,z-d/2],[x-w/2,h,z-d/2],m);
 // Continuous surfaces use tiled material UVs and a separate expansion joint layer.
 for(let z=-38;z<12;z+=2)for(let x=-13;x<13;x+=2)floor(x+1,z+1,2,2,'asphalt');
 for(const side of [-1,1])for(let z=-38;z<5;z+=2)for(let y=0;y<6;y+=2){
  const x=side*12.999;
  const start=side===1?z:z+2,end=side===1?z+2:z;
  yard.quad([x,y,start],[x,y,end],[x,y+2,end],[x,y+2,start],'concrete');
 }
 // Slab expansion joints and uneven repaired cracks.
 for(let z=-36;z<=12;z+=4)floor(0,z,26,.025,'asphaltDark',.006);
 for(const x of [-8,0,8])floor(x,-13,.025,50,'asphaltDark',.006);
 for(let i=0;i<45;i++){let x=rand()*24-12,z=rand()*47-36;
  for(let j=0;j<7;j++){floor(x,z,.018+rand()*.018,.12+rand()*.18,'asphaltDark',.007);x+=(rand()-.5)*.15;z+=.2;}
 }
 for(let i=0;i<1050;i++){const x=rand()*25.6-12.8,z=rand()*49-37;
  if(Math.abs(x)>10.5||rand()<.12){const r=.013+rand()*.045;yard.box([x,r*.3,z],[r,r*.5,r*1.4],rand()<.6?'gravel':'gravelLight',0,rand()*3);}
 }
 for(const side of [-1,1])for(let z=-36;z<5;z+=2){
  for(const y of [1.7,3.7])yard.box([side*12.98,y,z],[.02,.045,.045],'concreteDark');
  yard.box([side*12.96,.07,z],[.08,.14,1.96],'concreteDark');
 }
 // Drain grilles and fired cartridge cases near the firing line.
 for(const x of [-8,8]){
  floor(x,5.8,.6,2.6,'steelDark',.012);
  for(let z=4.6;z<7.1;z+=.11)yard.box([x,.02,z],[.56,.025,.027],'steel');
 }
 for(let i=0;i<80;i++){const x=.8+rand()*3.5,z=3+rand()*4.2;yard.tube([x,.018,z],.009,.036,'brass',.006,'x',6);}
 // Sandbag rows, individual seams and compressed corners.
 for(const side of [-1,1])for(let row=0;row<3;row++)for(let i=0;i<18;i++){
  const z=-33+i*1.35+(row%2)*.4;
  yard.bevel([side*12.05,.17+row*.28,z],[.77,.29,1.24],i%3===0?'sandDark':'sand',.09,0);
  yard.box([side*11.65,.17+row*.28,z],[.018,.014,1.02],'sandLight');
 }
 // Concrete panel joints, capped pilasters and amber safety bands.
 for(const side of [-1,1])for(let z=-37;z<=3;z+=4){yard.box([side*12.91,2.8,z],[.16,5.6,.16],'concreteDark');yard.box([side*12.85,5.8,z],[.28,.3,.4],'sand');}
 for(let x=-12;x<=12;x+=4){yard.box([x,2.8,-37.91],[.16,5.6,.16],'concreteDark');yard.box([x,2.8,11.91],[.16,5.6,.16],'concreteDark');}
 for(const side of [-1,1])yard.box([side*12.92,1.2,-17],[.03,.15,42],'sandLight');
 for(let x=-10;x<=10;x+=5)yard.box([x,.012,-13],[.055,.02,49],'white');
 const segments:Record<string,string>={'0':'abcedf','1':'bc','2':'abged','3':'abgcd','4':'fgbc'};
 const strokes=[[0,.27,.24,.045],[.12,.135,.045,.24],[.12,-.135,.045,.24],
  [0,-.27,.24,.045],[-.12,-.135,.045,.24],[-.12,.135,.045,.24],[0,0,.24,.045]];
 const label=(distance:number,x:number,z:number)=>{
  for(const [column,digit] of Array.from(String(distance)).entries())for(const segment of segments[digit]!){
   const [dx,y,w,h]=strokes[segment.charCodeAt(0)-97]!;
   yard.box([x+column*.38+dx!,2.6+y!,z],[w!,h!,.01],'white');
  }
  for(const side of [-1,1]){
   yard.box([x+.86+side*.095,2.5,z],[.031,.27,.01],'white');
   yard.box([x+.86+side*.05,2.56,z],[.031,.16,.01],'white',0,0,side*.6);
  }
 };
 for(const t of TARGETS){
  yard.box([t.x,.035,t.z+1.1],[2.4,.05,.13],'sandLight');
  yard.box([t.x,1.28,t.z-.2],[.10,2.55,.10],'steelDark');yard.box([t.x,.08,t.z],[1.2,.16,.7],'steelDark');
  yard.box([t.x,2.6,t.z-.25],[2,.85,.12],'rubber');label(t.d,t.x-.43,t.z-.184);
 }
 // Low earthen backstop, warning blocks and side storage remain out of the firing lanes.
 for(let row=0;row<3;row++)yard.box([0,.3+row*.5,-37+row*.45],[25-row*.6,.6,2-row*.35],'sandDark');
 for(let x=-12;x<12;x+=.8)yard.box([x,.025,6.4],[.36,.03,.30],'sandLight',0,.4);
 // Covered spawn bay with open forward view and closed rear service door.
 yard.box([0,4.2,9.5],[25,.25,5],'steelDark');
 for(const x of [-11,11]){yard.box([x,2.1,7.2],[.22,4.2,.22],'steel');yard.box([x,3.7,9.5],[.25,.18,5],'sand');}

 for(let x=-12;x<=12;x+=2){yard.box([x,4.04,9.5],[.10,.16,5],'steel');yard.box([x,4.35,9.5],[.07,.07,5],'steelLight');}
 for(const side of [-1,1])for(const z of [7.3,11.3])yard.box([side*10.95,3.45,z],[.24,.10,1.1],'steel',side*.4);
 yard.box([0,1.6,11.93],[3.8,3.2,.08],'steelDark');yard.box([0,1.6,11.86],[.055,3.2,.06],'sandLight');
 for(const x of [-10,10])for(let z=8;z<11;z+=1.2){yard.box([x,.45,z],[1.3,.9,1],'olive');yard.box([x,.9,z],[1.34,.06,1.04],'oliveDark');for(const dx of [-.45,.45])yard.box([x+dx,.48,z+.51],[.08,.78,.02],'steel');}

 for(const x of [-1.7,1.7])for(const y of [.5,1.6,2.7])yard.box([x,y,11.8],[.1,.20,.06],'steel');
 yard.box([.22,1.2,11.76],[.06,.3,.08],'steelLight');
 for(const side of [-1,1]){
  yard.box([side*12.92,2.4,4],[.05,1.1,2.6],'steelDark');
  for(let z=3;z<5;z+=.3)yard.box([side*12.88,2.55,z],[.04,.14,.15],'sandLight');
  yard.box([side*12.86,2.12,4],[.04,.05,1.9],'white');
 }
 // Target silhouette with concentric scoring rings and a separate head zone.
 target.bevel([0,1.43,0],[.78,.9,.12],'white',.12,0);
 target.bevel([0,2.05,0],[.36,.35,.12],'white',.08,0);
 target.box([0,1.81,0],[.23,.17,.12],'white');
 for(const [r,m] of [[.33,'black'],[.27,'white'],[.21,'black'],[.15,'white'],[.08,'red']] as const)target.tube([0,1.44,.065+( .34-r)*.05],r,.006,m,0,'z',24);
 target.tube([0,2.05,.066],.09,.008,'red',0,'z',16);
 mark.tube([0,0,0],.028,.012,'black',0,'z',8);mark.tube([0,0,.006],.035,.004,'sandDark',.026,'z',8);
 return [['mesh/range',yard.mesh()],['mesh/target',target.mesh()],['mesh/impact',mark.mesh()]] as const;
}
export function rangeEntities(ns:PackageId):readonly (readonly [string,SceneEntity])[]{
 const guid=(key:string)=>AssetGuid.format(AssetGuid.derive(ns,key));
 const mesh=(key:string,p:number[]):SceneEntity=>({components:{Transform:{pos:p},MeshFilter:{assetHandle:guid(key)},MeshRenderer:{materials:[]}}});
 const rows:(readonly [string,SceneEntity])[]=[['range',mesh('mesh/range',[0,0,0])]];
 WALLS.forEach((w,i)=>rows.push(['wall-'+i,{components:{Transform:{pos:w.p},RigidBody:{type:RigidBodyTypeValue.static},Collider:{shape:ColliderShapeValue.cuboid,halfExtents:w.s.map(v=>v/2),friction:.8}}}]));
 const solid=(key:string,p:number[],s:number[])=>rows.push([key,{components:{Transform:{pos:p},RigidBody:{type:RigidBodyTypeValue.static},Collider:{shape:ColliderShapeValue.cuboid,halfExtents:s.map(v=>v/2)}}}]);
 solid('equipment-table',[0,.48,10.9],[6,.96,.8]);
 solid('canopy',[0,4.2,9.5],[25,.25,5]);solid('backstop',[0,.8,-36.8],[25,1.6,2.4]);
 for(const x of [-11,11])solid('post'+x,[x,2.1,7.2],[.22,4.2,.22]);
 for(const x of [-10,10])for(let i=0;i<3;i++)solid('crate'+x+'-'+i,[x,.45,8+i*1.2],[1.3,.9,1]);
 for(const side of [-1,1])solid('side-storage'+side,[side*12.1,.42,-10.6],[.96,.84,12.5]);
 TARGETS.forEach((t,i)=>rows.push(['target-'+i,mesh('mesh/target',[t.x,0,t.z])]));
 for(let i=0;i<32;i++){const e=mesh('mesh/impact',[0,-10,0]);rows.push(['impact-'+i,e]);}
 return rows;
}
// Hitscan against the visible silhouette; closest hit wins. No hits through backs.
export function hitTarget(origin:ArrayLike<number>,dir:ArrayLike<number>){
 if(dir[2]!>=-.0001)return undefined;
 let best:{index:number;x:number;y:number;z:number;head:boolean;distance:number}|undefined;
 TARGETS.forEach((t,index)=>{const distance=(t.z+.085-origin[2]!)/dir[2]!;if(distance<=0)return;
 const x=origin[0]!+dir[0]!*distance-t.x,y=origin[1]!+dir[1]!*distance;
 const head=Math.abs(x)<=.18&&y>=1.875&&y<=2.225;
 const body=Math.abs(x)<=.39&&y>=.98&&y<=1.88;
 if((head||body)&&(!best||distance<best.distance))best={index,x:x+t.x,y,z:t.z+.1,head,distance};});return best;
}
