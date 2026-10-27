// Set dressing a story can place: set.props = [{ type, at: [x, z], ... }, ...]
//   barrier   a line of concrete jersey barriers from `at` to `to`, with a `gap` = [z0, z1] left open
//   gate      a striped boom gate across the gap, `len` long, raised by `open` (0..1)
//   booth     a guard booth with a lit window
//   flood     a floodlight tower aimed at `aim` = [x, y, z]: a real light, a glowing lamp, a beam through the haze
//   flag      a pole and a cloth that waves; `col` = [field, stripe]
//   sandbags  a curved wall of sandbags, `n` long
//   wire      coils of barbed wire from `at` to `to`
//   tank      a burnt-out tank, `ry` turned
// Each returns an object with update(t, sky) for what moves or lights up.
import * as THREE from '../engine/lib/three.module.min.js';
import { TOON } from '../engine/world3d.js?v=16';

const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: TOON, ...o });
const M = {
  conc: toon('#7a7468'), concD: toon('#5a554c'), stripeR: toon('#a83020'), stripeW: toon('#d8d4c8'), steel: toon('#3a3c40'), dark: toon('#1a1a1c'),
  sand: toon('#8a7a52'), sandD: toon('#6a5c3c'), olive: toon('#3c4628'), burnt: toon('#221e1c'), rust: toon('#4a3020'),
  glass: new THREE.MeshBasicMaterial({ color: '#ffd890' }), lamp: new THREE.MeshBasicMaterial({ color: '#fff6e0' }),
};
function mesh(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
const box = (p, w, h, d, mat, x, y, z, rx, ry, rz) => mesh(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz);
const cyl = (p, r, h, mat, x, y, z, n = 8, rx = 0, rz = 0) => mesh(p, new THREE.CylinderGeometry(r, r, h, n), mat, x, y, z, rx, 0, rz);

// a jersey barrier: wide at the foot, narrow on top
function jersey() {
  const g = new THREE.BufferGeometry(), s = [[-0.3, 0], [-0.3, 0.08], [-0.12, 0.2], [-0.07, 0.42], [0.07, 0.42], [0.12, 0.2], [0.3, 0.08], [0.3, 0]];
  return new THREE.ExtrudeGeometry(new THREE.Shape(s.map(([x, y]) => new THREE.Vector2(x, y))), { depth: 0.9, bevelEnabled: false });
}
const BUILD = {
  barrier(scene, o) {
    const G = new THREE.Group(); scene.add(G); const geo = jersey();
    const [x0, z0] = o.at, [x1, z1] = o.to, n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.95);
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k;
      if (o.gap && z > o.gap[0] && z < o.gap[1]) continue;
      const ang = Math.atan2(x1 - x0, z1 - z0), m = mesh(G, geo, i % 3 ? M.conc : M.concD, x - Math.sin(ang) * 0.45, 0, z - Math.cos(ang) * 0.45, 0, ang, 0);
      if (i % 2 === 0) box(G, 0.62, 0.05, 0.3, M.stripeR, x, 0.12, z, 0, ang, 0); void m;
    }
    return {};
  },
  gate(scene, o) {
    const G = new THREE.Group(); G.position.set(o.at[0], 0, o.at[1]); scene.add(G);
    box(G, 0.22, 0.6, 0.22, M.steel, 0, 0.3, 0); box(G, 0.26, 0.12, 0.26, M.stripeR, 0, 0.55, 0);
    const arm = new THREE.Group(); arm.position.set(0, 0.5, 0); G.add(arm);
    for (let k = 0; k < 8; k++) box(arm, 0.06, 0.06, (o.len || 3) / 8, k % 2 ? M.stripeR : M.stripeW, 0, 0, (k + 0.5) * (o.len || 3) / 8);
    arm.rotation.x = -(o.open || 0) * 1.3;
    return {};
  },
  booth(scene, o) {
    const G = new THREE.Group(); G.position.set(o.at[0], 0, o.at[1]); G.rotation.y = o.ry || 0; scene.add(G);
    box(G, 0.9, 0.9, 0.9, M.olive, 0, 0.45, 0); box(G, 1.05, 0.06, 1.05, M.dark, 0, 0.93, 0);
    box(G, 0.6, 0.28, 0.02, M.glass, 0, 0.6, 0.46); box(G, 0.02, 0.28, 0.5, M.glass, 0.46, 0.6, 0);
    return {};
  },
  flood(scene, o) {
    const G = new THREE.Group(); G.position.set(o.at[0], 0, o.at[1]); scene.add(G);
    const h = o.h || 4;
    for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) cyl(G, 0.02, h, M.steel, x * (1 - 0.4), h / 2, z * (1 - 0.4), 5);
    for (let k = 1; k < 6; k++) box(G, 0.3, 0.02, 0.02, M.steel, 0, (k * h) / 6, 0, 0, k * 0.8, 0);
    box(G, 0.6, 0.06, 0.4, M.steel, 0, h, 0);
    const head = new THREE.Group(); head.position.set(0, h + 0.15, 0); G.add(head);
    for (const x of [-0.16, 0.16]) { box(head, 0.26, 0.2, 0.12, M.dark, x, 0, 0); mesh(head, new THREE.CircleGeometry(0.09, 16), M.lamp, x, 0, 0.061, 0, 0, 0, false); }
    const aim = new THREE.Vector3(...(o.aim || [o.at[0] - 4, 0, o.at[1]]));
    head.lookAt(aim);
    const light = new THREE.SpotLight('#fff4dc', 0, 40, 0.42, 0.45, 1.4); light.position.copy(head.getWorldPosition(new THREE.Vector3())); light.target.position.copy(aim); scene.add(light); scene.add(light.target);
    const beamM = new THREE.MeshBasicMaterial({ color: '#fff4dc', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const len = head.getWorldPosition(new THREE.Vector3()).distanceTo(aim) * 1.1;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, len * 0.42, len, 20, 1, true), beamM); beam.rotation.x = Math.PI / 2; beam.position.z = len / 2; head.add(beam);
    return { update(t, sky) { const on = (o.on ?? 1) * Math.min(1, sky.windows / 1.2) * (1 + 0.03 * Math.sin(t * 31)); light.intensity = 60 * on; beamM.opacity = 0.05 * on; } };
  },
  flag(scene, o) {
    const G = new THREE.Group(); G.position.set(o.at[0], 0, o.at[1]); scene.add(G);
    cyl(G, 0.025, 3.2, M.steel, 0, 1.6, 0, 6); cyl(G, 0.04, 0.04, M.lamp, 0, 3.22, 0, 6);
    const geo = new THREE.PlaneGeometry(1.1, 0.66, 12, 4), base = geo.attributes.position.array.slice();
    const c = document.createElement('canvas'); c.width = 64; c.height = 40; const g = c.getContext('2d');
    g.fillStyle = o.col?.[0] || '#2a4a8a'; g.fillRect(0, 0, 64, 40); g.fillStyle = o.col?.[1] || '#e8e4d8'; g.fillRect(0, 16, 64, 8); g.fillRect(8, 0, 8, 40);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const cloth = mesh(G, geo, toon('#ffffff', { map: tex, side: THREE.DoubleSide }), 0.56, 2.8, 0, 0, o.ry || 0, 0);
    return { update(t) { const a = geo.attributes.position; for (let i = 0; i < a.count; i++) { const x = base[i * 3] + 0.55; a.setZ(i, Math.sin(x * 5 - t * 6 + (o.ph || 0)) * 0.07 * x + Math.sin(x * 9 - t * 9) * 0.02 * x); } a.needsUpdate = true; geo.computeVertexNormals(); } };
  },
  sandbags(scene, o) {
    const G = new THREE.Group(); G.position.set(o.at[0], 0, o.at[1]); G.rotation.y = o.ry || 0; scene.add(G);
    const geo = new THREE.CapsuleGeometry(0.07, 0.18, 3, 8);
    for (let r = 0; r < 3; r++) for (let k = 0; k < (o.n || 8); k++) { const a = ((k + (r % 2) * 0.5) / (o.n || 8) - 0.5) * 1.4; const m = mesh(G, geo, (k + r) % 3 ? M.sand : M.sandD, Math.sin(a) * 1.4, 0.07 + r * 0.13, Math.cos(a) * 1.4 - 1.4, 0, a + Math.PI / 2, Math.PI / 2); m.scale.set(1, 1, 1.4); }
    return {};
  },
  wire(scene, o) {
    const G = new THREE.Group(); scene.add(G); const [x0, z0] = o.at, [x1, z1] = o.to, n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.22);
    const geo = new THREE.TorusGeometry(0.14, 0.006, 4, 14);
    for (let i = 0; i < n; i++) { const k = i / n; mesh(G, geo, M.steel, x0 + (x1 - x0) * k, 0.14, z0 + (z1 - z0) * k, 0, Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2 + (i % 2) * 0.3, 0); }
    return {};
  },
  tank(scene, o) {
    const G = new THREE.Group(); G.position.set(o.at[0], 0, o.at[1]); G.rotation.y = o.ry || 0; scene.add(G);
    box(G, 0.9, 0.3, 1.6, M.burnt, 0, 0.3, 0); for (const s of [-1, 1]) { box(G, 0.22, 0.26, 1.7, M.dark, s * 0.52, 0.18, 0); for (let k = -3; k <= 3; k++) cyl(G, 0.09, 0.24, M.rust, s * 0.52, 0.13, k * 0.22, 8, 0, Math.PI / 2); }
    const tur = new THREE.Group(); tur.position.set(0, 0.5, -0.1); tur.rotation.y = o.turret || 0.6; G.add(tur);
    box(tur, 0.62, 0.22, 0.7, M.burnt, 0, 0, 0); cyl(tur, 0.04, 1.2, M.dark, 0, 0.02, 0.85, 8, Math.PI / 2 - 0.12);
    return {};
  },
};
export function buildProps(scene, list = []) { return list.map((o) => BUILD[o.type]?.(scene, o) || {}); }
