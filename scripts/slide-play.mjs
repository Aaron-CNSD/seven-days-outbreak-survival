import assert from 'node:assert/strict';
export default async function(play){
 const read='pulse.game';
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.waitFor(s=>s.phase==='playing',{read});
 await play.mouse.click([.5,.5]);
 await play.waitFor(s=>s.active,{read});
 await play.page.keyboard.down('KeyW');
 await play.advance(.08,{read});
 await play.page.keyboard.up('KeyW');
 await play.page.keyboard.down('KeyW');
 await play.advance(.08,{read});
 await play.page.keyboard.down('ShiftLeft');
 await play.waitFor(s=>s.slide>.1,{read});
 await play.screenshot('sliding-daylight');
 await play.page.keyboard.up('ShiftLeft');
 await play.page.keyboard.up('KeyW');
 await play.waitFor(s=>s.slide===0,{read});
 assert.equal((await play.state(read)).crouched,false);
 return {slide:true};
}
