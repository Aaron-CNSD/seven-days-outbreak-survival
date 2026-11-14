import {expect,it} from 'vitest';
import {Tactical} from '../state.ts';
it('armor tiers absorb more damage, medical items consume only on completion and damage interrupts',()=>{
 const low=new Tactical(),high=new Tactical();high.tier=6;low.damage(30);high.damage(30);expect(high.health).toBeGreaterThan(low.health);
 low.use('medkit');low.tick(1,[0,1.5,7]);expect(low.medkits).toBe(3);low.damage(1);expect(low.using).toBe('');
 low.use('medkit');low.tick(3.1,[0,1.5,7]);expect(low.medkits).toBe(2);expect(low.health).toBe(100);
 low.use('plate');low.tick(2.1,[0,1.5,7]);expect(low.plates).toBe(3);
});
it('enemy attacks stop in smoke, and grenades have finite stock and fuse',()=>{
 const t=new Tactical();t.start();t.enemies=t.enemies.slice(0,1);t.enemies[0]!.cool=0;t.clouds=[{p:[0,1.3,0],life:10}];t.tick(.1,[0,1.5,7]);expect(t.health).toBe(100);
 t.clouds=[];t.enemies[0]!.cool=0;t.tick(.1,[0,1.5,7]);expect(t.health).toBeLessThan(100);
 t.throw(false,[0,1,3],[0,0,-1]);expect(t.frags).toBe(2);for(let i=0;i<130;i++)t.tick(1/60,[10,1.5,7]);expect(t.explosions).toBe(1);expect(t.grenades).toHaveLength(0);
});
it('headshots kill enemies; dead opponents cannot attack',()=>{
 const t=new Tactical();t.start();expect(t.hit([0,1.75,7],[0,0,-1],60)?.head).toBe(true);expect(t.kills).toBe(1);expect(t.enemies[0]!.hp).toBe(0);
});
