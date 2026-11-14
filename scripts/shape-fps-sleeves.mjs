import {mat4, vec3} from '@forgeax/engine/math';

// Fit rigid cuboids to the original arm rig with a plain color.
export function shapeSleeves(gltf, binary, append) {
  const meshNode = gltf.nodes.find(node => node.name === 'FPArms' && node.skin !== undefined);
  const skin = gltf.skins[meshNode.skin];
  function accessor(index, width) {
    const a = gltf.accessors[index], view = gltf.bufferViews[a.bufferView];
    const bytes = {5121: 1, 5123: 2, 5126: 4}[a.componentType];
    if (!bytes) throw new Error('Unsupported sleeve accessor');
    const offset = i => (view.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * (view.byteStride ?? width * bytes);
    const read = (i, k) => {
      const at = offset(i) + k * bytes;
      return bytes === 4 ? binary.readFloatLE(at) : bytes === 2 ? binary.readUInt16LE(at) : binary.readUInt8(at);
    };
    return {a, offset, read};
  }
  const bind = accessor(skin.inverseBindMatrices, 16);
  const names = skin.joints.map(node => gltf.nodes[node].name);
  const mesh = gltf.meshes[meshNode.mesh];
  for (const primitive of mesh.primitives) {
    const parts = new Map();
    const positions = accessor(primitive.attributes.POSITION, 3);
    const joints = accessor(primitive.attributes.JOINTS_0, 4);
    const weights = accessor(primitive.attributes.WEIGHTS_0, 4);
    const material = gltf.materials[primitive.material];
    gltf.materials[primitive.material] = {
      name: material.name,
      pbrMetallicRoughness: {
        baseColorFactor: [.62, .40, .25, 1],
        metallicFactor: 0,
        roughnessFactor: 1,
      },
    };
    for (let i = 0; i < positions.a.count; i++) {
      let lane = 0;
      for (let k = 1; k < 4; k++) if (weights.read(i, k) > weights.read(i, lane)) lane = k;
      const name = names[joints.read(i, lane)];
      const side = /[_.]([LR])(?:[._]|$)/.exec(name)?.[1];
      if (!side) continue;
      if (!/Forearm|Twist/.test(name)) continue;
      const joint = names.indexOf('Forearm_' + side);
      if (joint < 0) continue;
      if (!parts.has(joint)) {
        const inverse = Float32Array.from({length:16}, (_, k) => bind.read(joint,k));
        parts.set(joint, {inverse, forward: mat4.invert(mat4.create(),inverse), samples: []});
      }
      const part = parts.get(joint);
      const point = [0,1,2].map(k => positions.read(i,k));
      const local = mat4.transformPoint(vec3.create(),part.inverse,point);
      part.samples.push(local);
    }
    const pos=[], normals=[], tex=[], bones=[], skinWeights=[], indices=[];
    for (const [joint,{forward,samples}] of parts) {
      if (samples.length < 20) continue;
      // Keep the fitted silhouette in forearm bind space, but drive the
      // whole Minecraft-style block from its wrist grip during animation.
      const wrist = names.indexOf('Hand_' + names[joint].at(-1));
      if (wrist < 0) throw new Error('Missing first-person wrist bone');
      const bounds = [0,1,2].map(k => {
        const values = samples.map(s => s[k]).sort((a,b) => a-b);
        return [values[Math.floor(values.length*.04)],values[Math.floor(values.length*.96)]];
      });
      // One continuous bar per arm. Extend the camera-side end under the frame
      // and let the far end form the fist without a separate wrist piece.
      const length = bounds[1][1] - bounds[1][0];
      bounds[1][0] -= length * 1.05;
      bounds[1][1] += length * .24;
      const center = bounds.map(([lo,hi]) => (lo+hi)/2);
      const half = bounds.map(([lo,hi]) => (hi-lo)/2);
      half[0] = half[2] = (half[0]+half[2])*.44;
      for (let axis=0;axis<3;axis++) for (const sign of [-1,1]) {
        const u=(axis+1)%3, v=(axis+2)%3;
        const normal = vec3.create(forward[axis*4],forward[axis*4+1],forward[axis*4+2]);
        vec3.normalize(normal,normal);
        const start=pos.length/3;
        for (const [s,t] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
          const corner=[...center];
          corner[axis]+=half[axis]*sign; corner[u]+=half[u]*s; corner[v]+=half[v]*t;
          pos.push(...mat4.transformPoint(vec3.create(),forward,corner));
          normals.push(normal[0]*sign,normal[1]*sign,normal[2]*sign);
          tex.push((s+1)/2,(t+1)/2);
          bones.push(wrist,0,0,0); skinWeights.push(1,0,0,0);
        }
        indices.push(...(sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]).map(i=>start+i));
      }
    }
    if (!indices.length) throw new Error('No block arms produced');
    function add(values,type,width,integer=false) {
      const buffer=Buffer.from((integer?Uint16Array.from(values):Float32Array.from(values)).buffer);
      const bufferView=gltf.bufferViews.length;
      gltf.bufferViews.push({buffer:0,byteOffset:append(buffer),byteLength:buffer.length});
      const index=gltf.accessors.length;
      gltf.accessors.push({bufferView,componentType:integer?5123:5126,count:values.length/width,type});
      return index;
    }
    const position=add(pos,'VEC3',3), coords=add(tex,'VEC2',2);
    const axes=[0,1,2].map(k=>pos.filter((_,i)=>i%3===k));
    gltf.accessors[position].min=axes.map(a=>Math.min(...a));
    gltf.accessors[position].max=axes.map(a=>Math.max(...a));
    primitive.attributes={POSITION:position,NORMAL:add(normals,'VEC3',3),TEXCOORD_0:coords,TEXCOORD_1:coords,JOINTS_0:add(bones,'VEC4',4,true),WEIGHTS_0:add(skinWeights,'VEC4',4)};
    primitive.indices=add(indices,'SCALAR',1,true);
    delete primitive.targets;
  }
  delete mesh.weights;
  if (mesh.extras) delete mesh.extras.targetNames;
}
