// 鋼魂戰線：鐵鴉之夜 / Iron Front: Night of the Ravens — a 30-second fight, filmed with the Iron Front engine.
// The machines are Iron Front's own 3D wanzers (engine/mech3d.js), posed frame by frame from cast.js; this file
// builds the stage, cuts between thirteen camera shots, draws the effects and runs the player.
import * as THREE from '../engine/lib/three.module.min.js';
import { buildMech, poseMech } from '../engine/mech3d.js?v=16';
import { buildSet, SUN_DIR, FOG, FIRE_AT } from './set.js?v=1';
import { FX, H } from './fx.js?v=1';
import { LEN, T, SHOTS, RON, HOUND, ronPos, houndPos, ronPose, houndPose, LINES, TITLE, END, S, seg, ss, imp } from './cast.js?v=1';
import * as score from './score.js?v=1';

const $ = (id) => document.getElementById(id);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const params = new URLSearchParams(location.search);
let lang = params.get('lang') === 'en' ? 'en' : (() => { try { return localStorage.getItem('ironfilm.lang') || 'zh'; } catch (e) { return 'zh'; } })();

// ---------------------------------------------------------------- the stage
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const FOG_NEAR = 22, FOG_FAR = 120;
scene.fog = new THREE.Fog(FOG, FOG_NEAR, FOG_FAR);
const camera = new THREE.PerspectiveCamera(40, 2.35, 0.1, 400);
scene.add(new THREE.HemisphereLight('#8a78a8', '#3a2824', 1.7));
const sun = new THREE.DirectionalLight('#ffb27a', 3.1); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 60 }); sun.shadow.camera.updateProjectionMatrix();
scene.add(sun); scene.add(sun.target);
const rim = new THREE.DirectionalLight('#6a8ad8', 0.7); rim.position.set(-10, 6, -8); scene.add(rim); // cold light from the dark end of the street
const fireLight = new THREE.PointLight('#ff7a30', 6, 0, 2); fireLight.position.copy(FIRE_AT).add(V(0, 0.8, 0)); scene.add(fireLight);
const fxLights = [0, 1].map(() => { const l = new THREE.PointLight('#ffb060', 0, 0, 2); scene.add(l); return l; });
buildSet(scene);
const fx = new FX(scene);

// the two machines
function cast(k) {
  const u = { ...k, hp: { body: 100, armL: 100, armR: 100, legs: 100 } };
  const m = buildMech(u), holder = new THREE.Group();
  holder.add(m.group); m.holder = holder; m.u = u; m.bar.visible = m.star.visible = m.mark.visible = false;
  scene.add(holder); return m;
}
const ron = cast(RON), hound = cast(HOUND);
// the Hound's sword arm, once it is cut off: a copy that tumbles away down the street
const loose = hound.armR.sh.clone(true); loose.visible = false; scene.add(loose);
loose.traverse((o) => { if (o.isMesh) o.castShadow = true; });
// two missiles
const missiles = [0, 1].map(() => {
  const g = new THREE.Group(), body = new THREE.MeshToonMaterial({ color: '#8a8a84' }), dark = new THREE.MeshToonMaterial({ color: '#2a2a2a' });
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 8), body); c.rotation.x = Math.PI / 2; g.add(c);
  const n = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 8), dark); n.rotation.x = Math.PI / 2; n.position.z = 0.27; g.add(n);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.1, 0.1), dark); f.position.z = -0.17; f.rotation.z = (i * Math.PI) / 2; f.position.x = Math.cos((i * Math.PI) / 2) * 0.05; f.position.y = Math.sin((i * Math.PI) / 2) * 0.05; g.add(f); }
  g.visible = false; scene.add(g); return g;
});

// ---------------------------------------------------------------- where things are
const wp = (obj, x = 0, y = 0, z = 0) => { obj.updateWorldMatrix(true, false); return V(x, y, z).applyMatrix4(obj.matrixWorld); };
const wdir = (obj, x, y, z) => { obj.updateWorldMatrix(true, false); return V(x, y, z).transformDirection(obj.matrixWorld); };
const ry = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);

