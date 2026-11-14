import { quat } from '@forgeax/engine/math';
import { definePack, definePackageId } from '@forgeax/engine/pack/source';
import {
  CharacterController,
  Collider,
  ColliderShapeValue,
  RigidBody,
  RigidBodyTypeValue,
} from '@forgeax/engine/physics';
import {
  ANTIALIAS_FXAA,
  Camera,
  DirectionalLight,
  MeshFilter,
  MeshRenderer,
  perspective,
  PointLight,
  SKYBOX_MODE_CUBEMAP,
  SkyboxBackground,
  Skylight,
  TONEMAP_ACES_FILMIC,
} from '@forgeax/engine/render';
import { ChildOf, Name, Transform } from '@forgeax/engine/scene';
import { Skin } from '@forgeax/engine/skinning';
import type { AssetGuid, SceneAsset, SceneEntity } from '@forgeax/engine/types';
import { ok } from '@forgeax/engine/types';
import { assetGuid, guidText, PACKAGE_IDS, SUN_OUTGOING_DIRECTION } from './shared/asset-refs.ts';
import { tacticalEntities } from './tactical/models.ts';
import { rangeEntities } from './range/training.ts';
import { WEAPON_NAMESPACE, weaponEntities } from './weapons/weapon-scene.ts';
import { PLAYER_RIG } from './player/player-rig.ts';

function meshEntity(
  key: string,
  name: string,
  mesh: AssetGuid,
  position: readonly [number, number, number],
  scale: readonly [number, number, number] = [1, 1, 1],
  rotation: readonly [number, number, number, number] = [0, 0, 0, 1],
  extra: Record<string, Record<string, unknown>> = {},
): readonly [string, SceneEntity] {
  return [key, {
    components: {
      Name: { value: name },
      Transform: { pos: position, scale, quat: rotation },
      MeshFilter: { assetHandle: guidText(mesh) },
      MeshRenderer: { materials: [] },
      ...extra,
    },
  }];
}

function namedTransform(
  key: string,
  name: string,
  position: readonly [number, number, number],
  parent: string,
): readonly [string, SceneEntity] {
  return [key, {
    components: {
      Name: { value: name },
      Transform: { pos: position },
      ChildOf: { parent },
    },
  }];
}

function keyed(key: string, entity: SceneEntity): readonly [string, SceneEntity] {
  return [key, entity];
}

function staticCuboid(halfExtents: readonly [number, number, number]) {
  return {
    RigidBody: { type: RigidBodyTypeValue.static },
    Collider: {
      shape: ColliderShapeValue.cuboid,
      halfExtents,
      friction: 0.86,
      restitution: 0,
    },
  };
}

function staticSphere(radius: number) {
  return {
    RigidBody: { type: RigidBodyTypeValue.static },
    Collider: {
      shape: ColliderShapeValue.sphere,
      radius,
      friction: 0.8,
      restitution: 0,
    },
  };
}

