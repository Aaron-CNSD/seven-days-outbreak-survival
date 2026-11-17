import assert from 'node:assert/strict';
export default async function(play){
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.waitFor(s=>s.buildingCount>=1660,{read:'outbreak.world'});
 const initial=await play.state('outbreak.world');assert.equal(initial.areaKm2,30);assert.equal(initial.uniqueDesigns,initial.buildingCount);
 await play.page.getByRole('button',{name:'M · 区域地图',exact:true}).click();
 await play.screenshot('outbreak-map-30km-1660-buildings');
 await play.page.getByRole('button',{name:'市立医院',exact:true}).click();
 await play.waitFor(s=>s.position[2]<-55,{read:'outbreak.world'});
 await play.advance(1,{read:'pulse.game'});await play.mouse.click([.5,.5]);await play.waitFor(s=>s.active,{read:'pulse.game'});
 assert((await play.state('outbreak.world')).loadedStreetClusters>0);await play.screenshot('abandoned-hospital-exterior');
 await play.page.keyboard.down('KeyW');await play.advance(3,{read:'pulse.game'});await play.page.keyboard.up('KeyW');
 const hospital=await play.state('outbreak.world');assert(hospital.position[2]<-68,'walk through hospital doorway');
 await play.page.mouse.move(580,455);await play.advance(.3,{read:'pulse.game'});await play.screenshot('hospital-enterable-interior');
 for(const [name,shot] of [['旧城餐厅','restaurant-interior'],['中央商场','mall-interior'],['森林营地','forest-cabins'],['海滩 / 旧码头','beach-ocean-pier']]){
  await play.page.keyboard.press('KeyM');await play.page.getByRole('button',{name,exact:true}).click();await play.advance(1,{read:'pulse.game'});
  await play.mouse.click([.5,.5]);
  if(name==='旧城餐厅'||name==='中央商场'){await play.page.keyboard.down('KeyW');await play.advance(5,{read:'pulse.game'});await play.page.keyboard.up('KeyW');}
  await play.screenshot(shot);
 }
 await play.page.keyboard.press('KeyM');await play.page.getByRole('button',{name:'高楼商业街',exact:true}).click();await play.advance(1,{read:'pulse.game'});await play.mouse.click([.5,.5]);await play.waitFor(s=>s.active,{read:'pulse.game'});
 await play.page.keyboard.down('KeyD');await play.advance(4.5,{read:'pulse.game'});await play.page.keyboard.up('KeyD');await play.page.mouse.move(520,90);await play.advance(.2,{read:'pulse.game'});await play.screenshot('dense-city-skyscrapers');
 await play.page.keyboard.press('KeyM');await play.page.getByRole('button',{name:'高楼商业街',exact:true}).click();await play.advance(1,{read:'pulse.game'});await play.mouse.click([.5,.5]);await play.waitFor(s=>s.active,{read:'pulse.game'});
 await play.page.keyboard.down('KeyW');await play.waitFor(s=>s.elevatorAvailable,{read:'outbreak.world',timeoutMs:20000});await play.page.keyboard.up('KeyW');await play.page.keyboard.press('KeyG');await play.waitFor(s=>s.position[1]>4.8,{read:'outbreak.world'});await play.screenshot('tower-accessible-upper-floor');
 await play.page.keyboard.press('KeyH');await play.waitFor(s=>s.position[1]<2,{read:'outbreak.world'});
 for(const [name,shot]of [['海滨游乐场','seaside-amusement-park'],['摩天轮广场','animated-ferris-wheel'],['过山车车站','rollercoaster-track-and-train']]){await play.page.keyboard.press('KeyM');await play.page.getByRole('button',{name,exact:true}).click();await play.advance(2,{read:'pulse.game'});await play.mouse.click([.5,.5]);await play.page.mouse.move(720,310);await play.advance(.3,{read:'pulse.game'});const a=await play.state('outbreak.world');assert(a.parkLoaded);await play.screenshot(shot);await play.advance(2,{read:'pulse.game'});assert((await play.state('outbreak.world')).parkTime>a.parkTime);}
 await play.reload();await play.waitFor(s=>s.buildingCount===1660,{read:'outbreak.world'});
 return {areaKm2:initial.areaKm2,buildings:initial.buildingCount,uniqueDesigns:initial.uniqueDesigns,hospitalEntry:true};
}