// the missiles' flights: from the Hound's shoulder, up and over, down either side of Ron
const flights = [
  { t0: T.missile1, t1: T.boom1, to: () => { const r = ronPos(11.95); return V(r.x + 0.45, 0.15, r.z + 0.35); }, side: 1.6 },
  { t0: T.missile2, t1: T.boom2, to: () => { const r = ronPos(11.95); return V(r.x - 0.35, 0.15, r.z - 0.6); }, side: -1.2 },
].map((f) => { const h = houndPos(f.t0), a = V(h.x - 0.1, 1.5, h.z - 0.25), b = f.to(), c = a.clone().lerp(b, 0.5).add(V(0, 3.4, f.side)); return { ...f, a, b, c }; });
const bez = (f, k) => { const u = 1 - k; return V(u * u * f.a.x + 2 * u * k * f.c.x + k * k * f.b.x, u * u * f.a.y + 2 * u * k * f.c.y + k * k * f.b.y, u * u * f.a.z + 2 * u * k * f.c.z + k * k * f.b.z); };

// the arm's tumble: up and away, a bounce, then still
const ARM0 = (() => { const h = houndPos(T.armOff), r = ronPos(T.armOff), a = ry(h, r); return V(h.x + Math.cos(a) * 0.4, 1.0, h.z - Math.sin(a) * 0.4); })();
function armAt(t) {
  const dt = t - T.armOff, g = 9.8, vy = 3.4, vx = 1.3, vz = 1.5, t1 = (vy + Math.sqrt(vy * vy + 2 * g * (ARM0.y - 0.15))) / g;
  if (dt < t1) return { p: V(ARM0.x + vx * dt, ARM0.y + vy * dt - g * dt * dt / 2, ARM0.z + vz * dt), r: dt * 9 };
  const d2 = dt - t1, v2 = 1.6, t2 = (2 * v2) / g;
  if (d2 < t2) return { p: V(ARM0.x + vx * t1 + vx * 0.3 * d2, 0.15 + v2 * d2 - g * d2 * d2 / 2, ARM0.z + vz * t1 + vz * 0.3 * d2), r: t1 * 9 + d2 * 3 };
  return { p: V(ARM0.x + vx * (t1 + 0.3 * t2), 0.15, ARM0.z + vz * (t1 + 0.3 * t2)), r: t1 * 9 + t2 * 3 };
}

