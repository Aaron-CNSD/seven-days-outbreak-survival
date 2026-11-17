import assert from 'node:assert/strict';
export default async function(play){
 await play.advance(.3,{read:'pulse.game'});await play.screenshot('home-stepped-buttons-and-shadow');
 await play.page.getByRole('button',{name:'选项',exact:false}).click();
 await play.page.getByRole('button',{name:'30',exact:true}).click();
 await play.page.getByRole('button',{name:'高',exact:false}).click();
 await play.advance(.3,{read:'pulse.game'});await play.screenshot('options-volume-fps-quality');
 await play.page.getByRole('button',{name:'保存并返回',exact:false}).click();
 await play.page.getByRole('button',{name:'开始游戏',exact:false}).click();
 await play.page.getByRole('button',{name:'02 / INTO THE UNKNOWN',exact:false}).click();
 await play.page.getByRole('button',{name:'GO',exact:false}).click();
 await play.advance(.3,{read:'pulse.game'});await play.screenshot('mode-selection-not-yet-released');
 await play.page.getByRole('button',{name:'返回首页',exact:false}).click();
 await play.page.getByRole('button',{name:'退出菜单',exact:true}).click();await play.advance(.3,{read:'pulse.game'});await play.screenshot('exit-menu');
 await play.page.getByRole('button',{name:'返回首页',exact:true}).click();
 await play.page.getByRole('button',{name:'进入训练场',exact:true}).click();
 await play.advance(1,{read:'pulse.game'});assert.equal((await play.state('pulse.game')).phase,'playing');await play.advance(.3,{read:'pulse.game'});await play.screenshot('training-entry');
 await play.reload();await play.advance(.3,{read:'pulse.game'});await play.screenshot('home-after-reload');
}
