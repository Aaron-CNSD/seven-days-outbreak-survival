import { expect, it } from 'vitest';
import { hipSpread, spreadRay } from '../spread.ts';

it('keeps the shot inside the configured cone even when aiming upward and turning',()=>{
 const yaw=1.9,pitch=-.7,cone=.04;
 const forward=spreadRay(yaw,pitch,0,0,0);
 for(const angle of [0,.25,.5,.75]){
  const ray=spreadRay(yaw,pitch,cone,1,angle);
  expect(Math.hypot(...ray)).toBeCloseTo(1,10);
  const dot=ray.reduce((sum,value,i)=>sum+value*forward[i]!,0);
  expect(Math.acos(dot)).toBeCloseTo(Math.atan(cone),10);
 }
});

it('makes movement, sprinting and sustained fire wider than stationary hip fire',()=>{
 const steady=hipSpread(0,0,false,false,0);
 const walking=hipSpread(0,1,false,false,0);
 expect(walking).toBeGreaterThan(steady);
 expect(hipSpread(0,1,true,false,0)).toBeGreaterThan(walking);
 expect(hipSpread(0,0,false,true,0)).toBeLessThan(steady);
 expect(hipSpread(0,0,false,false,1)).toBeGreaterThan(steady);
});
