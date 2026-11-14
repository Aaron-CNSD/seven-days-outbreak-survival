import assert from 'node:assert/strict';
export default async function(play){
 const device=await play.page.context().newCDPSession(play.page);
 await device.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const read=()=>play.state('pulse.game');
 await play.screenshot('voxel-menu');
 const tap=async(locator,hold=0)=>{await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();assert(r);await device.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});if(hold)await play.advance(hold,{read:'pulse.game'});await device.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 await tap(play.page.getByRole('button',{name:'进入训练场'}));
 await play.waitFor(s=>s.mobile&&s.active,{read:'pulse.game'});
 const inspect=play.page.getByRole('button',{name:'检视武器',exact:true});
 const fire=play.page.getByRole('button',{name:'射击',exact:true});
 for(let i=0;i<5;i++){
  await tap(play.page.locator('[data-weapon="'+i+'"]'));await play.waitFor(s=>s.selected===i,{read:'pulse.game'});await play.advance(.5,{read:'pulse.game'});
  await tap(inspect);await play.waitFor(s=>s.inspecting,{read:'pulse.game'});await play.advance(.6,{read:'pulse.game'});await play.screenshot(['ak47-detail','awm-detail','glock-detail','scar-detail','mp5-detail'][i]);
  await tap(inspect);await play.waitFor(s=>!s.inspecting,{read:'pulse.game'});await play.advance(.6,{read:'pulse.game'});await play.screenshot(['ak47-hands','awm-hands','glock-hands','scar-hands','mp5-hands'][i]);
  const before=await read();await tap(fire,.22);await play.waitFor(s=>s.shots>before.shots,{read:'pulse.game'});assert((await read()).ammo<before.ammo);
  if(i===1){await tap(play.page.getByRole('button',{name:'瞄准',exact:true}));await play.waitFor(s=>s.aiming,{read:'pulse.game'});await play.screenshot('awm-optics');await tap(play.page.getByRole('button',{name:'瞄准',exact:true}));}
  await tap(play.page.getByRole('button',{name:'换弹',exact:true}));await play.waitFor(s=>s.reloading,{read:'pulse.game'});await play.advance(.7,{read:'pulse.game'});await play.screenshot(['ak47-magazine','awm-magazine','glock-magazine','scar-magazine','mp5-magazine'][i]);await play.advance(3.1,{read:'pulse.game'});assert.equal((await read()).ammo,[30,5,17,30,30][i]);
 }
 await play.page.setViewportSize({width:390,height:844});await play.waitFor(s=>s.mobile,{read:'pulse.game'});await play.screenshot('portrait-hands');
 await tap(inspect);await play.advance(.6,{read:'pulse.game'});await play.screenshot('portrait-detail');
 await play.reload();await play.page.waitForSelector('html[data-forgeax-input="open"]');assert.equal((await read()).selected,0);assert.equal((await read()).inspecting,true);
 await play.screenshot('reload-detail');return {models:5,inspection:'passed',hands:'passed',firing:'all five',reload:'all five',optics:'passed'};
}
