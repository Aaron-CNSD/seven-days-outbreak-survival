import assert from 'node:assert/strict';

export default async function(play) {
 const read='pulse.game';
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.waitFor(s=>s.phase==='playing',{read});
 await play.mouse.click([.5,.5]);
 await play.waitFor(s=>s.active&&s.lean===0,{read});
 for(const [key,side,name] of [['KeyZ',-1,'lean-left'],['KeyC',1,'lean-right']]){
  await play.page.keyboard.down(key);
  await play.waitFor(s=>side*s.lean>.8,{read});
  await play.screenshot(name);
  await play.page.keyboard.up(key);
  await play.waitFor(s=>Math.abs(s.lean)<.02,{read});
 }
 await play.keyboard.press('KeyE');
 await play.waitFor(s=>s.rackOpen,{read});
 const dialog=play.page.getByRole('dialog',{name:'背包'});
 await dialog.waitFor();
 assert.equal(await dialog.locator('.bag-items li').count(),5);
 assert.match(await dialog.evaluate(el=>getComputedStyle(el).backgroundImage),/rgba\(/);
 await dialog.locator('[data-attachment-row="0"] button').first().click();
 await play.waitFor(s=>s.attachments[s.loadout[0]]===1,{read});
 await play.screenshot('transparent-inventory');
 await play.keyboard.press('KeyE');
 await play.waitFor(s=>!s.rackOpen,{read});
 return {inventory:true,lean:true};
}