function showcaseScene(): SceneAsset {
  const playerPosition = [0, 0.95, 7.4] as const;
  const cameraPosition = [0, 3.35, 13.5] as const;
  const target = [0, 1.42, 7.4] as const;
  const cameraRotation = quat.fromLookAt(quat.create(), cameraPosition, target, [0, 1, 0]);
  const rampRotation = [Math.sin(-Math.PI / 24), 0, 0, Math.cos(-Math.PI / 24)] as const;
  return {
    kind: 'scene',
    skinGuids: [guidText(assetGuid(PACKAGE_IDS.character, 'rig/player-skin'))],
    entities: Object.fromEntries([
      meshEntity(
        'ground',
        'Ground',
        assetGuid(PACKAGE_IDS.geometry, 'mesh/ground'),
        [0, -0.2, -13],
        [1, 1, 1],
        [0, 0, 0, 1],
        staticCuboid([14, 0.2, 26]),
      ),
      ...weaponEntities(),
      ...rangeEntities(WEAPON_NAMESPACE),
      ...tacticalEntities(WEAPON_NAMESPACE),
      keyed('sun', {
        components: {
          Name: { value: 'Sun' },
          DirectionalLight: {
            direction: SUN_OUTGOING_DIRECTION,
            // Bare lights default off; this game explicitly requests sun shadows.
            castShadow: true,
            // Two bounded shadow cascades keep the range readable on laptop GPUs.
            mapSize: 1024,
            cascadeCount: 2,
            shadowDistance: 48,
            shadowAngularRadius: .012,
          },
        },
      }),
      keyed('point-light', {
        components: {
          Name: { value: 'Warm Point Light' },
          Transform: { pos: [0, 4.6, 0] },
          PointLight: { color: [1, 0.32, 0.08], intensity: 18, range: 12 },
        },
      }),
      keyed('cyan-range-fill', {components: {
        Transform: {pos: [-3,2.7,5]},
        PointLight: {color: [.055,.58,1], intensity: 27, range: 13},
      }}),
      keyed('skylight', {
        components: {
          Name: { value: 'Skylight' },
          Skylight: {
            equirect: guidText(assetGuid(PACKAGE_IDS.environment, 'environment/daylight')),
            color: [1, 1, 1],
            intensity: .92,
          },
        },
      }),
      keyed('sky-background', {
        components: {
          Name: { value: 'Sky Background' },
          SkyboxBackground: {
            equirect: guidText(assetGuid(PACKAGE_IDS.environment, 'environment/daylight')),
            mode: SKYBOX_MODE_CUBEMAP,
          },
        },
      }),
      keyed('camera', {
        components: {
          Name: { value: 'Main Camera' },
          Transform: {
            pos: cameraPosition,
            quat: [
              cameraRotation[0] ?? 0,
              cameraRotation[1] ?? 0,
              cameraRotation[2] ?? 0,
              cameraRotation[3] ?? 1,
            ],
          },
          Camera: {
            ...perspective({ fov: Math.PI / 2.6, aspect: 16 / 9 }),
            // Explicit presentation style; generic Camera defaults remain neutral.
            tonemap: TONEMAP_ACES_FILMIC,
            antialias: ANTIALIAS_FXAA,
            exposure: 1.02,
            clearColor: [0.08, 0.12, 0.2, 1],
          },
        },
      }),
      keyed('player', {
        components: {
          Name: { value: 'Player' },
          Transform: { pos: playerPosition },
          RigidBody: { type: RigidBodyTypeValue.kinematic },
          Collider: {
            shape: ColliderShapeValue.capsule,
            radius: 0.38,
            halfHeight: 0.55,
            friction: 0.7,
            restitution: 0,
          },
          CharacterController: {
            offset: 0.03,
            maxSlopeClimbDeg: 48,
            minSlopeSlideDeg: 55,
            autoStepMaxHeight: 0.32,
            autoStepMinWidth: 0.15,
            snapToGroundDist: 0.24,
          },
        },
      }),
      keyed('player-body', {components: {
        Name: {value: 'Player Body'}, Transform: {pos:[0,0,0]},
        ChildOf: {parent: 'player'},
        Skin: {skeleton: guidText(assetGuid(PACKAGE_IDS.character, 'rig/player-skeleton')), joints: []},
      }}),
      ...PLAYER_RIG.map((joint, index) =>
        namedTransform(
          `player/joint/${joint.name}`,
          joint.name,
          joint.local,
          joint.parent < 0 ? 'player' : `player/joint/${PLAYER_RIG.at(joint.parent)?.name ?? 'root'}`,
        ),
      ),
    ]),
  };
}

export default definePack({
  schemaVersion: '2.0.0',
  packageId: definePackageId('019fb7ce-3400-7000-8000-000000000000'),
  name: 'Game 3D / Scene',
  parameters: [
    {
      name: 'sunColor',
      type: 'vec3',
      default: [1,.69,.44],
      apply: {
        asset: 'scene/showcase',
        path: ['entities', 'sun', 'components', 'DirectionalLight', 'color'],
      },
    },
    {
      name: 'sunIntensity',
      type: 'f32',
      default: 1.45,
      minimum: 0,
      maximum: 10,
      apply: {
        asset: 'scene/showcase',
        path: ['entities', 'sun', 'components', 'DirectionalLight', 'intensity'],
      },
    },
  ],
  sceneComponents: [
    Camera,
    CharacterController,
    ChildOf,
    Collider,
    DirectionalLight,
    MeshFilter,
    MeshRenderer,
    Name,
    PointLight,
    RigidBody,
    Skin,
    SkyboxBackground,
    Skylight,
    Transform,
  ],
  build: () => ok({ 'scene/showcase': showcaseScene() }),
});
