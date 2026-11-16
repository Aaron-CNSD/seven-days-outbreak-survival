import { VoxelMesh, type V3, type Material } from '../weapons/voxel-builder.ts';
import { WEAPON_NAMESPACE } from '../weapons/weapon-scene.ts';
import { cityX, cityZ, dimensions, type Kind } from './layout.ts';
export type Solid={p:V3;s:V3};
export function buildingModel(kind:Kind,variant:number){
 const shell=new VoxelMesh(WEAPON_NAMESPACE),inside=new VoxelMesh(WEAPON_NAMESPACE),solids:Solid[]=[];
 const [w,d]=dimensions(kind),h=4.4;
 const box=(m:VoxelMesh,p:V3,s:V3,c:Material,solid=false)=>{m.box(p,s,c);if(solid)solids.push({p,s});};
 const wall:Material=kind==='cabin'?'woodDark':variant===1?'sandLight':variant===2?'concreteLight':'white';
 // A generous open front doorway, windows on both sides, continuous floor and roof.
 box(shell,[0,-.12,0],[w,.24,d],'concrete');
 for(const side of [-1,1]){
  box(shell,[side*(w/4+1),h/2,d/2],[w/2-2,h,.3],wall,true);
  box(shell,[side*w/2,.55,0],[.3,1.1,d],wall,true);
  box(shell,[side*w/2,3.8,0],[.3,1.2,d],wall,true);
  for(let z=-d/2;z<=d/2;z+=4){box(shell,[side*w/2,2.2,z],[.38,2.2,.45],wall,true);box(shell,[side*(w/2+.05),1.15,z+1.8],[.5,.12,3.1],'steelDark');}
  box(shell,[side*2.03,1.55,d/2+.09],[.12,3.1,.4],'steelDark');
 }
 box(shell,[0,3.75,d/2],[4,1.3,.3],wall,true);
 box(shell,[0,h/2,-d/2],[w,h,.3],wall,true);
 box(shell,[0,h+.12,0],[w+.5,.24,d+.5],'concreteDark',true);
 box(shell,[0,3.7,d/2+.25],[Math.min(w-2,16),.7,.16],kind==='hospital'?'red':kind==='restaurant'?'wood':kind==='mall'?'steel':'oliveDark');
 if(kind==='hospital'){box(shell,[0,3.72,d/2+.35],[.18,.55,.04],'white');box(shell,[0,3.72,d/2+.35],[.55,.18,.04],'white');}
 // Pavement, parapet, gutters, rooftop vents, boarded windows and climbing growth.
 box(shell,[0,-.08,d/2+1.5],[w+3,.16,3],'concreteLight');
 for(const side of [-1,1])box(shell,[side*(w/2-.15),4.65,0],[.25,.8,d],'concreteDark');
 for(let i=0;i<3;i++){box(shell,[-w/3+i*3,4.8,-d/3],[1.4,.9,1.4],'steel');for(let j=0;j<4;j++)box(shell,[-w/3+i*3,4.9,-d/3+.72-j*.01],[1.1,.035,.02],'steelDark');}
 for(let i=0;i<14;i++){const x=(i*7.91%w)-w/2;box(shell,[x,.1+(i%4)*.33,d/2+.18],[.35+(i%3)*.15,.2,.04],i%2?'moss':'stain');}
 // Rear rooms open onto a 3.2 m central corridor; no inaccessible decorative upper floors.
 for(const side of [-1,1]){
  const roomWidth=w/2-1.6;
  box(inside,[side*(1.6+roomWidth/2),2,-2],[roomWidth,4,.18],wall,true);
  for(const z of [-d/2+3,-5])box(inside,[side*1.6,2,z],[.18,4,Math.max(1,(d/2-7)/2)],wall,true);
  // Room floors, skirting and ceiling light fittings.
  box(inside,[side*w/4,.012,-d/4],[w/2-2,.02,d/2-2],kind==='hospital'?'white':'sandDark');
  box(inside,[side*w/4,4.22,-d/4],[2,.08,.35],'white');
 }
 const table=(x:number,z:number)=>{box(inside,[x,.83,z],[1.8,.13,1.2],'wood',true);for(const a of [-.73,.73])for(const b of [-.43,.43])box(inside,[x+a,.4,z+b],[.08,.8,.08],'steel');};
 const chair=(x:number,z:number)=>{box(inside,[x,.48,z],[.52,.12,.55],'woodDark',true);box(inside,[x,.86,z+.25],[.52,.75,.08],'woodDark');for(const a of [-.2,.2])box(inside,[x+a,.24,z],[.06,.48,.48],'steelDark');};
 const shelf=(x:number,z:number)=>{for(const a of [-.9,.9])box(inside,[x+a,1.1,z],[.08,2.2,.65],'steel',true);for(let k=0;k<4;k++){box(inside,[x,.25+k*.55,z],[1.9,.06,.65],'woodDark');for(let j=0;j<4;j++)box(inside,[x-.65+j*.4,.42+k*.55,z],[.22,.28,.3],(['sand','white','olive','red'] as const)[(j+k+variant)%4]!);}};
 const bed=(x:number,z:number)=>{box(inside,[x,.4,z],[2.1,.35,1.05],'steelLight',true);box(inside,[x,.65,z],[2,.25,1],'white');box(inside,[x-.65,.82,z],[.5,.12,.7],'sandLight');box(inside,[x+.2,.8,z],[1.1,.06,1.02],'oliveLight');box(inside,[x-1.05,.8,z],[.07,1.1,1.1],'steel');box(inside,[x+1.4,.6,z],[.5,1.2,.6],'concreteLight',true);};
 if(kind==='hospital'||kind==='hotel'||kind==='apartment'||kind==='cabin'){
  for(const side of [-1,1])for(let z=-d/2+4;z<-3;z+=4)bed(side*(w/2-3),z);
  table(-w/4,d/4);chair(-w/4,d/4+1);shelf(w/3,-d/2+1);
  if(kind==='hospital'){box(inside,[w/4,1,d/4],[5,2,1.2],'white',true);box(inside,[w/4,2.15,d/4],[5.3,.15,1.4],'steelLight');for(let i=0;i<3;i++)chair(-w/3+i,d/2-3);}
 }else if(kind==='restaurant'){
  for(const x of [-w/3,w/3])for(const z of [2,7]){table(x,z);chair(x,z+1);chair(x,z-1);box(inside,[x,.94,z],[.3,.08,.3],'white');}
  box(inside,[-w/4,1,-d/2+1],[w/2-3,2,1.4],'steel',true);
  for(let i=0;i<3;i++){inside.tube([-w/3+i*1.8,2.04,-d/2+1],.3,.05,'black',0,'y',10);}
  shelf(w/3,-d/2+1);box(inside,[w/2-1,1.4,-5],[1.2,2.8,1.2],'white',true);
 }else{
  for(const side of [-1,1])for(let z=-d/2+3;z<d/2-4;z+=5){
   if(kind==='school'||kind==='office'||kind==='police'){table(side*w/3,z);chair(side*w/3,z+1);box(inside,[side*w/3,1.1,z],[.6,.4,.08],'black');}
   else shelf(side*w/3,z);
  }
  box(inside,[0,1,-d/2+1],[2,2,.7],'oliveDark',true);
 }
 if(kind==='office'||kind==='apartment'||kind==='hotel'){
  box(inside,[0,.055,-d/2+4],[2.8,.08,3],'steel');
  box(inside,[0,1.6,-d/2+.2],[2.8,3.2,.08],'steelLight');
  box(inside,[0,1.6,-d/2+.25],[.04,3.2,.03],'steelDark');
  box(inside,[1.6,1.4,-d/2+.25],[.22,.5,.1],'steelDark');
  box(inside,[1.6,1.5,-d/2+.32],[.09,.1,.02],'sandLight');
 }
 // Tiled floors, ceiling panels, corridor dado rails and wayfinding plates.
 for(let x=-w/2+1;x<w/2;x+=2)for(let z=-d/2+1;z<d/2;z+=2){
  box(inside,[x,.022,z],[1.96,.025,1.96],(Math.round(x+z)+variant)%4===0?'concreteLight':'concrete');
  box(inside,[x,4.29,z],[1.96,.06,1.96],'white');
 }
 for(const side of [-1,1]){
  box(inside,[side*(w/2-.18),.15,0],[.04,.24,d-.3],'steelDark');
  for(const z of [-d/2+3,-5]){
   const length=Math.max(1,(d/2-7)/2);
   box(inside,[side*1.49,1,z],[.04,.15,length],kind==='hospital'?'oliveLight':'woodDark');
   box(inside,[side*1.47,2.2,z],[.06,.4,.65],'steelDark');
   for(let j=0;j<3;j++)box(inside,[side*1.43,2.3-j*.1,z],[.02,.03,.42],'white');
  }
 }
 for(let z=-d/2+3;z<d/2;z+=5){box(inside,[0,4.21,z],[.6,.07,1.4],'steelLight');box(inside,[0,4.16,z],[.4,.03,1.2],'white');}
 if(kind==='hospital'){
  // Lobby reception, monitor, keyboard, patient files, waiting benches and IV stands.
  box(inside,[-4,1,5],[3,2,1.2],'white',true);box(inside,[-4,2.05,5],[3.2,.1,1.4],'woodDark');
  box(inside,[-4,2.4,5],[.7,.5,.12],'steelDark');box(inside,[-4,2.4,5.07],[.58,.35,.02],'lens');
  for(let i=0;i<4;i++)box(inside,[-4.9+i*.28,2.14,5.3],[.2,.08,.35],'sandLight');
  for(const z of [4,8])for(let i=0;i<3;i++)chair(4+i*.7,z);
  for(const side of [-1,1])for(let z=-d/2+4;z<-3;z+=4){box(inside,[side*(w/2-5),1.25,z],[.035,2.5,.035],'steelLight');box(inside,[side*(w/2-5),2.1,z],[.22,.4,.12],'white');}
 }
 if(kind==='mall'||kind==='pharmacy'){
  for(const side of [-1,1]){shelf(side*4,4);box(inside,[side*5,1,d/2-5],[3,2,1],'white',true);box(inside,[side*5,2.2,d/2-5],[.6,.4,.4],'steelDark');}
 }
 if(kind==='school'){box(inside,[-w/4,2,-d/2+.2],[6,2,.12],'oliveDark');for(let i=0;i<4;i++)box(inside,[-w/4,2.6-i*.3,-d/2+.28],[3.5,.04,.03],'white');}
 if(kind==='police'){for(let i=0;i<5;i++){box(inside,[w/4-2+i,1.3,-d/2+.8],[.85,2.6,1.1],'steel',true);box(inside,[w/4-1.7+i,1.35,-d/2+1.37],[.06,.2,.03],'steelLight');}}
 if(kind==='garage'){
  box(inside,[4,.65,3],[2.2,1,4.5],'rust',true);box(inside,[4,1.45,2.8],[1.9,.7,2.3],'steelDark');
  for(const side of [-1,1])for(const z of [1.4,4.6])inside.tube([4+side*1.1,.5,z],.45,.25,'rubber',0,'x',10);
 }
 // Facade panel courses, damaged plaster and open window frames.
 for(const side of [-1,1]){
  for(let y=.5;y<3.4;y+=.65)box(shell,[side*(w/4+1),y,d/2+.17],[w/2-2,.018,.02],'concreteDark');
  for(let i=0;i<16;i++){const x=side*(2.5+(i*1.79%(w/2-3))),y=.4+(i*.37%2.7);box(shell,[x,y,d/2+.19],[.12+(i%4)*.11,.09,.025],'stain');}
 }
 // A paved forecourt with bollards, lamp, bench and overgrown planter beds.
 box(shell,[0,-.03,d/2+7],[w+6,.04,11],'asphalt');
 for(const side of [-1,1]){
  box(shell,[side*(w/2+2),.35,d/2+2],[1.5,.7,3],'concreteDark',true);
  for(let j=0;j<3;j++)shell.ellipsoid([side*(w/2+2),.8,d/2+1+j],[.8,.6,.7],'oliveDark',5,3);
  box(shell,[side*(w/2+1),2.8,d/2+9],[.14,5.6,.14],'steelDark');box(shell,[side*(w/2+.4),5.5,d/2+9],[1.4,.12,.5],'steel');
  for(let i=0;i<3;i++)box(shell,[side*(3+i*2),.5,d/2+1.3],[.17,1,.17],'steel');
 }
 // Deterministic litter and wear, kept out of the entry/corridor.
 for(let i=0;i<24;i++){const x=(i%2?1:-1)*(3+(i*1.71%(w/2-5))),z=-d/2+2+(i*3.13%(d-4));box(inside,[x,.035,z],[.25,.03,.38],i%3?'dust':'white');}
 return {shell:shell.mesh(),inside:inside.mesh(),solids};
}
export function landscape(){const m=new VoxelMesh(WEAPON_NAMESPACE);
 m.box([-975,-.3,0],[4050,.5,5000],'oliveDark');m.box([1650,-.3,0],[1200,.5,5000],'olive');m.box([2335,-.3,0],[170,.5,5000],'sandLight');m.box([7420,-.2,0],[10000,.2,15000],'lensLight');
 for(let z=-2500;z<2500;z+=9){m.box([2420+Math.sin(z*.07)*3,-.085,z],[2.4,.02,6],'white');for(let k=0;k<3;k++)m.box([2440+k*24+Math.sin(z)*8,-.085,z+k*4],[7,.025,.15],'lens');}
 for(let i=0;i<140;i++){const z=-2450+i*35; m.ellipsoid([2290+Math.sin(i*6.7)*22,.3,z],[1.4,.6,1],'sandDark',5,3);}
 // Dense block streets: narrow lanes between lots and wider avenues every four blocks.
 for(let column=0;column<40;column++){
  const x=cityX(column)+32;
  m.box([x,-.025,-385],[column%4===3?26:9,.04,3300],'asphalt');
  for(let z=-2000;z<1250;z+=16)m.box([x,.004,z],[.12,.012,5],'sandLight');
 }
 for(let row=0;row<40;row++){
  const z=cityZ(row)+38;
  m.box([-1050,-.02,z],[2800,.04,row%4===3?26:12],'asphalt');
  for(let x=-2400;x<320;x+=16)m.box([x,.006,z],[5,.012,.12],'sandLight');
 }
 m.box([1700,-.02,0],[9,.04,5000],'sandDark');m.box([0,-.02,20],[4700,.04,10],'asphalt');
 // Weathered wooden pier extends over the water.
 for(let i=0;i<75;i++)m.box([2380+i*1.4,.15,0],[1.3,.25,5],'woodDark');
 return m.mesh();}
export function treeModel(){const m=new VoxelMesh(WEAPON_NAMESPACE);m.tube([0,3,0],.3,6,'woodDark',0,'y',7);for(let j=0;j<3;j++)m.ellipsoid([Math.sin(j*2)*2,.35,Math.cos(j*2)*2],[.8,.6,.8],'oliveDark',5,3);for(let i=0;i<4;i++)m.ellipsoid([Math.sin(i*2)*1.1,5.5+i*.9,Math.cos(i*2)*.8],[2.5-i*.35,1.8,2.5-i*.35],i%2?'olive':'oliveDark',6,4);return m.mesh();}
