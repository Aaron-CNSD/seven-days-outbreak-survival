import { definePackageId } from '@forgeax/engine/pack/source';
import { AssetGuid } from '@forgeax/engine/pack/guid';
import type { SceneEntity } from '@forgeax/engine/types';
import { WEAPONS } from './config.ts';
export const WEAPON_NAMESPACE=definePackageId('155bb6f7-f6f1-4438-a9f6-d4491c231f08');
const guid=(key:string)=>AssetGuid.format(AssetGuid.derive(WEAPON_NAMESPACE,key));
export function weaponEntities():readonly (readonly [string,SceneEntity])[]{
 const rows:(readonly [string,SceneEntity])[]=[];
 for(let index=0;index<WEAPONS.length;index++){
  const id='weapon-'+index;
  rows.push([id,{components:{Name:{value:WEAPONS[index]!.name},Transform:{pos:[.23,-.22,-.6],scale:index===0?[1,1,1]:[0,0,0]},ChildOf:{parent:'camera'}}}]);
  for(const group of ['body','mag','bolt','hands','support'])rows.push([id+'/'+group,{components:{Name:{value:group},Transform:{},ChildOf:{parent:id},MeshFilter:{assetHandle:guid('mesh/'+index+'/'+group)},MeshRenderer:{materials:[]}}}]);
  for(const part of ['muzzle','mag','optic'])rows.push([id+'/attachment-'+part,{components:{Name:{value:part},Transform:{scale:[0,0,0]},ChildOf:{parent:part==='mag'?id+'/mag':id},MeshFilter:{assetHandle:guid('mesh/'+index+'/attachment-'+part)},MeshRenderer:{materials:[]}}}]);
  const preview='inventory-'+id;
  rows.push([preview,{components:{Transform:{scale:[0,0,0]},ChildOf:{parent:'camera'}}}]);
  for(const part of ['body','mag','bolt','attachment-muzzle','attachment-mag','attachment-optic']){
   if(index===7&&part!=='body')continue;
   rows.push([preview+'/'+part,{components:{Transform:{scale:part.startsWith('attachment')?[0,0,0]:[1,1,1]},ChildOf:{parent:preview},MeshFilter:{assetHandle:guid('mesh/'+index+'/'+part)},MeshRenderer:{materials:[]}}}]);
  }
  rows.push([id+'/flash',{components:{Name:{value:'Voxel muzzle flash'},Transform:{pos:[0,index===1?.035:index===2?.022:.008,index===1?-.85:index===2?-.145:index===3?-.48:index===4?-.344:-.59],scale:[0,0,0]},ChildOf:{parent:id},MeshFilter:{assetHandle:guid('mesh/flash')},MeshRenderer:{materials:[guid('material/flash')]}}}]);
 }
 for(const skin of [1,2])rows.push(['knife-skin-'+skin,{components:{Transform:{scale:[0,0,0]},ChildOf:{parent:'weapon-7'},MeshFilter:{assetHandle:guid('mesh/knife-skin-'+skin)},MeshRenderer:{materials:[]}}}]);
 for(const skin of [1,2])rows.push(['inventory-knife-skin-'+skin,{components:{Transform:{scale:[0,0,0]},ChildOf:{parent:'inventory-weapon-7'},MeshFilter:{assetHandle:guid('mesh/knife-skin-'+skin)},MeshRenderer:{materials:[]}}}]);
 rows.push(['inventory-weapon-light',{components:{Transform:{pos:[.30,.45,-.95]},ChildOf:{parent:'camera'},PointLight:{color:[1,.94,.82],intensity:0,range:2}}}]);
 // Soft physical viewmodel lighting reveals metal/wood/glove differences, without a map.
 rows.push(['weapon-key',{components:{Transform:{pos:[-.5,.45,-.25]},ChildOf:{parent:'camera'},PointLight:{color:[1,.88,.7],intensity:2.8,range:2}}}]);
 rows.push(['weapon-rim',{components:{Transform:{pos:[.65,.25,-1]},ChildOf:{parent:'camera'},PointLight:{color:[.68,.82,1],intensity:1.1,range:2}}}]);
 return rows;
}
