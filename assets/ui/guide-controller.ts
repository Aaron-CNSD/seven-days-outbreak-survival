import type { GameHost } from '@forgeax/engine/app';
import { mountUi, type UiAsset, type UiInstance } from '@forgeax/engine/ui';
import { installPlayerControls } from './player-controls.ts';
import { BUILDINGS, DESTINATIONS } from '../outbreak/layout.ts';
import { WEAPONS } from '../weapons/config.ts';
export async function createGuideUi(asset:UiAsset,host:Pick<GameHost,'uiRoot'|'controlMode'|'port'|'presentationPort'>):Promise<UiInstance>{
 if(!host.uiRoot)throw new Error('FPS HUD needs uiRoot');
 const mounted=mountUi(asset,{root:host.uiRoot,layer:50});if(!mounted.ok)throw mounted.error;
 const ui=mounted.value,root=ui.host.shadowRoot!,port=host.presentationPort??host.port;
 const nodes=new Map<string,HTMLElement>();
 const node=(name:string)=>{let element=nodes.get(name);if(!element){element=root.querySelector<HTMLElement>('[data-part="'+name+'"]')!;nodes.set(name,element);}return element;};
 const text=(name:string,value:string)=>{const element=node(name);if(element.textContent!==value)element.textContent=value;};
 const controls=port?installPlayerControls(root,port):undefined;
 const releases:(()=>void)[]=[];
 const send=(m:Record<string,unknown>)=>port?.postMessage({channel:'pulse/combat',...m});
 let firePointer:number|undefined;
 let started=false,touch=false,aim=false,flashTimer:ReturnType<typeof setTimeout>|undefined,audio:AudioContext|undefined;
 const mode=()=>{touch=(host.controlMode?.read()==='touch');ui.host.classList.toggle('touch',touch);ui.host.classList.toggle('locked',host.controlMode?.read()==='pointer-locked');controls?.setEnabled(started&&touch);send({kind:'mode',touch});};
 const listen=(target:EventTarget,name:string,fn:EventListener)=>{target.addEventListener(name,fn);releases.push(()=>target.removeEventListener(name,fn));};
 let mapOpen=false;
 const toggleMap=(open:boolean)=>{mapOpen=open;node('world-map').hidden=!open;send({kind:'settings',open,bob:(node('bob') as HTMLInputElement).checked});if(open)document.exitPointerLock?.();};
 listen(node('lift-up'),'click',()=>port?.postMessage({channel:'outbreak/world',kind:'lift',direction:1}));listen(node('lift-down'),'click',()=>port?.postMessage({channel:'outbreak/world',kind:'lift',direction:-1}));
 listen(node('world-map-open'),'click',()=>toggleMap(true));listen(node('world-map-close'),'click',()=>toggleMap(false));
 listen(document,'keydown',event=>{const e=event as KeyboardEvent;if(e.code==='KeyM'&&!e.repeat){e.preventDefault();toggleMap(!mapOpen);}if(e.code==='Escape'&&mapOpen)toggleMap(false);});
 const plot=node('world-plot');
 for(const b of BUILDINGS){const dot=document.createElement('i');dot.className='world-building';dot.style.left=((b.x+3000)/60)+'%';dot.style.top=((b.z+2500)/50)+'%';plot.append(dot);}
 DESTINATIONS.forEach((d,index)=>{const button=document.createElement('button');button.textContent=d.name;button.dataset.travel=String(index);node('world-destinations').append(button);listen(button,'click',()=>{port?.postMessage({channel:'outbreak/world',kind:'travel',destination:index});toggleMap(false);});});
 listen(port!,'message',event=>{const s=(event as MessageEvent).data;if(s?.channel!=='outbreak/state')return;node('lift-controls').hidden=!s.elevatorAvailable;text('lift-status','电梯 · '+s.floor+' 层');ui.host.classList.toggle('world-roaming',Math.hypot(s.position[0],s.position[2])>55);text('world-location',s.region+' · '+Math.round(s.position[0])+' / '+Math.round(s.position[2])+' m');node('world-marker').style.left=((s.position[0]+3000)/60)+'%';node('world-marker').style.top=((s.position[2]+2500)/50)+'%';});
 // Three layers share one shot clock: pressure thump, filtered crack, then action click.
 let volume=.7;
 const sound=(index:number)=>{
  if(!audio)return;
  const ac=audio,t=ac.currentTime;void ac.resume();
  const [low,cut,tail]=[[95,2350,.23],[71,1750,.52],[142,4400,.14],[116,3100,.19],[158,2100,.13],[122,3300,.18],[78,1800,.4],[100,1800,.1]][index]!;
  const tone=ac.createOscillator(),thump=ac.createGain();tone.frequency.setValueAtTime(low!,t);tone.frequency.exponentialRampToValueAtTime(38,t+.09);thump.gain.setValueAtTime(Math.max(.0001,.38*volume),t);thump.gain.exponentialRampToValueAtTime(.001,t+.12);tone.connect(thump).connect(ac.destination);tone.start(t);tone.stop(t+.12);
  const noise=(at:number,d:number,hz:number,level:number)=>{const buf=ac.createBuffer(1,Math.ceil(ac.sampleRate*d),ac.sampleRate),samples=buf.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;const src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();src.buffer=buf;f.frequency.setValueAtTime(hz,at);f.frequency.exponentialRampToValueAtTime(650,at+d);g.gain.setValueAtTime(Math.max(.0001,level*volume),at);g.gain.exponentialRampToValueAtTime(.001,at+d);src.connect(f).connect(g).connect(ac.destination);src.start(at);};
  noise(t,tail!,cut!,.48);noise(t+(index===1?.34:.045),.032,4900,.10);
 };
 const settings=(open:boolean)=>{node('settings-panel').hidden=!open;send({kind:'settings',open,bob:(node('bob') as HTMLInputElement).checked});if(open)document.exitPointerLock?.();};
 listen(node('settings-open'),'click',()=>settings(true));listen(node('settings-close'),'click',()=>settings(false));
 listen(node('volume'),'input',()=>{volume=Number((node('volume') as HTMLInputElement).value)/100;});
 listen(node('start'),'click',()=>{started=true;ui.host.classList.add('started');try{audio??=new AudioContext();void audio.resume();}catch{}send({kind:'start'});mode();});
 root.querySelectorAll<HTMLElement>('[data-weapon]').forEach(button=>listen(button,'click',()=>{aim=false;send({kind:'select',index:Number(button.dataset.weapon)});}));
 const attachmentLabels=['补偿器','快换弹匣','瞄具'];
 const attachmentEffects=['后坐 −24%','换弹时间 −24%','提高瞄准倍率'];
 const attachmentHints=['降低后坐力 24%','缩短换弹时间 24%','开镜时放大画面'];
 const attachmentButtons: HTMLButtonElement[][]=[];
 root.querySelectorAll<HTMLElement>('[data-attachment-row]').forEach(row=>{
  const slot=Number(row.dataset.attachmentRow);
  attachmentButtons[slot]=attachmentLabels.map((label,part)=>{
   const button=document.createElement('button');
   button.type='button';
   button.append(document.createElement('strong'),document.createElement('small'));
   button.children[0]!.textContent=label;
   button.children[1]!.textContent=attachmentEffects[part]!;
   button.title=attachmentHints[part]!;
   button.setAttribute('aria-pressed','false');
   row.append(button);
   listen(button,'click',()=>send({kind:'attachment',slot,part}));
   return button;
  });
 });
 let rackSlot=0;
 root.querySelector('.rack-guns')!.innerHTML=WEAPONS.map((w,i)=>i!==2&&i!==7?'<button data-equip="'+i+'">'+w.name+'</button>':'').join('');
 root.querySelector('.rack-tiers')!.innerHTML=Array.from({length:6},(_,i)=>'<button data-tier="'+(i+1)+'">Lv.'+(i+1)+' · '+(85+i*25)+' 护甲</button>').join('');
 root.querySelectorAll<HTMLElement>('[data-action]:not([data-action=crouch])').forEach(b=>listen(b,'click',()=>send({kind:'action',action:b.dataset.action})));
 root.querySelectorAll<HTMLButtonElement>('[data-lean]').forEach(button=>{
  listen(button,'pointerdown',event=>{
   const e=event as PointerEvent;
   button.setPointerCapture(e.pointerId);
   send({kind:'lean',direction:Number(button.dataset.lean)});
  });
  listen(button,'lostpointercapture',()=>send({kind:'lean',direction:0}));
 });
 const crouch=root.querySelector<HTMLElement>('[data-action=crouch]')!;
 listen(crouch,'pointerdown',event=>{
  const e=event as PointerEvent;
  crouch.setPointerCapture(e.pointerId);
  send({kind:'crouch',held:true});
 });
 listen(crouch,'lostpointercapture',()=>send({kind:'crouch',held:false}));
 root.querySelectorAll<HTMLElement>('[data-slot]').forEach(b=>listen(b,'click',()=>{rackSlot=Number(b.dataset.slot);root.querySelectorAll<HTMLElement>('[data-slot]').forEach(x=>x.classList.toggle('selected',x===b));}));
 root.querySelectorAll<HTMLElement>('[data-equip]').forEach(b=>listen(b,'click',()=>send({kind:'equip',index:Number(b.dataset.equip),slot:rackSlot})));
 root.querySelectorAll<HTMLElement>('[data-gear]').forEach(b=>listen(b,'click',()=>send({kind:'gear',item:b.dataset.gear})));
 root.querySelectorAll<HTMLElement>('[data-tier]').forEach(b=>listen(b,'click',()=>send({kind:'tier',value:Number(b.dataset.tier)})));
 root.querySelectorAll<HTMLElement>('[data-skin]').forEach(b=>listen(b,'click',()=>send({kind:'skin',value:Number(b.dataset.skin)})));
 const releaseFire=()=>{send({kind:'fire',held:false});node('fire').classList.remove('held');};
 listen(node('fire'),'pointerdown',((e:PointerEvent)=>{if(!started)return;e.preventDefault();firePointer=e.pointerId;send({kind:'fire',held:true});node('fire').classList.add('held');}) as EventListener);
 const releaseContact=(event:Event)=>{if((event as PointerEvent).pointerId!==firePointer)return;firePointer=undefined;releaseFire();};
 listen(document,'pointerup',releaseContact);listen(document,'pointercancel',releaseContact);
 listen(node('aim'),'click',()=>{aim=!aim;send({kind:'aim',held:aim});node('aim').classList.toggle('held',aim);});
 listen(node('reload'),'click',()=>send({kind:'reload'}));
 listen(node('inspect'),'click',()=>send({kind:'inspect'}));
 const reset=()=>{releaseFire();aim=false;send({kind:'reset'});controls?.reset();node('aim').classList.remove('held');};
 listen(window,'blur',reset);listen(document,'visibilitychange',reset);listen(window,'resize',()=>{reset();mode();});
 const displays=Array.from(root.querySelectorAll<HTMLElement>('[data-weapon-display]'));
 let lastWeaponLayout='';
 const syncWeaponDisplays=()=>{
  const bounds=ui.host.getBoundingClientRect();
  if(!bounds.width||!bounds.height)return;
  const panel=node('equipment').getBoundingClientRect();
  const slots=displays.map(display=>{
   const rect=display.getBoundingClientRect();
   if(rect.top<panel.top||rect.bottom>panel.bottom||rect.width<=0||rect.height<=0)return null;
   return [(rect.left+rect.width/2-bounds.left)/bounds.width,(rect.top+rect.height/2-bounds.top)/bounds.height,rect.width/bounds.width,rect.height/bounds.height];
  });
  const signature=JSON.stringify(slots);
  if(signature===lastWeaponLayout)return;
  lastWeaponLayout=signature;
  send({kind:'weapon-layout',slots});
 };
 listen(node('equipment'),'scroll',syncWeaponDisplays);
 const receive=(ev:MessageEvent)=>{const s=ev.data;if(s?.channel==='pulse/shot'){sound(s.index);node('muzzle').style.display='block';clearTimeout(flashTimer);flashTimer=setTimeout(()=>node('muzzle').style.display='none',50);}
 if(s?.channel==='pulse/hit'&&audio){const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;osc.frequency.value=s.head?1450:940;gain.gain.setValueAtTime(.10,t);gain.gain.exponentialRampToValueAtTime(.001,t+.12);osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+.12);}
 if(s?.channel!=='pulse/state')return;
 const health=Math.max(0,Math.min(100,s.health));
 node('health-fill').style.width=health+'%';
 node('health-fill').classList.toggle('critical',health<30);
 node('armor-fill').style.width=Math.max(0,Math.min(100,s.armor/s.armorMax*100))+'%';
 const bearing=((Math.round(s.camera.yaw*180/Math.PI)%360)+360)%360;
 const tick=Math.round(bearing/15)*15;
 const directions:Record<number,string>={0:'N',45:'NE',90:'E',135:'SE',180:'S',225:'SW',270:'W',315:'NW'};
 const marks=[-30,-15,0,15,30].map(offset=>{
  const angle=(tick+offset+360)%360;
  return offset===0?String(bearing).padStart(3,'0'):directions[angle]??String(angle);
 });
 text('compass',marks.join('      '));
 const marker=node('map-player');
 marker.style.left=Math.max(0,Math.min(100,(s.position[0]+13)/26*100))+'%';
 marker.style.top=Math.max(0,Math.min(100,(s.position[2]+38)/50*100))+'%';
 marker.style.rotate=bearing+'deg';
 if(s.rackOpen){
  text('bag-helmet',s.helmetEquipped?'头部减伤 60% · '+Math.ceil(s.helmet)+' / '+s.helmetMax:'未装备');
  text('bag-rig',s.rigEquipped?'胸部减伤 25% · '+Math.ceil(s.rig)+' / '+s.rigMax:'未装备');
  root.querySelectorAll<HTMLButtonElement>('[data-gear]').forEach(b=>{b.disabled=!s.nearEquipment;b.title=s.nearEquipment?'点击装备或卸下':'靠近后方装备台更换';});
  for(const [part,count] of [['bag-ammo',s.reserve],['bag-med',s.medkits],['bag-plate',s.plates],['bag-frag',s.frags],['bag-smoke',s.smokes]] as const){
   text(part,String(count));
   node(part).parentElement?.classList.toggle('depleted',count<=0);
  }
  text('bag-armor','Lv.'+s.tier+'　'+Math.ceil(s.armor)+' / '+s.armorMax+' · 减伤 '+Math.round((.30+s.tier*.09)*100)+'%');
  text('nearby-hint',s.nearEquipment?'装备台在范围内':'靠近出生点后方装备台更换武器');
  attachmentButtons.forEach((buttons,slot)=>buttons.forEach((button,part)=>{
   const installed=Boolean((s.attachments?.[s.loadout[slot]]??0)&(1<<part));
   button.setAttribute('aria-pressed',String(installed));
   button.children[0]!.textContent=(installed?'✓ ':'')+attachmentLabels[part];
  }));
  s.loadout.forEach((index:number,slot:number)=>{
   text('slot-'+slot,WEAPONS[index]!.name);
   if(slot<3)text('card-ammo-'+slot,s.magazines[index]+' / '+s.reserves[index]+' 发');
  });
  root.querySelectorAll('[data-slot]').forEach(button=>{
   const selected=Number((button as HTMLElement).dataset.slot)===rackSlot;
   button.setAttribute('aria-pressed',String(selected));
  });
  root.querySelectorAll<HTMLButtonElement>('[data-equip]').forEach(button=>{
   button.disabled=!s.nearEquipment||s.loadout.includes(Number(button.dataset.equip));
  });
 }
 text('vitals','生命 '+Math.ceil(s.health)+' · 护甲 '+Math.ceil(s.armor)+' / '+s.armorMax+' · Lv.'+s.tier);
 text('inventory','手雷 '+s.frags+'  烟雾 '+s.smokes+'  医疗 '+s.medkits+'  护甲板 '+s.plates+'  击倒 '+s.kills+'/3'+(s.crouched?' · 蹲姿':''));
 text('tactical-message',s.message==='T 开始对抗训练'?'':s.message);node('use-progress').style.width=s.using?s.useProgress*100+'%':'0%';
 ui.host.classList.toggle('bag-open',s.rackOpen);
 node('equipment').style.display=s.rackOpen?'block':'none';if(s.rackOpen)syncWeaponDisplays();else lastWeaponLayout='';node('death-overlay').style.display=s.dead?'flex':'none';node('damage-overlay').style.opacity=String(s.damageFlash/.35);
 text('rack-summary','当前：'+s.loadout.map((i:number)=>WEAPONS[i]!.name).join(' / ')+' · 护甲 Lv.'+s.tier+'，吸收 '+Math.round((.30+s.tier*.09)*100)+'% 伤害，移动 '+Math.round((1-(s.tier-1)*.035)*100)+'% · '+['原钢','鎏金','冰蓝'][s.skin]);
 root.querySelectorAll<HTMLElement>('[data-tier]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.tier)===s.tier));
 root.querySelectorAll<HTMLElement>('[data-skin]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.skin)===s.skin));
 text('hit-count','命中 '+s.hits+' · 头部 '+s.headshots);
 text('hit-result',s.lastHit||'向前方靶位射击');
 node('hit-feedback').classList.toggle('visible',s.hitFlash>0);
 node('aim').classList.toggle('held',s.aiming);
 text('inspect',s.inspecting?'F · 结束检视 ↙':'F · 检视武器 ↗');
 ui.host.classList.toggle('inspecting',s.inspecting);
 const w=WEAPONS[s.selected as number];if(!w)return;
 text('catalog-name',w.name);text('dossier',['固定木托 · 层压木护木 · 弧形钢弹匣','拇指孔枪托 · 手动枪栓 · 高倍率光学镜','聚合物握把 · 往复套筒 · 三点式照门','沙色机匣 · 通长导轨 · 框式瞄具','双杆伸缩托 · 筒形机匣 · 护圈准星','伸缩枪托 · 导轨护木 · 自动射击','泵动护木 · 八发供弹 · 近距离散射','原钢 / 鎏金 / 冰蓝 · 近战挥刀'][s.selected]!);
 text('capacity',w.capacity+' 发');text('timing',w.reload.toFixed(2)+' s');
 const reticle=node('reticle');
 const spreadSize='calc('+Math.max(0,s.reticleSpread*2)+'vh + 16px)';
 reticle.style.width=reticle.style.height=s.aiming&&w.id==='scar'?'4px':spreadSize;ui.host.classList.toggle('ads',s.aiming);ui.host.classList.toggle('reflex',s.aiming&&w.id==='scar');text('weapon-name',w.name);text('weapon-kind',w.kind+' / '+(w.automatic?'AUTO':s.selected===1?'BOLT':'SEMI'));
 text('ammo',w.id==='knife'?'∞':String(s.ammo).padStart(2,'0'));text('reserve',String(s.reserve));text('action',s.reloading?'换弹中…':s.ammo===0?'弹匣已空 · 请换弹':s.selected===1&&s.aiming?'瞄准中':'就绪');
 if(s.throwable){
  text('weapon-name',s.throwable==='frag'?'破片手雷':'烟雾弹');
  text('weapon-kind','投掷物');
  text('ammo',String(s.throwable==='frag'?s.frags:s.smokes));
  text('reserve','');
  text('action',touch?'长按开火投掷':'右键或长按左键投掷');
 }
 node('reload-bar').style.width=(s.reloadProgress*100)+'%';
 ui.host.style.setProperty('--fx-pulse-accent',w.accent);ui.host.classList.toggle('scoped',s.aiming&&s.selected===1);node('scope').classList.toggle('active',s.aiming&&s.selected===1);
 node('status').style.display=started&&!s.active?'block':'none';text('status',touch?'滑动右侧调整视角，点击开火':'点击场景锁定鼠标 · 右键瞄准 / R 换弹');
 root.querySelectorAll<HTMLElement>('[data-weapon]').forEach(button=>{const i=Number(button.dataset.weapon);button.classList.toggle('selected',!s.throwable&&i===s.selected);button.style.display=s.loadout.includes(i)?'block':'none';button.style.order=String(s.loadout.indexOf(i));const slot=button.querySelector('span');if(slot)slot.textContent=String(s.loadout.indexOf(i)+1)+' / '+(i===2?'手枪':i===7?'近战':'主武器');});
 };
 port?.addEventListener('message',receive);port?.start();releases.push(()=>port?.removeEventListener('message',receive));
 if(host.controlMode)releases.push(host.controlMode.subscribe(mode));mode();
 return {host:ui.host,signal:ui.signal,resourceUrl:ui.resourceUrl,dispose(){reset();clearTimeout(flashTimer);controls?.dispose();for(const f of releases.reverse())f();void audio?.close();ui.dispose();}};
}
