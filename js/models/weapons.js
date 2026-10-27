// Detailed weapons, made for the film, that replace the engine's simple ones in the wanzers' hands:
//   mg (a machine gun), rod (a shock rod), blade (a combat sword), launcher (a shoulder missile pod),
//   and the missiles and rockets that fly. Each builder returns { group, points: { name: Object3D }, update(t, k) }.
// Orientation follows the engine's hands (engine/mech3d.js): guns point down the hand's -y (along the forearm),
// melee weapons out along the hand's +z; the launcher faces +z on the shoulder.
import * as THREE from '../../engine/lib/three.module.min.js';
import { TOON } from '../../engine/world3d.js?v=16';

const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: TOON, ...o });
const glow = (color) => new THREE.MeshBasicMaterial({ color });
export const MAT = {
  gun: toon('#2a2c30'), gunD: toon('#16171a'), steel: toon('#6a6e76'), steelL: toon('#9aa0a8'), black: toon('#0c0c0e'),
  brass: toon('#b08a3a'), olive: toon('#4a5a2c'), oliveD: toon('#34401e'), red: toon('#8a2a20'), white: toon('#c8c8c0'), warn: toon('#c89a2a'),
  lens: glow('#ff3020'), coil: glow('#6ad8ff'), edge: glow('#ff6a30'), dark: toon('#202024'),
};
function part(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const box = (p, w, h, d, mat, x, y, z, rx, ry, rz) => part(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz);
const cylY = (p, r, len, mat, x, y, z, n = 12, r2 = r) => part(p, new THREE.CylinderGeometry(r2, r, len, n), mat, x, y, z);
const cylZ = (p, r, len, mat, x, y, z, n = 12, r2 = r) => part(p, new THREE.CylinderGeometry(r2, r, len, n), mat, x, y, z, Math.PI / 2);
const cylX = (p, r, len, mat, x, y, z, n = 12) => part(p, new THREE.CylinderGeometry(r, r, len, n), mat, x, y, z, 0, 0, Math.PI / 2);
const point = (p, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };

// ---------------------------------------------------------------- the machine gun
export function mg() {
  const g = new THREE.Group(), M = MAT;
  // the pistol grip in the fist, a trigger guard
  box(g, 0.05, 0.08, 0.09, M.gunD, 0, -0.02, -0.03, -0.35); box(g, 0.012, 0.05, 0.05, M.gun, 0, -0.07, -0.07);
  // the receiver: a long box with side plates, an ejection port, rivets
  box(g, 0.1, 0.26, 0.12, M.gun, 0, -0.14, 0.02);
  for (const s of [-1, 1]) { box(g, 0.012, 0.2, 0.09, M.gunD, s * 0.056, -0.15, 0.02); for (const y of [-0.07, -0.23]) cylX(g, 0.008, 0.014, M.steel, s * 0.063, y, 0.05, 6); }
  box(g, 0.012, 0.07, 0.04, M.black, 0.057, -0.12, 0.045); // the ejection port
  box(g, 0.104, 0.03, 0.124, M.olive, 0, -0.03, 0.02); box(g, 0.104, 0.02, 0.124, M.olive, 0, -0.27, 0.02); // painted bands
  // a rail along the top with ridges, a carrying handle, a red-dot sight
  box(g, 0.04, 0.24, 0.012, M.steel, 0, -0.14, 0.086);
  for (let k = 0; k < 9; k++) box(g, 0.046, 0.008, 0.01, M.gunD, 0, -0.04 - k * 0.025, 0.094);
  box(g, 0.02, 0.012, 0.05, M.gun, 0, -0.06, 0.115); box(g, 0.02, 0.012, 0.05, M.gun, 0, -0.2, 0.115); box(g, 0.02, 0.15, 0.012, M.gun, 0, -0.13, 0.14);
  box(g, 0.05, 0.05, 0.05, M.gunD, 0, -0.1, 0.12); cylY(g, 0.02, 0.012, M.lens, 0, -0.127, 0.12, 10);
  // the drum magazine underneath
  cylX(g, 0.075, 0.07, M.gunD, 0, -0.16, -0.08, 16); cylX(g, 0.055, 0.074, M.oliveD, 0, -0.16, -0.08, 16); cylX(g, 0.02, 0.078, M.steel, 0, -0.16, -0.08, 8);
  // a barrel shroud full of cooling holes, the barrel, a muzzle brake with slots
  cylY(g, 0.034, 0.22, M.gun, 0, -0.38, 0.02, 14);
  for (let k = 0; k < 6; k++) for (let j = 0; j < 4; j++) { const a = (j / 4) * Math.PI * 2 + 0.4; box(g, 0.012, 0.022, 0.012, M.black, Math.sin(a) * 0.034, -0.3 - k * 0.032, 0.02 + Math.cos(a) * 0.034, 0, a, 0); }
  cylY(g, 0.016, 0.16, M.steel, 0, -0.55, 0.02, 10);
  cylY(g, 0.026, 0.06, M.gunD, 0, -0.64, 0.02, 10);
  for (const s of [-1, 1]) box(g, 0.01, 0.016, 0.03, M.black, s * 0.024, -0.645, 0.02);
  // a cable from the gun into the forearm
  part(g, new THREE.TorusGeometry(0.05, 0.008, 6, 12, Math.PI), M.black, -0.05, -0.05, 0.0, 0, Math.PI / 2, 0);
  const points = { muzzle: point(g, 0, -0.68, 0.02), eject: point(g, 0.07, -0.12, 0.045) };
  return { group: g, points, update() {} };
}

// ---------------------------------------------------------------- the shock rod: a grip, a guard, a shaft ringed with glowing coils, a fork
export function rod() {
  const g = new THREE.Group(), M = MAT, coil = M.coil.clone(), coils = [];
  cylZ(g, 0.026, 0.16, M.gunD, 0, 0, 0.06, 10);
  for (let k = 0; k < 4; k++) cylZ(g, 0.03, 0.012, M.steel, 0, 0, 0.0 + k * 0.04, 10);
  cylZ(g, 0.05, 0.018, M.steel, 0, 0, 0.15, 12); box(g, 0.11, 0.022, 0.02, M.gun, 0, 0, 0.155);
  cylZ(g, 0.018, 0.46, M.gun, 0, 0, 0.39, 10);
  for (let k = 0; k < 7; k++) { coils.push(part(g, new THREE.TorusGeometry(0.024, 0.007, 6, 14), coil, 0, 0, 0.2 + k * 0.055)); }
  for (const s of [-1, 1]) { box(g, 0.012, 0.012, 0.1, M.steelL, s * 0.022, 0, 0.66, 0, s * 0.18, 0); box(g, 0.016, 0.016, 0.016, coil, s * 0.032, 0, 0.71); }
  const tipBall = part(g, new THREE.SphereGeometry(0.018, 10, 8), coil, 0, 0, 0.66);
  const points = { tip: point(g, 0, 0, 0.7) };
  return {
    group: g, points,
    update(t, k = 0) { // the coils run brighter as the charge comes up, flickering
      const f = 0.25 + 0.75 * k * (0.75 + 0.25 * Math.sin(t * 47) * Math.sin(t * 13));
      coil.color.setRGB(0.25 + 0.2 * f, 0.5 + 0.35 * f, 0.6 + 0.4 * f);
      tipBall.scale.setScalar(0.6 + 0.8 * k);
    },
  };
}

// a sword blade: a flat diamond section tapering to a point (length along +z)
function bladeGeo(len, w, th) {
  const v = [], idx = [], N = 6;
  for (let i = 0; i <= N; i++) {
    const z = (i / N) * len, k = i === N ? 0 : 1 - Math.pow(i / N, 3) * 0.55, ww = w * k, tt = th * k;
    v.push(0, ww / 2, z, tt / 2, 0, z, 0, -ww / 2 * (i === N ? 0 : 1), z, -tt / 2, 0, z); // edge, side, back, side
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j, b = i * 4 + ((j + 1) % 4), c = a + 4, d = b + 4; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// ---------------------------------------------------------------- the Black Hound's blade: a long single-edged sword, the edge glowing hot
export function blade() {
  const g = new THREE.Group(), M = MAT, edge = M.edge.clone();
  cylZ(g, 0.024, 0.15, M.black, 0, 0, 0.05, 10);
  for (let k = 0; k < 5; k++) cylZ(g, 0.027, 0.01, M.red, 0, 0, -0.01 + k * 0.03, 10);
  cylZ(g, 0.032, 0.03, M.steel, 0, 0, -0.04, 10);
  box(g, 0.05, 0.2, 0.035, M.gunD, 0, 0, 0.14); for (const s of [-1, 1]) box(g, 0.03, 0.05, 0.05, M.red, 0, s * 0.1, 0.15, 0.4 * s);
  const bm = M.steelL.clone(); bm.side = THREE.DoubleSide; const b = part(g, bladeGeo(0.78, 0.095, 0.022), bm, 0, 0, 0.16);
  part(g, new THREE.BoxGeometry(0.004, 0.012, 0.6), M.black, 0.009, -0.012, 0.42); part(g, new THREE.BoxGeometry(0.004, 0.012, 0.6), M.black, -0.009, -0.012, 0.42); // the fuller
  const e = part(g, new THREE.BoxGeometry(0.006, 0.006, 0.66), edge, 0, 0.046, 0.48); e.castShadow = false; // the hot edge
  void b;
  const points = { tip: point(g, 0, 0, 0.94) };
  return { group: g, points, update(t, k = 1) { const f = 0.7 + 0.3 * Math.sin(t * 9); edge.color.setRGB(1 * f * k + 0.2, 0.42 * f * k, 0.15 * f * k); } };
}

// ---------------------------------------------------------------- the shoulder launcher: an armoured box of six tubes, missiles waiting in them
export function launcher() {
  const g = new THREE.Group(), M = MAT, tubes = [];
  box(g, 0.28, 0.21, 0.3, M.gunD, 0, 0.1, 0);
  for (const s of [-1, 1]) { box(g, 0.02, 0.23, 0.32, M.dark, s * 0.15, 0.1, 0); for (const [y, z] of [[0.03, -0.1], [0.17, -0.1], [0.03, 0.1], [0.17, 0.1]]) cylX(g, 0.009, 0.012, M.steel, s * 0.162, y, z, 6); }
  box(g, 0.3, 0.02, 0.33, M.red, 0, 0.215, 0); box(g, 0.18, 0.02, 0.06, M.warn, 0, 0.228, -0.1);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const x = -0.085 + i * 0.085, y = 0.05 + j * 0.1;
    cylZ(g, 0.036, 0.02, M.steel, x, y, 0.15, 12); cylZ(g, 0.03, 0.022, M.black, x, y, 0.152, 12);
    part(g, new THREE.ConeGeometry(0.022, 0.05, 10), M.red, x, y, 0.13, Math.PI / 2); // the nose in the tube
    tubes.push(point(g, x, y, 0.18));
  }
  box(g, 0.08, 0.1, 0.12, M.steel, 0.06, -0.04, -0.04); // the mount
  return { group: g, points: { launch: tubes[0], tubes }, update() {} };
}

// ---------------------------------------------------------------- what flies: a guided missile and an unguided rocket (along +z)
export function missileModel(kind = 'missile') {
  const g = new THREE.Group(), M = MAT;
  const r = kind === 'micro' ? 0.016 : kind === 'rocket' ? 0.024 : 0.042, L = kind === 'micro' ? 0.18 : kind === 'rocket' ? 0.3 : 0.46, body = kind === 'rocket' ? M.olive : M.white;
  cylZ(g, r, L, body, 0, 0, 0, 12);
  cylZ(g, r * 1.02, L * 0.06, kind === 'rocket' ? M.warn : M.red, 0, 0, L * 0.18, 12);
  if (kind !== 'rocket') cylZ(g, r * 1.02, L * 0.04, M.black, 0, 0, -L * 0.1, 12);
  part(g, new THREE.ConeGeometry(r, L * 0.32, 12), kind === 'rocket' ? M.dark : M.gun, 0, 0, L / 2 + L * 0.16, Math.PI / 2);
  cylZ(g, r * 0.8, L * 0.07, M.black, 0, 0, -L / 2 - L * 0.02, 10, r * 0.6); // the nozzle
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4, f = new THREE.Group(); f.rotation.z = a; g.add(f);
    box(f, 0.006, r * 2.6, L * 0.2, M.gun, 0, r * 1.4, -L * 0.38);
    if (kind !== 'rocket') box(f, 0.005, r * 1.5, L * 0.1, M.gun, 0, r * 1.1, L * 0.2);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(r * 0.9, L * 0.7, 10), new THREE.MeshBasicMaterial({ color: '#ffc070', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  flame.rotation.x = -Math.PI / 2; flame.position.z = -L / 2 - L * 0.4; g.add(flame);
  return { group: g, tail: -L / 2 - 0.02, update(t) { flame.scale.set(1, 0.8 + 0.4 * Math.abs(Math.sin(t * 61)), 1); } };
}

// ---------------------------------------------------------------- Karl's pump shotgun: a short thick barrel, a magazine tube under it, a pump grip
export function shotgun() {
  const g = new THREE.Group(), M = MAT;
  box(g, 0.05, 0.08, 0.09, M.gunD, 0, -0.02, -0.03, -0.35);
  box(g, 0.1, 0.22, 0.11, M.gun, 0, -0.12, 0.02); box(g, 0.104, 0.04, 0.114, M.oliveD, 0, -0.05, 0.02);
  cylY(g, 0.034, 0.34, M.gunD, 0, -0.4, 0.04, 12); cylY(g, 0.024, 0.3, M.steel, 0, -0.4, -0.02, 10); // barrel, magazine tube
  box(g, 0.08, 0.1, 0.1, M.dark, 0, -0.36, 0.0); for (let k = 0; k < 4; k++) box(g, 0.084, 0.008, 0.104, M.black, 0, -0.32 - k * 0.025, 0);
  cylY(g, 0.042, 0.04, M.gun, 0, -0.58, 0.04, 12); cylY(g, 0.028, 0.042, M.black, 0, -0.585, 0.04, 12);
  for (let k = 0; k < 4; k++) cylX(g, 0.012, 0.03, M.red, 0.058, -0.06 - k * 0.035, -0.02, 8); // shells on the side
  box(g, 0.02, 0.05, 0.02, M.lens, 0, -0.08, 0.085);
  return { group: g, points: { muzzle: point(g, 0, -0.62, 0.04), eject: point(g, 0.06, -0.12, 0.04) }, update() {} };
}
// ---------------------------------------------------------------- an Alliance rifle: long, with a scope and a box magazine
export function rifle() {
  const g = new THREE.Group(), M = MAT;
  box(g, 0.05, 0.08, 0.09, M.gunD, 0, -0.02, -0.03, -0.35);
  box(g, 0.08, 0.3, 0.1, M.gun, 0, -0.15, 0.02); box(g, 0.05, 0.1, 0.08, M.gunD, 0, -0.14, -0.07);
  cylY(g, 0.016, 0.4, M.steel, 0, -0.5, 0.02, 10); cylY(g, 0.028, 0.18, M.gun, 0, -0.38, 0.02, 10); cylY(g, 0.022, 0.05, M.gunD, 0, -0.72, 0.02, 10);
  cylY(g, 0.022, 0.16, M.black, 0, -0.14, 0.1, 10); cylY(g, 0.024, 0.01, M.lens, 0, -0.225, 0.1, 10);
  box(g, 0.085, 0.03, 0.105, M.white, 0, -0.27, 0.02);
  return { group: g, points: { muzzle: point(g, 0, -0.76, 0.02), eject: point(g, 0.05, -0.14, 0.04) }, update() {} };
}
// ---------------------------------------------------------------- a tower shield on the forearm: armour plate, a vision slit, rivets, a stencilled stripe
export function shield(side = -1) {
  const g = new THREE.Group(), M = MAT, x = side * 0.13;
  box(g, 0.05, 0.78, 0.44, M.gunD, x, 0.02, 0.1); box(g, 0.054, 0.74, 0.4, M.olive, x + side * 0.004, 0.02, 0.1);
  box(g, 0.058, 0.08, 0.4, M.warn, x + side * 0.006, 0.28, 0.1); box(g, 0.06, 0.03, 0.16, M.black, x + side * 0.008, 0.16, 0.1);
  for (const y of [-0.32, 0.36]) for (const z of [-0.08, 0.1, 0.28]) cylX(g, 0.012, 0.064, M.steel, x, y, z, 6);
  box(g, 0.06, 0.8, 0.03, M.steel, x, 0.02, 0.33); box(g, 0.06, 0.8, 0.03, M.steel, x, 0.02, -0.13);
  return { group: g, points: { front: point(g, x + side * 0.05, 0.02, 0.1) }, update() {} };
}
// ---------------------------------------------------------------- the prototype's greatsword: broad, with a spine and a red-hot edge
export function greatblade() {
  const b = blade(); b.group.scale.set(1.35, 1.5, 1.25);
  b.group.traverse((o) => { if (o.isMesh && o.material === MAT.red) o.material = MAT.white; });
  return b;
}
// ---------------------------------------------------------------- a micro-missile pod: sixteen small tubes
export function swarm() {
  const g = new THREE.Group(), M = MAT, tubes = [];
  box(g, 0.34, 0.26, 0.3, M.white, 0, 0.12, 0); box(g, 0.36, 0.03, 0.32, M.red, 0, 0.26, 0);
  for (const s of [-1, 1]) box(g, 0.02, 0.28, 0.32, M.gunD, s * 0.18, 0.12, 0);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = -0.12 + i * 0.08, y = 0.03 + j * 0.065; cylZ(g, 0.022, 0.02, M.black, x, y, 0.152, 8); tubes.push(point(g, x, y, 0.17)); }
  return { group: g, points: { launch: tubes[5], tubes }, update() {} };
}
