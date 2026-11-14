import assert from 'node:assert/strict';
export default async function(play){
 const state=await play.state('pulse.game');
 assert.equal(state.weapon,'AK-47');
 await play.screenshot('ak47-fixed-stock');
 return {weapon:state.weapon,inspecting:state.inspecting};
}
