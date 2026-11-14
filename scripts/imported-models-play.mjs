import assert from 'node:assert/strict';
export default async function(play){
 const read='pulse.game',active=async()=>{if(!(await play.state(read)).active){await play.advance(1.1,{read});await play.page.bringToFront();await play.mouse.click([.5,.5]);await play.waitFor(s=>s.active,{read});}};
 await play.page.getByRole('button',{name:'进入训练场'}).click();await play.waitFor(s=>s.phase==='playing',{read});
 assert.deepEqual((await play.state(read)).importedModels,[0,1,5]);
 await active();assert((await play.state(read)).modelBones>=68);await play.screenshot('imported-ak47-arms');
 await active();await play.page.mouse.down();await play.waitFor(s=>s.shots>0,{read});await play.page.mouse.up();
 await play.keyboard.press('KeyR');await play.waitFor(s=>s.reloading,{read});await play.advance(.95,{read});await play.screenshot('imported-ak47-reload');
 await active();await play.advance(3,{read});await play.keyboard.press('KeyF');await play.advance(.6,{read});await play.screenshot('imported-ak47-inspect');
 await active();await play.advance(3,{read});await play.keyboard.press('Digit2');await play.advance(.6,{read});assert.equal((await play.state(read)).selected,1);await play.screenshot('imported-awm');
 await active();await play.keyboard.press('KeyE');await play.waitFor(s=>s.rackOpen,{read});await play.page.locator('[data-equip="5"]').click();await play.page.getByRole('button',{name:'完成装备 / E',exact:true}).click();
 await active();await play.advance(.6,{read});assert.equal((await play.state(read)).selected,5);await play.screenshot('imported-m4a1');
 await active();await play.page.keyboard.down('ShiftLeft');await play.waitFor(s=>s.crouched,{read});await play.screenshot('imported-crouched');await play.page.keyboard.up('ShiftLeft');
 await play.reload();assert.deepEqual((await play.state(read)).importedModels,[0,1,5]);return {importedModels:3,weightedArms:true,shoot:true,reload:true,inspect:true,crouch:true,reloadPersistence:true};
}
