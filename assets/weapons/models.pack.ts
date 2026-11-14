import { PIXEL_FINISHES, pixelFinish } from './pixel-finish.ts';
import { surfaceDetail } from './surface-detail.ts';
import { sleeveFabric } from './sleeve-fabric.ts';
import { rangeSurface, blockSurface } from '../range/surfaces.ts';
import { definePack, definePackageId } from '@forgeax/engine/pack/source';
import { AssetGuid } from '@forgeax/engine/pack/guid';
import { createSphereGeometry } from '@forgeax/engine/geometry';
import { Materials } from '@forgeax/engine/render';
import { ok, RenderQueue, type SceneEntity } from '@forgeax/engine/types';
import { PALETTE, VoxelMesh, materialKey, SURFACES } from './voxel-builder.ts';
import { attachmentMeshes } from './attachments.ts';
import { makeWeapon } from './detailed-models.ts';
import { WEAPON_NAMESPACE } from './weapon-scene.ts';
import { wearableMeshes } from '../tactical/wearables.ts';
import { tacticalMeshes } from '../tactical/models.ts';
import { rangeMeshes } from '../range/training.ts';
import { WEAPONS } from './config.ts';
export const createModels=()=>WEAPONS.map((_,i)=>makeWeapon(i,WEAPON_NAMESPACE));
export default definePack({schemaVersion:'2.0.0',packageId:WEAPON_NAMESPACE,name:'Detailed voxel armoury',build:()=>{
 const MODEL_PARTS=createModels();
 const sphere=createSphereGeometry(1,8,6);if(!sphere.ok)return sphere;
 const materials=SURFACES.map((name,index)=>{
  const pixel=PIXEL_FINISHES.some(finish=>finish===name);
  const textured=pixel||name==='concrete'||name==='asphalt'||name==='sleeve'||name.startsWith('block-');
  const texture=textured?AssetGuid.format(AssetGuid.derive(WEAPON_NAMESPACE,'texture/'+name)):undefined;
  return ['material/'+name,Materials.standard({
   baseColor:[1,1,1,1],metallic:index===0?.65:name==='blued-steel'?.42:0,roughness:[.43,.69,.89,.1,.89,.94,.96,.99,.99,.94,.85,.71,.57][index]!,
   ...(texture?{baseColorTexture:texture}:{}),
   ...(!pixel&&name!=='lens'&&name!=='organic'&&!name.startsWith('block-')?{normalTexture:AssetGuid.format(AssetGuid.derive(WEAPON_NAMESPACE,'texture/'+name+'-normal')),metallicRoughnessTexture:AssetGuid.format(AssetGuid.derive(WEAPON_NAMESPACE,'texture/'+name+'-roughness')),normalScale:[.65,.65] as const}:{}),
  })];
 });
 const wearables=Object.entries(wearableMeshes(WEAPON_NAMESPACE)).map(([name,mesh])=>['mesh/wearable-'+name,mesh.mesh()]);
 const accessories=WEAPONS.flatMap((_,i)=>Object.entries(attachmentMeshes(i,WEAPON_NAMESPACE)).map(([part,mesh])=>['mesh/'+i+'/attachment-'+part,mesh.mesh()]));
 const meshes=MODEL_PARTS.flatMap((assembly,i)=>[
  ['mesh/'+i+'/body',assembly.body.mesh()],['mesh/'+i+'/mag',assembly.mag.mesh()],
  ['mesh/'+i+'/bolt',assembly.bolt.mesh()],['mesh/'+i+'/hands',assembly.hands.mesh()],['mesh/'+i+'/support',assembly.support.mesh()],
 ]);
 return ok(Object.fromEntries([['mesh/flash',sphere.value],['material/flash',Materials.unlit([1,.65,.12,1])],...materials,...PIXEL_FINISHES.map(s=>['texture/'+s,pixelFinish(s)]),...SURFACES.filter(s=>s!=='lens'&&s!=='organic'&&!s.startsWith('block-')&&!PIXEL_FINISHES.some(finish=>finish===s)).flatMap(s=>[['texture/'+s+'-normal',surfaceDetail(s,true)],['texture/'+s+'-roughness',surfaceDetail(s,false)]]),['texture/block-grass',blockSurface(true)],['texture/block-dirt',blockSurface(false)],['texture/concrete',rangeSurface(false)],['texture/asphalt',rangeSurface(true)],['texture/sleeve',sleeveFabric()],...meshes,...wearables,...accessories,...rangeMeshes(WEAPON_NAMESPACE),...tacticalMeshes(WEAPON_NAMESPACE),...([1,2].map(s=>['mesh/knife-skin-'+s,makeWeapon(7,WEAPON_NAMESPACE,s).body.mesh()])),['material/smoke',Materials.standard({baseColor:[.43,.46,.47,.42],roughness:1,queue:RenderQueue.Transparent,renderState:{depthWriteEnabled:false,blend:{color:{srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha',operation:'add'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha',operation:'add'}}}})]]));
}});
