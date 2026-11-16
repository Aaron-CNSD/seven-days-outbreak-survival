import { definePack, definePackageId } from '@forgeax/engine/pack/source';
import { AssetGuid } from '@forgeax/engine/pack/guid';
import { ok } from '@forgeax/engine/types';
import type { Plugin } from '@forgeax/engine/plugin';
import { Update, Time, type EntityHandle } from '@forgeax/engine/ecs';
import { Transform, Name } from '@forgeax/engine/scene';
import { MeshFilter, MeshRenderer, PointLight } from '@forgeax/engine/render';
import { Collider, ColliderShapeValue, RigidBody, RigidBodyTypeValue } from '@forgeax/engine/physics';
import { INPUT_SNAPSHOT_RESOURCE_KEY, type InputSnapshot } from '@forgeax/engine/input';
import { quat, vec3 } from '@forgeax/engine/math';
import type { PhysicsWorld } from '@forgeax/engine/physics';
import { ThirdPersonRig } from '../player/player.ts';
import { BUILDINGS, KINDS, DESTINATIONS, nearbyBuildings, regionAt, treeLocations, towerFloors, dimensions, PARK } from './layout.ts';
import { towerModel, parkModels, coasterPoint } from './landmarks.ts';
import { buildingModel, landscape, treeModel, type Solid } from './models.ts';
const ID=definePackageId('a07b82e0-4263-4cf1-bb55-68254665a340');
const guid=(key:string)=>AssetGuid.derive(ID,key);
export const OUTBREAK_GUID=AssetGuid.format(guid('plugin/world'));
export const outbreak:Plugin={name:'outbreak/world',inject:['world','assets','gameHost','game3dPlayer','physics'],async apply(ctx){
 const {world,assets,gameHost:host,game3dPlayer:player}=ctx;
 if(!assets||!host)throw new Error('World assets unavailable');
 await ctx.effect(async function*(){
  const handles=new Map<string,any>();const shapes=new Map<string,Solid[]>();
  for(const kind of KINDS)for(let v=0;v<3;v++){
   const key=kind+'-'+v;shapes.set(key,buildingModel(kind,v).solids);
   for(const part of ['shell','inside',...(towerFloors({id:0,x:0,z:0,kind,variant:v})>1?['tower']:[])]){const h=(await assets.load(guid('mesh/'+key+'-'+part),'mesh')).unwrap();handles.set(key+'-'+part,h);yield()=>{assets.release(h).unwrap();};}
  }
  for(const key of ['landscape','tree','park-ground','park-wheel','park-cabin','park-car']){const h=(await assets.load(guid('mesh/'+key),'mesh')).unwrap();handles.set(key,h);yield()=>{assets.release(h).unwrap();};}
  const all=new Set<EntityHandle>();
  const remove=(entities:EntityHandle[])=>{for(const e of entities){world.despawn(e).unwrap();all.delete(e);}};
  yield()=>remove([...all]);
  const mesh=(key:string,p:number[],scale=[1,1,1])=>{const e=world.spawn({component:Name,data:{value:'Outbreak '+key}},{component:Transform,data:{pos:p,scale}},{component:MeshFilter,data:{assetHandle:handles.get(key)}},{component:MeshRenderer,data:{materials:[]}}).unwrap();all.add(e);return e;};
  const light=(p:number[])=>{const e=world.spawn({component:Transform,data:{pos:p}},{component:PointLight,data:{color:[.83,.9,1],intensity:20,range:32}}).unwrap();all.add(e);return e;};
  const solid=(p:readonly number[],s:readonly number[])=>{const e=world.spawn({component:Transform,data:{pos:[...p]}},{component:RigidBody,data:{type:RigidBodyTypeValue.static}},{component:Collider,data:{shape:ColliderShapeValue.cuboid,halfExtents:s.map(v=>v/2),friction:.85}}).unwrap();all.add(e);return e;};
  mesh('landscape',[0,0,0]);solid([0,-.35,0],[6000,.6,5000]);
  for(const x of [-3000,3000])solid([x,30,0],[1,60,5000]);
  for(const z of [-2500,2500])solid([0,30,z],[6000,60,1]);
  solid([2430,0,0],[110,.3,5]);
  const shells=new Map<number,EntityHandle[]>(),interiors=new Map<number,EntityHandle[]>(),colliders=new Map<number,EntityHandle[]>(),trees=new Map<number,EntityHandle[]>();
  const forest=treeLocations();let timer=1,travelling=false,parkTime=0;
  let parkEntities:EntityHandle[]=[],wheel:EntityHandle|undefined,car:EntityHandle|undefined;let cabins:EntityHandle[]=[];
  const upperFloor:EntityHandle[]=[];
  const spawnPark=()=>{if(parkEntities.length)return;parkEntities.push(mesh('park-ground',[PARK.x,0,PARK.z]));wheel=mesh('park-wheel',[PARK.x-65,35,PARK.z]);car=mesh('park-car',[PARK.x,6,PARK.z]);cabins=Array.from({length:16},()=>mesh('park-cabin',[PARK.x,0,PARK.z]));parkEntities.push(wheel,car,...cabins,solid([PARK.x+95,.12,PARK.z+10],[16,.24,8]));for(const x of [-125,-100,-75,40,65,90])parkEntities.push(solid([PARK.x+x,1.6,PARK.z+110],[6,3.2,5]));};
  const elevatorCandidate=()=>{const p=world.get(player.entity,Transform).unwrap().pos;return nearbyBuildings(p[0]!,p[2]!,35).find(b=>towerFloors(b)>1&&Math.abs(p[0]!-b.x)<2.4&&Math.abs(p[2]!-(b.z-dimensions(b.kind)[1]/2+4))<3);};
  const lift=(direction:number)=>{const b=elevatorCandidate();if(!b)return;const current=Math.max(0,Math.round((world.get(player.entity,Transform).unwrap().pos[1]!-.95)/4.8));const floor=Math.max(0,Math.min(towerFloors(b)-1,current+direction));if(floor===current)return;
   remove(upperFloor.splice(0));
   const y=floor*4.8,[w,d]=dimensions(b.kind),key=b.kind+'-'+b.variant;
   if(floor>0){upperFloor.push(mesh(key+'-inside',[b.x,y,b.z]),light([b.x,y+3.4,b.z]),solid([b.x,y-.12,b.z],[w,.24,d]));for(const side of [-1,1])upperFloor.push(solid([b.x+side*w/2,y+2.2,b.z],[.3,4.4,d]),solid([b.x,y+2.2,b.z+side*d/2],[w,4.4,.3]));for(const s of shapes.get(key)!)upperFloor.push(solid([b.x+s.p[0],y+s.p[1],b.z+s.p[2]],s.s));}
   const z=b.z-d/2+4;(ctx.physics as PhysicsWorld).teleport(player.entity,vec3.create(b.x,y+1.05,z));world.set(player.entity,ThirdPersonRig,{verticalVelocity:0,focusX:b.x,focusY:y+1.6,focusZ:z}).unwrap();
  };
  const stream=()=>{
   const p=world.get(player.entity,Transform).unwrap().pos,x=p[0]!,z=p[2]!;
   const wanted=nearbyBuildings(x,z,540),ids=new Set(wanted.map(b=>b.id));
   for(const [id,es] of shells)if(!ids.has(id)){remove(es);shells.delete(id);}
   for(const [id,es] of interiors)if(Math.hypot(BUILDINGS[id]!.x-x,BUILDINGS[id]!.z-z)>125){remove(es);interiors.delete(id);}
   for(const [id,es] of colliders)if(Math.hypot(BUILDINGS[id]!.x-x,BUILDINGS[id]!.z-z)>175){remove(es);colliders.delete(id);}
   for(const b of wanted){const key=b.kind+'-'+b.variant,dist=Math.hypot(b.x-x,b.z-z);
    if(!shells.has(b.id))shells.set(b.id,[mesh(key+'-shell',[b.x,0,b.z]),...(towerFloors(b)>1?[mesh(key+'-tower',[b.x,0,b.z])]:[])]);
    if(dist<110&&!interiors.has(b.id))interiors.set(b.id,[mesh(key+'-inside',[b.x,0,b.z]),light([b.x,3.4,b.z+dimensions(b.kind)[1]/4]),light([b.x,3.4,b.z-dimensions(b.kind)[1]/4])]);
    if(dist<160&&!colliders.has(b.id))colliders.set(b.id,shapes.get(key)!.map(s=>solid([b.x+s.p[0],s.p[1],b.z+s.p[2]],s.s)));
   }
   if(Math.hypot(x-PARK.x,z-PARK.z)<650)spawnPark();else if(parkEntities.length){remove(parkEntities);parkEntities=[];cabins=[];wheel=undefined;car=undefined;}
   const nearby=forest.filter(t=>Math.hypot(t.x-x,t.z-z)<180),treeIds=new Set(nearby.map(t=>t.id));
   for(const [id,es] of trees)if(!treeIds.has(id)){remove(es);trees.delete(id);}
   for(const t of nearby)if(!trees.has(t.id))trees.set(t.id,[mesh('tree',[t.x,0,t.z],[t.size,t.size,t.size]),solid([t.x,2*t.size,t.z],[.55*t.size,4*t.size,.55*t.size])]);
  };
  stream();
  const read=()=>{const p=Array.from(world.get(player.entity,Transform).unwrap().pos);return {areaKm2:30,widthMetres:6000,depthMetres:5000,buildingCount:BUILDINGS.length,region:regionAt(p[0]!,p[2]!),towerCount:BUILDINGS.filter(b=>towerFloors(b)>1).length,maxHeightMetres:153.6,parkLoaded:parkEntities.length>0,parkTime,elevatorAvailable:!!elevatorCandidate(),floor:Math.floor((p[1]!-.5)/4.8)+1,position:p,loadedBuildings:shells.size,loadedInteriors:interiors.size,loadedTrees:trees.size,travelling,nearest:nearbyBuildings(p[0]!,p[2]!,80).map(b=>({id:b.id,kind:b.kind,x:b.x,z:b.z}))};};
  const unregister=host.gameProjection?.registerRead({id:'outbreak.world',title:'30 km² outbreak world',description:'Metric size, streamed buildings and interiors, player region.',read});if(unregister)yield unregister;
  const receive=(ev:MessageEvent)=>{const m=ev.data;if(m?.channel==='outbreak/world'&&m.kind==='lift'){lift(m.direction===-1?-1:1);return;}if(m?.channel!=='outbreak/world'||m.kind!=='travel'||!Number.isInteger(m.destination))return;const d=DESTINATIONS[m.destination];if(!d)return;travelling=true;remove(upperFloor.splice(0));(ctx.physics as PhysicsWorld).teleport(player.entity,vec3.create(d.x,1.05,d.z));world.set(player.entity,Transform,{pos:[d.x,1.05,d.z]}).unwrap();world.set(player.entity,ThirdPersonRig,{verticalVelocity:0,focusX:d.x,focusY:1.55,focusZ:d.z,yaw:d.yaw??0,pitch:0}).unwrap();stream();travelling=false;};
  host.port?.addEventListener('message',receive);yield()=>host.port?.removeEventListener('message',receive);
  world.addSystem(Update,{name:'outbreak-stream',queries:[],fn:()=>{const dt=world.getResource(Time).delta;parkTime+=dt;
   const input=world.getResource<InputSnapshot>(INPUT_SNAPSHOT_RESOURCE_KEY);if(input.keyboard.justPressedCode('KeyG'))lift(1);if(input.keyboard.justPressedCode('KeyH'))lift(-1);
   if(wheel){const a=parkTime*.045;world.set(wheel,Transform,{quat:[0,0,Math.sin(a/2),Math.cos(a/2)]}).unwrap();cabins.forEach((e,i)=>{const angle=a+i*Math.PI/8;world.set(e,Transform,{pos:[PARK.x-65+32*Math.cos(angle),35+32*Math.sin(angle)-1.8,PARK.z]}).unwrap();});}
   if(car){const p=coasterPoint(parkTime/65%1),q=coasterPoint((parkTime/65+.002)%1),r=quat.fromEuler(quat.create(),0,Math.atan2(q[0]-p[0],q[2]-p[2]),0,'YXZ');world.set(car,Transform,{pos:[PARK.x+p[0],p[1]+.45,PARK.z+p[2]],quat:Array.from(r)}).unwrap();}
   timer+=dt;if(timer<.35)return;timer=0;stream();host.port?.postMessage({channel:'outbreak/state',...read()});}}).unwrap();
  yield()=>world.removeSystem(Update,'outbreak-stream').unwrap();
 });
}};
export default definePack({schemaVersion:'2.0.0',packageId:ID,plugins:true,build:()=>{
 const park=parkModels();const entries:any[]=[['plugin/world',{kind:'plugin',module:{specifier:'./outbreak.pack.ts',export:'outbreak'},config:{}}],['mesh/landscape',landscape()],['mesh/tree',treeModel()],...Object.entries(park).map(([key,value])=>['mesh/park-'+key,value])];
 for(const kind of KINDS)for(let v=0;v<3;v++){const m=buildingModel(kind,v);entries.push(['mesh/'+kind+'-'+v+'-shell',m.shell],['mesh/'+kind+'-'+v+'-inside',m.inside]);if(towerFloors({id:0,x:0,z:0,kind,variant:v})>1)entries.push(['mesh/'+kind+'-'+v+'-tower',towerModel(kind,v)]);}
 return ok(Object.fromEntries(entries));
}});
