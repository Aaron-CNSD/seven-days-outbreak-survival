import {expect,it} from 'vitest';
import {hitTarget} from '../training.ts';
it('hits the nearest visible body and head, but rejects sky and back faces',()=>{
 expect(hitTarget([0,1.6,7.4],[0,0,-1])?.index).toBe(0);
 expect(hitTarget([0,2.05,7.4],[0,0,-1])?.head).toBe(true);
 expect(hitTarget([0,4,7.4],[0,0,-1])).toBeUndefined();
 expect(hitTarget([0,1.6,-4],[0,0,1])).toBeUndefined();
 expect(hitTarget([2,1.6,7.4],[0,0,-1])).toBeUndefined();
});
