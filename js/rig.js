// The film's rig, laid over Iron Front's wanzer (engine/mech3d.js), which is left unchanged.
//   - more joints: a toe on each foot; the hip turns and swings out as well as forward; the ankle rolls to keep the
//     sole on the ground; the pelvis turns and tilts under the chest; the shoulders lift outwards as the arms rise;
//     the head turns to watch the other machine
//   - the legs are solved (two-bone IK) to put each foot where feet.js planted it, so nothing slides
//   - the upper body is played through springs: each joint lags a little behind its pose and settles with a touch of
//     overshoot, the arms quicker than the chest, the head slowest, so blows carry through and the weight shows.
//     The springs are run once over the whole film at load, so any frame still stands on its own.
import * as THREE from '../engine/lib/three.module.min.js';
import { poseMech } from '../engine/mech3d.js?v=16';
import { LEG } from './feet.js?v=5';

const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const HZ = 60;

// ---------------------------------------------------------------- new joints
export function extend(m) {
  for (const L of [m.legL, m.legR]) {
    L.hip.rotation.order = 'YZX';
    // the toe claws come off the sole onto a joint of their own
    const toe = new THREE.Group(); toe.position.set(0, -0.06, 0.15); L.ank.add(toe);
    for (const c of [...L.ank.children]) if (c.isMesh && c.position.z > 0.18) toe.attach(c);
    L.toe = toe;
  }
  m.headBase = m.head.position.clone();
  for (const A of [m.armR, m.armL]) A.shBase = A.sh.position.clone();
}

// ---------------------------------------------------------------- the springs
// channels read back from the engine's own pose, then smoothed through time
const CH = [
  ['hips', 'position', 'x', 18, 0.85], ['hips', 'rotation', 'z', 18, 0.8],
  ['torso', 'rotation', 'x', 20, 0.7], ['torso', 'rotation', 'y', 18, 0.7], ['torso', 'rotation', 'z', 18, 0.7],
  ['head', 'rotation', 'x', 13, 0.6], ['head', 'rotation', 'y', 12, 0.65], ['head', 'rotation', 'z', 13, 0.6],
  ['armR.sh', 'rotation', 'z', 24, 0.7], ['armR.up', 'rotation', 'x', 32, 0.72], ['armR.el', 'rotation', 'x', 30, 0.68],
  ['armL.sh', 'rotation', 'z', 24, 0.7], ['armL.up', 'rotation', 'x', 32, 0.72], ['armL.el', 'rotation', 'x', 30, 0.68],
  ['parts.handwR', 'rotation', 'x', 30, 0.7], ['parts.handwL', 'rotation', 'x', 30, 0.7],
];
const node = (m, path) => path.split('.').reduce((o, k) => o?.[k], m);

// bake: pose the machine at every 60th of a second with the engine, read the joints back, run the springs
export function bake(m, poseAt, len) {
  const N = Math.ceil(len * HZ) + 2, raw = CH.map(() => new Float32Array(N)), out = CH.map(() => new Float32Array(N));
  const nodes = CH.map(([p]) => node(m, p));
  for (let i = 0; i < N; i++) {
    const s = poseAt(i / HZ); poseMech(m, s.u, { ...s.pose, walk: 0, muzzle: false });
    CH.forEach(([, a, k], c) => { raw[c][i] = nodes[c] ? nodes[c][a][k] : 0; });
  }
  CH.forEach(([, , , w, z], c) => {
    let x = raw[c][0], v = 0; const sub = 4, dt = 1 / HZ / sub;
    for (let i = 0; i < N; i++) { const target = raw[c][i]; for (let s = 0; s < sub; s++) { v += (w * w * (target - x) - 2 * z * w * v) * dt; x += v * dt; } out[c][i] = x; }
  });
  // the kinetic chain: the hips move a beat before the chest, the chest before the arm, the wrist last, like a whip;
  // the head trails a touch behind the body
  const LEAD = CH.map(([path, , k]) => (path === 'hips' ? 0.06 : path === 'torso' ? 0.03 : path === 'head' ? -0.03 : path.endsWith('.el') ? -0.015 : path.startsWith('parts.hand') ? -0.03 : 0));
  const read = (a, t) => { const q = cl(t * HZ, 0, N - 1.001), i = Math.floor(q), f = q - i; return a[i] + (a[i + 1] - a[i]) * f; };
  return { at: (t) => out.map((a, c) => read(a, t + LEAD[c])), nodes };
}

