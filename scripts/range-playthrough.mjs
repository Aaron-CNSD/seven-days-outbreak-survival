import assert from 'node:assert/strict';
export default async function(play){
 const read=()=>play.state('pulse.game');
 await play.page.getByRole('button',{name:'进入训练场'}).click();await play.waitFor(s=>s.phase==='playing',{read:'pulse.game'});await play.advance(.2,{read:'pulse.game'});
 await play.page.bringToFront();await play.mouse.click([.5,.5]);await play.waitFor(s=>s.active&&!s.mobile,{read:'pulse.game'});
 await play.advance(.6,{read:'pulse.game'});await play.screenshot('range-spawn');
 await play.page.mouse.down();await play.waitFor(s=>s.hits>=2,{read:'pulse.game'});await play.page.mouse.up();await play.screenshot('target-impact');
 const hold=async(key,time)=>{await play.page.keyboard.down(key);await play.advance(time,{read:'pulse.game'});await play.page.keyboard.up(key);return (await read()).position;};
 let p=await hold('KeyS',4);assert(p[2]<12&&p[2]>10,'rear wall stops movement');await play.screenshot('rear-boundary');
 p=await hold('KeyD',6);assert(p[0]<13&&p[0]>11,'right wall stops movement');await play.screenshot('right-boundary');
 p=await hold('KeyA',10);assert(p[0]>-13&&p[0]<-11,'left wall stops movement');await play.screenshot('left-boundary');
 await hold('KeyD',1.2);
 p=await hold('KeyW',18);assert(p[2]>-38&&p[2]<-34,'front wall stops movement');await play.screenshot('front-boundary');
 await play.page.keyboard.down('KeyW');await play.keyboard.press('Space');await play.advance(2,{read:'pulse.game'});await play.page.keyboard.up('KeyW');assert((await read()).position[2]>-38);
 await play.reload();assert.equal((await read()).hits,0);assert(Math.abs((await read()).position[2]-7.4)<.2);
 await play.screenshot('spawn-after-reload');return {targets:4,hitFeedback:true,walls:'all four sides plus jumping',reload:true};
}
