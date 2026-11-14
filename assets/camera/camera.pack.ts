import { definePack, definePackageId } from '@forgeax/engine/pack/source';
import { ok } from '@forgeax/engine/types';
import { FixedUpdate, Time, Update } from '@forgeax/engine/ecs';
import { quat } from '@forgeax/engine/math';
import type { Plugin } from '@forgeax/engine/plugin';
import { PROPAGATE_TRANSFORMS_SYSTEM, readPresentationWorldMatrix, Transform } from '@forgeax/engine/scene';
import type { Game3dPlayerService } from '../player/player.ts';
import { integratePointerLook, orbitPosition } from './third-person.ts';
import { resolveGameEntity } from '../shared/scene-refs.ts';

const CAMERA_DISTANCE = 0;
const CAMERA_TARGET_HEIGHT = 0.65;
const CAMERA_FOLLOW = 10;

/** Compare the values the f32 Transform columns would actually store. */
function sameCameraPose(
  current: { readonly pos: ArrayLike<number>; readonly quat: ArrayLike<number> },
  position: ArrayLike<number>,
  rotation: ArrayLike<number>,
): boolean {
  for (let index = 0; index < 3; index += 1)
    if (!Object.is(current.pos[index], Math.fround(position[index] as number))) return false;
  for (let index = 0; index < 4; index += 1)
    if (!Object.is(current.quat[index], Math.fround(rotation[index] as number)))
      return false;
  return true;
}

export const camera: Plugin = {
  name: 'game-3d/camera',
  inject: ['world', 'gameHost', 'game3dPlayer', 'gameScene'],
  apply(ctx) {
    const world = ctx.world;
    const host = ctx.gameHost;
    if (host === undefined) throw new Error('game-3d/camera requires the App-owned GameHost');
    const playerService = ctx.game3dPlayer as Game3dPlayerService | undefined;
    if (playerService === undefined)
      throw new Error('game-3d/camera requires the game-3d/player service');
    const player = playerService.entity;
    const camera = resolveGameEntity(world, ctx.gameScene, 'camera');
    ctx.effect(function* () {
      host.setPointerLockAllowed?.(true);
      yield () => host.setPointerLockAllowed?.(false);
      let lean=0;
      let eyeHeight = CAMERA_TARGET_HEIGHT;
      world
        .addSystem(Update, {
          name: 'game-3d-camera',
          after: [FixedUpdate, 'game-3d-player-input'],
          before: [PROPAGATE_TRANSFORMS_SYSTEM],
          queries: [],
          fn: () => {
            const input = playerService.readInput();
            const dt = world.getResource(Time).delta;
            const playerMatrix = readPresentationWorldMatrix(world, player);
            if (playerMatrix === undefined) throw new Error('game-3d/camera requires the player presentation pose');
            const rig = playerService.readRig();
            const look = integratePointerLook(rig.yaw, rig.pitch, input.lookX, input.lookY);
            const follow = 1 - Math.exp(-CAMERA_FOLLOW * dt);
            const crouched = world.hasResource('pulse-crouch') && world.getResource<boolean>('pulse-crouch');
            const sliding=world.hasResource('pulse-slide')?world.getResource<number>('pulse-slide'):0;
            eyeHeight += ((sliding ? .22 : crouched ? .32 : CAMERA_TARGET_HEIGHT) - eyeHeight) * (1 - Math.exp(-dt * 18));
            const desiredLean=world.hasResource('pulse-lean-target')?world.getResource<number>('pulse-lean-target'):0;
            lean+=(desiredLean-lean)*(1-Math.exp(-dt*14));
            if(Math.abs(lean-desiredLean)<.001)lean=desiredLean;
            world.insertResource('pulse-lean',lean);
            const rightX=Math.cos(look.yaw),rightZ=Math.sin(look.yaw);
            const focus = [(playerMatrix[12] ?? 0)+rightX*lean*.23, (playerMatrix[13] ?? 0)+eyeHeight-Math.abs(lean)*.04, (playerMatrix[14] ?? 0)+rightZ*lean*.23] as const;
            const position = focus;
            const target = [focus[0] + Math.sin(look.yaw) * Math.cos(look.pitch), focus[1] - Math.sin(look.pitch), focus[2] - Math.cos(look.yaw) * Math.cos(look.pitch)];
            const tilt=lean*.17;
            const rotation = quat.fromLookAt(quat.create(), position, target, [rightX*Math.sin(tilt), Math.cos(tilt), rightZ*Math.sin(tilt)]);
            const currentPose = world.get(camera, Transform);
            if (!currentPose.ok || !sameCameraPose(currentPose.value, position, rotation)) {
              world
                .set(camera, Transform, {
                  pos: position,
                  quat: [rotation[0] ?? 0, rotation[1] ?? 0, rotation[2] ?? 0, rotation[3] ?? 1],
                })
                .unwrap();
            }
            playerService.updateRig({
              yaw: look.yaw,
              pitch: look.pitch,
              focusX: focus[0],
              focusY: focus[1],
              focusZ: focus[2],
            });
          },
        })
        .unwrap();
      yield () => world.removeSystem(Update, 'game-3d-camera').unwrap();
    }, 'game-3d/camera');
  },
};


export default definePack({
  schemaVersion: '2.0.0', plugins: true,
  packageId: definePackageId('019fb7ce-3c00-7000-8000-000000000000'),
  build: () => ok({
    'plugin/camera': {
      kind: 'plugin',
      module: { specifier: './camera.pack.ts', export: 'camera' },
    },
  }),
});
