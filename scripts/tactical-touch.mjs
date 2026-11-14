import assert from 'node:assert/strict';
export default async function(play){
 const device=await play.page.context().newCDPSession(play.page);await device.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const tap=async(l,hold=0,during)=>{await l.scrollIntoViewIfNeeded();const r=await l.boundingBox();assert(r);await device.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});if(hold)await play.advance(hold,{read:'pulse.game'});if(during)await during();await device.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 const read=()=>play.state('pulse.game');
 await tap(play.page.getByRole('button',{name:'进入训练场'}));await play.waitFor(s=>s.mobile&&s.active,{read:'pulse.game'});
 await tap(play.page.locator('.tactical-actions [data-action="rack"]'));await play.waitFor(s=>s.rackOpen,{read:'pulse.game'});
 await tap(play.page.locator('[data-equip="5"]'));await tap(play.page.locator('[data-tier="4"]'));await tap(play.page.locator('[data-skin="1"]'));await play.screenshot('touch-equipment');
 await tap(play.page.getByRole('button',{name:'完成装备 / E',exact:true}));await play.waitFor(s=>!s.rackOpen,{read:'pulse.game'});
 assert.deepEqual((await read()).loadout,[5,1,2,7]);await tap(play.page.locator('.tactical-actions [data-action="crouch"]'),.2,()=>play.waitFor(s=>s.crouched,{read:'pulse.game'}));await play.waitFor(s=>!s.crouched,{read:'pulse.game'});
 await tap(play.page.getByRole('button',{name:'射击',exact:true}),.4);assert((await read()).shots>0);await play.screenshot('touch-crouch-fire');
 await tap(play.page.locator('.tactical-actions [data-action="frag"]'));await play.waitFor(s=>s.throwable==='frag',{read:'pulse.game'});const frags=(await read()).frags;await tap(play.page.getByRole('button',{name:'射击',exact:true}),.1);assert.equal((await read()).frags,frags);await tap(play.page.getByRole('button',{name:'射击',exact:true}),.6);await play.advance(2.5,{read:'pulse.game'});assert.equal((await read()).frags,2);
 await tap(play.page.locator('.tactical-actions [data-action="smoke"]'));await play.waitFor(s=>s.throwable==='smoke',{read:'pulse.game'});const smokes=(await read()).smokes;await tap(play.page.getByRole('button',{name:'射击',exact:true}),.1);assert.equal((await read()).smokes,smokes);await tap(play.page.getByRole('button',{name:'射击',exact:true}),.6);await play.advance(2.5,{read:'pulse.game'});assert((await read()).clouds>0);await play.screenshot('touch-smoke');
 await play.page.setViewportSize({width:390,height:844});await play.screenshot('portrait-equipment-controls');
 await play.reload();assert.deepEqual((await read()).loadout,[0,1,2,7]);return {touch:true,equipment:true,crouch:true,throwables:true,portrait:true};
}
