// An attack helicopter for the film: a narrow armoured fuselage with a stepped two-seat canopy, two engines, a
// four-blade main rotor and a tail rotor, stub wings with rocket pods and missiles, a chin gun that turns to its
// target, navigation lights and a searchlight. Nose along +z. About 3.4 units long (a wanzer stands 1.4).
//   const h = buildHeli({ paint }); scene.add(h.group); h.pose(t, { pitch, roll, aim: Vector3 | null, spot, muzzle })
import * as THREE from '../../engine/lib/three.module.min.js';
import { TOON } from '../../engine/world3d.js?v=16';

const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: TOON, ...o });
const PAINT = { olive: ['#3a4826', '#4e602e', '#2a3420', '#d8b44a'], navy: ['#2a384a', '#3c4e66', '#1c2632', '#e0c040'], arctic: ['#6e767e', '#929aa0', '#4e545c', '#d84030'] };

export function buildHeli(opt = {}) {
  const P = PAINT[opt.paint] || PAINT.olive;
  const M = {
    body: toon(P[0]), light: toon(P[1]), dark: toon(P[2]), trim: toon(P[3]), metal: toon('#3a3c40'), black: toon('#101012'),
    glass: toon('#1c2c38', { emissive: '#0a1a24' }), glassHi: new THREE.MeshBasicMaterial({ color: '#5a7a90' }),
    red: new THREE.MeshBasicMaterial({ color: '#ff3020' }), green: new THREE.MeshBasicMaterial({ color: '#30ff60' }), white: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    lamp: new THREE.MeshBasicMaterial({ color: '#fff4d0' }), heat: new THREE.MeshBasicMaterial({ color: '#ff8a40' }),
    disc: new THREE.MeshBasicMaterial({ color: '#1a1c1e', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
  };
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const add = (p, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = m.receiveShadow = true; p.add(m); return m; };
  const box = (p, w, h, d, mat, x, y, z, rx, ry, rz) => add(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz);
  // a block tapering from (w0, h0) at z0 to (w1, h1) at z1, its centre line rising by dy
  const taper = (p, w0, h0, w1, h1, z0, z1, mat, y = 0, dy = 0) => {
    const g = new THREE.BoxGeometry(1, 1, 1), a = g.attributes.position;
    for (let i = 0; i < a.count; i++) { const front = a.getZ(i) > 0; a.setXYZ(i, a.getX(i) * (front ? w1 : w0), a.getY(i) * (front ? h1 : h0) + (front ? dy : 0), front ? z1 : z0); }
    g.computeVertexNormals(); return add(p, g, mat, 0, y, 0);
  };
  const cyl = (p, r, len, mat, x, y, z, axis = 'z', n = 12, r2 = r) => add(p, new THREE.CylinderGeometry(r2, r, len, n), mat, x, y, z, axis === 'z' ? Math.PI / 2 : 0, 0, axis === 'x' ? Math.PI / 2 : 0);

  // ---- the fuselage: nose, cockpit, the middle, the tail boom
  taper(body, 0.3, 0.3, 0.16, 0.16, 1.15, 1.62, M.body, 0.02, -0.04); // nose
  taper(body, 0.42, 0.5, 0.3, 0.3, 0.35, 1.15, M.body, 0.08, -0.06); // cockpit section
  taper(body, 0.46, 0.62, 0.42, 0.5, -0.55, 0.35, M.body, 0.12, -0.04); // the middle
  taper(body, 0.16, 0.18, 0.36, 0.42, -2.1, -0.55, M.body, 0.22, -0.06); // tail boom
  box(body, 0.44, 0.04, 1.6, M.dark, 0, -0.17, 0.1); // a dark belly
  for (const z of [-0.2, 0.3, 0.8]) box(body, 0.47, 0.012, 0.012, M.dark, 0, 0.14, z); // panel lines
  // the stepped canopy: gunner in front, pilot behind and higher
  taper(body, 0.3, 0.2, 0.22, 0.12, 0.85, 1.18, M.glass, 0.35, -0.06);
  taper(body, 0.34, 0.26, 0.3, 0.2, 0.42, 0.85, M.glass, 0.44, -0.08);
  for (const z of [0.85, 0.6]) box(body, 0.36, 0.03, 0.03, M.dark, 0, 0.46 - (z - 0.42) * 0.12, z);
  box(body, 0.012, 0.012, 0.3, M.glassHi, 0.12, 0.53, 0.6); box(body, 0.012, 0.012, 0.25, M.glassHi, 0.1, 0.42, 1.0);
  // engines either side of the rotor mast: intakes in front, hot exhausts behind
  for (const s of [-1, 1]) {
    cyl(body, 0.1, 0.62, M.light, s * 0.27, 0.42, -0.05, 'z', 14);
    cyl(body, 0.085, 0.02, M.black, s * 0.27, 0.42, 0.27, 'z', 14);
    cyl(body, 0.07, 0.12, M.metal, s * 0.3, 0.44, -0.4, 'z', 12, 0.08); cyl(body, 0.05, 0.02, M.heat, s * 0.3, 0.44, -0.46, 'z', 10);
    box(body, 0.05, 0.12, 0.4, M.body, s * 0.17, 0.36, -0.05);
  }
  // ---- the main rotor: mast, hub, four blades, and a faint disc when it spins
  cyl(body, 0.04, 0.22, M.metal, 0, 0.66, 0.05, 'y', 10); cyl(body, 0.09, 0.06, M.metal, 0, 0.78, 0.05, 'y', 10);
  const rotor = new THREE.Group(); rotor.position.set(0, 0.82, 0.05); body.add(rotor);
  for (let k = 0; k < 4; k++) { const b = box(rotor, 1.55, 0.014, 0.1, M.black, 0.8, 0, 0); const arm = new THREE.Group(); arm.rotation.y = (k * Math.PI) / 2; arm.add(b); rotor.add(arm); box(arm, 0.08, 0.016, 0.1, M.trim, 1.52, 0.001, 0); }
  const disc = add(rotor, new THREE.CircleGeometry(1.6, 40), M.disc, 0, 0.01, 0, -Math.PI / 2); disc.castShadow = false;
  // ---- the tail: a swept fin, a stabiliser, the tail rotor
  const fin = new THREE.Group(); fin.position.set(0, 0.35, -1.95); body.add(fin);
  box(fin, 0.05, 0.6, 0.28, M.body, 0, 0.18, -0.05, -0.35); box(fin, 0.052, 0.12, 0.2, M.trim, 0, 0.44, -0.16, -0.35);
  box(body, 0.7, 0.03, 0.18, M.body, 0, 0.26, -1.7);
  const tail = new THREE.Group(); tail.position.set(-0.07, 0.5, -2.03); body.add(tail);
  for (let k = 0; k < 4; k++) { const b = new THREE.Group(); b.rotation.x = (k * Math.PI) / 2; tail.add(b); box(b, 0.01, 0.34, 0.05, M.black, 0, 0.17, 0); }
  cyl(tail, 0.03, 0.05, M.metal, 0, 0, 0, 'x', 8);
  // ---- stub wings with a rocket pod and two missiles each side
  const pods = {};
  for (const s of [-1, 1]) {
    box(body, 0.62, 0.035, 0.26, M.body, s * 0.5, 0.12, 0.0, 0, 0, s * -0.06);
    const pod = new THREE.Group(); pod.position.set(s * 0.52, 0.0, 0.05); body.add(pod);
    box(pod, 0.04, 0.1, 0.12, M.dark, 0, 0.07, 0);
    cyl(pod, 0.085, 0.42, M.light, 0, -0.04, 0, 'z', 14); cyl(pod, 0.088, 0.04, M.trim, 0, -0.04, 0.12, 'z', 14);
    for (let k = 0; k < 7; k++) { const a = (k / 6) * Math.PI * 2, rr = k === 6 ? 0 : 0.05; cyl(pod, 0.016, 0.02, M.black, Math.cos(a) * rr, -0.04 + Math.sin(a) * rr, 0.212, 'z', 8); }
    const p = new THREE.Object3D(); p.position.set(0, -0.04, 0.24); pod.add(p); pods[s < 0 ? 'podL' : 'podR'] = p;
    for (const y of [-0.04, 0.06]) { const m = cyl(body, 0.03, 0.42, M.light, s * 0.78, y - 0.02, 0.06, 'z', 10); void m; add(body, new THREE.ConeGeometry(0.03, 0.08, 10), M.dark, s * 0.78, y - 0.02, 0.31, Math.PI / 2); }
    box(body, 0.03, 0.03, 0.03, s < 0 ? M.red : M.green, s * 0.82, 0.12, 0.0); // navigation lights
  }
  // ---- the chin turret: a ball under the nose and a long gun
  const turret = new THREE.Group(); turret.position.set(0, -0.16, 1.28); body.add(turret);
  add(turret, new THREE.SphereGeometry(0.08, 14, 10), M.metal, 0, 0, 0);
  const gunPitch = new THREE.Group(); turret.add(gunPitch);
  cyl(gunPitch, 0.024, 0.48, M.black, 0, -0.02, 0.26, 'z', 8); cyl(gunPitch, 0.036, 0.1, M.metal, 0, -0.02, 0.06, 'z', 10); cyl(gunPitch, 0.03, 0.05, M.metal, 0, -0.02, 0.48, 'z', 8);
  const gunTip = new THREE.Object3D(); gunTip.position.set(0, -0.02, 0.53); gunPitch.add(gunTip);
  // the undercarriage and a white strobe on the fin
  for (const s of [-1, 1]) { box(body, 0.03, 0.18, 0.03, M.metal, s * 0.22, -0.24, 0.45); cyl(body, 0.05, 0.04, M.black, s * 0.22, -0.33, 0.45, 'x', 12); }
  box(body, 0.03, 0.12, 0.03, M.metal, 0, -0.02, -1.9); cyl(body, 0.03, 0.03, M.black, 0, -0.08, -1.9, 'x', 10);
  const strobe = box(fin, 0.03, 0.03, 0.03, M.white, 0, 0.5, -0.24);
  // the searchlight under the nose, and its beam through the smoke
  const lampG = new THREE.Group(); lampG.position.set(0.1, -0.16, 1.05); body.add(lampG);
  cyl(lampG, 0.05, 0.05, M.metal, 0, 0, 0, 'z', 12); add(lampG, new THREE.CircleGeometry(0.04, 12), M.lamp, 0, 0, 0.026);
  const spot = new THREE.SpotLight('#fff0d8', 0, 30, 0.32, 0.55, 1.2); spot.position.set(0, 0, 0.03); lampG.add(spot); const spotTarget = new THREE.Object3D(); spotTarget.position.set(0, 0, 4); lampG.add(spotTarget); spot.target = spotTarget;
  const beamMat = new THREE.MeshBasicMaterial({ color: '#fff0d0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 1.6, 6, 20, 1, true), beamMat); beam.rotation.x = Math.PI / 2; beam.position.z = 3.05; lampG.add(beam);

  const points = { body: body, gun: gunTip, podL: pods.podL, podR: pods.podR, spot: lampG, chest: body };
  const tmp = new THREE.Vector3();
  return {
    group: root, body, points, spot,
    pose(t, o = {}) {
      body.rotation.set(o.pitch || 0, 0, o.roll || 0);
      rotor.rotation.y = t * 27; tail.rotation.x = t * 58;
      disc.material.opacity = 0.16;
      strobe.visible = Math.floor(t * 1.3) % 2 === 0 && (t * 1.3) % 1 < 0.12;
      // the gun and the searchlight turn to what the pilot is looking at
      if (o.aim) {
        body.updateWorldMatrix(true, false);
        tmp.copy(o.aim); turret.parent.worldToLocal(tmp); tmp.sub(turret.position);
        turret.rotation.y = Math.atan2(tmp.x, tmp.z); gunPitch.rotation.x = Math.max(-0.2, Math.min(1.2, Math.atan2(-tmp.y, Math.hypot(tmp.x, tmp.z))));
        lampG.lookAt(o.light || o.aim);
      }
      spot.intensity = 40 * (o.spot || 0); beamMat.opacity = 0.07 * (o.spot || 0);
    },
  };
}
