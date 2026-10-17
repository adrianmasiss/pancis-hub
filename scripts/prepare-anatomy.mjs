/** node scripts/prepare-anatomy.mjs /path/to/muscle_body.glb
 * Preserves source sculpt normals and the face; bakes short-range ambient
 * occlusion into vertex colors. No texture downloads or runtime baking.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as T from "three";
import { MeshoptSimplifier } from "meshoptimizer";
if (!process.argv[2]) throw new Error("Pass the original muscle_body.glb path");
await MeshoptSimplifier.ready;
const source = readFileSync(process.argv[2]);
const root = (
  await new GLTFLoader().parseAsync(
    source.buffer.slice(
      source.byteOffset,
      source.byteOffset + source.byteLength,
    ),
    "",
  )
).scene;
root.updateMatrixWorld(true);
const parts = [];
root.traverse((o) => {
  if (o.isMesh) {
    let g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    for (const key of Object.keys(g.attributes))
      if (!["position", "normal"].includes(key)) g.deleteAttribute(key);
    parts.push(g);
  }
});
const g = mergeVertices(mergeGeometries(parts), 0.0001);
g.computeBoundingBox();
const box = g.boundingBox,
  size = box.getSize(new T.Vector3()),
  center = box.getCenter(new T.Vector3());
g.translate(-center.x, -box.min.y, -center.z);
g.scale(1 / size.y, 1 / size.y, 1 / size.y);
const lock = new Uint8Array(g.attributes.position.count);
for (let i = 0; i < lock.length; i++)
  if (g.attributes.position.getY(i) > 0.86) lock[i] = 1;
const [indices] = MeshoptSimplifier.simplifyWithAttributes(
  new Uint32Array(g.index.array),
  g.attributes.position.array,
  3,
  g.attributes.normal.array,
  3,
  [0.25, 0.25, 0.25],
  lock,
  210000 * 3,
  0.001,
  ["LockBorder"],
);
const [remap, count] = MeshoptSimplifier.compactMesh(indices);
const positions = new Float32Array(count * 3),
  normals = new Float32Array(count * 3);
for (let i = 0; i < remap.length; i++)
  if (remap[i] !== 0xffffffff) {
    positions.set(
      g.attributes.position.array.subarray(i * 3, i * 3 + 3),
      remap[i] * 3,
    );
    normals.set(
      g.attributes.normal.array.subarray(i * 3, i * 3 + 3),
      remap[i] * 3,
    );
  }
// A small offline BVH keeps occlusion baking independent of runtime libraries.
const triangles = Array.from({ length: indices.length / 3 }, (_, i) => i);
const bounds = new Float32Array(triangles.length * 6),
  centroids = new Float32Array(triangles.length * 3);
for (const t of triangles)
  for (let a = 0; a < 3; a++) {
    const v = [0, 1, 2].map((k) => positions[indices[t * 3 + k] * 3 + a]);
    bounds[t * 6 + a] = Math.min(...v);
    bounds[t * 6 + a + 3] = Math.max(...v);
    centroids[t * 3 + a] = (v[0] + v[1] + v[2]) / 3;
  }
function build(start, end) {
  const lo = [Infinity, Infinity, Infinity],
    hi = [-Infinity, -Infinity, -Infinity];
  for (let i = start; i < end; i++)
    for (let a = 0; a < 3; a++) {
      lo[a] = Math.min(lo[a], bounds[triangles[i] * 6 + a]);
      hi[a] = Math.max(hi[a], bounds[triangles[i] * 6 + a + 3]);
    }
  const node = { lo, hi, start, end };
  if (end - start > 12) {
    const extent = hi.map((v, a) => v - lo[a]),
      axis = extent.indexOf(Math.max(...extent));
    const sorted = triangles
      .slice(start, end)
      .sort((a, b) => centroids[a * 3 + axis] - centroids[b * 3 + axis]);
    for (let i = 0; i < sorted.length; i++) triangles[start + i] = sorted[i];
    const mid = (start + end) >> 1;
    node.left = build(start, mid);
    node.right = build(mid, end);
  }
  return node;
}
const tree = build(0, triangles.length);
function occluded(node, o, d, inv) {
  let near = 0,
    far = 0.025;
  for (let a = 0; a < 3; a++) {
    const t1 = (node.lo[a] - o[a]) * inv[a],
      t2 = (node.hi[a] - o[a]) * inv[a];
    near = Math.max(near, Math.min(t1, t2));
    far = Math.min(far, Math.max(t1, t2));
    if (far < near) return false;
  }
  if (node.left)
    return occluded(node.left, o, d, inv) || occluded(node.right, o, d, inv);
  for (let q = node.start; q < node.end; q++) {
    const t = triangles[q],
      a = indices[t * 3] * 3,
      b = indices[t * 3 + 1] * 3,
      c = indices[t * 3 + 2] * 3;
    const e1x = positions[b] - positions[a],
      e1y = positions[b + 1] - positions[a + 1],
      e1z = positions[b + 2] - positions[a + 2],
      e2x = positions[c] - positions[a],
      e2y = positions[c + 1] - positions[a + 1],
      e2z = positions[c + 2] - positions[a + 2];
    const px = d[1] * e2z - d[2] * e2y,
      py = d[2] * e2x - d[0] * e2z,
      pz = d[0] * e2y - d[1] * e2x,
      det = e1x * px + e1y * py + e1z * pz;
    if (Math.abs(det) < 1e-12) continue;
    const invDet = 1 / det,
      tx = o[0] - positions[a],
      ty = o[1] - positions[a + 1],
      tz = o[2] - positions[a + 2],
      u = (tx * px + ty * py + tz * pz) * invDet;
    if (u < 0 || u > 1) continue;
    const qx = ty * e1z - tz * e1y,
      qy = tz * e1x - tx * e1z,
      qz = tx * e1y - ty * e1x,
      v = (d[0] * qx + d[1] * qy + d[2] * qz) * invDet;
    if (v < 0 || u + v > 1) continue;
    const distance = (e2x * qx + e2y * qy + e2z * qz) * invDet;
    if (distance > 0.0001 && distance < 0.025) return true;
  }
  return false;
}
const colors = new Uint8Array(count * 4),
  n = new T.Vector3(),
  tangent = new T.Vector3(),
  bitangent = new T.Vector3();
for (let i = 0; i < count; i++) {
  n.fromArray(normals, i * 3).normalize();
  tangent
    .set(Math.abs(n.y) < 0.9 ? 0 : 1, Math.abs(n.y) < 0.9 ? 1 : 0, 0)
    .cross(n)
    .normalize();
  bitangent.crossVectors(n, tangent);
  const o = [
    positions[i * 3] + n.x * 0.00035,
    positions[i * 3 + 1] + n.y * 0.00035,
    positions[i * 3 + 2] + n.z * 0.00035,
  ];
  let hits = 0;
  for (let s = 0; s < 24; s++) {
    const r = Math.sqrt((s + 0.5) / 24),
      phi = s * 2.399963229728653,
      z = Math.sqrt(1 - r * r),
      x = r * Math.cos(phi),
      y = r * Math.sin(phi);
    const d = [
      tangent.x * x + bitangent.x * y + n.x * z,
      tangent.y * x + bitangent.y * y + n.y * z,
      tangent.z * x + bitangent.z * y + n.z * z,
    ];
    if (
      occluded(
        tree,
        o,
        d,
        d.map((v) => 1 / v),
      )
    )
      hits++;
  }
  const shade = Math.round(255 * (1 - (0.5 * hits) / 24));
  colors.set([shade, shade, shade, 255], i * 4);
  if (i % 20000 === 0) console.log("Baked vertices", i, "/", count);
}
const data = [
  Buffer.from(positions.buffer),
  Buffer.from(normals.buffer),
  Buffer.from(colors.buffer),
  Buffer.from(indices.buffer),
];
let offset = 0;
const bufferViews = data.map((b) => {
  const v = { buffer: 0, byteOffset: offset, byteLength: b.length };
  offset += b.length;
  return v;
});
const bin = Buffer.concat(data);
const json = {
  asset: {
    version: "2.0",
    generator: "Pancis anatomy preparation",
    extras: { source: "DB3D2534 / Muscle body", license: "CC BY 4.0" },
  },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [
    {
      primitives: [
        { attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3 },
      ],
    },
  ],
  buffers: [{ byteLength: bin.length }],
  bufferViews,
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count,
      type: "VEC3",
      min: [-0.22, 0, -0.2],
      max: [0.22, 1, 0.2],
    },
    { bufferView: 1, componentType: 5126, count, type: "VEC3" },
    {
      bufferView: 2,
      componentType: 5121,
      normalized: true,
      count,
      type: "VEC4",
    },
    {
      bufferView: 3,
      componentType: 5125,
      count: indices.length,
      type: "SCALAR",
    },
  ],
};
// Exact bounds rather than approximations in the exported accessor.
for (let a = 0; a < 3; a++) {
  let lo = Infinity,
    hi = -Infinity;
  for (let i = a; i < positions.length; i += 3) {
    lo = Math.min(lo, positions[i]);
    hi = Math.max(hi, positions[i]);
  }
  json.accessors[0].min[a] = lo;
  json.accessors[0].max[a] = hi;
}
let j = Buffer.from(JSON.stringify(json));
j = Buffer.concat([j, Buffer.alloc((4 - (j.length % 4)) % 4, 32)]);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + j.length + bin.length, 8);
header.writeUInt32LE(j.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const bh = Buffer.alloc(8);
bh.writeUInt32LE(bin.length);
bh.writeUInt32LE(0x004e4942, 4);
writeFileSync(
  "public/anatomy/muscle-body.glb",
  Buffer.concat([header, j, bh, bin]),
);
console.log({
  triangles: indices.length / 3,
  vertices: count,
  bytes: 28 + j.length + bin.length,
});
