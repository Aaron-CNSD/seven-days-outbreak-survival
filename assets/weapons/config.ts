export const WEAPONS = [
 {id:'ak47',name:'AK-47',kind:'突击步枪',capacity:30,reserve:180,interval:.10,reload:2.3,automatic:true,damage:36,recoil:.055,accent:'#e8a052'},
 {id:'awm',name:'AWM',kind:'栓动狙击步枪',capacity:5,reserve:30,interval:1.5,reload:3.0,automatic:false,damage:120,recoil:.13,accent:'#90bda4'},
 {id:'glock',name:'Glock 17',kind:'半自动手枪',capacity:17,reserve:102,interval:.18,reload:1.6,automatic:false,damage:28,recoil:.035,accent:'#aabbd0'},
 {id:'scar',name:'SCAR-L',kind:'短行程突击步枪',capacity:30,reserve:150,interval:.098,reload:2.15,automatic:true,damage:32,recoil:.043,accent:'#d9bd87'},
 {id:'mp5',name:'MP5 A3',kind:'紧凑型冲锋枪',capacity:30,reserve:210,interval:.075,reload:1.95,automatic:true,damage:23,recoil:.027,accent:'#8dbbcc'},
 {id:'m4',name:'M4A1',kind:'卡宾枪',capacity:30,reserve:180,interval:.085,reload:2.2,automatic:true,damage:30,recoil:.042,accent:'#a9c3bd'},
 {id:'shotgun',name:'M870',kind:'泵动霰弹枪',capacity:8,reserve:48,interval:.85,reload:3.2,automatic:false,damage:18,recoil:.15,accent:'#cfa782'},
 {id:'knife',name:'战术刀',kind:'近战武器',capacity:1,reserve:0,interval:.55,reload:0,automatic:false,damage:75,recoil:0,accent:'#87c8dd'},
] as const;
export type WeaponIndex=0|1|2|3|4|5|6|7;
export class Arsenal {
 selected:WeaponIndex=0; ammo=WEAPONS.map(w=>w.capacity as number); reserve=WEAPONS.map(w=>w.reserve as number);
 attachments=WEAPONS.map(()=>0);
 get recoilScale(){return this.attachments[this.selected]!&1?.76:1;}
 get reloadDuration(){return this.weapon.reload*(this.attachments[this.selected]!&2?.76:1);}
 get optic(){return Boolean(this.attachments[this.selected]!&4);}
 toggleAttachment(index:number,slot:number){this.attachments[index]=this.attachments[index]!^(1<<slot);}
 cooldown=0; reloadRemaining=0; recoil=0; shots=0; weaponShots=WEAPONS.map(()=>0); aiming=false;
 get weapon(){return WEAPONS[this.selected];}
 select(index:number){if(!Number.isInteger(index)||index<0||index>=WEAPONS.length)return; if(index===this.selected)return; this.selected=index as WeaponIndex;this.cooldown=.25;this.reloadRemaining=0;this.aiming=false;this.recoil=0;}
 reload(){if(this.weapon.id==='knife')return false;if(this.reloadRemaining>0||this.ammo[this.selected]===this.weapon.capacity||this.reserve[this.selected]!<=0)return false;this.reloadRemaining=this.reloadDuration;this.aiming=false;return true;}
 tick(dt:number){this.cooldown=Math.max(0,this.cooldown-dt);this.recoil*=Math.exp(-dt*14);if(this.reloadRemaining>0){this.reloadRemaining-=dt;if(this.reloadRemaining<=0){const n=Math.min(this.weapon.capacity-this.ammo[this.selected]!,this.reserve[this.selected]!);this.ammo[this.selected]!+=n;this.reserve[this.selected]!-=n;this.reloadRemaining=0;}}}
 fire(){if(this.cooldown>0||this.reloadRemaining>0||this.ammo[this.selected]!<=0)return false;if(this.weapon.id!=='knife')this.ammo[this.selected]!--;this.shots++;this.weaponShots[this.selected]!++;this.cooldown=this.weapon.interval;this.recoil=this.weapon.recoil*this.recoilScale;return true;}
}
