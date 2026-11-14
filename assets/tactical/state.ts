export type V=[number,number,number];
export type Enemy={x:number;z:number;hp:number;cool:number;flash:number};
export class Tactical {
 helmetEquipped=false;helmet=50;rigEquipped=false;rig=65;incomingShots=0;
 readonly helmetMax=50;readonly rigMax=65;
 toggleGear(kind:'helmet'|'rig'){if(kind==='helmet'){this.helmetEquipped=!this.helmetEquipped;}else{this.rigEquipped=!this.rigEquipped;}}
 tier=1;loadout=[0,1,2,7];
 get armorMax(){return 60+this.tier*25;}
 health=100;armor=85;kills=0;damageTaken=0;round=false;dead=false;crouched=false;skin=0;
 medkits=3;plates=4;frags=3;smokes=2;using:''|'medkit'|'plate'='';useTime=0;useDuration=0;
 enemies:Enemy[]=[];grenades:{p:V;v:V;age:number;smoke:boolean}[]=[];clouds:{p:V;life:number}[]=[];
 blast:V=[0,-20,0];blastLife=0;message='T 开始对抗训练';thrown=0;explosions=0;smoked=0;
 start(){this.health=100;this.armor=this.armorMax;this.dead=false;this.kills=0;this.damageTaken=0;this.helmet=this.helmetMax;this.rig=this.rigMax;this.incomingShots=0;this.round=true;this.medkits=3;this.plates=4;this.frags=3;this.smokes=2;this.using='';this.grenades=[];this.clouds=[];this.blastLife=0;this.enemies=[{x:0,z:-8,hp:100,cool:4,flash:0},{x:-5,z:-15,hp:100,cool:5,flash:0},{x:5,z:-23,hp:100,cool:6,flash:0}];this.message='对抗已开始 · 消灭 3 名敌人';}
 damage(n:number,zone:'head'|'body'|'blast'='body'){if(this.dead)return;
 let remaining=n;
 if(zone==='head'&&this.helmetEquipped){const blocked=Math.min(this.helmet,remaining*.6);this.helmet-=blocked;remaining-=blocked;}
 if(zone==='body'&&this.rigEquipped){const blocked=Math.min(this.rig,remaining*.25);this.rig-=blocked;remaining-=blocked;}
 const absorbed=zone==='head'?0:Math.min(this.armor,remaining*(.30+this.tier*.09));this.armor-=absorbed;this.health=Math.max(0,this.health-(remaining-absorbed));this.damageTaken+=n;this.using='';if(this.health<=0){this.dead=true;this.message='训练失败 · 按 T 重开';}}
 use(kind:'medkit'|'plate'){if(this.dead||this.using)return;if(kind==='medkit'&&(this.medkits<=0||this.health>=100)||kind==='plate'&&(this.plates<=0||this.armor>=this.armorMax))return;this.using=kind;this.useTime=this.useDuration=kind==='medkit'?3:2;this.message=kind==='medkit'?'医疗包使用中':'正在装填护甲板';}
 cancel(){this.using='';this.useTime=0;}
 throw(smoke:boolean,p:V,d:V){if(this.dead||this.using||(smoke?this.smokes:this.frags)<=0||this.grenades.length>=4)return false;if(smoke)this.smokes--;else this.frags--;this.thrown++;this.grenades.push({p:[...p],v:[d[0]*(smoke?5:11),3.2+d[1]*8,d[2]*(smoke?5:11)],age:0,smoke});this.message=smoke?'烟雾弹已投出':'破片手雷已投出';return true;}
 obscured(a:V,b:V){return this.clouds.some(c=>{const v=b.map((n,i)=>n-a[i]!),den=v.reduce((n,x)=>n+x*x,0),t=Math.max(0,Math.min(1,c.p.reduce((n,x,i)=>n+(x-a[i]!)*v[i]!,0)/(den||1)));return Math.hypot(...a.map((x,i)=>x+v[i]!*t-c.p[i]!))<3;});}
 hit(origin:V,dir:V,damage:number,max=90){let nearest=max,enemy:Enemy|undefined,head=false;for(const e of this.enemies){if(e.hp<=0)continue;const t=(e.z-origin[2])/dir[2];if(!Number.isFinite(t)||t<=0||t>=nearest)continue;const x=origin[0]+dir[0]*t,y=origin[1]+dir[1]*t;if(Math.abs(x-e.x)<.42&&y>.25&&y<1.95){nearest=t;enemy=e;head=y>1.55;}}if(!enemy)return undefined;this.hurt(enemy,damage*(head?2:1));return {distance:nearest,head};}
 hurt(e:Enemy,n:number){if(e.hp<=0)return;e.hp=Math.max(0,e.hp-n);e.flash=.18;if(e.hp===0){this.kills++;if(this.kills===this.enemies.length){this.round=false;this.message='训练完成 · T 再来一轮';}}}
 tick(dt:number,player:V){this.blastLife=Math.max(0,this.blastLife-dt);
 if(this.using){this.useTime-=dt;if(this.useTime<=0){if(this.using==='medkit'){this.medkits--;this.health=Math.min(100,this.health+65);}else{this.plates--;this.armor=Math.min(this.armorMax,this.armor+50);}this.using='';this.message='补给完成';}}
 for(const c of this.clouds)c.life-=dt;this.clouds=this.clouds.filter(c=>c.life>0);
 for(const g of this.grenades){g.age+=dt;g.v[1]-=9.8*dt;for(let i=0;i<3;i++)g.p[i]!+=g.v[i]!*dt;
 if(g.p[1]<.10){g.p[1]=.10;g.v[1]=Math.abs(g.v[1])*.35;g.v[0]*=.72;g.v[2]*=.72;}
 if(Math.abs(g.p[0])>12.7){g.p[0]=Math.sign(g.p[0])*12.7;g.v[0]*=-.5;}if(g.p[2]<-37.5||g.p[2]>11.5){g.p[2]=Math.max(-37.5,Math.min(11.5,g.p[2]));g.v[2]*=-.5;}
 if(g.age>=2){if(g.smoke){this.clouds.push({p:[g.p[0],1.3,g.p[2]],life:10});this.smoked++;}else{this.blast=[...g.p];this.blastLife=.35;this.explosions++;for(const e of this.enemies){const d=Math.hypot(e.x-g.p[0],e.z-g.p[2]);if(d<6)this.hurt(e,150*(1-d/6));}const d=Math.hypot(player[0]-g.p[0],player[2]-g.p[2]);if(d<5)this.damage(90*(1-d/5),'blast');}}}
 this.grenades=this.grenades.filter(g=>g.age<2);
 for(const e of this.enemies){e.flash=Math.max(0,e.flash-dt);if(!this.round||this.dead||e.hp<=0)continue;const d=Math.hypot(e.x-player[0],e.z-player[2]);if(d>7){e.x+=(player[0]-e.x)/d*dt*.65;e.z+=(player[2]-e.z)/d*dt*.65;}e.cool-=dt;if(e.cool<=0){e.cool=1.8;if(!this.obscured([e.x,1.5,e.z],player)){e.flash=.12;this.incomingShots++;this.damage(this.crouched?9:14,this.incomingShots%4===0?'head':'body');}}}
 }
}
