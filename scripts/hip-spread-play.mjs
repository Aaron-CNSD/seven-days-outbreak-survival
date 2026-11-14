import assert from 'node:assert/strict';

export default async function(play){
 const read='pulse.game';
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.waitFor(s=>s.phase==='playing',{read});
 await play.mouse.click([.5,.5]);
 await play.waitFor(s=>s.active&&s.reticleSpread>0,{read});
 const idle=(await play.state(read)).reticleSpread;
 await play.page.keyboard.down('KeyW');
 await play.waitFor(s=>s.reticleSpread>idle*1.4,{read});
 await play.screenshot('moving-hip-fire');
 await play.page.keyboard.up('KeyW');
 await play.page.keyboard.down('ShiftLeft');
 await play.waitFor(s=>s.crouched&&s.reticleSpread<idle*.85,{read});
 await play.screenshot('crouched-hip-fire');
 await play.page.keyboard.up('ShiftLeft');
 const before=(await play.state(read)).shots;
 await play.page.mouse.down();
 await play.waitFor(s=>s.shots>before&&s.reticleSpread>idle*1.15,{read});
 await play.page.mouse.up();
 await play.page.mouse.down({button:'right'});
 await play.waitFor(s=>s.aiming,{read});
 assert.equal((await play.state(read)).reticleSpread,0);
 await play.page.mouse.up({button:'right'});
 return {moving:true,crouched:true,firing:true,aiming:true};
}
