import { PIXEL_FINISHES } from './pixel-finish.ts';
import { packInterleavedVertexAttributes } from '@forgeax/engine/geometry';
import { box3 } from '@forgeax/engine/math';
import type { PackageId } from '@forgeax/engine/pack/source';
import { AssetGuid } from '@forgeax/engine/pack/guid';
import type { MeshAsset, VertexAttributeMap } from '@forgeax/engine/types';
export type V3=readonly [number,number,number];
export const PALETTE={
 blockGrass:[.155,.36,.048,1],blockGrassLight:[.225,.43,.073,1],blockGrassDark:[.095,.26,.030,1],blockDirt:[.29,.16,.077,1],blockDirtLight:[.42,.25,.13,1],blockStone:[.34,.33,.30,1],blockStoneDark:[.27,.26,.24,1],blockStoneLight:[.40,.39,.36,1],
 asphalt:[.105,.115,.109,1],asphaltLight:[.112,.121,.114,1],asphaltDark:[.100,.110,.104,1],dust:[.25,.235,.19,1],gravel:[.20,.205,.18,1],gravelLight:[.29,.28,.23,1],moss:[.095,.12,.071,1],stain:[.20,.22,.195,1],concreteLight:[.32,.33,.30,1],rust:[.24,.115,.052,1],lensPuddle:[.065,.083,.087,1],
 concrete:[.29,.30,.27,1],concreteDark:[.14,.16,.15,1],
 steel:[.105,.125,.145,1],steelPatina:[.083,.098,.112,1],steelGrain:[.127,.145,.16,1],steelDark:[.038,.047,.055,1],steelLight:[.22,.25,.27,1],edge:[.34,.36,.37,1],black:[.012,.017,.02,1],groove:[.008,.011,.014,1],
 sand:[.39,.29,.17,1],sandLight:[.52,.41,.26,1],sandDark:[.23,.17,.10,1],
 wood:[.31,.105,.035,1],woodLight:[.35,.135,.047,1],woodDark:[.255,.084,.027,1],woodGrain:[.28,.094,.031,1],
 olive:[.115,.15,.072,1],oliveLight:[.19,.22,.11,1],oliveDark:[.055,.073,.038,1],
 rubber:[.023,.031,.029,1],rubberLight:[.06,.075,.068,1],rubberDark:[.012,.018,.015,1],
 cyanBadge:[.025,.65,1,1],
 shirt:[1,1,1,1],shirtCuff:[1,1,1,1],snowBlock:[.84,.89,.94,1],
 sleeve:[.21,.245,.17,1],
 fabric:[.15,.19,.135,1],fabricLight:[.23,.265,.18,1],fabricDark:[.085,.115,.075,1],
 leather:[.073,.060,.04,1],stitch:[.34,.31,.22,1],skin:[.46,.27,.16,1],skinDark:[.28,.14,.073,1],
 brass:[.56,.31,.075,1],lens:[.015,.12,.18,1],lensLight:[.055,.35,.43,1],white:[.65,.68,.60,1],red:[.5,.025,.012,1],
} as const;
export type Material=keyof typeof PALETTE;
const names=Object.keys(PALETTE) as Material[];
const colors=Object.values(PALETTE);
export const SURFACES=['metal','organic','cloth','lens','concrete','asphalt','sleeve','block-grass','block-dirt',...PIXEL_FINISHES] as const;
const surface=(m:Material)=>m.startsWith('blockGrass')?7:m.startsWith('blockDirt')?8:m==='sleeve'?6:m.startsWith('concrete')?4:m.startsWith('asphalt')?5:/lens/.test(m)?3:/fabric|rubber|leather|stitch/.test(m)?2:/cyanBadge|snowBlock|block|shirt|white|red|wood|olive|sand|skin|concrete|asphalt|dust|gravel|moss|stain|rust/.test(m)?1:0;
export const materialKey=(name:string)=>name.replace(/([A-Z])/g,'-$1').toLowerCase();
export class VoxelMesh {
 positions:number[]=[];normals:number[]=[];uvs:number[]=[];tangents:number[]=[];colors:number[]=[];groups=SURFACES.map(()=>[] as number[]);pieces=0;
 constructor(private namespace:PackageId, private weaponFinish=false){}
 quad(a:V3,b:V3,c:V3,d:V3,m:Material,tile=0,cornerNormals?:readonly [V3,V3,V3,V3],uv?:readonly [number,number,number,number]){
  const u=b.map((v,i)=>v-a[i]!) as unknown as V3,v=d.map((v,i)=>v-a[i]!) as unknown as V3;
  const cross=[(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])];const len=Math.hypot(...cross);if(len<1e-12)return;
  const normal=cross.map(n=>n/len),ul=Math.hypot(...u);const tangent=u.map(n=>n/ul);
  const nx=tile?Math.min(48,Math.max(1,Math.ceil(ul/tile))):1,ny=tile?Math.min(48,Math.max(1,Math.ceil(Math.hypot(...v)/tile))):1;
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
   const base=this.positions.length/3;
   const palette=colors[names.indexOf(m)]!;
   for(const [i,j] of [[x,y],[x+1,y],[x+1,y+1],[x,y+1]]){
    const xx=i!/nx,yy=j!/ny;for(let axis=0;axis<3;axis++)this.positions.push(a[axis]!*(1-xx)*(1-yy)+b[axis]!*xx*(1-yy)+c[axis]!*xx*yy+d[axis]!*(1-xx)*yy);
    const idx=this.positions.length-3;
    const px=this.positions[idx]!,py=this.positions[idx+1]!,pz=this.positions[idx+2]!;
    const grain=m.startsWith('wood')&&!this.weaponFinish
      ? 1+.10*Math.sin(py*1000+Math.sin(pz*32)*2+px*75)+.04*Math.sin(py*2170+pz*43)
      : tile?1+.045*Math.sin(px*199+py*349+pz*237):1;
    this.normals.push(...(cornerNormals?.[xx+(yy?3-2*xx:0)]??normal));
    this.colors.push(palette[0]*grain,palette[1]*grain,palette[2]*grain,1);
    this.tangents.push(...tangent,1);this.uvs.push(uv?uv[0]+xx*(uv[2]-uv[0]):xx,uv?uv[1]+yy*(uv[3]-uv[1]):yy);
   }
   const slot=m==='shirt'?9:m==='shirtCuff'?10:
    this.weaponFinish&&m.startsWith('wood')?11:
    this.weaponFinish&&surface(m)===0?12:surface(m);
   const g=this.groups[slot]!;g.push(base,base+1,base+2);if(d.some((n,k)=>Math.abs(n-a[k]!)>1e-10))g.push(base,base+2,base+3);
  }
 }
 box(center:V3,size:V3,m:Material='steel',rx=0,ry=0,rz=0,tile=0){
  this.pieces++;
  const transform=(x:number,y:number,z:number):V3=>{
   let yy=y*Math.cos(rx)-z*Math.sin(rx),zz=y*Math.sin(rx)+z*Math.cos(rx);y=yy;z=zz;
   let xx=x*Math.cos(ry)+z*Math.sin(ry);zz=-x*Math.sin(ry)+z*Math.cos(ry);x=xx;z=zz;
   xx=x*Math.cos(rz)-y*Math.sin(rz);yy=x*Math.sin(rz)+y*Math.cos(rz);return [xx+center[0],yy+center[1],z+center[2]];
  };
  const [w,h,d]=size.map(v=>v/2) as [number,number,number];
  const f=(a:V3,b:V3,c:V3,e:V3)=>this.quad(transform(...a),transform(...b),transform(...c),transform(...e),m,tile);
  f([w,-h,d],[w,-h,-d],[w,h,-d],[w,h,d]);f([-w,-h,-d],[-w,-h,d],[-w,h,d],[-w,h,-d]);
  f([-w,h,d],[w,h,d],[w,h,-d],[-w,h,-d]);f([-w,-h,-d],[w,-h,-d],[w,-h,d],[-w,-h,d]);
  f([-w,-h,d],[w,-h,d],[w,h,d],[-w,h,d]);f([w,-h,-d],[-w,-h,-d],[-w,h,-d],[w,h,-d]);
 }
 // Smooth the tube sides while keeping the end caps hard.
 tube(center:V3,radius:number,length:number,m:Material='steel',inner=0,axis:'z'|'x'|'y'='z',sides=12){
  this.pieces++;
  const point=(angle:number,r:number,z:number):V3=>{const x=Math.cos(angle)*r,y=Math.sin(angle)*r;return axis==='z'?[center[0]+x,center[1]+y,center[2]+z]:axis==='x'?[center[0]+z,center[1]+x,center[2]+y]:[center[0]+x,center[1]+z,center[2]-y];};
  const radial=(angle:number):V3=>{
   const x=Math.cos(angle),y=Math.sin(angle);
   return axis==='z'?[x,y,0]:axis==='x'?[0,x,y]:[x,0,-y];
  };
  for(let i=0;i<sides;i++){
   const a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2,h=length/2;
   this.quad(point(a,radius,-h),point(b,radius,-h),point(b,radius,h),point(a,radius,h),m,0,[radial(a),radial(b),radial(b),radial(a)]);
   if(inner>0){this.quad(point(a,inner,h),point(b,inner,h),point(b,inner,-h),point(a,inner,-h),'groove');}
   this.quad(point(a,inner||0,h),point(a,radius,h),point(b,radius,h),point(b,inner||0,h),m);
   this.quad(point(b,inner||0,-h),point(b,radius,-h),point(a,radius,-h),point(a,inner||0,-h),m);
  }
 }
 bevel(center:V3,size:V3,m:Material='steel',cut=.003,tile=.008){
  const [w,h,d]=size.map(v=>v/2) as [number,number,number];const k=Math.min(cut,w*.4,h*.4);
  const ring=[[-w+k,-h],[w-k,-h],[w,-h+k],[w,h-k],[w-k,h],[-w+k,h],[-w,h-k],[-w,-h+k]];
  const pt=(i:number,z:number):V3=>[center[0]+ring[i]![0]!,center[1]+ring[i]![1]!,center[2]+z];
  for(let i=0;i<8;i++){const j=(i+1)%8;this.quad(pt(i,-d),pt(j,-d),pt(j,d),pt(i,d),m,tile);}
  // Use a closed box core to seal end faces, with the visible bevel around it.
  for(let i=0;i<8;i++){const j=(i+1)%8;this.quad([center[0],center[1],center[2]+d],pt(i,d),pt(j,d),[center[0],center[1],center[2]+d],m);this.quad([center[0],center[1],center[2]-d],pt(j,-d),pt(i,-d),[center[0],center[1],center[2]-d],m);}this.pieces++;
 }
 // Rounded anatomical and soft-equipment volumes, with continuous normals and UVs.
 ellipsoid(center:V3,radius:V3,m:Material='fabric',segments=16,rings=10){
  const at=(j:number,i:number):[V3,V3]=>{
   const a=(j/rings-.5)*Math.PI,b=i/segments*Math.PI*2;
   const unit=[Math.cos(a)*Math.cos(b),Math.sin(a),Math.cos(a)*Math.sin(b)];
   const n=unit.map((v,k)=>v/radius[k]!),len=Math.hypot(...n);
   return [unit.map((v,k)=>center[k]!+v*radius[k]!) as unknown as V3,n.map(v=>v/len) as unknown as V3];
  };
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
   const [a,na]=at(j,i),[b,nb]=at(j+1,i),[c,nc]=at(j+1,i+1),[d,nd]=at(j,i+1);
   if(j===0)this.quad(a,b,c,a,m,0,[na,nb,nc,na],[i/segments,j/rings,(i+1)/segments,(j+1)/rings]);
   else if(j===rings-1)this.quad(a,b,d,a,m,0,[na,nb,nd,na],[i/segments,j/rings,(i+1)/segments,(j+1)/rings]);
   else this.quad(a,b,c,d,m,0,[na,nb,nc,nd],[i/segments,j/rings,(i+1)/segments,(j+1)/rings]);
  }
  this.pieces++;
 }
 screw(x:number,y:number,z:number,side=1){this.tube([x,y,z],.003,.002,'edge',0,'x',8);this.box([x+side*.0012,y,z],[.001,.001,.004],'groove');}
 mesh():MeshAsset{
  const vertexCount=this.positions.length/3,attributes:VertexAttributeMap={position:new Float32Array(this.positions),normal:new Float32Array(this.normals),color:new Float32Array(this.colors),uv:new Float32Array(this.uvs),tangent:new Float32Array(this.tangents)};
  const packed=packInterleavedVertexAttributes(attributes,vertexCount).unwrap();const indices:number[]=[],submeshes:any[]=[],materialSlots:any[]=[];
  for(let i=0;i<SURFACES.length;i++){const group=this.groups[i]!;if(!group.length)continue;const materialSlot=materialSlots.length;submeshes.push({indexOffset:indices.length,indexCount:group.length,vertexCount,topology:'triangle-list',materialSlot});for(const value of group)indices.push(value);materialSlots.push({slotName:SURFACES[i],sourceKey:'weapon-'+SURFACES[i],defaultMaterial:AssetGuid.derive(this.namespace,'material/'+SURFACES[i])});}
  return {kind:'mesh',vertices:packed.vertices,attributes,indices:new Uint32Array(indices),aabb:box3.fromPositions(box3.create(),this.positions),submeshes,materialSlots};
 }
}
