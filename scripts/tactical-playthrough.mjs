import assert from 'node:assert/strict';
export default async function(play){
 const read=()=>play.state('pulse.game');
 const ensureActive=async()=>{if(!(await read()).active){await play.advance(1.1,{read:'pulse.game'});await play.page.bringToFront();await play.mouse.click([.5,.5]);await play.waitFor(s=>s.active,{read:'pulse.game'});}};
 await play.page.getByRole('button',{name:'进入训练场'}).click();await play.waitFor(s=>s.phase==='playing',{read:'pulse.game'});await play.advance(.3,{read:'pulse.game'});
 await play.page.getByRole('button',{name:'E 装备台',exact:true}).click();await play.waitFor(s=>s.rackOpen,{read:'pulse.game'});
 await play.page.locator('[data-equip="5"]').click();await play.page.locator('[data-slot="1"]').click();await play.page.locator('[data-equip="6"]').click();await play.page.locator('[data-tier="6"]').click();await play.page.locator('[data-skin="2"]').click();
 await play.waitFor(s=>s.loadout[0]===5&&s.loadout[1]===6&&s.tier===6&&s.skin===2,{read:'pulse.game'});assert.deepEqual((await read()).loadout,[5,6,2,7]);await play.screenshot('equipment-loadout');
 await play.page.getByRole('button',{name:'完成装备 / E',exact:true}).click();await play.advance(.2,{read:'pulse.game'});
 await play.page.bringToFront();await play.mouse.click([.5,.5]);await play.waitFor(s=>s.active,{read:'pulse.game'});
 await ensureActive();await play.keyboard.press('Digit1');await play.advance(.4,{read:'pulse.game'});const before=(await read()).camera.pitch;await play.page.mouse.down();await play.waitFor(s=>s.shots>=3,{read:'pulse.game'});await play.page.mouse.up();assert((await read()).camera.pitch<before-.02);await play.screenshot('m4-recoil');
 await ensureActive();await play.page.keyboard.down('ShiftLeft');await play.waitFor(s=>s.crouched,{read:'pulse.game'});await play.screenshot('crouched');
 await play.page.keyboard.up('ShiftLeft');await play.waitFor(s=>!s.crouched,{read:'pulse.game'});
 await ensureActive();await play.keyboard.press('KeyF');await play.advance(.7,{read:'pulse.game'});assert((await read()).inspecting);await play.screenshot('held-inspection');await play.advance(3,{read:'pulse.game'});assert(!(await read()).inspecting);
 await ensureActive();await play.keyboard.press('Digit2');await play.advance(.4,{read:'pulse.game'});await play.screenshot('m870');await play.page.mouse.click(720,450);await play.advance(1,{read:'pulse.game'});
 await ensureActive();await play.keyboard.press('Digit4');await play.advance(.4,{read:'pulse.game'});await play.page.mouse.down();await play.advance(.15,{read:'pulse.game'});await play.screenshot('ice-knife-slash');await play.page.mouse.up();
 await ensureActive();await play.keyboard.press('Digit5');await play.waitFor(s=>s.throwable==='frag',{read:'pulse.game'});assert.equal((await read()).frags,3);await play.page.mouse.click(720,450,{button:'right'});await play.advance(.15,{read:'pulse.game'});await play.screenshot('grenade-throw');await play.advance(2.1,{read:'pulse.game'});assert.equal((await read()).explosions,1);assert.equal((await read()).frags,2);
 await ensureActive();await play.keyboard.press('Digit6');await play.waitFor(s=>s.throwable==='smoke',{read:'pulse.game'});await play.page.mouse.click(720,450,{button:'right'});await play.advance(2.5,{read:'pulse.game'});assert((await read()).clouds>0);await play.screenshot('smoke-screen');
 await ensureActive();await play.keyboard.press('KeyT');await play.waitFor(s=>s.round,{read:'pulse.game'});await play.screenshot('combat-enemies');
 await play.advance(9,{read:'pulse.game'});assert((await read()).health<100);assert((await read()).armor<210);await play.screenshot('enemy-damage');
 // Return to shelter behind smoke then complete medical and armor actions.
 await ensureActive();await play.keyboard.press('Digit6');await play.waitFor(s=>s.throwable==='smoke',{read:'pulse.game'});await play.page.mouse.click(720,450,{button:'right'});await play.advance(2.5,{read:'pulse.game'});
 await ensureActive();await play.keyboard.press('KeyV');await play.advance(.3,{read:'pulse.game'});await play.screenshot('medical-animation');
 await play.advance(3.2,{read:'pulse.game'});assert.equal((await read()).medkits,2,'medical completes under smoke cover');
 await ensureActive();await play.keyboard.press('KeyB');await play.advance(.3,{read:'pulse.game'});await play.screenshot('armor-animation');await play.advance(2.2,{read:'pulse.game'});assert.equal((await read()).plates,3,'armor plate completes');
 await play.reload();assert.deepEqual((await read()).loadout,[0,1,2,7]);return {loadout:true,armorTier:6,knifeSkin:2,recoil:true,crouch:true,inspection:true,grenades:true,smoke:true,enemies:true};
}
