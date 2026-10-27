// Which way each machine faces, and both machines' footwork, from cast.js. Pure arithmetic (the sound tools use it).
import { ronPos, houndPos, ronPose, houndPose, T, LEN } from './cast.js?v=2';
import { planFeet } from './feet.js?v=2';

const face = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
export function yawRon(t) { const r = ronPos(t), h = houndPos(t), f = ronPose(t).faceFixed; return face(r, h) * (1 - f) + (Math.PI / 2) * f; }
export function yawHound(t) { return face(houndPos(t), ronPos(t)); }
export const houndFloor = (t) => (t < 6.3 ? 5.0 : 0);
export const houndSkate = (t) => t > T.charge + 0.05 && t < T.clash - 0.02;

export function plans() {
  const ron = planFeet({
    root: (t) => ronPos(t), floor: () => 0, yaw: yawRon, skate: () => false, kx: 1, len: LEN,
    stance: (t) => ronPose(t).pose.stance, crouch: (t) => ronPose(t).pose.crouch,
  });
  const hound = planFeet({
    root: (t) => { const h = houndPos(t), s = houndPose(t).sink; return { x: h.x, y: h.y - s, z: h.z }; }, floor: houndFloor, yaw: yawHound, skate: houndSkate, kx: 0.88, len: LEN,
    stance: (t) => houndPose(t).pose.stance, crouch: (t) => houndPose(t).pose.crouch,
  });
  return { ron, hound };
}
