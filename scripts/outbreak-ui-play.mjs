import assert from 'node:assert/strict';
export default async function(play){
 await play.page.getByRole('button',{name:'进入训练场'}).click();
 await play.page.getByRole('button',{name:'M · 区域地图',exact:true}).click();
 await play.page.getByRole('button',{name:'海滨游乐场',exact:true}).scrollIntoViewIfNeeded();
 await play.screenshot('compact-screen-world-map');
 await play.page.getByRole('button',{name:'海滨游乐场',exact:true}).click();
 await play.waitFor(s=>s.region==='海滨游乐场',{read:'outbreak.world'});
 assert((await play.state('outbreak.world')).parkLoaded);
 await play.screenshot('compact-screen-amusement-park');
 return {navigation:true};
}
