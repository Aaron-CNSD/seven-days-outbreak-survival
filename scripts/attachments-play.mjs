export default async function(play) {
 const read='pulse.game';
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.waitFor(s=>s.phase==='playing',{read});
 await play.page.getByRole('button',{name:'E 装备台',exact:true}).click();
 await play.waitFor(s=>s.rackOpen,{read});
 const first=play.page.locator('[data-attachment-row="0"] button').first();
 await first.click();
 await play.waitFor(s=>s.attachments[0]===1,{read});
 await play.page.locator('[data-attachment-row="0"] button[aria-pressed="true"]').waitFor();
 await play.page.locator('[data-attachment-row="1"] button').nth(1).click();
 await play.waitFor(s=>s.attachments[1]===2,{read});
 await play.screenshot('attachment-slots');
 await first.click();
 await play.waitFor(s=>s.attachments[0]===0&&s.attachments[1]===2,{read});
 return {installed:true,removed:true,independentWeapons:true};
}
