import { definePack } from '@forgeax/engine/pack/source';
import type { EquirectAsset } from '@forgeax/engine/types';
import { ok } from '@forgeax/engine/types';
import { PACKAGE_IDS, SUN_OUTGOING_DIRECTION } from './shared/asset-refs.ts';

const WIDTH = 512;
const HEIGHT = 256;

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function cloudNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const u = smoothstep(0, 1, x - ix), v = smoothstep(0, 1, y - iy);
  const hash = (a: number, b: number) => {
    const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  const a = hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u;
  const b = hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u;
  return a * (1 - v) + b * v;
}

function analyticDaylight(): EquirectAsset {
  const pixels = new Float32Array(WIDTH * HEIGHT * 4);
  const outgoingLength = Math.hypot(...SUN_OUTGOING_DIRECTION);
  const sun = SUN_OUTGOING_DIRECTION.map((value) => -value / outgoingLength) as [
    number,
    number,
    number,
  ];
  for (let y = 0; y < HEIGHT; y += 1) {
    const latitude = Math.PI * (0.5 - (y + 0.5) / HEIGHT);
    const cosLatitude = Math.cos(latitude);
    for (let x = 0; x < WIDTH; x += 1) {
      const longitude = Math.PI * (2 * ((x + 0.5) / WIDTH) - 1);
      const direction = [
        cosLatitude * Math.sin(longitude),
        Math.sin(latitude),
        cosLatitude * Math.cos(longitude),
      ] as const;
      const up = clamp(direction[1], 0, 1);
      const horizon = Math.exp(-Math.max(direction[1], 0) * 5.5);
      const belowHorizon = smoothstep(-0.12, 0.02, direction[1]);
      const sunAlignment = clamp(
        direction[0] * sun[0] + direction[1] * sun[1] + direction[2] * sun[2],
        0,
        1,
      );
      // The broad circumsolar term keeps the sky natural without baking a
      // second hard Sun into the IBL. DirectionalLight remains the direct-Sun owner.
      const circumsolar = sunAlignment ** 64 * .28 + sunAlignment ** 8 * .04;
      const zenith = [0.16, 0.24, 0.32] as const;
      const horizonColor = [0.52, 0.57, 0.59] as const;
      const groundBounce = [0.035, 0.045, 0.04] as const;
      // Layered cloud density with perspective compression toward the horizon.
      const plane = .18 + up;
      const cx = 8 + direction[0] * 3.5 / plane;
      const cz = 5 + direction[2] * 3.5 / plane;
      const density = cloudNoise(cx, cz) * .63 +
        cloudNoise(cx * 2.1, cz * 2.1) * .25 + cloudNoise(cx * 5, cz * 5) * .12;
      const cloud = smoothstep(.48, .7, density) * smoothstep(.025, .17, up) * (1 - smoothstep(.78, .98, up));
      const cloudLight = .39 + smoothstep(.49, .76, density) * .18;
      const sky = zenith.map((channel,index) =>
        (channel * (.45 + .9 * up) + horizonColor[index]! * horizon * .75 +
          circumsolar * [1,.82,.66][index]!) * (1 - cloud) +
        cloud * cloudLight * [1.03,1,.94][index]!);
      const rgb = sky.map(
        (channel, index) =>
          (groundBounce[index] ?? 0) * (1 - belowHorizon) + channel * belowHorizon,
      );
      const offset = (y * WIDTH + x) * 4;
      pixels.set([rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, 1], offset);
    }
  }
  return {
    kind: 'equirect',
    width: WIDTH,
    height: HEIGHT,
    format: 'rgba32float',
    data: new Uint8Array(pixels.buffer),
    colorSpace: 'linear',
  };
}

export default definePack({
  schemaVersion: '2.0.0',
  packageId: PACKAGE_IDS.environment,
  name: 'Game 3D / Environment',
  build: () => ok({ 'environment/daylight': analyticDaylight() }),
});
