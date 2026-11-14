import {VoxelMesh} from '../weapons/voxel-builder.ts';
import type {PackageId} from '@forgeax/engine/pack/source';
import {AssetGuid} from '@forgeax/engine/pack/guid';
import type {SceneEntity} from '@forgeax/engine/types';
export function tacticalMeshes(ns:PackageId){
 const enemy=new VoxelMesh(ns),grenade=new VoxelMesh(ns),med=new VoxelMesh(ns),plate=new VoxelMesh(ns),rack=new VoxelMesh(ns);
 enemy.bevel([0,1.17,0],[.49,.61,.27],'fabric',.04,0);enemy.box([0,1.22,.15],[.40,.42,.06],'oliveDark');
 enemy.bevel([0,1.73,0],[.31,.32,.29],'rubber',.05,0);enemy.box([0,1.75,.155],[.25,.07,.02],'red');
 for(const side of [-1,1]){enemy.box([side*.15,.43,0],[.20,.83,.22],'fabricDark');enemy.box([side*.15,.09,.08],[.23,.18,.36],'rubber');enemy.box([side*.31,1.17,.13],[.16,.47,.17],'fabric');for(let j=0;j<3;j++)enemy.box([side*.11,1.1+j*.1,.19],[.16,.07,.05],'olive');}
 enemy.box([.23,1.2,.4],[.09,.12,.68],'steelDark');enemy.tube([.23,1.24,.78],.027,.16,'steel');
 grenade.tube([0,0,0],.055,.14,'olive',0,'y',10);grenade.box([0,.09,0],[.04,.05,.04],'steel');grenade.box([.04,.04,0],[.012,.13,.025],'steelLight');
 med.box([0,0,0],[.16,.12,.08],'fabricDark');med.box([0,0,.043],[.105,.025,.006],'white');med.box([0,0,.045],[.025,.083,.006],'white');
 plate.bevel([0,0,0],[.20,.29,.025],'steelDark',.04,0);
 rack.box([0,.48,10.9],[6,.96,.8],'steelDark');rack.box([0,1,10.9],[6.2,.08,.95],'wood');rack.box([0,2.1,11.55],[6.2,2.1,.10],'oliveDark');
 for(let x=-2.8;x<3;x+=.6){rack.box([x,2.1,11.47],[.04,1.7,.12],'steel');rack.box([x,1.5,11.35],[.18,.05,.28],'sandLight');}
 return [['mesh/enemy',enemy.mesh()],['mesh/grenade',grenade.mesh()],['mesh/medkit',med.mesh()],['mesh/plate',plate.mesh()],['mesh/rack',rack.mesh()]] as const;
}
export function tacticalEntities(ns:PackageId){
 const guid=(s:string)=>AssetGuid.format(AssetGuid.derive(ns,s));
 const rows:(readonly[string,SceneEntity])[]=[];
 const add=(id:string,mesh:string,parent?:string,material?:string)=>rows.push([id,{components:{Transform:{pos:id==='equipment-rack'?[0,0,0]:[0,-20,0]},...(parent?{ChildOf:{parent}}:{}),MeshFilter:{assetHandle:guid('mesh/'+mesh)},MeshRenderer:{materials:material?[guid('material/'+material)]:[]}}}]);
 add('equipment-rack','rack');
 add('inventory-operator','wearable-body','camera');
 for(let i=0;i<2;i++)add('inventory-arm-'+i,'wearable-arm','inventory-operator');
 for(const key of ['helmet','carrier','rig'])add('inventory-'+key,'wearable-'+key,'inventory-operator');
 for(let i=0;i<4;i++)add('view-sleeve-'+i,'wearable-sleeve','camera');
 for(const [slot,index] of [0,1,3,4,5,6].entries()){
  const id='stored-'+index;rows.push([id,{components:{Transform:{pos:[-2.5+slot,2,11.25],scale:[.85,.85,.85],quat:[0,.7071,0,.7071]}}}]);
  for(const group of ['body','mag','bolt'])rows.push([id+'-'+group,{components:{Transform:{},ChildOf:{parent:id},MeshFilter:{assetHandle:guid('mesh/'+index+'/'+group)},MeshRenderer:{materials:[]}}}]);
 }
 for(let i=0;i<3;i++){add('enemy-'+i,'enemy');add('enemy-flash-'+i,'flash',undefined,'flash');}
 for(let i=0;i<4;i++)add('grenade-'+i,'grenade');
 for(let i=0;i<10;i++)add('smoke-'+i,'flash',undefined,'smoke');
 add('explosion','flash',undefined,'flash');
 add('use-medkit','medkit','camera');add('use-plate','plate','camera');add('held-grenade','grenade','camera');
 return rows;
}
