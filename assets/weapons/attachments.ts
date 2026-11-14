import { VoxelMesh } from './voxel-builder.ts';

export function attachmentMeshes(index:number, ns:any) {
 const muzzle=new VoxelMesh(ns), mag=new VoxelMesh(ns), optic=new VoxelMesh(ns);
 const muzzleZ=[-.54,-.85,-.15,-.49,-.35,-.50,-.57,0][index]!;
 const muzzleY=[.008,.035,.022,.008,.008,.008,.008,0][index]!;
 muzzle.tube([0,muzzleY,muzzleZ],.016,.045,'steelDark',0,'z',8);
 for(const side of [-1,1]) for(const z of [-.012,0,.012]) muzzle.box([side*.015,muzzleY+.004,muzzleZ+z],[.002,.006,.005],'groove');
 const magZ=[-.09,-.056,.067,-.04,-.04,-.04,-.04,0][index]!;
 const magY=[-.19,-.11,-.11,-.15,-.15,-.15,-.15,0][index]!;
 mag.box([0,magY,magZ],[.042,.019,.079],'rubberDark');
 mag.box([0,magY-.012,magZ],[.052,.009,.09],'steelLight');
 const sightZ=[-.04,-.05,.01,-.04,-.04,-.04,-.04,0][index]!;
 optic.box([0,.071,sightZ],[.035,.012,.09],'steelDark');
 optic.box([0,.097,sightZ],[.042,.043,.055],'steelDark');
 optic.box([0,.099,sightZ-.029],[.027,.027,.003],'lens');
 return {muzzle,mag,optic};
}
