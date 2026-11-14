import { definePack, definePackageId } from '@forgeax/engine/pack/source';
import { AssetGuid } from '@forgeax/engine/pack/guid';
import { ok } from '@forgeax/engine/types';
import { Update, Time } from '@forgeax/engine/ecs';
import { INPUT_SNAPSHOT_RESOURCE_KEY, type InputSnapshot } from '@forgeax/engine/input';
import type { Plugin } from '@forgeax/engine/plugin';
import { Transform, PROPAGATE_TRANSFORMS_SYSTEM, worldResolveSceneEntity, sceneEntity } from '@forgeax/engine/scene';
import { mat4, quat, vec3 } from '@forgeax/engine/math';
import { Collider } from '@forgeax/engine/physics';
import { Tactical, type V } from '../tactical/state.ts';
import { Camera, PointLight } from '@forgeax/engine/render';
import { resolveGameEntity } from '../shared/scene-refs.ts';
import { hitTarget } from '../range/training.ts';
import { gripAnchors } from '../weapons/detailed-models.ts';
import { hipSpread, spreadRay, SHOTGUN_PATTERN } from '../weapons/spread.ts';
import { Arsenal, WEAPONS } from '../weapons/config.ts';
const ID=definePackageId('b98b92ca-6d44-453c-883e-4e72099539f1');
export const COMBAT_GUID=AssetGuid.format(AssetGuid.derive(ID,'plugin/combat'));
export const combat:Plugin={name:'pulse/arsenal',inject:['world','gameHost','gameScene','game3dPlayer'],apply(ctx){
 const {world,gameHost:host,game3dPlayer:player}=ctx;
 const camera=resolveGameEntity(world,ctx.gameScene,'camera');
 const resolve=(key:string)=>worldResolveSceneEntity(world,ctx.gameScene.root,sceneEntity('scene/showcase',key)).unwrap();
 const roots=WEAPONS.map((_,i)=>resolve('weapon-'+i)),flashes=WEAPONS.map((_,i)=>resolve('weapon-'+i+'/flash'));
 const magazines=WEAPONS.map((_,i)=>resolve('weapon-'+i+'/mag')),bolts=WEAPONS.map((_,i)=>resolve('weapon-'+i+'/bolt'));
 const hands=WEAPONS.map((_,i)=>resolve('weapon-'+i+'/hands')),supports=WEAPONS.map((_,i)=>resolve('weapon-'+i+'/support'));
 const previewLight=resolve('inventory-weapon-light');
 const previewWeapons=WEAPONS.map((_,i)=>resolve('inventory-weapon-'+i));
 const previewAttachments=WEAPONS.slice(0,7).map((_,i)=>['muzzle','mag','optic'].map(part=>resolve('inventory-weapon-'+i+'/attachment-'+part)));
 const previewKnife=[resolve('inventory-weapon-7/body'),resolve('inventory-knife-skin-1'),resolve('inventory-knife-skin-2')];
 const accessories=WEAPONS.map((_,i)=>['muzzle','mag','optic'].map(part=>resolve('weapon-'+i+'/attachment-'+part)));
 const avatar=resolve('inventory-operator'),avatarArms=[0,1].map(i=>resolve('inventory-arm-'+i));
 const worn=['helmet','carrier','rig'].map(k=>resolve('inventory-'+k));
 const sleeves=[0,1,2,3].map(i=>resolve('view-sleeve-'+i));
 const grips=WEAPONS.map((_,i)=>gripAnchors(i));
 const impacts=Array.from({length:32},(_,i)=>resolve('impact-'+i));
 const enemyEntities=Array.from({length:3},(_,i)=>resolve('enemy-'+i)),grenadeEntities=Array.from({length:4},(_,i)=>resolve('grenade-'+i)),smokeEntities=Array.from({length:10},(_,i)=>resolve('smoke-'+i));
 const enemyFlashes=Array.from({length:3},(_,i)=>resolve('enemy-flash-'+i));
 const stored=[0,1,3,4,5,6].map(i=>({i,e:resolve('stored-'+i)}));
 const knifeBody=resolve('weapon-7/body'),knifeSkins=[resolve('knife-skin-1'),resolve('knife-skin-2')];
 const explosion=resolve('explosion'),medModel=resolve('use-medkit'),plateModel=resolve('use-plate'),throwModel=resolve('held-grenade');
 ctx.effect(function*(){
  const tactical=new Tactical();let settingsOpen=false,bobAmount=1;let action='',rackOpen=false,inspectTime=0,throwTime=0,lastDamage=0,damageFlash=0;
  let hits=0,headshots=0,lastHit='',hitFlash=0;
  let previewLit=false;
  let weaponSlots:Array<[number,number,number,number]|null>=[];
  const previewYaw=quat.eulerY(1.38);
  const previewRotation=[previewYaw[0]!,previewYaw[1]!,previewYaw[2]!,previewYaw[3]!] as const;
  // Approximate side profile extents and centers in the authored weapon frames.
  const profiles=[
   [.95,.33,-.09,-.055],[1.22,.34,-.23,-.01],[.24,.18,-.03,-.025],[.90,.35,-.065,-.05],
   [.66,.32,-.02,-.05],[.97,.35,-.09,-.05],[.99,.27,-.13,-.03],[.40,.09,-.06,0],
  ] as const;
  const wornAmount=[0,0,0];
  let dressing=0, dressPart=0;
  let lastSkin=-1,lastLoadout='',lastVisible=-1;
  let throwable: 'frag'|'smoke'|null=null;
  let touchLean=0,touchCrouch=false, throwHeldTime=0, throwUsed=false;
  const arsenal=new Arsenal();let phase='ready',mobile=false,held=false,previousTrigger=false,aimHeld=false,start=false,queueReload=false,selection=-1,lastLocked=false,lockDelay=0,elapsed=0,sent=0,flash=0,shotSerial=0;
  let sprintPose=0, stridePhase=0, strideWeight=0, swayX=0, swayY=0;
  let active=false,desktopArmed=false,inspecting=true,inspectQueued=false,poseMix=1,shotAge=10,equip=0,visibleTime=0,ads=0,kickSide=0;
  const nearEquipment=()=>{
   const position=world.get(player.entity,Transform).unwrap().pos;
   return Math.hypot(position[0]!,position[2]!-10.3)<4.2;
  };
  let bloom=0, reticleSpread=0;
  const read=()=>({helmet:tactical.helmet,helmetMax:tactical.helmetMax,helmetEquipped:tactical.helmetEquipped,rig:tactical.rig,rigMax:tactical.rigMax,rigEquipped:tactical.rigEquipped,health:tactical.health,armor:tactical.armor,armorMax:tactical.armorMax,tier:tactical.tier,loadout:tactical.loadout,attachments:[...arsenal.attachments],skin:tactical.skin,crouched:tactical.crouched,throwable,dead:tactical.dead,round:tactical.round,kills:tactical.kills,enemies:tactical.enemies.map(e=>({x:e.x,z:e.z,hp:e.hp})),medkits:tactical.medkits,plates:tactical.plates,frags:tactical.frags,smokes:tactical.smokes,using:tactical.using,useProgress:tactical.using?1-tactical.useTime/tactical.useDuration:0,grenades:tactical.grenades.length,clouds:tactical.clouds.length,thrown:tactical.thrown,explosions:tactical.explosions,message:tactical.message,rackOpen,nearEquipment:nearEquipment(),damageFlash,hits,headshots,lastHit,hitFlash,phase,active,mobile,inspecting,selected:arsenal.selected,weapon:arsenal.weapon.name,ammo:arsenal.ammo[arsenal.selected],reserve:arsenal.reserve[arsenal.selected],magazines:[...arsenal.ammo],reserves:[...arsenal.reserve],reloading:arsenal.reloadRemaining>0,reloadProgress:arsenal.reloadRemaining>0?1-arsenal.reloadRemaining/arsenal.reloadDuration:0,aiming:arsenal.aiming,shots:arsenal.shots,weaponShots:[...arsenal.weaponShots],shotSerial,recoil:arsenal.recoil,reticleSpread,elapsed,position:Array.from(world.get(player.entity,Transform).unwrap().pos),slide:world.hasResource('pulse-slide')?world.getResource<number>('pulse-slide'):0,lean:world.hasResource('pulse-lean')?world.getResource<number>('pulse-lean'):0,camera:player.readRig()});
  const receive=(ev:MessageEvent)=>{const m=ev.data;if(!m||m.channel!=='pulse/combat')return;
   if(m.kind==='settings'){settingsOpen=m.open===true;bobAmount=m.bob===false?0:1;}
   if(m.kind==='weapon-layout'&&rackOpen&&Array.isArray(m.slots)&&m.slots.length===4){
    weaponSlots=m.slots.map((slot:unknown)=>Array.isArray(slot)&&slot.length===4&&slot.every(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1)?slot:null);
   }
   if(m.kind==='action'&&typeof m.action==='string')action=m.action;
   if(m.kind==='attachment'&&rackOpen&&Number.isInteger(m.slot)&&m.slot>=0&&m.slot<2&&Number.isInteger(m.part)&&m.part>=0&&m.part<3){
    arsenal.toggleAttachment(tactical.loadout[m.slot]!,m.part);
   }
   if(m.kind==='equip'&&rackOpen&&nearEquipment()&&Number.isInteger(m.index)&&m.index>=0&&m.index<7&&m.index!==2){const slot=m.slot===1?1:0;if(!tactical.loadout.includes(m.index))tactical.loadout[slot]=m.index;selection=m.index;}
   if(m.kind==='gear'&&rackOpen&&nearEquipment()&&(m.item==='helmet'||m.item==='rig')){tactical.toggleGear(m.item);dressPart=m.item==='helmet'?0:2;dressing=.58;}
   if(m.kind==='tier'&&rackOpen&&Number.isInteger(m.value)&&m.value>=1&&m.value<=6){if(tactical.tier!==m.value){tactical.tier=m.value;tactical.armor=tactical.armorMax;dressPart=1;dressing=.58;}}
   if(m.kind==='skin'&&rackOpen&&Number.isInteger(m.value))tactical.skin=Math.max(0,Math.min(2,m.value));
   if(m.kind==='mode')mobile=m.touch===true;
   if(m.kind==='lean')touchLean=m.direction===1?1:m.direction===-1?-1:0;
   if(m.kind==='crouch')touchCrouch=m.held===true;
   if(m.kind==='fire'&&typeof m.held==='boolean')held=m.held;
   if(m.kind==='aim'&&typeof m.held==='boolean')aimHeld=m.held;
   if(m.kind==='reload')queueReload=true;
   if(m.kind==='inspect')inspectQueued=true;
   if(m.kind==='select'&&Number.isInteger(m.index))selection=m.index;
   if(m.kind==='start')start=true;
   if(m.kind==='reset'){touchLean=0;touchCrouch=false;held=false;aimHeld=false;previousTrigger=false;}
  };
  host?.port?.addEventListener('message',receive);host?.port?.start();yield ()=>host?.port?.removeEventListener('message',receive);
  const unregister=host?.gameProjection?.registerRead({id:'pulse.game',title:'Weapon lab',description:'Read-only weapon, ammo, reload, aiming and player state',read});if(unregister)yield unregister;
  // Only publish transforms when this subsystem actually changes them.
  const placed=new Map<any,number[]>();
  const place=(entity:any,p:number[],scale:number|number[]=1)=>{
   const sx=typeof scale==='number'?scale:scale[0]!,sy=typeof scale==='number'?scale:scale[1]!,sz=typeof scale==='number'?scale:scale[2]!;
   const old=placed.get(entity);
   if(old&&old[0]===p[0]&&old[1]===p[1]&&old[2]===p[2]&&old[3]===sx&&old[4]===sy&&old[5]===sz)return;
   world.set(entity,Transform,{pos:p,scale:[sx,sy,sz]}).unwrap();
   placed.set(entity,[p[0]!,p[1]!,p[2]!,sx,sy,sz]);
  };
  world.addSystem(Update,{name:'pulse-combat',after:['game-3d-camera'],before:[PROPAGATE_TRANSFORMS_SYSTEM],queries:[],fn:()=>{
   const input=world.getResource<InputSnapshot>(INPUT_SNAPSHOT_RESOURCE_KEY),dt=Math.min(world.getResource(Time).delta,.1);
   if(start){phase='playing';start=false;inspecting=false;}
   lockDelay=Math.max(0,lockDelay-dt);if(lastLocked&&!input.mouse.pointerLocked){lockDelay=1;held=false;aimHeld=false;desktopArmed=false;}if(!lastLocked&&input.mouse.pointerLocked)desktopArmed=false;if(input.mouse.pointerLocked&&!input.mouse.button(0))desktopArmed=true;lastLocked=input.mouse.pointerLocked;
   host?.setPointerLockAllowed?.(phase==='playing'&&!rackOpen&&!settingsOpen&&!tactical.dead&&!mobile&&lockDelay<=0);
   active=phase==='playing'&&!rackOpen&&!settingsOpen&&!tactical.dead&&(mobile||input.mouse.pointerLocked);
   world.insertResource('pulse-active',active);
   const keys:Record<string,string>={Digit5:'frag',Digit6:'smoke',KeyV:'medkit',KeyB:'plate',KeyT:'round',KeyE:'rack'};
   for(const [code,a] of Object.entries(keys))if(input.keyboard.justPressedCode(code))action=a;
   if(action==='rack'&&phase==='playing'){if(rackOpen)rackOpen=false;else {weaponSlots=[];rackOpen=true;tactical.cancel();inspecting=false;}}
   if(action==='round'&&phase==='playing'){tactical.start();lastDamage=0;for(let i=0;i<WEAPONS.length;i++){arsenal.ammo[i]=WEAPONS[i]!.capacity;arsenal.reserve[i]=WEAPONS[i]!.reserve;}rackOpen=false;}
   world.insertResource('pulse-lean-target',active&&!rackOpen
    ? mobile?touchLean:Number(input.keyboard.downCode('KeyC'))-Number(input.keyboard.downCode('KeyQ')||input.keyboard.downCode('KeyZ'))
    : 0);
   const crouched=active&&(mobile?touchCrouch:input.keyboard.downCode('ShiftLeft')||input.keyboard.downCode('ShiftRight'));
   if(crouched!==tactical.crouched){tactical.crouched=crouched;world.set(player.entity,Collider,{halfHeight:tactical.crouched?.22:.55}).unwrap();}
   world.insertResource('pulse-crouch',tactical.crouched);world.insertResource('pulse-weight',1-(tactical.tier-1)*.035);
   if(active&&(action==='medkit'||action==='plate')){tactical.use(action);inspecting=false;arsenal.aiming=false;}
   if(phase==='playing'&&!rackOpen&&!settingsOpen&&(action==='frag'||action==='smoke')){
    throwable=action;tactical.cancel();inspecting=false;throwHeldTime=0;
    throwUsed=held||input.mouse.button(0)||input.mouse.button(2);
   }
   action='';
   for(let i=0;i<4;i++)if(input.keyboard.justPressedCode('Digit'+(i+1)))selection=tactical.loadout[i]!;

   if(active&&!mobile&&input.mouse.pointerLocked&&input.mouse.wheelDelta!==0&&equip<=0){selection=tactical.loadout[(Math.max(0,tactical.loadout.indexOf(arsenal.selected))+(input.mouse.wheelDelta>0?1:3))%4]!;}
   if(selection>=0){if(tactical.loadout.includes(selection)){if(selection!==arsenal.selected)bloom=0;arsenal.select(selection);throwable=null;tactical.cancel();}else tactical.message='这把武器在后方装备台，按 E 装备';selection=-1;held=false;aimHeld=false;previousTrigger=false;equip=.24;shotAge=10;}
   if(inspectQueued||input.keyboard.justPressedCode('KeyF')){inspecting=!inspecting;inspectTime=0;inspectQueued=false;held=false;aimHeld=false;arsenal.aiming=false;}
   if(active&&inspecting){inspectTime+=dt;if(inspectTime>3.2)inspecting=false;}throwTime=Math.max(0,throwTime-dt);damageFlash=Math.max(0,damageFlash-dt);
   visibleTime+=dt;poseMix+=(Number(inspecting)-poseMix)*(1-Math.exp(-dt*10));equip=Math.max(0,equip-dt);shotAge+=dt;hitFlash=Math.max(0,hitFlash-dt);
   bloom=Math.max(0,bloom-dt*2.4);
   const spreadInput=player.readInput();
   const moving=active?Math.hypot(spreadInput.horizontal,spreadInput.vertical):0;
   const hipCone=()=>hipSpread(arsenal.selected,moving,moving>.1&&spreadInput.run&&!tactical.crouched,tactical.crouched,bloom);
   if(active){
    elapsed+=dt;arsenal.tick(dt);tactical.tick(dt,Array.from(world.get(camera,Transform).unwrap().pos) as V);if(tactical.damageTaken>lastDamage){damageFlash=.35;lastDamage=tactical.damageTaken;}flash=Math.max(0,flash-dt);
    const right=!mobile&&input.mouse.button(2);
    const longPress=mobile?held:desktopArmed&&input.mouse.button(0);
    if(!longPress&&!right){throwUsed=false;throwHeldTime=0;}
    if(throwable&&longPress&&!throwUsed)throwHeldTime+=dt;
    const rightClick=!mobile&&input.mouse.justPressed(2);
    if(throwable&&throwTime<=0&&!tactical.using&&(rightClick||(!throwUsed&&throwHeldTime>=.4))){
     throwUsed=true;
     const rig=player.readRig();
     const origin=Array.from(world.get(camera,Transform).unwrap().pos) as V;
     const direction:V=[Math.sin(rig.yaw)*Math.cos(rig.pitch),-Math.sin(rig.pitch),-Math.cos(rig.yaw)*Math.cos(rig.pitch)];
     if(tactical.throw(throwable==='smoke',origin,direction))throwTime=.5;
    }
    if(!throwable&&(queueReload||input.keyboard.justPressedCode('KeyR'))){inspecting=false;arsenal.reload();}
    arsenal.aiming=!throwable&&arsenal.selected!==7&&!tactical.using&&throwTime<=0&&!inspecting&&arsenal.reloadRemaining<=0&&(mobile?aimHeld:input.mouse.pointerLocked&&input.mouse.button(2));
    const trigger=!throwable&&(mobile?held:desktopArmed&&input.mouse.pointerLocked&&input.mouse.button(0));
    if(trigger&&inspecting)inspecting=false;
    if(!tactical.using&&throwTime<=0&&!inspecting&&trigger&&(arsenal.weapon.automatic||!previousTrigger)&&arsenal.fire()){flash=.045;shotSerial++;shotAge=0;
     const rig=player.readRig(),origin=world.get(camera,Transform).unwrap().pos;
     const shotgun=arsenal.selected===6;
     const cone=(arsenal.aiming?0:hipCone())+(shotgun?SHOTGUN_PATTERN:0);
     let shotHit:{head:boolean;label:string}|undefined;
     for(let pellet=0;pellet<(shotgun?8:1);pellet++){
      const direction=spreadRay(rig.yaw,rig.pitch,cone,Math.random(),Math.random());
      const enemy=tactical.hit(Array.from(origin) as V,direction,arsenal.weapon.damage,arsenal.selected===7?2.2:90);
      if(enemy){if(!shotHit||enemy.head)shotHit={head:enemy.head,label:enemy.head?'敌人头部命中':'敌人命中'};continue;}
      const target=arsenal.selected===7?undefined:hitTarget(origin,direction);
      if(target&&(!shotHit||target.head&&!shotHit.head)){
       world.set(impacts[hits%32]!,Transform,{pos:[target.x,target.y,target.z]}).unwrap();
       shotHit={head:target.head,label:(target.head?'头部命中':'靶身命中')+' · '+Math.round(target.distance)+' m'};
      }
     }
     if(shotHit){hits++;if(shotHit.head)headshots++;lastHit=shotHit.label;hitFlash=.22;host?.port?.postMessage({channel:'pulse/hit',head:shotHit.head});}
     if(!arsenal.aiming&&arsenal.selected!==7)bloom=Math.min(1.35,bloom+.42);
     if(arsenal.selected!==7){const factor=(arsenal.aiming?.55:1)*(tactical.crouched?.65:1);player.updateRig({...rig,pitch:Math.max(-1.2,rig.pitch-arsenal.weapon.recoil*arsenal.recoilScale*.45*factor),yaw:rig.yaw+Math.sin(shotSerial*2.3)*arsenal.weapon.recoil*arsenal.recoilScale*.08*factor});}
     kickSide=(Math.sin(shotSerial*2.1)*.5+.18)*arsenal.weapon.recoil;if(arsenal.selected!==7)host?.port?.postMessage({channel:'pulse/shot',index:arsenal.selected});}
    previousTrigger=trigger;
   }else{held=false;previousTrigger=false;arsenal.aiming=false;flash=0;}
   if(!active){throwHeldTime=0;throwUsed=true;}
   queueReload=false;
   enemyFlashes.forEach((entity,i)=>{const e=tactical.enemies[i];place(entity,e?[e.x+.23,1.24,e.z+.85]:[0,-20,0],e&&e.hp>0&&e.flash>0?.09:0);});
   tactical.enemies.forEach((e,i)=>{place(enemyEntities[i]!,[e.x,e.hp>0?0:-.2,e.z],e.hp>0?1:[1,.16,1]);});
   if(!tactical.enemies.length)for(const e of enemyEntities)place(e,[0,-20,0],0);
   grenadeEntities.forEach((e,i)=>place(e,tactical.grenades[i]?.p??[0,-20,0],tactical.grenades[i]?1:0));
   smokeEntities.forEach((e,i)=>{const c=tactical.clouds[Math.floor(i/5)];const k=i%5;place(e,c?[c.p[0]+Math.cos(k*2.4)*1.2,c.p[1]+Math.sin(k*1.7)*.6,c.p[2]+Math.sin(k*2.4)*1.2]:[0,-20,0],c?Math.min(2.2,(10-c.life)*3)*Math.min(1,c.life):0);});
   place(explosion,tactical.blast,tactical.blastLife>0?(1-tactical.blastLife/.35)*5:0);
   place(medModel,[.03,-.16,-.37],tactical.using==='medkit'?1:0);place(plateModel,[.04,-.15,-.4],tactical.using==='plate'?1:0);place(throwModel,[.15,-.1+Math.sin(throwTime*6)*.08,-.4],throwTime>0||throwable&&!tactical.using&&!tactical.dead?1:0);

   if(lastSkin!==tactical.skin){lastSkin=tactical.skin;
   world.set(knifeBody,Transform,{scale:tactical.skin===0?[1,1,1]:[0,0,0]}).unwrap();knifeSkins.forEach((e,i)=>world.set(e,Transform,{scale:tactical.skin===i+1?[1,1,1]:[0,0,0]}).unwrap());
   }
   const loadoutKey=tactical.loadout.join(',');if(lastLoadout!==loadoutKey){lastLoadout=loadoutKey;
   for(const {i,e} of stored)world.set(e,Transform,{scale:tactical.loadout.includes(i)?[0,0,0]:[.85,.85,.85]}).unwrap();
   }
   accessories.forEach((parts,i)=>parts.forEach((entity,part)=>{
    const enabled=(arsenal.attachments[i]! & (1<<part))!==0;
    place(entity,[0,0,0],enabled?1:0);
   }));
   const scoped=arsenal.aiming&&arsenal.selected===1;
   const viewport=host?.drawingBufferSize?.();
   const aspect=viewport?viewport.width/Math.max(1,viewport.height):16/9;
   const weaponOffset=.19*Math.min(1,aspect/1.2);
   ads+=(Number(arsenal.aiming)-ads)*(1-Math.exp(-dt*(arsenal.selected===1?8:16)));kickSide*=Math.exp(-dt*11);
   const slide=world.hasResource('pulse-slide')?world.getResource<number>('pulse-slide'):0;
   const hip=Math.PI/2.6;
   const fov=hip+((arsenal.selected===1?(arsenal.optic?Math.PI/16:Math.PI/12):arsenal.optic?Math.PI/4.3:Math.PI/3.2)-hip)*ads+arsenal.recoil*.13;
   world.set(camera,Camera,{fov}).unwrap();
   reticleSpread=throwable||arsenal.aiming?0:(hipCone()+(arsenal.selected===6?SHOTGUN_PATTERN:0))/Math.tan(fov/2)*50;
   if(previewLit!==rackOpen){previewLit=rackOpen;world.set(previewLight,PointLight,{intensity:rackOpen?4:0}).unwrap();}
   const previewDepth=1.65;
   const previewHeight=2*previewDepth*Math.tan(hip/2);
   for(const [index,entity] of previewWeapons.entries()){
    const slot=rackOpen?weaponSlots[tactical.loadout.indexOf(index)]:null;
    if(!slot){place(entity,[0,0,0],0);continue;}
    const [x,y,width,height]=slot;
    const [profileWidth,profileHeight,centerZ,centerY]=profiles[index]!;
    const size=.90*Math.min(width*previewHeight*aspect/profileWidth,height*previewHeight/profileHeight);
    world.set(entity,Transform,{pos:[(x-.5)*previewHeight*aspect-Math.sin(1.38)*centerZ*size,(.5-y)*previewHeight-centerY*size,-previewDepth],scale:[size,size,size],quat:previewRotation}).unwrap();
    // Visible poses bypass the shared cache, so clearing must do the same.
    placed.delete(entity);
   }
   if(rackOpen){
    previewAttachments.forEach((parts,i)=>parts.forEach((entity,part)=>place(entity,[0,0,0],arsenal.attachments[i]!&(1<<part)?1:0)));
    previewKnife.forEach((entity,i)=>place(entity,[0,0,0],i===tactical.skin?1:0));
   }
   const lerp=(a:number,b:number)=>a+(b-a)*poseMix;
   const on=[tactical.helmetEquipped,true,tactical.rigEquipped];
   const mounts:V[]=[[0,1.805,0],[0,1.34,-.146],[0,1.28,-.224]];
   const pose=1-Math.exp(-dt*12);
   dressing=Math.max(0,dressing-dt);
   if(rackOpen){
    const portrait=aspect<1;
    const depth=portrait?4.3:3.35;
    const x=(portrait?-.52:-.75)*depth*Math.tan(hip/2)*aspect;
    world.set(avatar,Transform,{pos:[x,portrait?.37:-.56,-depth],scale:portrait?[.67,.67,.67]:[.89,.89,.89],quat:[0,1,0,0]}).unwrap();
    worn.forEach((entity,i)=>{
     wornAmount[i]!+=(Number(on[i])-wornAmount[i]!)*pose;
     const t=wornAmount[i]!,p=mounts[i]!;
     const change=dressPart===i?Math.sin(dressing/.58*Math.PI):0;
     world.set(entity,Transform,{pos:[p[0],p[1]+(i===0?.34:.08)*(1-t)+change*.085,p[2]-(1-t)*.32-change*.17],scale:t>.025?[1,1,1]:[0,0,0]}).unwrap();
    });
    avatarArms.forEach((entity,i)=>{
     const lift=Math.sin(dressing/.58*Math.PI),side=i===0?-1:1;
     const q=quat.fromEuler(quat.create(),lift*(dressPart===0?2.22:1.45),0,side*(.13+lift*.27),'YXZ');
     world.set(entity,Transform,{pos:[side*.257,1.50,0],quat:[q[0]!,q[1]!,q[2]!,q[3]!]}).unwrap();
    });
   }else world.set(avatar,Transform,{pos:[0,-20,0]}).unwrap();
   const visibleWeapon=!rackOpen&&!throwable&&!scoped&&!tactical.using&&throwTime<=0&&!tactical.dead?arsenal.selected:-1;
   if(lastVisible!==visibleWeapon){if(lastVisible>=0)world.set(roots[lastVisible]!,Transform,{scale:[0,0,0]}).unwrap();lastVisible=visibleWeapon;}
   if(visibleWeapon<0||phase==='ready')for(const entity of sleeves)world.set(entity,Transform,{scale:[0,0,0]}).unwrap();
   for(let i=0;i<WEAPONS.length;i++){
    if(i!==visibleWeapon)continue;
    const shown=true;
    const progress=arsenal.reloadRemaining>0?1-arsenal.reloadRemaining/arsenal.reloadDuration:0;
    const reloadCurve=arsenal.reloadRemaining>0?Math.sin(Math.PI*progress):0;
    const movement=player.readInput();const walking=Math.hypot(movement.horizontal,movement.vertical)>.1;
    sprintPose+=(Number(active&&walking&&movement.run&&!tactical.crouched&&!arsenal.aiming&&!progress&&!inspecting)-sprintPose)*(1-Math.exp(-dt*13));
    const strideTarget=active&&walking?Math.min(1,Math.hypot(movement.horizontal,movement.vertical)):0;
    const smoothing=1-Math.exp(-dt*12);
    strideWeight+=(strideTarget-strideWeight)*smoothing;
    stridePhase+=dt*(tactical.crouched?6:sprintPose>.5?13:9);
    const swayScale=bobAmount*(1-ads*.86)*(1-poseMix);
    swayX+=(Math.max(-.013,Math.min(.013,movement.lookX*.00045))-swayX)*smoothing;
    swayY+=(Math.max(-.009,Math.min(.009,movement.lookY*.00035))-swayY)*smoothing;
    const lateral=(Math.sin(stridePhase)*.007*strideWeight-swayX)*swayScale;
    const bob=(Math.cos(stridePhase*2)*.005*strideWeight+Math.sin(visibleTime*1.9)*.001-swayY)*swayScale;
    const scale=i===2?1.6:1;
    const inspectScale=phase==='ready'?(i===2?3.8:1.15)*(!mobile&&aspect>=1.6?1.13:1):scale;
    const nearX=(1-ads)*weaponOffset*(i===2?.65:1);
    const restY=i===2?-.16:-.18;const sightY=i===2?.047*scale:i===3?.091:.064;const nearY=restY+(-sightY-restY)*ads;
    const nearZ=i===2?-.38:-.50;
    const inspectX=phase==='ready'?(aspect>1?.29:0):.05;
    const inspectY=phase==='ready'?(aspect>1?.015:-.21):-.12;
    const inspectZ=phase==='ready'?-Math.max(i===1?1.12:.93,.82/aspect):-.60;
    const rotation=quat.fromEuler(quat.create(),arsenal.recoil*.8+reloadCurve*.28+sprintPose*.20+slide*.16+(i===7&&shotAge<.45?Math.sin(shotAge/.45*Math.PI)*1.1:0),
      lerp((1-ads)*.26+kickSide,phase==='ready'?1.30+Math.sin(visibleTime*.65)*.12:.65+Math.sin(inspectTime*2)*.38),
      lerp(-.025*(1-ads)+kickSide*.6+lateral*2,phase==='ready'?-.13:-.45+Math.sin(inspectTime*2.5)*.65)+reloadCurve*.28+slide*.08,'YXZ');
    const size=lerp(scale,inspectScale);
    const weaponPos:V=[lerp(nearX+lateral,inspectX),lerp(nearY,inspectY)-reloadCurve*.09-equip*.35-sprintPose*.042-slide*.029+bob,lerp(nearZ,inspectZ)+arsenal.recoil];
    world.set(roots[i]!,Transform,{
      scale:shown?[size,size,size]:[0,0,0],
      pos:weaponPos,
      quat:[rotation[0]!,rotation[1]!,rotation[2]!,rotation[3]!],
    }).unwrap();
    const smooth=(t:number)=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
    const detachable=i===0||i===2||i===3||i===4||i===5;
    const reach=detachable?smooth(progress/.18)*(1-smooth((progress-.7)/.23)):0;
    const magDrop=detachable?.20*smooth((progress-.18)/.22)*(1-smooth((progress-.49)/.21)):
      progress>0?Math.sin(Math.PI*Math.min(1,progress/.8))*.12:0;
    world.set(magazines[i]!,Transform,{pos:[-magDrop*.16,-magDrop,magDrop*.22],quat:[0,0,Math.sin(-magDrop),Math.cos(-magDrop)]}).unwrap();
    const cycle=i===1?(shotAge>.18&&shotAge<1.15?Math.sin((shotAge-.18)/.97*Math.PI):0):Math.max(0,1-shotAge/.095);
    world.set(bolts[i]!,Transform,{pos:[0,0,cycle*(i===1?.065:i===2?.026:.035)],quat:i===1?[0,0,Math.sin(-cycle*.5),Math.cos(-cycle*.5)]:[0,0,0,1]}).unwrap();
    world.set(hands[i]!,Transform,{scale:phase==='ready'?[0,0,0]:[1,1,1]}).unwrap();
    const supportPos:V=[-magDrop*.16,-magDrop*.8-reach*.025,magDrop*.22+reach*(i===2?.025:i===4?.105:.15)];
    const supportQ=[0,0,Math.sin(-reach*.11),Math.cos(reach*.11)] as const;
    world.set(supports[i]!,Transform,{scale:phase==='ready'?[0,0,0]:[1,1,1],quat:supportQ,pos:supportPos}).unwrap();
    if(phase!=='ready'){
     const weaponFrame=mat4.compose(mat4.create(),weaponPos,rotation,[size,size,size]);
     const supportFrame=mat4.compose(mat4.create(),supportPos,supportQ,[1,1,1]);
     const segment=(entity:typeof sleeves[number],a:ArrayLike<number>,b:ArrayLike<number>,width:number)=>{
      const axis:V=[b[0]!-a[0]!,b[1]!-a[1]!,b[2]!-a[2]!];
      const len=Math.hypot(...axis);
      const q=quat.fromUnitVectors(quat.create(),[0,0,1],vec3.normalize(vec3.create(),axis));
      world.set(entity,Transform,{pos:[(a[0]!+b[0]!)/2,(a[1]!+b[1]!)/2,(a[2]!+b[2]!)/2],scale:[width,width,len+.032],quat:[q[0]!,q[1]!,q[2]!,q[3]!]}).unwrap();
     };
     grips[i]!.forEach((g,arm)=>{
      const side=arm===0?1:-1;
      const cuff:V=[g[0]+(arm===0?.009:-.014),g[1]-(arm===0?.011:.016),g[2]+.036];
      const wrist=mat4.transformPoint(vec3.create(),weaponFrame,arm===0?cuff:mat4.transformPoint(vec3.create(),supportFrame,cuff));
      const shoulder:V=[side*.19,-.35,-.075];
      const elbow:V=[wrist[0]*.60+shoulder[0]*.40+side*.05,Math.min(wrist[1]-.09,-.29),wrist[2]*.60-.022];
      segment(sleeves[arm*2]!,shoulder,elbow,.081);
      segment(sleeves[arm*2+1]!,elbow,wrist,.063);
     });
    }
    world.set(flashes[i]!,Transform,{scale:i!==7&&i===arsenal.selected&&flash>0?[.033,.033,.085]:[0,0,0]}).unwrap();
   }
   sent+=dt;if(sent>.04){host?.port?.postMessage({channel:'pulse/state',...read()});sent=0;}
  }}).unwrap();
  yield ()=>world.removeSystem(Update,'pulse-combat').unwrap();
  yield ()=>host?.setPointerLockAllowed?.(false);
 });
}};
export default definePack({schemaVersion:'2.0.0',plugins:true,packageId:ID,build:()=>ok({'plugin/combat':{kind:'plugin',module:{specifier:'./combat.pack.ts',export:'combat'}}})});
