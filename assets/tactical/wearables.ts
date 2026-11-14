import type { PackageId } from '@forgeax/engine/pack/source';
import { VoxelMesh } from '../weapons/voxel-builder.ts';

export function wearableMeshes(ns:PackageId){
 const arm=new VoxelMesh(ns);
 arm.bevel([0,-.12,0],[.141,.32,.16],'shirt',.018,0);
 arm.bevel([0,-.37,-.023],[.12,.24,.143],'shirt',.016,0);
 arm.box([0,-.504,-.043],[.108,.116,.12],'rubberDark');
 const body=new VoxelMesh(ns),helmet=new VoxelMesh(ns),carrier=new VoxelMesh(ns),rig=new VoxelMesh(ns),sleeve=new VoxelMesh(ns);
 body.bevel([0,1.33,0],[.44,.53,.25],'shirt',.037,0);
 body.bevel([0,1.73,0],[.25,.29,.25],'skin',.035,0);
 body.box([0,1.78,-.126],[.19,.12,.012],'rubberDark');
 body.box([0,1.77,-.135],[.175,.035,.012],'lens');
 body.box([0,1.64,-.126],[.19,.11,.024],'fabricDark');
 body.box([0,.99,0],[.4,.18,.24],'fabricDark');
 for(const side of [-1,1]){
  body.bevel([side*.114,.54,0],[.20,.82,.22],'fabricDark',.025,0);
  body.bevel([side*.114,.51,-.11],[.146,.163,.065],'olive',.021,0);
  body.bevel([side*.114,.094,-.053],[.2,.18,.33],'rubberDark',.022,0);
  body.box([side*.114,.025,-.058],[.207,.039,.337],'rubber');
 }
 helmet.bevel([0,.035,0],[.31,.191,.318],'olive',.034,0);
 helmet.bevel([0,.09,.012],[.272,.106,.288],'oliveLight',.027,0);
 helmet.box([0,.001,-.149],[.22,.035,.05],'oliveDark');
 for(const side of [-1,1]){
  helmet.box([side*.151,-.04,.042],[.029,.085,.12],'rubberDark');
  helmet.box([side*.126,-.092,.024],[.019,.13,.019],'fabricDark',.18);
 }
 carrier.bevel([0,0,0],[.402,.36,.074],'oliveDark',.026,0);
 for(const x of [-.137,.137])carrier.box([x,.191,.063],[.072,.09,.24],'olive');
 for(let y=-.12;y<=.12;y+=.06)carrier.box([0,y,-.041],[.36,.019,.018],'olive');
 rig.box([0,0,0],[.37,.144,.047],'fabricDark');
 for(const x of [-.12,0,.12]){
  rig.bevel([x,0,-.048],[.103,.137,.08],'olive',.012,0);
  rig.box([x,.058,-.061],[.098,.03,.081],'oliveLight');
  rig.box([x,.031,-.091],[.021,.062,.009],'rubberDark');
 }
 sleeve.bevel([0,0,0],[1,1,1],'shirt',.12,0);
 sleeve.box([0,.35,-.50],[.92,.12,.06],'shirtCuff');
 return {body,arm,helmet,carrier,rig,sleeve};
}