// ---------------------------------------------------------------- one frame
const v3 = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1), eul = new THREE.Euler();
const L1 = LEG.thigh, L2 = LEG.shin;
function solveLeg(L, local, hipPos, relYaw, footPitch, limp) {
  const v = local.clone().sub(hipPos);
  const yh = cl(relYaw, -0.7, 0.7); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), -yh);
  const az = Math.atan2(v.x, -v.y), r = Math.hypot(v.x, v.y), z = v.z;
  const D = cl(Math.hypot(r, z), 0.12, L1 + L2 - 0.002);
  const bend = Math.PI - Math.acos(cl((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2), -1, 1));
  let th = Math.atan2(z, r) + Math.acos(cl((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
  let A = { yh, az: cl(az, -0.5, 0.5), th, bend };
  if (limp > 0) A = { yh: A.yh * (1 - limp), az: A.az * (1 - limp), th: A.th + (0.55 - A.th) * limp, bend: A.bend + (0.35 - A.bend) * limp };
  L.hip.rotation.set(-A.th, A.yh, A.az);
  L.knee.rotation.set(A.bend, 0, 0);
  // the ankle undoes the leg's turn so the sole lies flat (and tips by the foot's pitch)
  q1.setFromAxisAngle(X, A.th - A.bend); q2.setFromAxisAngle(Z, -A.az); q3.setFromAxisAngle(X, footPitch * (1 - limp));
  L.ank.quaternion.copy(q1).multiply(q2).multiply(q3);
  return A;
}

// an arm reaching for a point in the world (a parry meeting the blade): shoulder out, upper arm forward, elbow bent
const A1 = 0.18, A2 = 0.32;
function solveArm(m, A, target, w) {
  const k = A.sh.scale.x || 1, T = m.torso.worldToLocal(target.clone());
  const base = A.sh.position.clone().add(new THREE.Vector3(0, -0.06 * k, 0)), v = T.sub(base).divideScalar(k);
  const az = Math.atan2(v.x, -v.y), r = Math.hypot(v.x, v.y), z = v.z, D = cl(Math.hypot(r, z), 0.1, A1 + A2 - 0.005);
  const bend = Math.PI - Math.acos(cl((A1 * A1 + A2 * A2 - D * D) / (2 * A1 * A2), -1, 1));
  const th = Math.atan2(z, r) - Math.acos(cl((A1 * A1 + D * D - A2 * A2) / (2 * A1 * D), -1, 1)) * 0.6;
  A.sh.rotation.z += (cl(az, -0.9, 0.9) - A.sh.rotation.z) * w;
  A.up.rotation.x += (-th - A.up.rotation.x) * w;
  A.el.rotation.x += (-bend - A.el.rotation.x) * w;
}

// o: { t, s (cast state), sm (smoothed channels), feet (planner frame), yaw (world), other (the other machine's head, world), resolve }
export function apply(m, u, o) {
  const { t, s, feet } = o;
  // the engine's pose first (materials, broken parts, the muzzle flash, the eye), then the smoothed joints over it
  poseMech(m, u, { ...s.pose, walk: 0 });
  o.nodes.forEach((n, c) => { if (n) n[o.CH[c][1]][o.CH[c][2]] = o.sm[c]; });

  // ---- legs
  m.group.updateWorldMatrix(true, false);
  const hipY = feet.hip, kx = m.legL.hip.scale.x, limp = s.limp || 0;
  m.hips.position.y = hipY;
  let fwdL = 0, fwdR = 0;
  for (const [L, F, side] of [[m.legL, feet.L, -1], [m.legR, feet.R, 1]]) {
    const hipPos = v3.set(side * LEG.hipX * kx, hipY, 0).clone();
    L.hip.position.set(hipPos.x, hipY, 0);
    let local;
    if (F.mode >= 1.5 && F.mode < 2.5) local = new THREE.Vector3(side * 0.16, hipY - 0.4, side < 0 ? 0.1 : -0.06); // tucked up in the air
    else { local = new THREE.Vector3(F.x, F.y + LEG.ankle + Math.max(0, F.pitch) * 0.12, F.z); m.group.worldToLocal(local); }
    const A = solveLeg(L, local, hipPos, F.yaw - o.yaw, F.pitch, limp);
    // the toe bends back as the heel comes up, and curls in the air
    L.toe.rotation.x = -Math.max(0, F.pitch) * 0.9 + (F.mode >= 1.5 && F.mode < 2.5 ? 0.35 : 0);
    if (side < 0) fwdL = local.z; else fwdR = local.z;
    void A;
  }
  // ---- the pelvis turns with the legs, the chest turns back against it; the arms swing against the legs
  const stride = cl((fwdL - fwdR) / 0.5, -1, 1), walking = Math.abs(stride);
  const twist = m.torso.rotation.y, lean = m.torso.rotation.x;
  m.hips.rotation.y = 0.3 * twist + 0.22 * stride;
  m.torso.rotation.y = 0.7 * twist - 0.3 * stride;
  m.hips.rotation.x = 0.25 * lean; m.torso.rotation.x = 0.75 * lean + Math.sin(t * 2.1 + o.ph) * 0.012; // and it breathes
  const free = 1 - cl((s.pose.aim || 0) + (s.pose.guard || 0) * 0.6);
  m.armR.up.rotation.x -= 0.4 * stride * free; m.armL.up.rotation.x += 0.4 * stride * free * (1 - (s.pose.guard || 0));
  // ---- the shoulders lift outwards as the arms come up
  for (const [A, side] of [[m.armR, 1], [m.armL, -1]]) {
    const up = cl((-A.up.rotation.x - 0.9) / 1.6);
    A.sh.rotation.z += side * (0.05 + 0.16 * up);
    A.sh.position.y = A.shBase.y + 0.025 * up;
  }
  // ---- parries: the arm goes to meet the blade
  if (s.ik && o.resolve) { m.torso.updateWorldMatrix(true, false); for (const k of s.ik) { const tg = o.resolve(k.to, t); if (tg) solveArm(m, k.side === 'R' ? m.armR : m.armL, tg, cl(k.w)); } }
  // ---- the head watches the other machine (through the chest's turn), on top of what the pose asks
  if (o.other && !s.dead) {
    m.head.updateWorldMatrix(true, false); m.torso.updateWorldMatrix(true, false);
    const d = o.other.clone().sub(m.head.getWorldPosition(new THREE.Vector3()));
    const inv = m.torso.getWorldQuaternion(new THREE.Quaternion()).invert(); d.applyQuaternion(inv);
    const yaw = cl(Math.atan2(d.x, d.z), -0.9, 0.9), pitch = cl(Math.atan2(-d.y, Math.hypot(d.x, d.z)), -0.5, 0.6);
    const w = s.lookW ?? 0.85;
    m.head.rotation.y += yaw * w; m.head.rotation.x += pitch * w * 0.8;
  }
}
export { CH };
