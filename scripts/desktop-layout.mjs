import assert from 'node:assert/strict';
export default async function(play){
 const read=()=>play.state('pulse.game');
 await play.screenshot('desktop-armoury');
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.waitFor(s=>s.phase==='playing',{read:'pulse.game'});
 await play.advance(.15,{read:'pulse.game'});
 await play.page.bringToFront();
 await play.mouse.click([.5,.5]);
 await play.waitFor(s=>s.active&&!s.mobile,{read:'pulse.game'});
 await play.page.mouse.wheel(0,100);
 await play.waitFor(s=>s.selected===1,{read:'pulse.game'});
 await play.keyboard.press('KeyF');
 await play.waitFor(s=>s.inspecting,{read:'pulse.game'});
 await play.screenshot('desktop-inspection');
 await play.page.setViewportSize({width:840,height:620});
 assert.equal((await read()).mobile,false);
 await play.screenshot('compact-desktop');
 await play.reload();
 assert.equal((await read()).selected,0);
 return {wheel:'AWM',inspection:true,narrowDesktop:'mouse'};
}