// ---------------------------------------------------------------- the camera: thirteen shots
// each gives a camera place, a point to look at, a lens; cuts are hard, between shots
const SHOTLIST = [
  [0, 3.5, (t, C, k) => ({ pos: lerpV(V(-26, 5.5, 2.8), V(-21, 2.4, 1.6), ss(k)), look: lerpV(V(-8, 1.6, 0), V(-11, 1.0, 0), k), fov: 40 })], // over the street
  [3.5, 6.0, (t, C, k) => ({ pos: V(C.r.x - 1.1 + 0.3 * k, 0.3, 2.3), look: V(C.r.x + 0.4, 0.22 + 0.9 * S(t, 5.0, 6.0), 0), fov: 42 })], // the feet
  [6.0, 8.0, (t, C) => ({ pos: V(-0.6, 0.5, -2.2), look: V(C.h.x, C.h.y + 0.8, C.h.z), fov: 24 + 18 * S(t, 6.3, 6.9) - 6 * S(t, 7.1, 8.0) })], // the drop
  [8.0, 9.2, (t, C, k) => ({ pos: V(C.r.x + 2.5 - 0.35 * k, 0.55, C.r.z - 0.7), look: V(C.r.x, 1.15, C.r.z), fov: 30 })], // Ron, from the front
  [9.2, 10.5, (t, C, k) => ({ pos: V(C.r.x - 1.6 - 0.3 * k, 1.45, C.r.z - 0.95), look: V(C.h.x, 0.9, C.h.z), fov: 30 })], // over Ron's shoulder: the guns
  [10.5, 12.0, (t, C, k) => ({ pos: V(C.h.x + 1.9 + 0.3 * k, 1.15, C.h.z + 1.3), look: V(C.r.x, 0.9, C.r.z), fov: 38 })], // behind the Hound: the missiles go
  [12.0, 13.4, (t, C) => { const r = ronPos(12.0); return { pos: V(r.x - 3.4, 1.4, r.z - 1.7), look: V(r.x + 1.5, 0.9, r.z + 0.2), fov: 50 }; }], // behind Ron, the missiles
  [13.4, 15.4, (t, C) => ({ pos: V(C.r.x - 0.7, 0.45, C.r.z - 1.5), look: V(C.h.x, 0.8, C.h.z), fov: 40 })], // the charge, coming at us
  [15.4, 17.0, (t, C, k) => ({ pos: V(C.mid.x + 0.2, 1.05, C.mid.z - 2.9 + 0.5 * k), look: V(C.mid.x, 1.0, C.mid.z), fov: 34 })], // the clash
  [17.0, 20.0, (t, C, k) => { const a = -1.9 + 0.9 * k; return { pos: V(C.mid.x + Math.cos(a) * 4.3, 1.35, C.mid.z + Math.sin(a) * 4.3), look: V(C.mid.x, 0.95, C.mid.z), fov: 36 }; }], // round them
  [20.0, 22.5, (t, C) => ({ pos: V(C.mid.x + 0.9, 0.55, C.mid.z + 2.7), look: V(C.mid.x - 0.1, 1.0, C.mid.z), fov: 38, roll: 0.1 })], // low, tilted
  [22.5, T.ronLand, (t, C) => { const b = ronPos(23.2); return { pos: V(b.x + 1.6, 0.3, b.z - 2.6), look: V(C.r.x, C.r.y + 0.8, C.r.z), fov: 52 }; }], // up at the leap
  [T.ronLand, 28.0, (t, C, k) => ({ pos: V(C.r.x - 2.4 - 0.4 * k, 1.0 + 0.3 * k, C.r.z - 2.8), look: V(C.h.x, 0.6, C.h.z), fov: 40 })], // behind Ron, the Hound blows up
  [28.0, LEN + 1, (t, C, k) => ({ pos: lerpV(V(C.r.x + 3.0, 0.8, C.r.z + 2.2), V(C.r.x + 5.5, 2.8, C.r.z + 3.3), ss(k)), look: V(C.r.x, 1.0 + 0.5 * k, C.r.z), fov: 38 })], // Ron, alone
];
const SHAKES = [[T.land, 0.12, 5], [T.boom1, 0.2, 4], [T.boom2, 0.16, 4], [T.leapLand, 0.05, 6], [T.clash, 0.09, 6], [T.slash[2], 0.04, 6], [T.over, 0.05, 6], [T.armOff, 0.07, 6], [T.strike, 0.16, 4], [T.boomA, 0.06, 5], [T.boomB, 0.24, 3], [T.fall + 0.75, 0.06, 5]];
// white flashes over the whole picture
const FLASHES = [[T.boom1, 0.35], [T.clash, 0.45], [T.armOff, 0.3], [T.strike, 0.4], [T.boomB, 0.45]];

