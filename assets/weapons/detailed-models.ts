import { VoxelMesh, type V3 } from './voxel-builder.ts';
export type Assembly={body:VoxelMesh;mag:VoxelMesh;bolt:VoxelMesh;hands:VoxelMesh;support:VoxelMesh;parts:number};
const block=(b:VoxelMesh,c:V3,s:V3,m:Parameters<VoxelMesh['box']>[2]='steel')=>b.bevel(c,s,m,.0025,.006);
// Build the arm in a local frame so each raised detail follows its pose.
function blockArm(mesh: VoxelMesh, grip: V3, supporting = true) {
 const direction: V3 = [supporting ? -.43 : .25, supporting ? -.52 : -.36, 1];
 const length = Math.hypot(...direction);
 const pitch = -Math.asin(direction[1]/length);
 const yaw = Math.atan2(direction[0],direction[2]);
 const put = (x:number,y:number,z:number,size:V3,material:Parameters<VoxelMesh['box']>[2]) => {
  const up=y*Math.cos(pitch)-z*Math.sin(pitch);
  const depth=y*Math.sin(pitch)+z*Math.cos(pitch);
  mesh.box([grip[0]+x*Math.cos(yaw)+depth*Math.sin(yaw),grip[1]+up,
   grip[2]-x*Math.sin(yaw)+depth*Math.cos(yaw)],size,material,pitch,yaw);
 };
 // The wrist cuff joins the animated sleeve; the glove stays locked to its grip.
 put(0,0,.004,[.064,.057,.069],'rubberDark');
 put(supporting?.024:-.024,.012,-.006,[.028,.030,.051],'rubberLight');
 put(0,.024,.012,[.055,.013,.047],'rubber');
 put(0,0,.045,[.061,.061,.035],'shirtCuff');
}
const GLYPHS:Record<string,string[]>={A:['010','101','111','101','101'],K:['101','110','100','110','101'],'4':['101','101','111','001','001'],'7':['111','001','010','010','010'],W:['101','101','101','111','101'],M:['101','111','111','101','101'],G:['111','100','101','101','111'],L:['100','100','100','100','111'],O:['111','101','101','101','111'],C:['111','100','100','100','111'],'1':['010','110','010','010','111'],'3':['111','001','111','001','111'],'8':['111','101','111','101','111'],'.':['0','0','0','0','1']};
function stamp(b:VoxelMesh,text:string,x:number,y:number,z:number,pixel=.00065){
 let cursor=0;const side=Math.sign(x);
 for(const char of text){const rows=Object.entries(GLYPHS).find(([key])=>key===char)?.[1];if(!rows){cursor+=3;continue;}rows.forEach((row,iy)=>[...row].forEach((v,ix)=>{if(v==='1')b.box([x,y-iy*pixel,z+side*(cursor+ix)*pixel],[.0004,pixel*.75,pixel*.75],'steelLight');}));cursor+=(rows[0]?.length??3)+1;}
}
export function gripAnchors(index:number):[V3,V3]{
 const scar=index===3;
 if(index===0)return [[.026,-.083,.1],[-.015,-.044,-.215]];
 if(index===1)return [[.025,-.065,.109],[-.013,-.052,-.235]];
 if(index===2)return [[.023,-.064,.06],[-.035,-.064,.043]];
 if(index>=5)return [[.022,-.075,.068],[-.016,-.042,index===7?-.04:-.21]];
 return [[.022,-.077,.078],[-.016,-.043,scar?-.218:-.173]];
}
export function makeWeapon(index:number,ns:any,skin=0):Assembly{
 const body=new VoxelMesh(ns,index!==7),mag=new VoxelMesh(ns,index!==7),bolt=new VoxelMesh(ns,index!==7),hands=new VoxelMesh(ns),support=new VoxelMesh(ns);
 if(index===0){
  block(body,[0,.005,0],[.043,.057,.252]);
  block(body,[0,.006,-.139],[.039,.049,.036],'steelDark');
  body.tube([0,.039,-.219],.006,.18,'steelDark');
  for(const side of [-1,1])for(let i=0;i<24;i++)body.box([side*.022,.027,-.112+i*.009],[.001,.0015,.0025],i%6===0?'edge':'steelGrain');
  // Smooth cover and elongated lightening recess of the milled-receiver variant.
  block(body,[0,.041,-.005],[.042,.025,.248],'steelDark');
  body.box([-.022,.025,-.005],[.002,.003,.238],'steelLight');body.box([.022,.025,-.005],[.002,.003,.238],'steelLight');
  for(const side of [-1,1])body.bevel([side*.022,.006,-.068],[.002,.019,.088],'steelPatina',.002);
  body.box([.0226,.008,-.043],[.0015,.023,.073],'groove');
  body.box([.0239,-.004,-.05],[.0014,.004,.061],'steelLight');
  for(const side of [-1,1]){
   for(const [y,z] of [[-.008,-.105],[-.008,.10],[.009,.09],[-.014,.055]])body.screw(side*.023,y!,z!,side);
   body.box([side*.023,-.017,.01],[.002,.006,.034],'steelDark');
  }
  // Safety selector, hinge, trigger and hollow trigger guard.
  body.box([.026,-.002,.055],[.004,.007,.074],'steelDark',-.12);body.screw(.029,-.001,.089);
  body.box([0,-.047,.062],[.009,.027,.008],'black',-.25);
  body.box([-.016,-.051,.061],[.006,.04,.012],'steelDark');body.box([.016,-.051,.061],[.006,.04,.012],'steelDark');
  body.box([0,-.072,.025],[.035,.006,.075],'steelDark');
  block(body,[0,-.081,.106],[.033,.09,.04],'wood');
  for(let i=0;i<7;i++)body.box([.017,-.054-i*.009,.106],[.0015,.002,.032],'woodDark');
  block(body,[0,-.011,.135],[.034,.043,.040],'steelDark');
  block(body,[0,-.031,.106],[.031,.034,.034],'steelDark');
  // The walnut stock has a continuous taper and bevelled shoulder edges.
  const stockSections=[[.145,-.011,.033,.036],[.184,-.018,.039,.049],[.300,-.041,.046,.078],[.378,-.053,.047,.096]];
  const stockRings=stockSections.map(([z,y,w,h])=>{
   const a=w!/2,b=h!/2,k=.005;
   return [[-a+k,-b],[a-k,-b],[a,-b+k],[a,b-k],[a-k,b],[-a+k,b],[-a,b-k],[-a,-b+k]]
    .map(([x,dy])=>[x!,y!+dy!,z!] as V3);
  });
  for(let j=1;j<stockRings.length;j++)for(let i=0;i<8;i++){
   const previous=stockRings[j-1]!,next=stockRings[j]!,k=(i+1)%8;
   body.quad(previous[i]!,previous[k]!,next[k]!,next[i]!,'wood',.006);
  }
  body.box([0,-.053,.381],[.047,.096,.006],'steelDark');body.screw(.025,-.025,.275);
  // Laminated handguard with inset cooling vents and steel ferrules.
  for(let i=0;i<12;i++){
   const z=-.157-i*.012;block(body,[0,-.005,z],[.044-Math.abs(i-5)*.0008,.045,.014],i%4===0?'woodGrain':'wood');
   for(const side of [-1,1])body.box([side*.022,.009,z],[.002,.003,.010],i%3===0?'woodLight':'woodDark');
  }
  block(body,[0,.025,-.225],[.033,.022,.121],'wood');
  for(let i=0;i<4;i++)for(const side of [-1,1])body.box([side*.017,.026,-.18-i*.026],[.003,.011,.016],'groove');
  for(const z of [-.143,-.297])body.tube([0,.009,z],.025,.008,'steelDark',0,'z',8);
  body.tube([0,.008,-.421],.009,.25,'steelDark');body.tube([0,.041,-.327],.007,.12,'steel');
  for(const z of [-.307,-.386])body.tube([0,.01,z],.014,.015,'steel');
  body.box([0,.025,-.379],[.019,.052,.019],'steel',.56);
  body.tube([0,.008,-.525],.015,.022,'steelDark');
  block(body,[0,.037,-.525],[.017,.057,.019]);
  for(const side of [-1,1])body.box([side*.009,.068,-.525],[.005,.025,.013],'steel',0,0,-side*.24);
  body.box([0,.065,-.525],[.003,.019,.004],'black');
  body.tube([0,.008,-.558],.015,.035,'steelDark',.006);body.tube([0,.008,-.578],.013,.006,'edge',.006);
  body.box([.013,.012,-.562],[.004,.009,.015],'groove');
  block(body,[0,.057,-.119],[.026,.012,.024]);body.box([0,.064,-.12],[.010,.004,.013],'groove');
  // Continuous curved shell with three stamped ribs on each side.
  const magazinePoint=(t:number,x:number,z:number):V3=>{
   const angle=.05+t*.38;
   return [x,-.037-.153*t-z*Math.sin(angle),-.038-.065*t*t+z*Math.cos(angle)];
  };
  const ring=[[-.011,-.035],[.011,-.035],[.014,-.031],[.014,.031],
   [.011,.035],[-.011,.035],[-.014,.031],[-.014,-.031]];
  for(let section=0;section<12;section++){
   const t=section/12,next=(section+1)/12;
   for(let i=0;i<ring.length;i++){
    const [x,z]=ring[i]!,[xx,zz]=ring[(i+1)%ring.length]!;
    mag.quad(magazinePoint(t,x!,z!),magazinePoint(t,xx!,zz!),magazinePoint(next,xx!,zz!),magazinePoint(next,x!,z!),'steelDark');
   }
   for(const side of [-1,1])for(const z of [-.021,0,.021]){
    const x=side*.014, ridge=side*.0158;
    const a=magazinePoint(t,x,z-.0022),c=magazinePoint(next,x,z-.0022);
    const d=magazinePoint(next,ridge,z),e=magazinePoint(t,ridge,z);
    const f=magazinePoint(t,x,z+.0022),g=magazinePoint(next,x,z+.0022);
    if(side>0){mag.quad(a,e,d,c,'steel');mag.quad(e,f,g,d,'steelPatina');}
    else{mag.quad(c,d,e,a,'steel');mag.quad(d,g,f,e,'steelPatina');}
   }
  }
  mag.box([0,-.194,-.104],[.032,.006,.075],'steel',.43);
  bolt.box([.019,.02,-.034],[.016,.018,.085],'steelLight');bolt.box([.036,.02,-.035],[.034,.008,.012],'steel');bolt.box([.052,.021,-.035],[.006,.014,.025],'steelDark');

 }else if(index===1){
  // Accuracy International style stock with an open thumbhole, not a solid block.
  block(body,[0,-.014,-.09],[.046,.047,.39],'olive');
  block(body,[0,-.048,-.035],[.041,.026,.28],'oliveDark');
  block(body,[0,-.063,.108],[.035,.10,.044],'olive');
  block(body,[0,-.105,.19],[.036,.022,.20],'olive');
  block(body,[0,-.012,.285],[.045,.093,.135],'olive');
  block(body,[0,-.072,.29],[.04,.096,.046],'olive');
  block(body,[0,.042,.28],[.046,.025,.105],'rubber');
  body.box([0,-.009,.36],[.05,.108,.013],'rubber');
  for(let i=0;i<7;i++)body.box([0,-.049+i*.014,.368],[.043,.004,.003],'rubberLight');
  for(const side of [-1,1])for(const z of [-.255,-.21,-.145,-.085,.112,.257]){body.screw(side*.025,-.013,z,side);}
  for(let i=0;i<12;i++){
   const z=-.269+i*.013;for(const side of [-1,1])body.box([side*.024,-.011,z],[.002,.013,.006],i%4===0?'oliveLight':'oliveDark');
  }
  body.tube([0,.035,-.065],.020,.26,'steelDark');body.tube([0,.035,-.491],.011,.58,'steel');
  for(let i=0;i<15;i++)body.tube([0,.035,-.27-i*.007],.014,.002,'steelLight');
  body.tube([0,.035,-.8],.018,.064,'steelDark',.007);
  for(let i=0;i<3;i++)for(const side of [-1,1])body.box([side*.017,.036,-.78-i*.016],[.004,.015,.008],'groove');
  body.tube([0,.035,-.834],.015,.004,'edge',.007);
  // Picatinny rail: alternating relief, mounting screws, two separate rings.
  body.box([0,.061,-.062],[.028,.009,.21],'steelDark');
  for(let i=0;i<18;i++)body.box([0,.069,-.16+i*.011],[.035,.006,.006],'steel');
  for(const z of [-.13,.018]){
   block(body,[0,.083,z],[.026,.023,.024]);body.tube([0,.113,z],.025,.018,'steel',.018);
   for(const side of [-1,1])body.screw(side*.027,.112,z,side);
  }
  body.tube([0,.113,-.065],.018,.29,'steelDark');
  for(let i=0;i<6;i++)body.tube([0,.113,.066+i*.005],.022,.003,'steelLight');
  body.tube([0,.113,-.221],.036,.079,'steelDark',.028);body.tube([0,.113,-.263],.036,.005,'edge',.029);
  body.tube([0,.113,.096],.025,.044,'steelDark',.018);
  body.tube([0,.113,.12],.019,.001,'lens');body.tube([0,.113,-.26],.028,.001,'lens');
  body.box([-.008,.122,.121],[.008,.005,.001],'lensLight');
  body.tube([0,.15,-.04],.017,.023,'steel',0,'y');body.tube([.027,.114,-.04],.016,.026,'steel',0,'x');
  for(let i=0;i<12;i++){
   const a=i/12*Math.PI*2;body.box([Math.cos(a)*.017,.159,-.04+Math.sin(a)*.017],[.004,.004,.004],'edge');
   body.box([.041,.114+Math.cos(a)*.015,-.04+Math.sin(a)*.015],[.003,.003,.003],'edge');
  }
  for(let i=0;i<11;i++)body.box([.022,.119,.065+i*.0035],[.001,.004,i%5===0?.002:.001],'white');
  body.box([0,.163,-.041],[.002,.002,.008],'white');
  // Bolt handle has a distinct axis so it can unlock and cycle after firing.
  bolt.tube([0,.034,.028],.014,.13,'steelLight');bolt.box([.032,.032,.075],[.055,.01,.01],'steel');bolt.tube([.061,.008,.075],.012,.037,'steelDark',0,'y',8);
  for(let i=0;i<4;i++)bolt.tube([.061,-.005+i*.008,.075],.013,.002,'steelLight',0,'y',8);
  mag.bevel([0,-.081,-.057],[.034,.079,.077],'steelDark');
  for(const side of [-1,1])for(let i=0;i<4;i++)mag.box([side*.018,-.054-i*.015,-.056],[.002,.004,.063],'steel');
  // Folded bipod rails and pivot bolts.
  for(const side of [-1,1]){body.box([side*.032,-.048,-.34],[.012,.018,.15],'steel');body.tube([side*.032,-.053,-.266],.013,.01,'steelLight',0,'x');body.box([side*.035,-.056,-.417],[.022,.014,.026],'rubber');}

 }else if(index===2){
  // Glock 17: actual slim slide/frame proportions with separated moving slide.
  block(body,[0,-.008,-.018],[.031,.024,.168],'rubber');
  body.box([0,-.026,-.066],[.023,.012,.073],'rubberDark');
  for(let i=0;i<3;i++)body.box([0,-.032,-.072+i*.015],[.028,.004,.005],'steelDark');
  // Grip tilts rearward in fine slices, plus stippled side panels and backstrap.
  for(let i=0;i<19;i++){
   const y=-.024-i*.0045,z=.043+i*.0014;
   body.box([0,y,z],[.03,.006,.042],'rubber',-.16);
   for(const side of [-1,1])for(let j=0;j<5;j++)body.box([side*.0158,y,z-.014+j*.007],[.0018,.0025,.0025],(i+j)%4===0?'rubberLight':'rubberDark');
  }
  for(let i=0;i<4;i++)body.box([0,-.039-i*.019,.035+i*.002],[.032,.005,.007],'rubberLight');
  body.box([-.013,-.043,-.002],[.006,.038,.007],'rubber');body.box([.013,-.043,-.002],[.006,.038,.007],'rubber');
  body.box([0,-.061,.008],[.031,.006,.042],'rubber');body.box([0,-.042,.008],[.008,.026,.005],'black',-.15);
  body.box([.017,-.008,.028],[.004,.006,.016],'steel');body.box([-.017,-.005,.032],[.004,.008,.016],'steelDark');
  for(const side of [-1,1]){body.screw(side*.017,-.011,.015,side);body.screw(side*.017,-.018,.042,side);}
  // Slide milling, front chamfer, serrations and open ejection chamber.
  bolt.bevel([0,.021,-.021],[.029,.034,.183],'steel',.003,.004);
  for(const side of [-1,1]){
   for(let i=0;i<9;i++)bolt.box([side*.015,.022,.032+i*.0046],[.0015,.026,.002],'groove');
   for(let i=0;i<5;i++)bolt.box([side*.015,.021,-.088+i*.0047],[.0015,.024,.0017],'steelDark');
   bolt.box([side*.0153,.024,-.017],[.001,.009,.019],'steelDark');
   for(let i=0;i<7;i++)bolt.box([side*.0159,.025,-.027+i*.003],[.0007,.004,.0009],'steelLight');
  }
  bolt.box([.010,.04,-.012],[.011,.001,.033],'groove');bolt.box([.011,.036,-.012],[.007,.004,.027],'steelLight');
  bolt.tube([0,.022,-.117],.006,.026,'steelDark',.004);bolt.tube([0,.022,-.132],.0065,.002,'edge',.004);
  bolt.box([0,.043,-.095],[.006,.008,.008],'black');bolt.box([0,.047,-.098],[.002,.003,.001],'white');
  for(const side of [-1,1]){bolt.box([side*.010,.043,.059],[.007,.008,.012],'black');bolt.box([side*.009,.046,.064],[.002,.003,.001],'white');}
  mag.box([0,-.112,.067],[.035,.007,.047],'steelDark');mag.box([0,-.116,.068],[.032,.003,.043],'rubberLight');


 }else if(index>=5){
  if(index===7){
   mag.box([0,-.02,.02],[.01,.01,.01],'steel');bolt.box([0,-.02,.04],[.01,.01,.01],'steel');
   block(body,[0,-.02,.03],[.025,.032,.13],'rubber');block(body,[0,-.02,-.045],[.075,.012,.012],'steel');
   for(let j=0;j<18;j++){const t=j/17;body.box([0,-.015,-.053-j*.009],[.038*(1-t*.8),.008,.011],skin===1?'brass':skin===2?'lensLight':j%3===0?'edge':'steelLight');}
   for(let j=0;j<9;j++)body.box([0,-.001,j*.013-.02],[.028,.005,.004],'rubberLight');
  }else{
   block(body,[0,.005,0],[.045,.055,.21],'steelDark');
   body.tube([0,.018,-.31],.012,.42,'steelDark',.006);
   block(body,[0,-.061,.067],[.033,.085,.04],'rubber');
   body.box([0,-.064,.012],[.03,.007,.075],'steel');
   body.box([0,-.041,.037],[.008,.025,.006],'steelLight',-.2);
   body.tube([0,.008,.18],.014,.15,'steel');
   block(body,[0,-.018,.28],[.041,.075,.09],'rubber');block(body,[0,-.028,.33],[.048,.10,.014],'rubberDark');
   if(index===5){
    for(let j=0;j<20;j++){const z=-.112-j*.012;block(body,[0,.008,z],[.042,.045,.013],'rubber');body.box([0,.036,z],[.028,.007,.007],'steel');for(const side of [-1,1])body.box([side*.022,.01,z],[.002,.014,.006],'groove');}
    for(let j=0;j<16;j++){const t=j/15;mag.box([0,-.038-j*.008,-.032-t*t*.018],[.027,.01,.062],'steel',t*.2);for(const side of [-1,1])mag.box([side*.014,-.038-j*.008,-.032],[.002,.009,.035],'steelDark');}
    for(const z of [.08,-.35]){body.box([0,.054,z],[.028,.04,.012],'steelDark');body.box([0,.071,z+.008],[.014,.015,.014],'groove');}
    bolt.box([.023,.018,-.02],[.012,.018,.07],'steelLight');
   }else{
    body.tube([0,-.014,-.29],.012,.36,'steel');
    for(let j=0;j<14;j++)bolt.box([0,-.015,-.18-j*.009],[.052,.043,.009],j%2?'wood':'woodDark');
    body.box([0,.037,-.489],[.006,.009,.009],'white');
    mag.box([0,-.028,-.06],[.022,.006,.06],'steelLight');
   }
   for(const side of [-1,1])for(let j=0;j<8;j++)body.screw(side*.023,.003,-.085+j*.024,side);
  }

 }else{
  const scar=index===3;
  const color=scar?'sand':'steelDark';
  // SCAR: angular monolithic upper, folding-stock hinge and cheek riser.
  // MP5: free-standing twin stock rails, tubular receiver and tapered fore-end.
  if(scar){
   body.bevel([0,.023,-.095],[.049,.065,.388],'sand',.007);
   block(body,[0,.004,.126],[.05,.063,.043],'sandDark');
   body.tube([-.024,.003,.126],.011,.063,'steelDark',0,'y',8);
   for(let i=0;i<13;i++){const t=i/12;
    body.bevel([0,-.002-.018*t,.145+i*.014],[.039+.009*t,.041+.025*t,.017],'sand',.004);
   }
   block(body,[0,.026,.243],[.046,.021,.098],'sandLight');
   block(body,[0,-.033,.327],[.05,.099,.017],'rubber');
   for(let i=0;i<9;i++)body.box([0,-.072+i*.01,.337],[.048,.003,.004],'rubberLight');
   for(let i=0;i<37;i++)body.box([0,.058,.093-i*.0103],[.025,.008,.005],'steelDark');
   for(const side of [-1,1]){
    for(let i=0;i<4;i++)body.bevel([side*.025,.026,-.155-i*.031],[.002,.010,.020],'groove',.002);
    body.box([side*.0252,.042,-.095],[.001,.002,.368],'sandLight');
    for(let j=0;j<16;j++)body.box([side*.0254,.045+(j%3)*.001,-.273+j*.019],[.001,.0015,.003+j%4*.001],'sandDark');
    for(let j=0;j<7;j++)body.box([side*.0254,-.001,-.14-j*.021],[.002,.005,.012],'sandDark');
    body.box([side*.0252,.020,-.177],[.001,.002,.146],'sandLight');
    body.box([side*.026,.011,-.03],[.002,.007,.109],'steelDark');
    for(let i=0;i<4;i++)body.screw(side*.026,.001,.076-i*.082,side);
   }
   body.tube([0,.012,-.345],.011,.125,'steel');
   body.tube([0,.012,-.437],.018,.068,'steelDark',.007);
   for(let i=0;i<4;i++)body.box([.017,.012,-.415-i*.011],[.003,.009,.005],'groove');
   // Holographic sight: frame with a clear centre for the sight picture.
   block(body,[0,.068,-.034],[.045,.012,.069],'black');
   for(const side of [-1,1])block(body,[side*.023,.091,-.044],[.009,.043,.039],'rubber');
   block(body,[0,.112,-.044],[.052,.008,.039],'steelDark');
   body.box([-.024,.091,-.023],[.007,.018,.005],'steelLight');
   bolt.box([-.036,.022,-.083],[.031,.011,.016],'steel');
  }else{
   body.tube([0,.018,-.016],.025,.234,'steel',0,'z',12);
   body.tube([0,.018,-.168],.012,.13,'steelDark');
   for(const side of [-1,1]){
    block(body,[side*.021,.002,.179],[.009,.014,.185],'steel');
    body.box([side*.022,.01,.18],[.008,.002,.156],'steelLight');
   }
   block(body,[0,-.019,.278],[.05,.079,.018],'rubber');
   for(let i=0;i<13;i++){const t=i/12;
    body.bevel([0,-.003,-.116-i*.011],[.051-.018*t,.051-.014*t,.014],'rubber',.005);
   }
   for(const side of [-1,1]){
    for(let i=0;i<9;i++)body.box([side*(.026-i*.00072),-.005,-.119-i*.014],[.002,.024,.003],'rubberLight',.15);
    body.screw(side*.026,.001,-.119,side);
    body.box([side*.025,.005,-.014],[.002,.004,.14],'steelPatina');
   }
   body.tube([0,.007,-.28],.010,.064,'steel');
   body.tube([0,.007,-.322],.014,.031,'steelDark',.006);
   body.box([0,.035,-.262],[.015,.05,.015],'steelDark');
   body.tube([0,.063,-.262],.021,.012,'steel',.016,'z',12);
   body.box([0,.057,-.262],[.003,.017,.005],'black');
   body.tube([0,.048,.074],.018,.018,'steelDark',.008,'z',10);
   bolt.box([-.028,.024,-.17],[.035,.011,.015],'steelDark');
   for(let i=0;i<5;i++)bolt.box([-.041,.03,-.176+i*.003],[.011,.002,.001],'steelLight');
  }
  block(body,[0,-.023,.006],[.04,.044,.155],scar?'sandDark':'rubber');
  body.box([0,-.077,.074],[.034,.085,.037],'rubber',-.23);
  body.box([0,-.068,.018],[.019,.007,.070],'steelDark');
  body.box([0,-.052,-.014],[.017,.035,.007],'steelDark');
  body.box([0,-.049,.032],[.008,.028,.007],'steel',-.22);
  for(const side of [-1,1]){
   body.screw(side*.021,-.024,.046,side);
   body.box([side*.022,-.023,.053],[.004,.007,.024],'steelDark',-.22);
   for(let i=0;i<6;i++)body.box([side*.017,-.055-i*.009,.074+i*.002],[.002,.003,.026],'rubberLight');
  }
  for(let i=0;i<17;i++){const t=i/16,y=-.047-i*.0068,z=-.063-(scar?.018:.039)*t*t;
   mag.box([0,y,z],[scar?.029:.024,.009,scar?.066:.042],scar?'steel':'steelDark',t*.27);
   for(const side of [-1,1])for(let j=0;j<2;j++)mag.box([side*(scar?.015:.0125),y,z+.011-j*.024],[.002,.008,.003],'steelLight');
   if(i===16)mag.box([0,y-.005,z],[scar?.033:.028,.009,scar?.069:.045],'rubberDark',.27);
  }


 }
 if(index<3)for(const side of [-1,1])stamp(body,index===0?'AK47':index===1?'AWM338':'GLOCK17',side*(index===0?.024:index===1?.025:.016),index===0?.018:index===1?.002:.018,index===0?.035:index===1?-.06:-.041,index===2?.00048:.0007);
 const [mainGrip,supportGrip]=gripAnchors(index);
 blockArm(hands,mainGrip,false);blockArm(support,supportGrip);
 return {body,mag,bolt,hands,support,parts:[body,mag,bolt,hands,support].reduce((n,b)=>n+b.pieces,0)};
}
