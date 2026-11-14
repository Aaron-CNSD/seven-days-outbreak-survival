import {expect,it} from 'vitest';
import {Tactical} from '../state.ts';

it('applies independent head and chest protection and respects depleted durability',()=>{
 const player=new Tactical();
 player.toggleGear('helmet');player.toggleGear('rig');
 player.damage(20,'head');
 expect(player.helmet).toBe(38);expect(player.rig).toBe(65);expect(player.armor).toBe(85);expect(player.health).toBe(92);
 player.damage(20,'body');
 expect(player.helmet).toBe(38);expect(player.rig).toBe(60);expect(player.armor).toBeCloseTo(79.15);
 player.helmet=0;player.toggleGear('helmet');player.toggleGear('helmet');
 expect(player.helmet).toBe(0);
});
