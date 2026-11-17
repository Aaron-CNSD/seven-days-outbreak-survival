import assert from 'node:assert/strict';
export default async function(play){
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.waitFor(s=>s.buildingCount===1660,{read:'outbreak.world'});
 await play.page.getByRole('button',{name:'M · 区域地图',exact:true}).click();
 await play.page.getByRole('button',{name:'高楼商业街',exact:true}).click();
 await play.advance(2,{read:'pulse.game'});await play.mouse.click([.5,.5]);
 const a=await play.state('outbreak.world');assert(a.detailedBuildings<a.loadedBuildings);
 await play.page.keyboard.down('KeyD');await play.advance(4.5,{read:'pulse.game'});await play.page.keyboard.up('KeyD');
 await play.screenshot('road-sidewalk-and-lod');
 await play.page.mouse.move(1100,450);await play.advance(1,{read:'pulse.game'});await play.screenshot('street-turn-culling');
 return {loaded:a.loadedBuildings,detailed:a.detailedBuildings};
}
