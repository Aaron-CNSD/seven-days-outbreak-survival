import { VoxelMesh } from '../weapons/voxel-builder.ts';
import { WEAPON_NAMESPACE } from '../weapons/weapon-scene.ts';
import { buildingScale, buildingDimensions, roofStyle, facadeStyle, equipmentStyle, towerFloors, type Building } from './layout.ts';
export function roofModel(style:number){
 const m=new VoxelMesh(WEAPON_NAMESPACE);
 if(style===0||style===1){
  const h=style===0?3.5:6,material=style===0?'woodDark':'steelDark';
  m.quad([-10,0,10],[10,0,10],[10,h,0],[-10,h,0],material);
  m.quad([-10,h,0],[10,h,0],[10,0,-10],[-10,0,-10],material);
  for(let z=-9;z<=9;z+=1.5)m.box([0,h*(1-Math.abs(z)/10)+.04,z],[20,.06,.07],'steelDark');
  m.box([-5,2,-3],[1.2,4,1.2],'rust');m.box([-5,4,-3],[1.6,.2,1.6],'concreteDark');
 }else if(style===2){
  m.box([0,.5,0],[19,1,19],'concreteDark');m.box([0,1.3,0],[13,1,13],'concreteLight');m.box([0,2.2,0],[7,1,7],'sandLight');
  for(let i=-7;i<=7;i+=2)m.box([i,2,8],[.15,2,.15],'steelLight');
 }else if(style===3){
  for(const x of [-5,5]){m.tube([x,2,0],2,4,'steel',0,'y',12);m.tube([x,4.1,0],2.2,.2,'steelLight',0,'y',12);for(let y=.6;y<4;y+=.6)m.tube([x,y,0],2.04,.04,'rust',0,'y',12);}
 }else if(style===4){
  for(const x of [-6,0,6])for(const z of [-6,0,6]){m.box([x,.55,z],[4.7,.12,4.5],'steelLight',-.3);m.box([x,.63,z],[4.5,.04,4.2],'lens',-.3);for(let j=-2;j<=2;j++)m.box([x+j*.85,.68,z],[.04,.04,4.1],'steelLight',-.3);}
 }else if(style===5){
  for(const z of [-7,7]){m.box([0,.4,z],[18,.8,3],'concrete');for(let x=-7;x<=7;x+=2)m.ellipsoid([x,1,z],[1.3,.9,1],'oliveDark',5,3);}
  for(const x of [-7,7])m.box([x,1.8,0],[.18,3.6,12],'woodDark');m.box([0,3.6,0],[15,.2,12],'woodDark');for(let x=-7;x<=7;x+=1)m.box([x,3.8,0],[.1,.25,12],'wood');
 }else{
  for(let i=0;i<5;i++){m.box([-7+i*3.2,.8,-4],[2.2,1.6,3.6],'steel');for(let y=.2;y<1.5;y+=.2)m.box([-7+i*3.2,y,-2.18],[1.8,.055,.04],'steelDark');}
  m.tube([6,5,5],.12,10,'steelLight',0,'y',6);m.box([6,8,5],[3,.12,.12],'steelLight');
 }
 return m.mesh();
}
/** Normalized facade modules keep the central doorway unobstructed. */
export function facadeModel(style:number){
 const m=new VoxelMesh(WEAPON_NAMESPACE);
 for(const side of [-1,1]){
  const z=side*10.13;
  if(style===0)for(const x of [-9,9]){m.box([x,10,z],[.5,20,.35],'concreteLight');m.box([x,19,z],[1.1,.5,.6],'concreteLight');}
  if(style===1)for(const x of [-8,-5,5,8])m.box([x,10,z],[.25,20,.6],'sandLight');
  if(style===2)for(const x of [-7,7])for(let y=2;y<20;y+=4){m.box([x,y,z],[4,.18,.2],'steelLight');m.box([x,y+1,z],[.2,2.8,.2],'steelDark',0,0,Math.PI/4);}
  if(style===3)for(const x of [-7,7])for(let y=4;y<20;y+=4){m.box([x,y,z],[4,.2,1.3],'concreteLight');m.box([x,y+.45,z+side*.5],[4,.7,.12],'sand');m.box([x,y+.7,z],[3.5,.5,.8],'oliveDark');}
  if(style===4)for(let x=-9;x<=9;x+=1.5)if(Math.abs(x)>3)m.box([x,10,z],[.13,20,.9],'rust');
  if(style===5)for(const x of [-7,7]){for(let y=1;y<20;y+=.9)m.box([x,y,z],[4,.12,.25],'woodDark');for(const dx of [-2,2])m.box([x+dx,10,z],[.12,20,.3],'steelDark');}
  if(style===6)for(let i=0;i<34;i++){const x=(i%2?1:-1)*(5+(i*7%11)/3),y=.6+(i*13%97)/5;m.box([x,y,z],[.7+(i%3)*.3,1+(i%4)*.3,.14],i%3?'oliveDark':'olive');}
  if(style===7)for(let y=4;y<=20;y+=4){for(const x of [-6.5,6.5])m.box([x,y,z],[7,.22,.35],'concreteLight');for(const x of [-9,9])m.box([x,y-2,z],[.25,4,.35],'concreteLight');}
 }
 return m.mesh();
}
export function equipmentModel(style:number){
 const m=new VoxelMesh(WEAPON_NAMESPACE);
 if(style===0){m.box([0,1,0],[3,2,2],'concrete');m.tube([0,4,0],.18,6,'steelDark',0,'y',6);m.box([0,6,0],[3,.12,.12],'steelLight');}
 if(style===1){m.box([0,.2,0],[5,.4,3],'concreteDark');for(const x of [-1.5,1.5]){m.box([x,1.3,0],[2,2,2],'steel');for(let y=.5;y<2;y+=.25)m.box([x,y,1.02],[1.6,.08,.04],'steelDark');}}
 if(style===2){for(const x of [-1,1])m.box([x,1,0],[.2,2,.2],'rust');m.tube([0,3,0],1.5,3,'steelLight',0,'y',10);m.tube([0,4.6,0],1.6,.2,'steelDark',0,'y',10);}
 if(style===3){m.box([0,2,0],[4,4,3],'concreteLight');m.box([0,4.1,0],[4.5,.2,3.5],'steelDark');m.box([0,1.5,1.52],[1.2,2.8,.1],'woodDark');}
 return m.mesh();
}
export type ArchitecturalPart={key:string;p:[number,number,number];scale:[number,number,number]};
export function buildingParts(b:Building):ArchitecturalPart[]{
 const key=b.kind+'-'+b.variant,s=buildingScale(b),[w,d]=buildingDimensions(b),height=towerFloors(b)*4.8;
 return [{key:key+'-shell',p:[b.x,0,b.z],scale:s},...(towerFloors(b)>1?[{key:key+'-tower',p:[b.x,0,b.z] as [number,number,number],scale:s}]:[]),{key:'roof-'+roofStyle(b),p:[b.x,height,b.z],scale:[w/21,1,d/21]},{key:'facade-'+facadeStyle(b),p:[b.x,0,b.z],scale:[w/20,height/20,d/20]},{key:'equipment-'+equipmentStyle(b),p:[b.x+w*.3,height,b.z-d*.3],scale:[1,1,1]}];
}
/** Ignores identity and world position; checks geometry combinations themselves. */
export function designSignature(b:Building){return JSON.stringify({kind:b.kind,variant:b.variant,roof:roofStyle(b),facade:facadeStyle(b),equipment:equipmentStyle(b),floors:towerFloors(b)});}