// ---------------------------------------------------------------- one frame
function frame(t) {
  // pose the machines
  const r = ronPos(t), h = houndPos(t), R = ronPose(t), Hd = houndPose(t);
  ron.holder.position.set(r.x, r.y, r.z);
  ron.holder.rotation.y = ry(r, h) * (1 - R.faceFixed) + (Math.PI / 2) * R.faceFixed;
  hound.holder.position.set(h.x, h.y - Hd.sink, h.z);
  hound.holder.rotation.y = ry(h, r); hound.group.rotation.x = Hd.tilt;
  hound.u.hp.armR = Hd.armOff ? 0 : 100; hound.u.hp.body = Hd.dead ? 0 : 100;
  poseMech(ron, ron.u, R.pose); poseMech(hound, hound.u, Hd.pose);
  ron.mats.eye.color.set('#7af4ff'); hound.mats.eye.color.set(Math.floor(t * 3) % 2 ? '#ff3a24' : '#ff6a40');
  if (Hd.dead) hound.mats.eye.color.set('#200a08');
  scene.updateMatrixWorld();

  // where the parts that matter are now
  const C = { r: V(r.x, r.y, r.z), h: V(h.x, h.y, h.z), ronHead: wp(ron.head, 0, 0.08, 0.02), mid: V((r.x + h.x) / 2, 0, (r.z + h.z) / 2) };
  const muzzle = wp(ron.parts.muzzlewR), rodTip = wp(ron.parts.handwL, 0, 0, 0.5), houndChest = wp(hound.torso, 0, 0.22, 0.1);
  const bladeTip = Hd.armOff ? null : wp(hound.parts.handwR, 0, 0, 0.62), shoulderR = wp(hound.torso, 0.42 * 0.93, 0.32, 0);

  // ---- the effects
  fx.begin();
  fx.fire(t, FIRE_AT, 1, 70);
  for (const [i, p] of [V(30, 0, -26), V(-34, 0, 24), V(58, 0, 12), V(-62, 0, -20), V(14, 0, 34)].entries()) fx.column(t, p, 0.7 + 0.15 * i, 80 + i * 7);
  fx.embers(t, C.mid, 160);
  // eyes and thrusters
  fx.glow.put(...wp(ron.eye).toArray(), 0.05, 0.45, 0.95, 1, 0.9);
  if (!Hd.dead) fx.glow.put(...wp(hound.eye).toArray(), 0.05, 1, 0.3, 0.2, 0.9);
  for (const [m, k, seed] of [[ron, R.jets, 1], [hound, Hd.jets, 2]]) {
    if (k <= 0.01) continue;
    const dir = wdir(m.torso, 0, -1, -0.55).normalize();
    for (const s of [-1, 1]) fx.jet(t, wp(m.torso, s * 0.13, 0.0, -0.42), dir, k, seed * 10 + s);
  }
  // dust from Ron's steps in the second shot, the landings
  for (let k = 0; k * 0.48 + 0.24 < T.stop; k++) { const at = k * 0.48 + 0.24; if (at > 3.3) { const p = ronPos(at); fx.dust(t, at, V(p.x + 0.1, 0, p.z + (k % 2 ? 0.15 : -0.15)), 0.35, 200 + k); } }
  fx.dust(t, T.land, V(3.5, 0, 0.4), 2.0, 300); fx.dust(t, T.leapLand, V(ronPos(T.leapLand).x, 0, ronPos(T.leapLand).z), 0.9, 301);
  fx.dust(t, T.ronLand, V(ronPos(T.ronLand).x, 0, ronPos(T.ronLand).z), 1.1, 302); fx.dust(t, T.fall + 0.75, V(houndPos(27).x + 0.6, 0, houndPos(27).z), 1.6, 303);
  fx.dust(t, T.charge, V(3.5, 0, houndPos(T.charge).z), 0.8, 304);
  // the gun
  for (const s of SHOTS) {
    if (t < s.t || t > s.t + 1.3) continue;
    const hp = houndPos(s.t);
    const target = s.hit ? houndChest.clone().add(V(0, 0.1, 0.12)) : V(hp.x + 2 + H(s.n, 1) * 4, 0.1 + H(s.n, 2) * 2.4, hp.z + (H(s.n, 3) - 0.45) * 2.6);
    fx.muzzle(t, s.t, muzzle); fx.tracer(t, s.t, muzzle, target, 0.2);
    fx.sparks(t, s.t + 0.2, target, null, s.hit ? 0.9 : 0.35, 400 + s.n);
    if (!s.hit && target.y < 0.5) fx.dust(t, s.t + 0.2, target, 0.2, 500 + s.n);
  }
  // the missiles
  for (const [i, f] of flights.entries()) {
    const m = missiles[i], k = (t - f.t0) / (f.t1 - f.t0);
    m.visible = k > 0 && k < 1;
    if (m.visible) { const p = bez(f, k); m.position.copy(p); m.lookAt(bez(f, Math.min(1, k + 0.01))); fx.glow.put(p.x, p.y, p.z, 0.3, 1, 0.75, 0.4, 0.9); fx.flash(p, 4, '#ffa050'); }
    if (k > 0) for (let j = 0; j < 40; j++) {
      const q = Math.min(k, 1) - j * 0.025; if (q < 0) break;
      const age = (t - (f.t0 + q * (f.t1 - f.t0))) / 2.2; if (age > 1) continue;
      const p = bez(f, q);
      fx.smoke.put(p.x + age * 0.3, p.y + age * 0.5, p.z, 0.18 + age * 0.6, 0.55, 0.52, 0.5, 0.5 * (1 - age));
    }
    if (k < 0.08 && k > 0) fx.muzzle(t, f.t0, f.a);
  }
  fx.explosion(t, T.boom1, flights[0].b, 1.35, 11); fx.explosion(t, T.boom2, flights[1].b, 1.1, 21);
  // the rod
  const rodK = R.rod * (0.55 + 0.45 * Math.abs(Math.sin(t * 13)));
  if (rodK > 0.02) fx.crackle(t, rodTip, rodK, 31);
  // the clash: a burst, then sparks and arcs while the blade and the rod grind
  if (bladeTip && t > T.clash - 0.02 && t < T.part + 0.3) {
    const mid = rodTip.clone().lerp(bladeTip, 0.5);
    if (t < T.part) { fx.arc(t, rodTip, bladeTip, 1.2, 33); fx.arc(t + 0.3, rodTip, bladeTip, 0.8, 34); }
    for (let k = 0; k < 9; k++) fx.sparks(t, T.clash + k * 0.11, mid, null, k === 0 ? 2.2 : 0.45, 600 + k, [0.7, 0.9, 1]);
  }
  if (t > T.clash && t < T.clash + 0.15) fx.flash(rodTip, 60 * (1 - (t - T.clash) / 0.15), '#c0e8ff');
  // two parries and a hit on Ron's arm
  for (const [i, te] of T.slash.entries()) {
    if (t < te || t > te + 1.2) continue;
    if (i < 2 && bladeTip) fx.sparks(t, te, rodTip.clone().lerp(bladeTip, 0.5), null, 1.3, 700 + i, [0.75, 0.9, 1]);
    if (i === 2) fx.sparks(t, te, wp(ron.armR.sh), V(-1, 0.4, 0), 1.4, 710);
  }
  // Ron's damaged arm keeps sparking
  if (t > T.slash[2]) for (let k = 0; k < 14; k++) fx.sparks(t, T.slash[2] + 0.7 + k * 0.63, wp(ron.armR.sh, 0, -0.05, 0), null, 0.25, 720 + k);
  // the overhead blow strikes the street
  fx.sparks(t, T.over + 0.02, V(h.x - 0.9, 0.05, h.z), V(0, 1, 0), 1.0, 730); fx.dust(t, T.over + 0.02, V(houndPos(T.over).x - 0.9, 0, houndPos(T.over).z), 0.6, 731);
  // the uppercut: the arm comes off
  if (t > T.counter - 0.02 && t < T.counter + 0.25) fx.arc(t, rodTip, shoulderR, 1.4, 740);
  fx.sparks(t, T.counter, ARM0, null, 1.6, 741, [0.75, 0.9, 1]);
  fx.explosion(t, T.armOff, ARM0, 0.45, 742);
  if (t > T.armOff) {
    for (let k = 0; k < 12; k++) fx.sparks(t, T.armOff + 0.5 + k * 0.4, shoulderR, V(0, 0.6, 0), 0.3, 750 + k);
    for (let i = 0; i < 18; i++) { const a = ((t - T.armOff) / 2.4 + H(i, 760)) % 1; fx.smoke.put(shoulderR.x + a * 0.4, shoulderR.y + a * 1.4, shoulderR.z, 0.12 + a * 0.4, 0.15, 0.14, 0.14, 0.4 * (1 - a)); }
  }
  // the blow from above
  if (t > T.strike - 0.02 && t < T.strike + 0.5) { for (let k = 0; k < 3; k++) fx.arc(t + k * 0.2, rodTip, houndChest.clone().add(V((H(k, 1) - 0.5) * 0.6, (H(k, 2) - 0.5) * 0.8, 0)), 1.5, 770 + k); }
  fx.sparks(t, T.strike, houndChest, null, 2.2, 780, [0.75, 0.9, 1]);
  if (t > T.strike && t < T.strike + 0.2) fx.flash(houndChest, 70 * (1 - (t - T.strike) / 0.2), '#c8ecff');
  // the end of the Hound: a blast in the chest, the big one, then it burns
  fx.explosion(t, T.boomA, houndChest, 0.7, 790);
  fx.explosion(t, T.boomB, houndChest.clone().add(V(0, 0.2, 0)), 2.1, 800);
  if (t > T.boomB + 0.3) fx.fire(t, V(h.x + 0.5, 0.25, h.z), 0.75 * S(t, T.boomB + 0.3, T.boomB + 1.2), 810);
  if (t > T.strike && t < T.boomB) for (let k = 0; k < 6; k++) fx.sparks(t, T.strike + 0.3 + k * 0.27, houndChest, null, 0.35, 820 + k);
  // the loose arm
  loose.visible = t >= T.armOff;
  if (loose.visible) { const a = armAt(t); loose.position.copy(a.p); loose.rotation.set(a.r, a.r * 0.6, 1.2 + a.r * 0.3); }

  // the lights from the effects: the two brightest flashes near the camera
  fireLight.intensity = 5 + Math.sin(t * 23) * 1.2 + Math.sin(t * 37) * 0.8;
  const fl = fx.flashes.slice().sort((a, b) => b.i - a.i);
  fxLights.forEach((l, i) => { const f = fl[i]; if (!f) { l.intensity = 0; return; } l.position.copy(f.p); l.intensity = Math.min(14, f.i * 0.45); l.color.set(f.col); });

  // ---- the camera
  const si = SHOTLIST.findIndex(([a, b]) => t >= a && t < b), [a0, a1, shot] = SHOTLIST[si < 0 ? SHOTLIST.length - 1 : si];
  const c = shot(t, C, Math.min(1, (t - a0) / (a1 - a0)));
  let shake = 0; for (const [te, amp, dec] of SHAKES) shake += amp * imp(t - te, 0.02, dec);
  const sx = (Math.sin(t * 61) + Math.sin(t * 97) * 0.5) * shake, sy = (Math.sin(t * 73 + 1) + Math.sin(t * 89) * 0.5) * shake;
  camera.position.copy(c.pos).add(V(sx * 0.6, sy * 0.6, 0));
  camera.up.set(Math.sin(c.roll || 0), Math.cos(c.roll || 0), 0);
  camera.lookAt(c.look.clone().add(V(sx, sy, 0)));
  camera.fov = c.fov; camera.updateProjectionMatrix();
  // the sun's shadows follow what the camera is looking at
  const focus = c.look.clone(); focus.y = 0;
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(SUN_DIR, 30);
  scene.userData.sky.position.copy(camera.position);

  fx.end(camera, renderer.domElement.height, FOG_NEAR, FOG_FAR);
  renderer.render(scene, camera);
  overlays(t);
}

