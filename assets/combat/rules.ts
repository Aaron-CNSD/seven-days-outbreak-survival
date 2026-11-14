export type Target = {x:number;y:number;z:number;radius:number};
export function raySphere(origin: readonly number[], direction: readonly number[], t:Target): number | undefined {
  const ox=origin[0]!-t.x, oy=origin[1]!-t.y, oz=origin[2]!-t.z;
  const b=ox*direction[0]!+oy*direction[1]!+oz*direction[2]!;
  const c=ox*ox+oy*oy+oz*oz-t.radius*t.radius, d=b*b-c;
  if(d<0) return; const near=-b-Math.sqrt(d), far=-b+Math.sqrt(d);
  return near>=0?near:far>=0?far:undefined;
}
export function waveCount(wave:number) { return 2+wave; }
