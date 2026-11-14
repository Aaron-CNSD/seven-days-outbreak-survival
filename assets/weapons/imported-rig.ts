import type {World,EntityHandle} from '@forgeax/engine/ecs';
import {collectSubtree,Name,Transform,ChildOf} from '@forgeax/engine/scene';
import {quat,mat4,vec3} from '@forgeax/engine/math';

export function importedRig(world:World,root:EntityHandle){
 const nodes=new Map<string,EntityHandle>();
 for(const id of collectSubtree(world,root)){const e=id as EntityHandle,n=world.get(e,Name);if(n.ok)nodes.set(n.value.value,e);}
 const rest=new Map([...nodes].map(([name,e])=>{const t=world.get(e,Transform).unwrap();return [name,{pos:Array.from(t.pos),rotation:Array.from(t.quat)}] as const;}));
 const matrices=new Map<number,ReturnType<typeof mat4.create>>();
 const modelMatrix=(e:EntityHandle|null):ReturnType<typeof mat4.create>=>{
  if(e===null||e===root)return mat4.create();const cached=matrices.get(e);if(cached)return cached;
  const t=world.get(e,Transform).unwrap(),p=world.get(e,ChildOf),local=mat4.compose(mat4.create(),t.pos,t.quat,t.scale);
  const m=p.ok?mat4.multiply(mat4.create(),modelMatrix(p.value.parent),local):local;matrices.set(e,m);return m;
 };
 for(const e of nodes.values())modelMatrix(e);
 const rotation=(m:ReturnType<typeof mat4.create>)=>{const q=quat.create();mat4.decompose(vec3.create(),q,vec3.create(),m);return q;};
 const offset=(name:string,x:number,y:number,z:number,roll=0)=>{const e=nodes.get(name),r=rest.get(name);if(!e||!r)return;const q=quat.multiply(quat.create(),r.rotation,quat.fromEuler(quat.create(),0,0,roll,'YXZ'));world.set(e,Transform,{pos:[r.pos[0]!+x,r.pos[1]!+y,r.pos[2]!+z],quat:Array.from(q)}).unwrap();};
 const upper=nodes.get('UpArm_L'),lower=nodes.get('Forearm_L'),hand=nodes.get('Hand_L'),control=nodes.get('IK_Hand_Cntrl_L');
 const origin=(e:EntityHandle)=>mat4.transformPoint(vec3.create(),modelMatrix(e),[0,0,0]);
 const unit=(v:ReturnType<typeof vec3.create>)=>vec3.normalize(v,v);
 const S=upper?origin(upper):vec3.create(),E=lower?origin(lower):vec3.create(),W=hand?origin(hand):vec3.create();
 const a=vec3.sub(vec3.create(),E,S),b=vec3.sub(vec3.create(),W,E),l1=vec3.length(a),l2=vec3.length(b);
 const upperQ=upper?rotation(modelMatrix(upper)):quat.create(),lowerQ=lower?rotation(modelMatrix(lower)):quat.create();
 const upperParentQ=upper?rotation(modelMatrix(world.get(upper,ChildOf).unwrap().parent)):quat.create();
 const controlInverse=control?mat4.invert(mat4.create(),modelMatrix(world.get(control,ChildOf).unwrap().parent)):mat4.create();
 const controlOrigin=control?origin(control):vec3.create();
 const magazine=nodes.get('Magazine'),magOrigin=magazine?origin(magazine):W;
 function solveArm(delta:readonly number[]){
  if(!upper||!lower||!control||l1<.001||l2<.001)return;
  const target=vec3.create(W[0]!+delta[0]!,W[1]!+delta[1]!,W[2]!+delta[2]!);
  const direction=vec3.sub(vec3.create(),target,S),distance=Math.max(.001,Math.min(vec3.length(direction),l1+l2-.002));unit(direction);
  const projection=vec3.dot(a,direction),pole=vec3.create(a[0]!-direction[0]!*projection,a[1]!-direction[1]!*projection,a[2]!-direction[2]!*projection);unit(pole);
  const along=(l1*l1+distance*distance-l2*l2)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  const elbow=vec3.create(S[0]!+direction[0]!*along+pole[0]!*height,S[1]!+direction[1]!*along+pole[1]!*height,S[2]!+direction[2]!*along+pole[2]!*height);
  const uq=quat.multiply(quat.create(),quat.fromUnitVectors(quat.create(),unit(vec3.clone(a)),unit(vec3.sub(vec3.create(),elbow,S))),upperQ);
  const lq=quat.multiply(quat.create(),quat.fromUnitVectors(quat.create(),unit(vec3.clone(b)),unit(vec3.sub(vec3.create(),target,elbow))),lowerQ);
  world.set(upper,Transform,{quat:Array.from(quat.multiply(quat.create(),quat.invert(quat.create(),upperParentQ),uq))}).unwrap();
  world.set(lower,Transform,{quat:Array.from(quat.multiply(quat.create(),quat.invert(quat.create(),uq),lq))}).unwrap();
  const local=mat4.transformPoint(vec3.create(),controlInverse,[controlOrigin[0]!+delta[0]!,controlOrigin[1]!+delta[1]!,controlOrigin[2]!+delta[2]!]);
  world.set(control,Transform,{pos:Array.from(local)}).unwrap();
 }
 return {root,bones:nodes.size, update(reload:number,shotAge:number,ready:boolean){
  const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const reach=smooth(reload/.18)*(1-smooth((reload-.70)/.24));
  const drop=.30*smooth((reload-.18)/.17)*(1-smooth((reload-.50)/.20));
  offset('Magazine',0,-drop,drop*.2,-drop*.35);
  offset('ChargingHandle',0,0,Math.max(0,1-shotAge/.11)*.04);
  solveArm([(magOrigin[0]!-W[0]!-.035)*reach,(magOrigin[1]!-W[1]!-.10)*reach-drop,(magOrigin[2]!-W[2]!)*reach+drop*.2]);
  const arms=nodes.get('FPRig');if(arms)world.set(arms,Transform,{scale:ready?[0,0,0]:[1,1,1]}).unwrap();
  // The left block pivots around the grip as it rolls the magazine in.
  offset('Hand_L',0,0,0,-reach*.18+drop*.24);
 },nodes};
}