// ---------------------------------------------------------------- words and fades over the picture
function overlays(t) {
  let fade = 1 - seg(t, 0, 0.8); fade = Math.max(fade, seg(t, 29.2, LEN));
  $('fade').style.opacity = fade.toFixed(3);
  let fl = 0; for (const [te, k] of FLASHES) fl = Math.max(fl, k * imp(t - te, 0.015, 9));
  $('flash').style.opacity = fl.toFixed(3);
  const tt = TITLE[lang], tk = Math.min(seg(t, 0.8, 1.6), 1 - seg(t, 2.8, 3.4));
  $('title').style.opacity = tk.toFixed(3); $('title').innerHTML = `<b>${tt[0]}</b><i>${tt[1]}</i><small>${tt[2]}</small>`;
  const ek = Math.min(seg(t, 28.3, 29.0), 1 - seg(t, 29.6, 30));
  $('end').style.opacity = ek.toFixed(3); $('end').innerHTML = `<b>${END[lang][0]}</b><small>${END[lang][1]}</small>`;
  const L = LINES[lang].find(([a, b]) => t >= a && t < b);
  const sub = $('sub');
  if (L) { const k = Math.min(seg(t, L[0], L[0] + 0.15), 1 - seg(t, L[1] - 0.15, L[1])); sub.style.opacity = k.toFixed(3); const html = `<span class="who">${L[2]}</span>${L[3]}`; if (sub.dataset.html !== html) { sub.innerHTML = html; sub.dataset.html = html; } }
  else sub.style.opacity = '0';
}

