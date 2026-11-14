type Direction = [number, number, number];

// Tangent of the cone half-angle, in weapon order.
const HIP_SPREAD = [.016, .033, .019, .014, .017, .013, .026, 0] as const;
export const SHOTGUN_PATTERN = .035;

export function hipSpread(index:number, movement:number, sprint:boolean, crouched:boolean, bloom:number){
 const base=HIP_SPREAD[index]??0;
 return base*(1+.75*Math.min(1,movement)+(sprint?.65:0))*(crouched?.70:1)+base*bloom;
}

/** Sample a disk around the aim axis in camera space, then normalize the ray. */
export function spreadRay(yaw:number,pitch:number,cone:number,radiusSample:number,angleSample:number):Direction{
 const horizontal=Math.sin(yaw), forwardZ=-Math.cos(yaw);
 const cosine=Math.cos(pitch), sine=Math.sin(pitch);
 const radius=cone*Math.sqrt(radiusSample), angle=2*Math.PI*angleSample;
 const right=radius*Math.cos(angle), up=radius*Math.sin(angle);
 const x=horizontal*(cosine+up*sine)+Math.cos(yaw)*right;
 const y=-sine+up*cosine;
 const z=forwardZ*(cosine+up*sine)+horizontal*right;
 const length=Math.hypot(x,y,z);
 return [x/length,y/length,z/length];
}
