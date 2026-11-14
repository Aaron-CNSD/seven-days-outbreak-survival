import assert from 'node:assert/strict';
export default async function(play){
 const read=()=>play.state('pulse.game');
 for(const [index,name,key] of [[3,'SCAR-L','scar'],[4,'MP5 A3','mp5']]){
  await play.page.locator('[data-weapon="'+index+'"]').click();
  await play.waitFor(s=>s.weapon===name,{read:'pulse.game'});await play.advance(.7,{read:'pulse.game'});
  await play.screenshot('catalog-'+key);
 }
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.waitFor(s=>s.phase==='playing',{read:'pulse.game'});await play.advance(.2,{read:'pulse.game'});
 await play.page.bringToFront();await play.mouse.click([.5,.5]);
 await play.waitFor(s=>s.active&&!s.mobile,{read:'pulse.game'});
 for(const index of [3,4]){
  await play.keyboard.press('Digit'+(index+1));await play.waitFor(s=>s.selected===index,{read:'pulse.game'});await play.advance(.4,{read:'pulse.game'});
  await play.page.mouse.down({button:'right'});await play.waitFor(s=>s.aiming,{read:'pulse.game'});await play.advance(.4,{read:'pulse.game'});
  await play.screenshot(index===3?'scar-aim':'mp5-aim');await play.page.mouse.up({button:'right'});
  await play.page.mouse.down();await play.waitFor(s=>s.weaponShots[index]>=2,{read:'pulse.game'});await play.page.mouse.up();
  await play.keyboard.press('KeyR');await play.waitFor(s=>s.reloading,{read:'pulse.game'});await play.advance(2.5,{read:'pulse.game'});assert.equal((await read()).ammo,30);
 }
 await play.page.mouse.wheel(0,110);await play.waitFor(s=>s.selected===0,{read:'pulse.game'});
 await play.reload();assert.equal((await read()).weapon,'AK-47');return {guns:5,automaticFire:true,reload:true,wrap:true};
}