// ---------------------------------------------------------------- the frame on the screen: 2.35:1 on wide screens
function layout() {
  const W = window.innerWidth, Hh = window.innerHeight, ar = params.has('thumb') || W / Hh <= 1.3 ? 16 / 9 : 2.35;
  let w = W, h = W / ar; if (h > Hh) { h = Hh; w = h * ar; }
  const f = $('frame'); f.style.width = w + 'px'; f.style.height = h + 'px'; f.style.left = (W - w) / 2 + 'px'; f.style.top = (Hh - h) / 2 + 'px';
  f.style.fontSize = Math.max(11, h / 30) + 'px';
  renderer.setSize(w, h, false); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  camera.aspect = w / h;
}
window.addEventListener('resize', () => { layout(); frame(state.t); });

// ---------------------------------------------------------------- the player
const state = { t: Math.max(0, Math.min(LEN, +(params.get('t') || 0))), playing: false, wall: 0, from: 0 };
const UI = {
  zh: { play: '▶ 播放', replay: '↺ 重播', sub: '以《鋼魂戰線》的 3D 引擎拍攝的動畫短片．30 秒戰鬥片段', lang: 'EN', hint: '空白鍵 播放／暫停．← → 快轉' },
  en: { play: '▶ Play', replay: '↺ Replay', sub: 'An animated short filmed in the Iron Front 3D engine · a 30-second fight', lang: '中', hint: 'Space play / pause · ← → skip' },
};
function texts() {
  const u = UI[lang]; document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  $('go').textContent = state.t >= LEN - 0.01 ? u.replay : u.play; $('blurb').textContent = u.sub; $('lang').textContent = u.lang; $('hint').textContent = u.hint;
  $('st').innerHTML = `<b>${TITLE[lang][0]}</b><i>${TITLE[lang][1]}</i>`;
}
function play() {
  if (state.t >= LEN - 0.01) state.t = 0;
  state.playing = true; state.wall = performance.now(); state.from = state.t; score.play(state.t);
  $('start').hidden = true; $('pp').textContent = '❚❚'; document.body.classList.add('playing');
}
function pause() { state.playing = false; score.stop(); $('pp').textContent = '▶'; document.body.classList.remove('playing'); }
function seek(t) { const was = state.playing; if (was) score.stop(); state.t = Math.max(0, Math.min(LEN, t)); if (was) { state.wall = performance.now(); state.from = state.t; score.play(state.t); } frame(state.t); bar(); }
function bar() { $('scrub').value = state.t.toFixed(2); $('time').textContent = `${state.t.toFixed(1).padStart(4, '0')} / ${LEN.toFixed(1)}`; }
function loop() {
  if (state.playing) {
    state.t = state.from + (performance.now() - state.wall) / 1000;
    if (state.t >= LEN) { state.t = LEN; pause(); $('start').hidden = false; texts(); }
    frame(state.t); bar();
  }
  requestAnimationFrame(loop);
}
$('go').onclick = play;
$('pp').onclick = () => (state.playing ? pause() : play());
$('scrub').oninput = (e) => seek(+e.target.value);
$('lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('ironfilm.lang', lang); } catch (e) { /* ignore */ } texts(); frame(state.t); };
$('mute').onclick = () => { score.setMuted(!score.isMuted()); $('mute').textContent = score.isMuted() ? '🔇' : '🔊'; };
$('fs').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); };
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); state.playing ? pause() : play(); }
  else if (e.code === 'ArrowRight') seek(state.t + 2); else if (e.code === 'ArrowLeft') seek(state.t - 2);
});
// the controls show while the mouse moves
let idle = 0; window.addEventListener('pointermove', () => { document.body.classList.add('awake'); clearTimeout(idle); idle = setTimeout(() => document.body.classList.remove('awake'), 2200); });

layout(); texts(); frame(state.t); bar(); loop();
if (state.t > 0) $('start').hidden = true;
// for tests and screenshots
window.FILM = { frame: (t) => { state.t = t; frame(t); bar(); }, T, LEN, state, setLang: (l) => { lang = l; texts(); } };
