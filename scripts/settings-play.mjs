export default async function(play){
await play.page.getByRole('button',{name:'设置',exact:true}).click();
await play.page.locator('[data-part="volume"]').fill('30');
await play.page.locator('[data-part="bob"]').uncheck();
await play.screenshot('settings-panel');
await play.page.getByRole('button',{name:'保存并返回'}).click();
await play.page.getByRole('button',{name:'进入训练场'}).click();
await play.mouse.click([.5,.5]);await play.waitFor(s=>s.active,{read:'pulse.game'});
await play.page.keyboard.down('ShiftLeft');await play.waitFor(s=>s.crouched,{read:'pulse.game'});
await play.page.keyboard.up('ShiftLeft');await play.waitFor(s=>!s.crouched,{read:'pulse.game'});
await play.keyboard.press('KeyE');await play.waitFor(s=>s.rackOpen,{read:'pulse.game'});
await play.screenshot('equipment-backboard');await play.reload();return {settings:true,shiftCrouch:true,equipment:true};
}
