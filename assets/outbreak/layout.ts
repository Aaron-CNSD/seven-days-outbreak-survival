/** Metric playable world: 1 engine unit = 1 metre. */
export const WORLD_BOUNDS={minX:-3000,maxX:3000,minZ:-2500,maxZ:2500};
export const KINDS=['hospital','restaurant','mall','apartment','pharmacy','school','warehouse','garage','office','police','cabin','hotel'] as const;
export type Kind=typeof KINDS[number];
export const LABELS=['废弃医院','废弃餐厅','废弃商场','居民楼','药房','学校','仓库','修车厂','办公楼','警署','林间木屋','海岸旅馆'];
export type Building={id:number;x:number;z:number;kind:Kind;variant:number};
export const CITY_COLUMNS=40,CITY_ROWS=40;
export const cityX=(column:number)=>-2380+column*64+Math.floor(column/4)*18;
export const cityZ=(row:number)=>-1950+row*76+Math.floor(row/4)*18;
const cityKind=(id:number):Kind=>id===1?'restaurant':id===2?'mall':id%80===0?'hospital':id%47===0?'mall':id%31===0?'school':id%43===0?'police':id%13===0?'garage':id%17===0?'warehouse':id%9===0?'pharmacy':id%7===0?'restaurant':id%3===0?'office':'apartment';
export const BUILDINGS:Building[]=Array.from({length:1660},(_,id)=>{
 if(id<1600)return {id,x:cityX(id%40),z:cityZ(Math.floor(id/40)),kind:cityKind(id),variant:Math.floor(id/3)%3};
 const n=id-1600;return {id,x:1250+(n%5)*220,z:-2200+Math.floor(n/5)*390,kind:n%5===4?'hotel':'cabin',variant:n%3};
});
let relocated=0;
for(const b of BUILDINGS)if(Math.abs(b.x)<85&&Math.abs(b.z)<150){b.x=-2750;b.z=-2000+(relocated++)*80;}
BUILDINGS[0]={id:0,x:0,z:-85,kind:'hospital',variant:0};
export const towerFloors=(b:Building)=>b.kind==='office'?[12,20,32][b.variant]!:b.kind==='apartment'?[6,10,16][b.variant]!:b.kind==='hotel'?8:1;
export const dimensions=(kind:Kind):[number,number]=>kind==='office'?[48,50]:kind==='apartment'?[46,48]:kind==='hospital'?[36,38]:kind==='mall'?[48,42]:kind==='school'?[34,30]:kind==='warehouse'?[30,30]:kind==='cabin'?[14,16]:[24,24];
export const PARK={x:2020,z:650};
let parkRelocations=0;for(const b of BUILDINGS)if(b.id>=1600&&Math.hypot(b.x-PARK.x,b.z-PARK.z)<240){b.x=1100;b.z=-2440+(parkRelocations++)*70;}
export type Destination={name:string;x:number;z:number;y?:number;yaw?:number};
export const DESTINATIONS:Destination[]=[
 {name:'训练场 / 出发点',x:0,z:7.4},{name:'市立医院',x:0,z:-58},
 {name:'旧城餐厅',x:BUILDINGS[1]!.x,z:BUILDINGS[1]!.z+23},
 {name:'中央商场',x:BUILDINGS[2]!.x,z:BUILDINGS[2]!.z+32},
 {name:'高楼商业街',x:BUILDINGS[402]!.x,z:BUILDINGS[402]!.z+33},
 {name:'森林营地',x:1250,z:-2177},{name:'海岸旅馆',x:2130,z:-2175},
 {name:'海滩 / 旧码头',x:2360,z:0,yaw:Math.PI/2},
 {name:'海滨游乐场',x:PARK.x,z:PARK.z+105},
 {name:'摩天轮广场',x:PARK.x-65,z:PARK.z+27},
 {name:'过山车车站',x:PARK.x+95,z:PARK.z+16},
];
export function regionAt(x:number,z=0){return Math.hypot(x-PARK.x,z-PARK.z)<210?'海滨游乐场':x>2420?'近海':x>2250?'海滩':x>1050?'森林':'废弃城区';}
export function nearbyBuildings(x:number,z:number,radius:number){return BUILDINGS.filter(b=>Math.hypot(b.x-x,b.z-z)<radius);}
export function treeLocations(){let seed=71973;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};return Array.from({length:18000},(_,id)=>({id,x:1100+rand()*1100,z:-2480+rand()*4960,size:.8+rand()*.9})).filter(t=>!BUILDINGS.filter(b=>b.id>=1600).some(b=>Math.abs(t.x-b.x)<35&&Math.abs(t.z-b.z)<35)&&Math.abs(t.x-1700)>12&&Math.hypot(t.x-PARK.x,t.z-PARK.z)>210);}
