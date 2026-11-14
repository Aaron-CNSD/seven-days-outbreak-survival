import assert from 'node:assert/strict';
export default async function(play){
 const read='pulse.game';
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.waitFor(s=>s.phase==='playing',{read});
 await play.page.getByRole('button',{name:'E 背包',exact:true}).click();
 await play.waitFor(s=>s.rackOpen,{read});
 await play.page.locator('[data-gear="helmet"]').click();
 await play.page.locator('[data-gear="rig"]').click();
 await play.waitFor(s=>s.helmetEquipped&&s.rigEquipped,{read});
 for(let i=0;i<3;i++) await play.page.locator('[data-attachment-row="0"] button').nth(i).click();
 await play.waitFor(s=>s.attachments[0]===7,{read});
 await play.advance(.65,{read});
 assert.deepEqual(await play.page.locator('.bag-items b').allTextContents(),['3','4','3','2','180']);
 await play.screenshot('operator-and-supplies');
 await play.page.getByRole('button',{name:'完成装备 / E'}).click();
 await play.waitFor(s=>!s.rackOpen,{read});
 await play.screenshot('attachments-on-weapon');
 await play.keyboard.press('KeyF');
 await play.waitFor(s=>s.inspecting,{read});
 await play.advance(.35,{read});
 await play.screenshot('inspect-connected-arms');
 const s=await play.state(read); assert.equal(s.attachments[0],7);
 return {gear:true,attachments:true};
}
