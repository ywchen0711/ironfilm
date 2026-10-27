// The actors on the stage: each character built in 3D from js/cast/characters.js, and posed each frame from the
// runtime's state. Every actor offers named points (world positions) for the effects and the cameras:
//   wanzer: chest, head, eye, muzzle, tipR, tipL, launcher, shoulderR, shoulderL, handR, handL, front, wR, wL, armR, armL
//   heli:   body, chest, gun, podL, podR, spot
import * as THREE from '../../engine/lib/three.module.min.js';
import { buildMech } from '../../engine/mech3d.js?v=16';
import { CHARACTERS } from '../cast/characters.js?v=5';
import * as W from '../models/weapons.js?v=5';
import { buildHeli } from '../models/heli.js?v=5';
import * as rig from '../rig.js?v=5';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const world = (o, x = 0, y = 0, z = 0) => { o.updateWorldMatrix(true, false); return V(x, y, z).applyMatrix4(o.matrixWorld); };
const BUILD = { mg: W.mg, rod: W.rod, blade: W.blade, launcher: W.launcher, shotgun: W.shotgun, rifle: W.rifle, shield: W.shield, greatblade: W.greatblade, swarm: W.swarm };

function wanzer(scene, A, C, rt) {
  const u = { ...C.kit, ...(A.kit || {}), pilot: A.who, hp: { body: 100, armL: 100, armR: 100, legs: 100 } };
  const m = buildMech(u), holder = new THREE.Group(); holder.add(m.group); scene.add(holder);
  m.bar.visible = m.star.visible = m.mark.visible = false; m.u = u; m.holder = holder;
  rig.extend(m);
  // the detailed weapons go into the hands (and on the shoulder) in place of the engine's
  const weap = {};
  for (const [slot, type] of Object.entries(A.weapons || C.weapons || {})) {
    const pivot = slot === 'sh' ? m.parts.launcher : m.parts['hand' + slot]; if (!pivot || !BUILD[type]) continue;
    for (const c of pivot.children) if (c.isMesh) c.visible = false;
    const w = BUILD[type](slot === 'wL' ? -1 : 1); pivot.add(w.group); w.type = type; weap[slot] = w;
    if (slot === 'sh') w.group.position.set(0, 0.0, -0.02);
  }
  if (m.parts.muzzlewR && weap.wR?.points.muzzle) m.parts.muzzlewR.position.copy(weap.wR.points.muzzle.position).add(weap.wR.group.position);
  const tip = (slot) => { const w = weap[slot]; if (w?.points.tip) return world(w.points.tip); if (w?.points.muzzle) return world(w.points.muzzle); return world(m.parts['hand' + slot] || m.torso, 0, 0, 0.3); };
  const P = {
    chest: () => world(m.torso, 0, 0.22, 0.1), head: () => world(m.head, 0, 0.08, 0.02), eye: () => world(m.eye),
    muzzle: () => (weap.wR?.points.muzzle ? world(weap.wR.points.muzzle) : world(m.armR.el, 0, -0.4, 0)), eject: () => (weap.wR?.points.eject ? world(weap.wR.points.eject) : world(m.armR.el)),
    tipR: () => tip('wR'), tipL: () => tip('wL'), launcher: () => (weap.sh ? world(weap.sh.points.launch) : world(m.torso, -0.24, 0.6, 0.1)),
    shoulderR: () => world(m.armR.sh), shoulderL: () => world(m.armL.sh), handR: () => world(m.armR.el, 0, -0.3, 0), handL: () => world(m.armL.el, 0, -0.3, 0),
    front: (off = [0, 0, 0.9]) => world(m.holder, ...off), root: () => world(m.holder),
  };
  // the objects whose own frame a camera can sit in (a close-up that turns with the head)
  const frames = { head: m.head, chest: m.torso, root: holder };
  // what can come loose: an arm, or a weapon
  const looseOf = (what) => {
    if (what === 'armR' || what === 'armL') return m[what].sh;
    const w = weap[what]; return w ? w.group : null;
  };
  return {
    kind: 'wanzer', A, C, m, u, weap, points: P, looseOf, frames,
    sm: null, bake() { this.sm = rig.bake(m, (t) => { const s = rt.state(A.id, t); return { pose: s.pose, u: { ...u, hp: s.hp } }; }, rt.story.LEN); this.feet = rt.feet(A.id); },
    pose(t, s, other, aimAt, resolve) {
      const p = rt.pos(A.id, t);
      holder.visible = !s.hidden; holder.position.set(p.x, p.y - s.sink, p.z); holder.rotation.y = rt.yaw(A.id, t); m.group.rotation.x = s.tilt;
      u.hp = s.hp;
      rig.apply(m, u, { t, s, sm: this.sm.at(t), nodes: this.sm.nodes, CH: rig.CH, feet: this.feet.at(t), yaw: holder.rotation.y, other, ph: A.i * 2, resolve });
      if (m.parts.muzzlewR?.flash) m.parts.muzzlewR.flash.visible = false; // the director draws a better flash
      for (const [slot, w] of Object.entries(weap)) { w.group.visible = !s.gone[slot]; w.update?.(t, w.type === 'rod' ? s.rod : 1); }
      m.mats.eye.color.set(s.dead ? '#200a08' : C.eye);
      if (C.blink && !s.dead && Math.floor(t * 3) % 2) m.mats.eye.color.multiplyScalar(0.75); // the Hound's eye pulses
    },
  };
}

function heli(scene, A, C, rt) {
  const h = buildHeli({ paint: C.paint }); scene.add(h.group);
  const P = {}; for (const k of Object.keys(h.points)) P[k] = () => world(h.points[k]); P.root = () => world(h.group);
  return {
    kind: 'heli', A, C, h, points: P, looseOf: () => null, frames: { body: h.body, root: h.group }, bake() {},
    pose(t, s, other, aimAt) {
      // the attitude comes from the flight itself: nose down to speed up, banked into the turns
      const p = rt.pos(A.id, t), a = rt.pos(A.id, t - 0.15), b = rt.pos(A.id, t + 0.15), yaw = rt.yaw(A.id, t);
      const vx = (b.x - a.x) / 0.3, vz = (b.z - a.z) / 0.3, ax = (b.x - 2 * p.x + a.x) / 0.0225, az = (b.z - 2 * p.z + a.z) / 0.0225;
      const fx = Math.sin(yaw), fz = Math.cos(yaw), vf = vx * fx + vz * fz, af = ax * fx + az * fz, al = ax * fz - az * fx;
      h.group.visible = !s.hidden; h.group.position.set(p.x, p.y, p.z); h.group.rotation.y = yaw;
      h.pose(t, { pitch: Math.max(-0.4, Math.min(0.4, 0.05 * vf + 0.035 * af)), roll: Math.max(-0.5, Math.min(0.5, -0.05 * al)), aim: aimAt, spot: s.spot });
      void other;
    },
  };
}

export function buildActors(scene, rt) {
  const views = {};
  for (const A of rt.actors) {
    const C = CHARACTERS[A.who]; if (!C || C.kind === 'voice') continue;
    views[A.id] = C.kind === 'heli' ? heli(scene, A, C, rt) : wanzer(scene, A, C, rt);
  }
  return views;
}
