// node tools/cues.mjs > tools/cues.json — every moment the sound mix (tools/mix.py) needs: the beats, the gunshots, the footsteps
import { T, SHOTS, LEN } from '../js/cast.js?v=2';
import { plans } from '../js/motion.js?v=2';
const P = plans();
const steps = (p, who) => p.steps.map((s) => ({ t: +s.t.toFixed(3), k: +s.k.toFixed(2), land: !!s.land, who, x: +s.x.toFixed(2), z: +s.z.toFixed(2) }));
console.log(JSON.stringify({ LEN, T, shots: SHOTS.map((s) => ({ t: s.t, hit: s.hit })), steps: [...steps(P.ron, 'ron'), ...steps(P.hound, 'hound')].sort((a, b) => a.t - b.t) }, null, 1));
