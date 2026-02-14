import * as THREE from 'three';

export interface ExtractedTriangles {
  positions: Float32Array;   // 9 floats per tri (3 verts x 3 xyz)
  centroids: Float32Array;   // 3 floats per tri
  normals: Float32Array;     // 3 floats per tri (face normal)
  colors: Float32Array;      // 3 floats per tri (from material.color)
  count: number;
}

const _v0 = new THREE.Vector3();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _edge1 = new THREE.Vector3();
const _edge2 = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _white = new THREE.Color(1, 1, 1);

export function extractTriangles(scene: THREE.Object3D): ExtractedTriangles {
  scene.updateMatrixWorld(true);

  // First pass: count total triangles
  let totalTris = 0;
  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const geo = mesh.geometry;
    if (!geo || !geo.attributes.position) return;
    const expanded = geo.index ? geo.toNonIndexed() : geo;
    totalTris += expanded.attributes.position.count / 3;
  });

  // Allocate
  const positions = new Float32Array(totalTris * 9);
  const centroids = new Float32Array(totalTris * 3);
  const normals = new Float32Array(totalTris * 3);
  const colors = new Float32Array(totalTris * 3);

  let triIdx = 0;

  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const geo = mesh.geometry;
    if (!geo || !geo.attributes.position) return;

    const expanded = geo.index ? geo.toNonIndexed() : geo;
    const posAttr = expanded.attributes.position;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const color = mat?.color ?? _white;

    const vertCount = posAttr.count;
    for (let v = 0; v < vertCount; v += 3) {
      // Read and transform vertices by mesh.matrixWorld
      _v0.fromBufferAttribute(posAttr, v).applyMatrix4(mesh.matrixWorld);
      _v1.fromBufferAttribute(posAttr, v + 1).applyMatrix4(mesh.matrixWorld);
      _v2.fromBufferAttribute(posAttr, v + 2).applyMatrix4(mesh.matrixWorld);

      const base = triIdx * 9;
      positions[base]     = _v0.x; positions[base + 1] = _v0.y; positions[base + 2] = _v0.z;
      positions[base + 3] = _v1.x; positions[base + 4] = _v1.y; positions[base + 5] = _v1.z;
      positions[base + 6] = _v2.x; positions[base + 7] = _v2.y; positions[base + 8] = _v2.z;

      // Centroid
      const cx = (_v0.x + _v1.x + _v2.x) / 3;
      const cy = (_v0.y + _v1.y + _v2.y) / 3;
      const cz = (_v0.z + _v1.z + _v2.z) / 3;
      const cBase = triIdx * 3;
      centroids[cBase] = cx; centroids[cBase + 1] = cy; centroids[cBase + 2] = cz;

      // Face normal
      _edge1.subVectors(_v1, _v0);
      _edge2.subVectors(_v2, _v0);
      _normal.crossVectors(_edge1, _edge2).normalize();
      normals[cBase] = _normal.x; normals[cBase + 1] = _normal.y; normals[cBase + 2] = _normal.z;

      // Color
      colors[cBase] = color.r; colors[cBase + 1] = color.g; colors[cBase + 2] = color.b;

      triIdx++;
    }
  });

  return { positions, centroids, normals, colors, count: triIdx };
}
