import { VoxelMesh, type V3, type Material } from '../weapons/voxel-builder.ts';
import { WEAPON_NAMESPACE } from '../weapons/weapon-scene.ts';
import { dimensions, towerFloors, type Kind } from './layout.ts';
export function towerModel(kind:Kind,variant:number){
 const m=new VoxelMesh(WEAPON_NAMESPACE),[w,d]=dimensions(kind),floors=towerFloors({id:0,x:0,z:0,kind,variant});
 const wall:Material=(['concreteLight','sandLight','steelDark','white','rust','sand','concrete','oliveDark','steel','woodDark','sandDark','concreteDark'] as const)[variant]!;
 const spacing=3.1+(variant%5)*.48;
 for(let f=1;f<floors;f++){
  const y=f*4.8;
  for(const side of [-1,1]){
   m.box([side*w/2,y+2.2,0],[.3,4.4,d],wall);m.box([0,y+2.2,side*d/2],[w,4.4,.3],wall);
   for(let x=-w/2+2;x<w/2;x+=spacing){m.box([x,y+2.3,side*(d/2+.17)],[spacing-.8,2.3+(variant%3)*.17,.04],(f*7+Math.round(x)*3+variant)%9===0?'woodDark':(f+Math.round(x)+variant)%5===0?'sand':'lens');m.box([x,y+.95,side*(d/2+.23)],[spacing-.6,.12,.3],'steelLight');}
   for(let x=-w/2+2;x<w/2;x+=spacing){
    m.box([x,y+2.3,side*(d/2+.22)],[.07,2.4,.07],'steelLight');
    m.box([x,y+3.5,side*(d/2+.22)],[spacing-.75,.065,.09],'steelLight');
    if((variant%3===2)&&f%3===1){m.box([x,y+.8,side*(d/2+1)],[spacing-.5,.16,1.9],'concrete');m.box([x,y+1.65,side*(d/2+1.9)],[spacing-.5,.07,.07],'steel');for(let dx=-1;dx<=1;dx+=.5)m.box([x+dx,y+1.2,side*(d/2+1.9)],[.045,.9,.045],'steel');}
    if(variant%4===1)m.box([x+spacing/2,y+2.2,side*(d/2+.38)],[.18,4.8,.65],'concreteLight');
    if((f*3+Math.round(x)+variant)%11===0){m.box([x,y+1.2,side*(d/2+.6)],[.9,.55,.7],'steelLight');for(let dx=-.3;dx<=.3;dx+=.15)m.box([x+dx,y+1.22,side*(d/2+.97)],[.045,.35,.02],'steelDark');}
   }
   for(let z=-d/2+2;z<d/2;z+=spacing)m.box([side*(w/2+.17),y+2.3,z],[.04,2.6,1.9],(f+Math.round(z))%7===0?'sand':'lens');
  }
  if(f%4===variant%4)m.box([0,y+4.3,0],[w+.8,.25,d+.8],variant%2?'sandDark':'steelLight');
  m.box([0,y+4.55,0],[w+.3,.2,d+.3],'concreteDark');
 }
 if(floors>1){m.box([0,floors*4.8,0],[w+.5,.25,d+.5],'steelDark');m.box([0,floors*4.8+1.8,0],[8,3.6,7],'concrete');m.tube([0,floors*4.8+7,0],.15,12,'steelLight',0,'y',6);}
 return m.mesh();
}
const segment=(m:VoxelMesh,a:V3,b:V3,width:number,material:Material)=>{
 const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dy,dz);
 m.box([(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],[width,width,length],material,-Math.asin(dy/length),Math.atan2(dx,dz));
};
export function coasterPoint(t:number):V3{const a=t*Math.PI*2;return [85+72*Math.cos(a),6+30*Math.pow((Math.sin(a)+1)/2,3)+5*Math.sin(a*3),-45+63*Math.sin(a)];}
export function parkModels(){const ground=new VoxelMesh(WEAPON_NAMESPACE),wheel=new VoxelMesh(WEAPON_NAMESPACE),cabin=new VoxelMesh(WEAPON_NAMESPACE),car=new VoxelMesh(WEAPON_NAMESPACE);
 ground.box([0,-.025,0],[370,.05,330],'concrete');ground.box([0,.015,90],[300,.04,10],'sandLight');ground.box([-65,.02,0],[95,.08,90],'asphalt');
 // Entrance arch, ticket counters, colourful kiosks, benches and queue railings.
 for(const x of [-22,22])ground.box([x,5,95],[2,10,2],'red');ground.box([0,10,95],[46,2.5,2],'sandLight');
 for(const x of [-125,-100,-75,40,65,90]){ground.box([x,1.6,110],[6,3.2,5],'wood');ground.box([x,3.3,110],[6.8,.4,5.8],x%2?'red':'sandLight');ground.box([x,1.9,112.6],[4.8,1,.08],'black');ground.box([x,1.2,113],[5.2,.2,1],'white');}
 for(let x=-140;x<=140;x+=20){ground.box([x,.65,80],[3,.2,.7],'woodDark');ground.box([x,1.1,79.7],[3,.9,.12],'woodDark');ground.box([x,3.5,75],[.15,7,.15],'steelDark');ground.box([x,7,75],[.8,.35,.8],'sandLight');}
 // Ferris wheel 64 m diameter; standalone wheel and cabins animated in runtime.
 for(const side of [-1,1])for(const z of [-7,7])segment(ground,[-65+side*15,0,z],[-65,35,0],.9,'white');
 for(let i=0;i<96;i++){const a=i/96*Math.PI*2,b=(i+1)/96*Math.PI*2;for(const z of [-1.5,1.5])segment(wheel,[32*Math.cos(a),32*Math.sin(a),z],[32*Math.cos(b),32*Math.sin(b),z],.35,'white');}
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;for(const z of [-1.5,1.5])segment(wheel,[0,0,z],[32*Math.cos(a),32*Math.sin(a),z],.16,i%2?'red':'white');}
 wheel.tube([0,0,0],1.3,4,'steel',0,'z',16);
 cabin.box([0,-.5,0],[2.7,1,2.3],'red');cabin.box([0,1.6,0],[2.9,.2,2.5],'white');for(const x of [-1.25,1.25])for(const z of [-1,1])cabin.box([x,.7,z],[.12,1.7,.12],'white');cabin.box([0,0,0],[2.3,.12,1.8],'woodDark');
 // Full closed coaster loop with paired rails, sleepers, elevated supports and station.
 for(let i=0;i<240;i++){const p=coasterPoint(i/240),q=coasterPoint((i+1)/240),dx=q[0]-p[0],dz=q[2]-p[2],l=Math.hypot(dx,dz),nx=dz/l*.85,nz=-dx/l*.85;
  for(const sign of [-1,1])segment(ground,[p[0]+sign*nx,p[1],p[2]+sign*nz],[q[0]+sign*nx,q[1],q[2]+sign*nz],.18,'red');
  segment(ground,[p[0]-nx,p[1]-.1,p[2]-nz],[p[0]+nx,p[1]-.1,p[2]+nz],.14,'steel');
  if(i%8===0){ground.box([p[0],p[1]/2,p[2]],[.45,p[1],.45],'white');ground.box([p[0],.2,p[2]],[2,.4,2],'concreteDark');}
 }
 ground.box([95,.12,10],[16,.24,8],'concreteDark');ground.box([95,4.8,10],[18,.3,10],'red');for(const x of [88,102])ground.box([x,2.5,10],[.2,5,.2],'white');
 car.box([0,.3,0],[1.4,.6,2.8],'red');car.box([0,.65,-.4],[1.2,.12,1.6],'black');car.box([0,1,.5],[1.2,.7,.2],'sandLight');for(const x of [-.7,.7])car.box([x,.9,-.5],[.1,.2,2],'white');
 // Carousel pavilion with eight stylised horses.
 ground.tube([-70,.25,-105],16,.5,'wood',0,'y',24);ground.tube([-70,6,-105],17,.4,'red',0,'y',24);ground.tube([-70,3,-105],.7,6,'sandLight',0,'y',8);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=-70+10*Math.cos(a),z=-105+10*Math.sin(a);ground.tube([x,3,z],.08,6,'sandLight',0,'y',6);ground.box([x,1.6,z],[.6,.8,1.6],'white');ground.box([x,2.2,z-.7],[.5,1,.5],'white');for(const side of [-1,1])ground.box([x+side*.22,.8,z],[.15,1,.9],'white');}
 return {ground:ground.mesh(),wheel:wheel.mesh(),cabin:cabin.mesh(),car:car.mesh()};
}
