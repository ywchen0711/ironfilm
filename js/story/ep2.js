// Episode 2 — 停火線 / The Ceasefire Line. About five minutes.
//
// The same night. Ron and Karl walk the last stretch of the street to the ceasefire checkpoint, Mia flying cover.
// Five minutes to the truce. At the barrier the Alliance sentries raise their rifles, and Ron lowers his first.
// Then a missile falls out of the dark: Halden of Orrin, the arms company that sells to both sides, has come in his
// prototype to see that the war never ends. He cuts down the sentries, breaks Karl's shield, drives Mia's helicopter
// off with a swarm of missiles and beats Ron to his knees; and with the blade raised over him, a missile takes Halden
// in the back. Down the burning street, one-armed, comes the Black Hound, who did not die in Act One. Three machines,
// one street. The Hound turns his launcher on Halden. Ron and the Hound fight him together, Karl from the ground,
// Mia back with her last rockets; and as the ceasefire comes into force they cut him down crosswise, in silence.
// Halden escapes in a pod. At dawn the Hound walks away into the sunrise.
//
// How it is filmed, after the directors who taught us how:
//   Kubrick       one-point perspective down the street, at the start and at dawn
//   Kurosawa      long lenses compressing the street; a slow walk through smoke; after the last blow, the pause before
//                 the fall (Sanjuro); the two walking in side by side (Seven Samurai)
//   Leone         wide stillness and extreme close-ups of eyes; a three-way standoff (the triello) cut faster and faster
//   John Woo      guns raised at each other at the barrier; slow motion for the last blow
//   Spielberg     the face before the threat (Ron looks up before we see the missile); a dolly zoom on him as the
//                 prototype lands; one long moving take round the three of them
//   Ridley Scott  the prototype coming down through the floodlights in silhouette
//   Itano Ichirō  missile swarms that corkscrew in their own paths
//   George Miller fights framed on the centre, so they read at speed
//   Michael Mann  handheld in the gunfire
//   Nolan         a clock: five minutes, three, one, ten seconds to the truce
const BLOCK = { s: -1.35, e: -1.2 };
const at = (actor, off = [0, 0, 0]) => ({ at: actor, off });
const mid = (a, b, off = [0, 0, 0]) => ({ mid: [a, b], off });
const head = (actor, off = [0, 0, 0]) => ({ actor, part: 'head', off });
// a close-up on the eye, in the head's own frame, so it stays in front of the face however the head turns
const eye = (actor, dist = 0.7, side = 0.12, fov = 16) => ({ pos: { actor, part: 'head', local: true, off: [side, 0.1, dist] }, look: { actor, part: 'head', local: true, off: [0, 0.08, 0.1] }, fov });
const PI = Math.PI;

export const T = { lower: 53, missile: 59, boom1: 61, land: 74, kill2: 82, karlBreak: 89.6, swarm1: 99, thrown: 110.2, swing: 145.5, disarm: 148.2, houndShot: 149.6, triello: 168, fire3: 182, sever: 192.3, rockets2: 214.2, cross: 236.95, pod: 242.6, boomEnd: 243.0 };

export default {
  id: 'ep2', LEN: 294, T,
  title: { zh: ['鋼魂戰線', '第二幕　停火線', '停火協議生效前　五分鐘'], en: ['IRON FRONT', 'Act Two: The Ceasefire Line', 'Five minutes before the truce'] },
  end: { zh: ['鋼魂戰線　鐵鴉之夜', '第二幕　完．第三幕　待續'], en: ['IRON FRONT — Night of the Ravens', 'End of Act Two · Act Three to come'] },
  endFor: 3.5,
  warp: [[236.6, 238.4, 0.25]], // the last blow, four times slower
  blacks: [[246.6, 249.2]], // a fade to black before the dawn
  set: {
    kind: 'street',
    sky: [[0, 'dusk'], [52, 'night', 38], [262, 'dawn', 246]],
    fires: [{ at: [-10.6, 0.5, -2.3], k: 1 }, { at: [44, 0.4, 1.8], k: 1.2 }],
    columns: [[30, 0, -26], [-34, 0, 24], [58, 0, 12], [-62, 0, -20], [14, 0, 34], [46, 0, 6]],
    embers: 160,
    props: [
      { type: 'barrier', at: [26.5, -4.6], to: [26.5, 4.6], gap: [-1.3, 1.3] },
      { type: 'gate', at: [26.5, -1.3], len: 2.6, open: 1 },
      { type: 'booth', at: [31.4, -2.9], ry: -PI / 2 },
      { type: 'flood', at: [29.6, -3.9], aim: [23, 0, -0.6], h: 4.2 }, { type: 'flood', at: [29.6, 3.9], aim: [23, 0, 0.6], h: 4.2 },
      { type: 'flag', at: [26.9, -3.4], col: ['#2a4a8a', '#e8e4d8'] }, { type: 'flag', at: [26.9, 3.4], col: ['#8a2a24', '#e8c040'], ph: 2 },
      { type: 'sandbags', at: [28.4, 2.7], n: 9, ry: PI / 2 }, { type: 'sandbags', at: [28.3, -1.9], n: 6, ry: PI / 2 },
      { type: 'wire', at: [26.0, -4.6], to: [26.0, -1.7] }, { type: 'wire', at: [26.0, 1.7], to: [26.0, 4.6] },
      { type: 'tank', at: [17.5, -2.6], ry: 0.3, turret: 1.1 },
    ],
  },

  actors: [
    // ---------------------------------------------------------------- Ron
    {
      id: 'ron', who: 'ron', start: [-28, 0.3], stance0: 0, face: 'halden',
      track: [
        { do: 'face', t: 0, t1: 44.2, yaw: PI / 2, blend: 0.8 },
        { do: 'walk', t: 0, t1: 46, v: [1.08, 0], stop: 0.8 },
        { do: 'stance', t: 44.5, t1: 45.6 },
        // the standoff at the barrier: the gun up, and down first
        { do: 'p', t: 47.6, t1: T.lower, set: { aim: 1 }, ramp: 0.45 },
        { do: 'lookat', t: 58.3, t1: 61.2, to: 'halden' }, { do: 'p', t: 58.3, t1: 61, set: { headKick: 0.5 }, ramp: 0.15 },
        { do: 'react', t: T.boom1, part: 'head', k: 0.4 }, { do: 'p', t: 61.3, t1: 66, set: { guard: 0.8 } },
        { do: 'lookat', t: 66, t1: 74.4, to: 'halden' }, { do: 'react', t: T.land, part: 'head', k: 0.25 },
        { do: 'p', t: 80.8, t1: 82.2, set: { lean: 0.15 }, shape: 'bump' },
        // fight one: the gun, then the rod
        { do: 'p', t: 83.6, t1: 85.3, set: { aim: 1 }, ramp: 0.3 },
        { do: 'burst', t: 84.0, n: 12, rate: 0.08, target: 'halden', hits: [3, 5, 7, 9] },
        { do: 'rod', t: 89.9, t1: T.disarm }, { do: 'rod', t: 167.5, t1: 285 },
        { do: 'charge', t: 91.0, t1: 92.4, to: 'halden', gap: 1.05, jets: 0.9, armBack: false },
        { do: 'anchor', t: 92.4, t1: 96, to: 'halden', dist: 1.05, blend: 0.05 }, { do: 'pin', t: 96 },
        { do: 'blow', t: 92.8, style: 'side', arm: 'L', result: 'clash', target: 'halden', against: 'tipR', close: false },
        { do: 'blow', t: 93.6, style: 'upper', arm: 'L', result: 'clash', target: 'halden', against: 'tipR', close: false },
        { do: 'guard', t: 93.95, t1: 95.0, side: 'L', arm: BLOCK },
        { do: 'react', t: 95.1, part: 'body', k: 1.0 }, { do: 'dist', t: 95.1, t1: 95.6, d: 0.6 },
        { do: 'goto', t: 96.2, t1: 97.6, to: { rel: 'halden', at: 96.19, off: [-2.0, -1.7] } }, // away from Karl, into open ground
        { do: 'lookat', t: 99.5, t1: 104.8, to: 'mia' },
        // fight two: overwhelmed, thrown down
        { do: 'guard', t: 106.0, t1: 110.2, side: 'L', arm: BLOCK },
        { do: 'react', t: 107.8, part: 'body', k: 1.0 }, { do: 'react', t: 109.4, part: 'armL', k: 0.9 }, { do: 'react', t: T.thrown, part: 'body', k: 1.6, decay: 1.6 },
        { do: 'goto', t: T.thrown, t1: 111.2, to: { rel: 'halden', at: T.thrown, off: [-4.9, -1.1] }, e: 'out' },
        { do: 'jump', t: T.thrown, t1: 111.2, h: 0.55, jets: 0, land: 1.0, recover: 1.2 },
        { do: 'kneel', t: 111.3, t1: 166, ramp: 0.5 },
        { do: 'arm', side: 'L', keys: [[141.5, -0.6, -0.9, 0], [144.6, -1.2, -1.3, -0.3], [145.4, -1.35, -1.25, -0.5], [147.6, -1.5, -1.1, -0.5]] },
        { do: 'p', t: T.swing, t1: 148.2, set: { crouch: 0.5, lean: -0.1 }, shape: 'hold', ramp: 0.2 },
        { do: 'disarm', t: T.disarm, t1: 167.4, slot: 'wL', v: [0.3, 2.0, -1.2] },
        { do: 'arm', side: 'L', keys: [[148.5, -0.8, -1.6, 0], [150.4, -1.1, -1.7, 0]] },
        { do: 'lookat', t: 151, t1: 166, to: 'hound' },
        // up again; the rod back in the hand; the three-way standoff
        { do: 'p', t: 166.6, t1: 167.9, set: { crouch: 0.75 }, shape: 'bump' },
        { do: 'arm', side: 'L', keys: [[166.7, -0.3, -0.2, 0], [167.3, 0.1, -0.1, 0], [167.9, -0.5, -0.9, 0]] },
        { do: 'goto', t: 168.0, t1: 169.6, to: { rel: 'halden', at: 167.99, off: [-3.5, -3.0] } },
        // fight three: together
        { do: 'jump', t: 185.2, t1: 185.9, h: 0.8, d: [-0.8, 0.6], jets: 1 },
        { do: 'guard', t: 186.6, t1: 187.6, side: 'L', arm: BLOCK },
        { do: 'blow', t: 187.8, style: 'side', arm: 'L', result: 'clash', target: 'halden', against: 'tipR', close: false },
        { do: 'blow', t: 188.6, style: 'upper', arm: 'L', result: 'clash', target: 'halden', against: 'tipR', close: false },
        { do: 'blow', t: 192.2, style: 'upper', arm: 'L', result: 'hit', target: 'halden', part: 'shoulderR', close: false, k: 1.4 },
        { do: 'charge', t: 197.6, t1: 198.6, to: 'halden', gap: 1.0, jets: 0.9, armBack: false },
        { do: 'blow', t: 198.8, style: 'side', arm: 'L', result: 'clash', target: 'halden', against: 'tipL', close: false, bind: 1.6, k: 1.2 },
        { do: 'arm', side: 'L', keys: [[198.85, -1.45, -0.2, 1.1], [200.4, -1.45, -0.2, 1.1]], blendIn: 0.02 },
        { do: 'p', t: 198.8, t1: 200.4, set: { lean: 0.25, crouch: 0.3 }, ramp: 0.1 },
        { do: 'jump', t: 206.6, t1: 207.3, h: 0.7, d: [-1.0, 0.8], jets: 1 },
        // the walk in, side by side; the last blow, crosswise
        { do: 'goto', t: 218, t1: 222.5, to: { rel: 'halden', at: 217.99, off: [-6.0, -1.2] } },
        { do: 'goto', t: 224, t1: 231, to: { rel: 'halden', at: 223.99, off: [-3.0, -0.6] }, e: 'lin' },
        { do: 'p', t: 234.2, t1: 236.0, set: { crouch: 0.45, lean: 0.2 }, ramp: 0.4 },
        { do: 'goto', t: 236.0, t1: 237.3, to: { rel: 'halden', at: 235.99, off: [1.8, 0.7] }, jets: 1.2, skate: true, e: 'in' },
        { do: 'blow', t: T.cross, style: 'side', arm: 'L', result: 'hit', target: 'halden', part: 'chest', close: false, k: 1.5 },
        { do: 'arm', side: 'L', keys: [[237.05, -1.45, -0.15, 1.2], [241.0, -1.45, -0.15, 1.2]], blendOut: 0.9 },
        { do: 'p', t: 237.3, t1: 241.2, set: { crouch: 0.4, lean: 0.2, twist: -0.6 }, ramp: 0.5 },
        // dawn
        { do: 'face', t: 250, t1: 263.5, to: 'hound', blend: 0.8 },
        { do: 'lookat', t: 266.5, t1: 270, to: 'karl' }, { do: 'lookat', t: 271.5, t1: 276, to: 'mia' },
        { do: 'face', t: 280, t1: 300, yaw: -PI / 2, blend: 1.2 },
      ],
    },
    // ---------------------------------------------------------------- Karl
    {
      id: 'karl', who: 'karl', start: [-29.4, -1.5], stance0: 0, face: 'halden',
      track: [
        { do: 'face', t: 0, t1: 44.2, yaw: PI / 2, blend: 0.8 },
        { do: 'walk', t: 0, t1: 46, v: [1.08, 0], stop: 0.8 },
        { do: 'stance', t: 44.5, t1: 45.6 },
        { do: 'p', t: 47.2, t1: 54.2, set: { aim: 1 }, ramp: 0.45 },
        { do: 'move', t: 62.2, t1: 62.9, d: [0.6, 1.0] }, { do: 'guard', t: 62.0, t1: 66.5, side: 'L', arm: { s: -1.5, e: -0.6 }, wrist: 0 },
        { do: 'react', t: 63.4, part: 'armL', k: 0.3 }, { do: 'react', t: 64.0, part: 'armL', k: 0.3 },
        // fight one: shield first, the shotgun over it; the shield breaks
        { do: 'charge', t: 84.5, t1: 86.0, to: 'halden', gap: 1.3, jets: 0.8, armBack: false },
        { do: 'guard', t: 84.5, t1: 89.6, side: 'L', arm: { s: -1.5, e: -0.6 }, wrist: 0 },
        { do: 'p', t: 85.8, t1: 87.4, set: { aim: 1 }, ramp: 0.2 },
        { do: 'burst', t: 86.2, n: 1, rate: 0.1, target: 'halden', hits: [0] }, { do: 'burst', t: 87.0, n: 1, rate: 0.1, target: 'halden', hits: [0] },
        { do: 'anchor', t: 86.0, t1: 90.5, to: 'halden', dist: 1.3, blend: 0.05 }, { do: 'pin', t: 90.5 },
        { do: 'react', t: 88.0, part: 'armL', k: 0.6 }, { do: 'react', t: 88.8, part: 'armL', k: 0.8 },
        { do: 'react', t: T.karlBreak, part: 'body', k: 1.3 }, { do: 'disarm', t: T.karlBreak + 0.02, slot: 'wL', v: [-1.0, 2.4, 1.6] }, { do: 'dist', t: T.karlBreak, t1: 90.4, d: 1.2 },
        { do: 'kneel', t: 90.4, t1: 101.5, ramp: 0.5 },
        // back up, firing for Ron; knocked down again
        { do: 'p', t: 112.6, t1: 114.4, set: { aim: 1 }, ramp: 0.2 },
        { do: 'burst', t: 113.0, n: 1, rate: 0.1, target: 'halden', hits: [0] }, { do: 'burst', t: 114.0, n: 1, rate: 0.1, target: 'halden', hits: [0] },
        { do: 'react', t: 116.0, part: 'body', k: 1.5 }, { do: 'kneel', t: 116.5, t1: 250, ramp: 0.5 },
        { do: 'p', t: 199.6, t1: 200.4, set: { aim: 1 }, ramp: 0.15 },
        { do: 'burst', t: 200.0, n: 1, rate: 0.1, target: 'halden', hits: [0] },
        { do: 'lookat', t: 266, t1: 271, to: 'ron' },
      ],
    },
    // ---------------------------------------------------------------- the two Alliance sentries at the barrier
    {
      id: 'guard1', who: 'guard', start: [28.6, -1.0], face: 'ron',
      track: [
        { do: 'p', t: 46.8, t1: 56.6, set: { aim: 1 }, ramp: 0.4 },
        { do: 'react', t: T.boom1, part: 'body', k: 1.6 }, { do: 'die', t: T.boom1 }, { do: 'fall', t: T.boom1 + 0.05, t1: T.boom1 + 0.9 },
      ],
    },
    {
      id: 'guard2', who: 'guard', start: [28.8, 1.2], face: 'ron',
      track: [
        { do: 'p', t: 46.8, t1: 55.2, set: { aim: 1 }, ramp: 0.4 },
        { do: 'face', t: 62.0, t1: 66.0, to: 'karl', blend: 0.3 },
        { do: 'p', t: 62.1, t1: 65.6, set: { aim: 1 }, ramp: 0.2 },
        { do: 'burst', t: 62.5, n: 8, rate: 0.1, target: 'karl', hits: [1, 3, 5, 7], part: 'tipL' },
        { do: 'burst', t: 64.4, n: 6, rate: 0.1, target: 'ron' },
        { do: 'face', t: 80.0, t1: 83, to: 'halden', blend: 0.3 },
        { do: 'react', t: T.kill2, part: 'body', k: 1.4 }, { do: 'die', t: T.kill2 + 0.3 }, { do: 'fall', t: T.kill2 + 0.35, t1: T.kill2 + 1.2 },
      ],
    },
    // ---------------------------------------------------------------- Halden, in Orrin's prototype
    {
      id: 'halden', who: 'halden', start: [36, 2], floor: [[0, 14], [70, 0]], face: 'ron',
      track: [
        { do: 'hide', t: 0, t1: 69.8 },
        { do: 'missile', t: T.missile, to: [28.6, 0.9, -1.0], at: T.boom1, side: 2, arc: 3, boom: 1.4 },
        { do: 'drop', t: 70.0, t1: T.land, from: [36, 14, 2], to: [31, 0.4] },
        { do: 'arm', side: 'R', keys: [[74.2, -0.4, -0.5, 0], [76, -0.7, -0.6, 0.3], [80, -0.7, -0.6, 0.3]] },
        { do: 'p', t: 76, t1: 80, set: { headKick: -0.15 }, ramp: 0.5 },
        // the second sentry
        { do: 'charge', t: 80.5, t1: 81.8, to: 'guard2', gap: 1.0, jets: 1.2 },
        { do: 'blow', t: T.kill2, style: 'side', result: 'hit', target: 'guard2', part: 'chest', close: false, k: 1.3 },
        // fight one: Karl, then Ron
        { do: 'face', t: 84.5, t1: 91, to: 'karl', blend: 0.3 },
        { do: 'p', t: 84.0, t1: 85.6, set: { guard: 0.8 } },
        { do: 'blow', t: 88.0, style: 'side', result: 'clash', target: 'karl', against: 'tipL', close: false },
        { do: 'blow', t: 88.8, style: 'over', result: 'clash', target: 'karl', against: 'tipL', close: false, lean: 0.15 },
        { do: 'blow', t: T.karlBreak, style: 'thrust', result: 'hit', target: 'karl', part: 'chest', close: false, k: 1.3 },
        { do: 'blow', t: 94.3, style: 'over', result: 'clash', target: 'ron', against: 'tipL', close: false },
        { do: 'blow', t: 95.1, style: 'side', arm: 'L', result: 'hit', target: 'ron', part: 'chest', close: false },
        { do: 'jump', t: 96.0, t1: 97.0, h: 1.0, d: [2.0, -0.3], jets: 1 },
        // the swarm at the helicopter
        { do: 'face', t: 97.4, t1: 104, to: 'mia', blend: 0.4 },
        { do: 'swarm', t: T.swarm1, n: 16, rate: 0.06, target: 'mia', at: 101.2, decoys: 10 },
        // fight two: Ron beaten down, Karl knocked aside
        { do: 'charge', t: 105.5, t1: 106.8, to: 'ron', gap: 1.4 },
        { do: 'anchor', t: 106.8, t1: 110.15, to: 'ron', dist: 1.4, blend: 0.05 }, { do: 'pin', t: 110.15 },
        { do: 'blow', t: 107.0, style: 'side', result: 'clash', target: 'ron', against: 'tipL' },
        { do: 'blow', t: 107.8, style: 'thrust', result: 'hit', target: 'ron', part: 'chest' },
        { do: 'blow', t: 108.6, style: 'over', result: 'clash', target: 'ron', against: 'tipL', lean: 0.2 },
        { do: 'blow', t: 109.4, style: 'side', arm: 'L', result: 'hit', target: 'ron', part: 'shoulderL' },
        { do: 'blow', t: T.thrown, style: 'thrust', result: 'hit', target: 'ron', part: 'chest', k: 1.5, reach: 0.4 },
        { do: 'face', t: 113.4, t1: 119.8, to: 'karl', blend: 0.3 },
        { do: 'react', t: 113.2, part: 'body', k: 0.5 }, { do: 'react', t: 114.2, part: 'body', k: 0.5 },
        { do: 'goto', t: 114.5, t1: 115.6, to: { rel: 'karl', at: 114.49, off: [1.25, 0.1] } },
        { do: 'blow', t: 116.0, style: 'side', result: 'hit', target: 'karl', part: 'chest', close: false, k: 1.3 },
        // the slow walk to Ron, the speech, the blade going up
        { do: 'goto', t: 121, t1: 128, to: { rel: 'ron', at: 120.99, off: [1.25, 0.2] }, e: 'lin' },
        { do: 'p', t: 121, t1: 141, set: { sway: 0.3, headKick: -0.12 }, ramp: 1 },
        { do: 'arm', side: 'R', keys: [[141.0, -0.6, -0.5, 0], [143.5, -2.9, -0.35, 0.2], [145.2, -2.95, -0.35, 0.2]] },
        { do: 'blow', t: T.swing, style: 'over', result: 'clash', target: 'ron', against: 'tipL', close: false, bind: 2.0, k: 1.4 },
        { do: 'arm', side: 'R', keys: [[145.52, -0.9, -0.3, 0.6], [147.7, -0.9, -0.3, 0.6]], blendIn: 0.02 },
        { do: 'p', t: T.swing, t1: 147.7, set: { lean: 0.3, crouch: 0.2 }, ramp: 0.1 },
        { do: 'blow', t: T.disarm, style: 'thrust', result: 'hit', target: 'ron', part: 'handL', close: false },
        { do: 'arm', side: 'R', keys: [[148.6, -1.0, -0.4, 0], [150.0, -3.0, -0.3, 0.2], [150.35, -3.0, -0.3, 0.2]], blendOut: 0.5 },
        // the missile in the back; the Hound; three in the street
        { do: 'react', t: 150.4, part: 'body', k: 1.4 }, { do: 'p', t: 150.4, t1: 151.4, set: { lean: 0.3 }, shape: 'bump' },
        { do: 'face', t: 151, t1: 168, to: 'hound', blend: 0.6 },
        { do: 'goto', t: 160, t1: 163, to: { rel: 'ron', at: 159.99, off: [3.5, 3.0] } },
        { do: 'face', t: 168.2, t1: 171.5, to: 'ron', blend: 0.4 }, { do: 'face', t: 172, t1: 175.5, to: 'hound', blend: 0.4 },
        { do: 'face', t: 176, t1: 178.2, to: 'ron', blend: 0.3 }, { do: 'face', t: 178.4, t1: 179.8, to: 'hound', blend: 0.3 },
        // fight three
        { do: 'move', t: 182.3, t1: 182.9, d: [0.3, 1.3] }, { do: 'jets', t: 182.2, t1: 183.0, shape: 'bump' },
        { do: 'swarm', t: 184.0, n: 8, rate: 0.06, target: 'hound', at: 186.0, decoys: 8 },
        { do: 'swarm', t: 184.5, n: 8, rate: 0.06, target: 'ron', at: 186.3, decoys: 8 },
        { do: 'charge', t: 186.2, t1: 187.4, to: 'ron', gap: 1.35 },
        { do: 'anchor', t: 187.4, t1: 193.4, to: 'ron', dist: 1.35, blend: 0.05 }, { do: 'pin', t: 193.4 },
        { do: 'face', t: 189.8, t1: 192.0, to: 'hound', blend: 0.25 },
        { do: 'react', t: 189.9, part: 'body', k: 1.0 },
        { do: 'blow', t: 190.8, style: 'over', arm: 'L', result: 'clash', target: 'hound', against: 'tipL', close: false },
        { do: 'blow', t: 191.6, style: 'side', arm: 'L', result: 'clash', target: 'hound', against: 'tipL', close: false },
        { do: 'react', t: 192.2, part: 'armR', k: 1.5 }, { do: 'sever', t: T.sever, part: 'armR', v: [1.4, 3.0, -1.0] },
        { do: 'jump', t: 193.5, t1: 194.5, h: 1.2, d: [0.6, 2.2], jets: 1 },
        { do: 'face', t: 195, t1: 197.8, to: 'hound', blend: 0.3 },
        { do: 'charge', t: 195.5, t1: 196.8, to: 'hound', gap: 1.1 },
        { do: 'blow', t: 197.2, style: 'side', arm: 'L', result: 'hit', target: 'hound', part: 'chest', close: false },
        { do: 'arm', side: 'L', keys: [[198.7, -1.45, -0.2, 1.1], [200.4, -1.45, -0.2, 1.1]], blendIn: 0.1 },
        { do: 'react', t: 200.1, part: 'body', k: 1.2 },
        { do: 'swarm', t: 205.0, n: 20, rate: 0.05, target: 'ron', at: 207.0, decoys: 20 },
        { do: 'face', t: 211, t1: 213.4, to: 'karl', blend: 0.3 },
        { do: 'charge', t: 211.5, t1: 213.0, to: 'karl', gap: 1.2 },
        { do: 'blow', t: 213.2, style: 'side', arm: 'L', result: 'clash', target: 'hound', against: 'tipL', close: false, bind: 1.0 },
        { do: 'face', t: 213.6, t1: 216, to: 'mia', blend: 0.3 },
        { do: 'react', t: 214.9, part: 'body', k: 1.6 }, { do: 'move', t: 214.9, t1: 216.4, d: [-6.0, -1.0], e: 'out' }, { do: 'jets', t: 214.9, t1: 216.2, k: 0.8, shape: 'bump' },
        { do: 'p', t: 216, t1: 236, set: { crouch: 0.2, sway: 0.5 }, ramp: 1 },
        { do: 'jets', t: 234, t1: 235.6, k: 0.7, shape: 'bump' }, { do: 'p', t: 234, t1: 235.8, set: { crouch: 0.3, lean: 0.2 }, shape: 'bump' },
        { do: 'arm', side: 'L', keys: [[235.6, -0.6, -0.5, 0], [236.6, -2.6, -0.4, 0.2], [237.0, -2.6, -0.4, 0.2]], blendOut: 1.2 },
        // the pause; down; the pod; the end of the prototype
        { do: 'react', t: T.cross, part: 'body', k: 0.7 },
        { do: 'look', t: T.cross, w: 0 },
        { do: 'kneel', t: 241.6, t1: 300, ramp: 0.6 },
        { do: 'die', t: T.boomEnd }, { do: 'fall', t: T.boomEnd + 0.1, t1: T.boomEnd + 0.9 },
      ],
    },
    // ---------------------------------------------------------------- the Black Hound, one-armed, the blade in his left hand
    {
      id: 'hound', who: 'hound', start: [46, 0.2], face: 'halden', kit: { wR: null, wL: 'W-blade1' }, weapons: { wL: 'blade', sh: 'launcher' },
      track: [
        { do: 'broken', t: 0, part: 'armR' }, { do: 'hide', t: 0, t1: 150.6 },
        { do: 'missile', t: T.houndShot, target: 'halden', at: 150.35, off: [0.35, 1.0, 0], side: 0.5, arc: 0.8, boom: 0.9 },
        { do: 'walk', t: 151, t1: 160, v: [-0.9, 0], stop: 0.6 },
        { do: 'arm', side: 'L', keys: [[151, -0.3, -0.4, 0], [163, -0.3, -0.4, 0]] },
        { do: 'goto', t: 163.5, t1: 169, to: { rel: 'halden', at: 163.49, off: [5.0, -2.0] } },
        // fight three, on Ron's side
        { do: 'missile', t: T.fire3, target: 'halden', at: 182.9, off: [-0.2, 0.4, -0.4], side: 0.8, arc: 1.0, boom: 1.0 },
        { do: 'missile', t: T.fire3 + 0.15, target: 'halden', at: 183.0, off: [-0.4, 0.3, -0.8], side: -0.8, arc: 1.0, boom: 0.9 },
        { do: 'move', t: 185.0, t1: 185.8, d: [0, 1.6] }, { do: 'jets', t: 185.0, t1: 185.8, shape: 'bump' },
        { do: 'charge', t: 188.6, t1: 189.6, to: 'halden', gap: 1.0, armBack: false },
        { do: 'anchor', t: 189.6, t1: 193.4, to: 'halden', dist: 1.0, blend: 0.05 }, { do: 'pin', t: 193.4 },
        { do: 'blow', t: 189.9, style: 'side', arm: 'L', result: 'hit', target: 'halden', part: 'shoulderL', close: false },
        { do: 'guard', t: 190.5, t1: 192.0, side: 'L', arm: { s: -1.5, e: -1.1 } },
        { do: 'react', t: 197.2, part: 'body', k: 1.3 }, { do: 'move', t: 197.2, t1: 197.9, d: [1.2, 0.2] },
        { do: 'charge', t: 211.8, t1: 213.0, to: 'halden', gap: 0.9, armBack: false },
        { do: 'arm', side: 'L', keys: [[213.2, -1.45, -0.2, 1.1], [214.2, -1.45, -0.2, 1.1]], blendIn: 0.05 },
        { do: 'move', t: 214.3, t1: 214.9, d: [-1.2, -0.3] },
        { do: 'goto', t: 218, t1: 222.5, to: { rel: 'halden', at: 217.99, off: [6.0, -0.5] } },
        { do: 'goto', t: 224, t1: 231, to: { rel: 'halden', at: 223.99, off: [3.0, -0.3] }, e: 'lin' },
        { do: 'p', t: 234.2, t1: 236.0, set: { crouch: 0.45, lean: 0.2 }, ramp: 0.4 },
        { do: 'goto', t: 236.0, t1: 237.3, to: { rel: 'halden', at: 235.99, off: [-1.8, -0.7] }, jets: 1.2, skate: true, e: 'in' },
        { do: 'blow', t: T.cross + 0.04, style: 'side', arm: 'L', result: 'hit', target: 'halden', part: 'chest', close: false, k: 1.5 },
        { do: 'arm', side: 'L', keys: [[237.1, -1.45, -0.15, 1.2], [241.0, -1.45, -0.15, 1.2]], blendOut: 0.9 },
        { do: 'p', t: 237.3, t1: 241.2, set: { crouch: 0.4, lean: 0.2, twist: -0.6 }, ramp: 0.5 },
        // dawn: words with Ron, then away down the street into the sunrise
        { do: 'face', t: 250, t1: 263.5, to: 'ron', blend: 0.8 },
        { do: 'face', t: 263.5, t1: 300, yaw: -PI / 2, blend: 0.8 },
        { do: 'walk', t: 264.5, t1: 291, v: [-0.75, 0], stop: 1 },
      ],
    },
    // ---------------------------------------------------------------- Mia, flying cover
    {
      id: 'mia', who: 'mia', start: [-34, -1, 7],
      track: [
        { do: 'fly', keys: [[0, -34, 7, -1], [20, -14, 7.5, 0.8], [40, 6, 7.2, -1.2], [47, 14, 6.4, -2.4], [56, 17, 6.2, -2.6], [66, 18, 6.0, -2.8], [74, 19, 6.4, -2.0], [84, 20, 6.8, -2.6],
          [94, 21, 6.0, -2.8], [97, 23, 5.4, -2.6], [100, 24, 5.6, -1.8], [101.4, 23, 6.2, -0.6], [103, 16, 7.5, 4], [106, 6, 9.5, 12], [108, -6, 11, 22],
          [210, -10, 12, -10], [212.5, 4, 9, -6], [214.2, 16, 6.4, -2.8], [216, 20, 6, -2.6], [222, 22, 6.5, -3.0], [236, 22, 7, -3], [246, 22, 6, -2.6], [256, 21, 4.2, -2.4], [270, 21, 3.8, -2.4], [294, 21, 4.4, -2.0]] },
        { do: 'face', t: 94, t1: 101.4, to: 'halden', blend: 0.6 },
        { do: 'burst', t: 97.0, n: 12, rate: 0.07, target: 'halden', hits: [1, 3, 5, 7, 9], big: true, from: 'gun', fly: 0.15 },
        { do: 'flares', t: 100.2 },
        { do: 'hide', t: 107.5, t1: 212.0 },
        { do: 'face', t: 213.6, t1: 216.5, to: 'halden', blend: 0.6 },
        { do: 'rockets', t: T.rockets2, n: 6, rate: 0.09, target: 'halden', at: 214.8, spread: 1.0, boom: 0.7 },
        { do: 'face', t: 250, t1: 300, to: 'ron', blend: 1.5 },
        { do: 'spot', t: 248, t1: 300 },
      ],
      aim: [[0, 'halden.chest'], [248, 'ron.chest']],
    },
  ],

  // ---------------------------------------------------------------- the camera
  shots: [
    // ACT I — the walk to the line
    { t: 0, pos: [-46, 1.7, 0], look: [0, 1.2, 0], fov: 36 }, // Kubrick: down the middle of the street
    { t: 10, pos: [10, 0.9, 0.2], look: at('ron', [0, 0.9, 0]), fov: [8, 9] }, // Kurosawa: the long lens, the street squeezed
    { t: 18, pos: [at('ron', [0.8, 1.1, 3.9]), at('ron', [0.2, 1.1, 3.9])], look: at('ron', [0.4, 0.9, -0.7]), fov: 34 }, // walking with them
    { t: 26, ...eye('ron', 0.7, 0.1, 15), hand: 0.3 }, // Leone: the eye
    { t: 29.8, pos: head('karl', [0.9, 0.05, 0.35]), look: head('karl'), fov: 18 },
    { t: 32.3, pos: head('ron', [1.1, 0.08, 0.0]), look: head('ron'), fov: 20 },
    { t: 34, pos: [[12, 2.0, 2.6], [16, 6.5, 3.2]], look: [[24, 1.2, 0], [28, 0.8, 0]], fov: 42 }, // the checkpoint, as the lights come on
    { t: 40, pos: at('ron', [-3.5, 1.6, 1.8]), look: [28, 1.2, 0], fov: 40 },
    // the standoff (John Woo)
    { t: 46, pos: [25, 1.3, -4.2], look: [25.3, 1.0, 0], fov: 58 },
    { t: 47.8, pos: head('guard1', [-0.9, 0.0, -0.5]), look: { actor: 'guard1', part: 'muzzle' }, fov: 24 },
    { t: 49.5, pos: head('ron', [1.1, 0.1, 0.0]), look: head('ron'), fov: 22 },
    { t: 51, pos: at('guard2', [1.8, 1.4, 0.9]), look: at('ron', [0, 1.0, 0]), fov: 30 },
    { t: 53, pos: at('ron', [1.6, 0.35, -1.2]), look: at('ron', [0, 1.1, 0]), fov: 34 }, // Ron lowers his gun first
    { t: 55, pos: head('guard2', [-1.0, 0, 0.4]), look: head('guard2'), fov: 22 },
    { t: 56.5, pos: [25, 1.3, -4.2], look: [25.3, 1.0, 0], fov: 50 },
    // Spielberg: the face first, then what it sees
    { t: 58.2, pos: head('ron', [1.0, -0.12, 0.05]), look: head('ron', [0, 0.06, 0]), fov: 20 },
    { t: 59.6, pos: [26, 0.6, -3], look: [31, 7, 1], fov: 40 },
    { t: 61.3, pos: at('karl', [-1.8, 1.3, -1.6]), look: at('guard2', [0, 1, 0]), fov: 40, hand: 1 }, // Mann: handheld in the gunfire
    { t: 65.4, pos: at('mia', [0.5, -0.4, 0.8]), look: [32, 2, 1.5], fov: 45, hand: 0.6 },
    { t: 68, pos: [head('ron', [1.2, -0.15, 0.05]), head('ron', [0.9, -0.15, 0.05])], look: head('ron', [0, 0.1, 0]), fov: 24 },
    { t: 70, pos: at('ron', [-1.5, 0.35, -3.0]), look: at('halden', [0, 1.0, 0]), fov: 38 }, // Ridley Scott: down through the floodlights
    { t: 74.3, vertigo: { at: head('ron'), dir: [1, 0.05, 0.25], d: [1.2, 3.8], h: 0.9 } }, // the dolly zoom
    { t: 76, pos: at('halden', [-2.2, 0.3, -0.9]), look: at('halden', [0, 1.4, 0]), fov: 34 },
    // ACT II — the ambush
    { t: 80.3, pos: mid('halden', 'guard2', [0, 1.2, -3.6]), look: mid('halden', 'guard2', [0, 1, 0]), fov: 44 },
    { t: 83.2, pos: at('ron', [-1.6, 1.45, -0.9]), look: at('halden', [0, 1, 0]), fov: 32 },
    { t: 84.6, pos: at('karl', [0.8, 0.45, -1.6]), look: at('halden', [0, 0.9, 0]), fov: 42, hand: 0.6 },
    { t: 87.4, pos: mid('karl', 'halden', [0.2, 1.05, -2.6]), look: mid('karl', 'halden', [0, 1, 0]), fov: 36 }, // Miller: on the centre
    { t: 90.4, pos: at('ron', [-1.0, 0.6, 1.8]), look: at('halden', [0, 1, 0]), fov: 40 },
    { t: 92.4, orbit: { c: mid('ron', 'halden', [0, 0.95, 0]), r: 3.6, h: 0.4, a: [-1.4, -0.6] }, fov: 38, hand: 0.4 },
    { t: 96, pos: [24, 0.5, -3.8], look: at('halden', [0, 1.5, 0]), fov: 52 },
    { t: 98.6, pos: at('halden', [0.8, 1.6, 1.4]), look: at('mia'), fov: 52, hand: 0.4 }, // Itano: the swarm
    { t: 100.6, pos: at('mia', [2.5, 0.6, 1.8]), look: at('mia'), fov: 40 },
    { t: 101.8, pos: head('ron', [1.1, -0.05, 0.0]), look: head('ron'), fov: 22 },
    { t: 103.5, pos: at('ron', [-1, 0.5, -1.5]), look: at('mia'), fov: 44 },
    { t: 105.4, pos: at('ron', [-0.9, 0.45, -1.4]), look: at('halden', [0, 0.9, 0]), fov: 40 },
    { t: 106.8, pos: mid('ron', 'halden', [0, 1.1, -2.4]), look: mid('ron', 'halden', [0, 1.0, 0]), fov: 36, hand: 0.5 },
    { t: 109.2, pos: mid('ron', 'halden', [0.6, 0.8, -1.8]), look: mid('ron', 'halden', [0, 1.0, 0]), fov: 32, hand: 0.7 },
    { t: 110.2, pos: [22.0, 1.0, -3.6], look: at('ron', [0, 0.8, 0]), fov: 44 },
    { t: 112.3, pos: at('karl', [-1.7, 1.5, -1.7]), look: at('halden', [0, 1, 0]), fov: 34 },
    { t: 115.4, pos: mid('karl', 'halden', [0, 1.0, 2.6]), look: mid('karl', 'halden', [0, 1, 0]), fov: 38 },
    { t: 117.5, pos: at('ron', [-6.0, 0.9, -0.8]), look: at('halden', [0, 1.2, 0]), fov: 14 }, // Kurosawa: the slow walk through the smoke
    { t: 124, pos: at('halden', [-2.4, 0.5, -1.0]), look: at('halden', [0, 1.5, 0]), fov: 34 },
    { t: 129.3, pos: head('ron', [1.2, 0.08, 0.0]), look: head('ron'), fov: 24 },
    { t: 133.5, pos: mid('ron', 'halden', [0, 0.9, -3.0]), look: mid('ron', 'halden', [0, 1.1, 0]), fov: 40 },
    { t: 137.3, ...eye('halden', 0.7, 0.1, 14) },
    { t: 141, pos: at('ron', [-0.6, 0.35, -2.0]), look: at('halden', [0, 2.2, 0]), fov: 46 },
    { t: 143.6, pos: [27.5, 2.4, -1.5], look: [26.9, 2.8, -3.4], fov: 30 }, // the flag, while the radio counts down
    { t: 145.3, pos: mid('ron', 'halden', [0.3, 0.9, -2.0]), look: mid('ron', 'halden', [0, 0.9, 0]), fov: 32, hand: 0.6 },
    { t: 148.0, pos: mid('ron', 'halden', [-0.5, 1.2, -3.6]), look: mid('ron', 'halden', [0, 1, 0]), fov: 44 },
    { t: 148.9, pos: at('ron', [-0.6, 0.35, -2.0]), look: at('halden', [0, 2.2, 0]), fov: 46 },
    { t: 150.1, pos: mid('ron', 'halden', [0, 1.2, -4.0]), look: mid('ron', 'halden', [0, 1, 0]), fov: 52 },
    // ACT III — the enemy of my enemy
    { t: 151.5, pos: [22.5, 1.6, 2.4], look: at('hound', [0, 1.0, 0]), fov: 9 }, // Leone: out of the fire
    { t: 156, pos: at('hound', [-3.0, 0.9, -0.5]), look: at('hound', [0, 1.1, 0]), fov: 30 },
    { t: 158.4, pos: head('halden', [1.0, 0, 0.5]), look: head('halden'), fov: 22 },
    { t: 161.8, pos: head('hound', [-0.9, 0, 0.3]), look: head('hound'), fov: 20 },
    { t: 165, pos: at('ron', [1.6, 0.4, 1.5]), look: at('ron', [0, 0.8, 0]), fov: 38 },
    // the triello: wide, mediums, then the eyes, faster and faster
    { t: T.triello, pos: mid('ron', 'hound', [0, 6.5, 4.2]), look: mid('ron', 'hound', [0, 0, 0.4]), fov: 40 },
    { t: 171, orbit: { c: at('halden', [0, 1, 0]), r: 5, h: 0.2, a: [1.0, 2.0] }, fov: 36 },
    { t: 174, pos: at('ron', [2.2, 0.8, 0.8]), look: at('ron', [0, 1.1, 0]), fov: 28 },
    { t: 176, pos: at('hound', [-2.2, 0.8, -0.8]), look: at('hound', [0, 1.1, 0]), fov: 28 },
    { t: 177.6, pos: at('halden', [-1.6, 0.8, -1.6]), look: at('halden', [0, 1.2, 0]), fov: 26 },
    { t: 178.7, ...eye('ron') }, { t: 179.5, ...eye('hound', 0.7, -0.16) }, { t: 180.2, ...eye('halden') },
    { t: 180.8, ...eye('ron', 0.6, 0.06, 11) }, { t: 181.2, ...eye('hound', 0.6, -0.14, 11) }, { t: 181.6, ...eye('halden', 0.6, 0.06, 11) },
    { t: T.fire3, pos: mid('ron', 'hound', [0, 1.4, -4.0]), look: mid('ron', 'hound', [0, 1, 0.5]), fov: 58 },
    { t: 184.0, pos: at('halden', [-3, 0.4, -2]), look: at('halden', [0, 2.0, 0]), fov: 50, hand: 0.5 },
    { t: 185.6, pos: at('ron', [-2.2, 1.0, -2.0]), look: at('ron', [0, 0.9, 0]), fov: 46, hand: 1 },
    { t: 187.0, pos: mid('ron', 'halden', [0, 1.0, -2.6]), look: mid('ron', 'halden', [0, 1, 0]), fov: 36, hand: 0.4 },
    { t: 189.0, orbit: { c: at('halden', [0, 1, 0]), r: 4.2, h: 0.5, a: [-2.2, 0.6] }, fov: 40, hand: 0.3 }, // Spielberg: one long take round the three
    { t: 196.0, pos: mid('hound', 'halden', [0, 1.0, 2.6]), look: mid('hound', 'halden', [0, 1, 0]), fov: 36 },
    { t: 198.5, pos: mid('ron', 'halden', [0.2, 0.9, -2.1]), look: mid('ron', 'halden', [0, 0.9, 0]), fov: 32, hand: 0.5 },
    { t: 200.0, pos: at('karl', [-1.0, 0.7, -1.0]), look: at('halden', [0, 1, 0]), fov: 34 },
    { t: 201, pos: [20, 1.2, 3.6], look: at('halden', [0, 1, 0]), fov: 46 },
    { t: 204.8, pos: at('halden', [-6, 4.5, -3.6]), look: at('halden', [0, 1.5, 0]), fov: 55 },
    { t: 207.5, pos: at('ron', [1.6, 0.35, 1.4]), look: at('ron', [0, 1.0, 0]), fov: 40, hand: 0.6 },
    { t: 210.8, pos: at('karl', [-2.2, 0.6, -2.4]), look: at('halden', [0, 1.0, 0]), fov: 44 },
    { t: 213.4, pos: at('karl', [0.5, 0.4, 1.5]), look: at('mia'), fov: 50 },
    { t: 214.6, pos: [22, 1.3, -4.0], look: at('halden', [0, 1, 0]), fov: 52 },
    { t: 216.5, pos: at('halden', [-1.6, 0.4, 2.2]), look: at('halden', [0, 1.3, 0]), fov: 36 },
    { t: 222.5, pos: mid('ron', 'hound', [0, 2.0, -4.3]), look: mid('ron', 'hound', [0, 0.9, 0]), fov: 66 }, // Seven Samurai: the two walk in
    { t: 226.5, pos: at('ron', [-1.8, 0.7, -1.2]), look: at('halden', [0, 1.1, 0]), fov: 34 },
    { t: 229, pos: at('hound', [1.8, 0.7, 1.2]), look: at('halden', [0, 1.1, 0]), fov: 34 },
    { t: 231, ...eye('halden') }, { t: 232.2, ...eye('ron') }, { t: 233.0, ...eye('hound', 0.7, -0.16) },
    { t: 233.8, pos: mid('ron', 'hound', [0, 0.6, -4.0]), look: at('halden', [0, 1, 0]), fov: 40 },
    { t: 235.6, pos: at('halden', [0, 0.35, -4.5]), look: at('halden', [0, 1.0, 0]), fov: 52 }, // the cross, slowed down
    { t: 238.4, pos: at('halden', [-0.5, 1.0, -4.0]), look: at('halden', [0, 0.9, 0]), fov: 44 }, // Kurosawa: the pause
    { t: 241.3, pos: at('halden', [-1.6, 0.6, -1.4]), look: at('halden', [0, 1.0, 0]), fov: 36 },
    { t: 242.5, pos: at('halden', [-3, 0.5, -2.5]), look: at('halden', [0, 6, 0]), fov: 50 },
    { t: 243.4, pos: at('ron', [2.6, 1.1, -2.6]), look: at('halden', [0, 0.8, 0]), fov: 42 },
    { t: 245, pos: [27.5, 2.4, -1.5], look: [26.9, 2.8, -3.4], fov: 30 },
    // ACT IV — dawn
    { t: 249.2, pos: [40, 1.7, 0], look: [0, 1.2, 0], fov: 36 }, // Kubrick again, the sun coming up
    { t: 252, pos: mid('ron', 'hound', [0, 1.1, -3.2]), look: mid('ron', 'hound', [0, 1.1, 0]), fov: 34 },
    { t: 255, pos: at('ron', [1.4, 1.45, -0.8]), look: at('hound', [0, 1.1, 0]), fov: 30 },
    { t: 258.5, pos: at('hound', [-1.4, 1.45, 0.8]), look: at('ron', [0, 1.1, 0]), fov: 30 },
    { t: 262, ...eye('hound', 0.8, 0.1, 16) },
    { t: 263.5, pos: at('ron', [2.0, 1.0, 0.2]), look: at('hound', [0, 1.0, 0]), fov: [24, 12] },
    { t: 266.5, pos: at('karl', [1.4, 0.8, 1.6]), look: at('karl', [0, 1.1, 0]), fov: 34 },
    { t: 269, pos: at('ron', [-2.0, 0.7, 0.8]), look: at('ron', [0, 1.1, 0]), fov: 30 },
    { t: 272, pos: at('ron', [-1.6, 0.4, 1.8]), look: at('mia'), fov: 46 },
    { t: 276, pos: mid('ron', 'karl', [-2.6, 0.9, 1.6]), look: mid('ron', 'karl', [0, 1.0, 0]), fov: 36 },
    { t: 280, pos: [at('ron', [-3.0, 0.8, 2.4]), at('ron', [-7.0, 5.5, 2.8])], look: [at('ron', [0, 1, 0]), at('ron', [-8, 2, 0])], fov: 40 },
  ],

  // ---------------------------------------------------------------- the words
  lines: {
    zh: [
      [6, 10, 'hq', '全部隊注意，停火協議將在五分鐘後生效。重複，五分鐘後。'],
      [12, 14.8, 'karl', '你這一身傷，還要親自走過去？'],
      [15, 17.5, 'ron', '說好了，要親眼看它簽下去。'],
      [19, 22, 'mia', '我在上面看著你們兩個老頭，別走散了。'],
      [22.3, 23.5, 'karl', '誰是老頭。'],
      [27, 30, 'ron', '卡爾，戰爭結束以後，你要做什麼？'],
      [30.3, 32.2, 'karl', '回家。種番茄。'],
      [32.5, 34, 'ron', '……番茄。'],
      [40, 41.8, 'hq', '三分鐘。'],
      [47, 49.5, 'guard', '停下！再往前一步就開火！'],
      [50, 52.4, 'ron', '我們是來見證停火的。'],
      [55.4, 56.9, 'guard', '……放下槍。'],
      [63, 65, 'karl', '不是我們打的！'],
      [65.5, 68, 'mia', '上面！有東西從雲裡下來了！'],
      [76, 80, 'halden', '停火？戰爭是生意，而生意……永遠不會停。'],
      [81, 82.2, 'ron', '住手！'],
      [101.6, 104.6, 'mia', '被打中了！旋翼受損，我得先撤！'],
      [102.0, 103.0, 'ron', '米雅！'],
      [114, 116.4, 'karl', '洛恩，快起來……！'],
      [122, 125.5, 'halden', '你知道這座城，為什麼燒了十年嗎？'],
      [126, 129, 'halden', '因為每一發子彈，都有人付錢。'],
      [129.5, 133, 'halden', '同盟、聯合，兩邊的帳單，都寄到奧林。'],
      [134, 137, 'ron', '……所以停火，礙著你的生意了。'],
      [137.5, 141, 'halden', '停火的那一天，就是奧林破產的那一天。'],
      [143.6, 145.2, 'hq', '一分鐘後停火生效。'],
      [146, 148, 'ron', '……還、沒、完……'],
      [155, 158, 'hound', '奧林養的狗，也會咬主人。'],
      [158.5, 161.5, 'halden', '黑犬……你不是已經死在這條街上了？'],
      [162, 164.5, 'hound', '死過一次的人，最難殺。'],
      [170, 173.5, 'halden', '三個人，只有一個能活著走出這條街。'],
      [175, 177.5, 'hound', '洛恩，這次我不跟你打。'],
      [178, 179.6, 'ron', '……那就一起。'],
      [201, 203.5, 'mia', '我回來了！給我三十秒！'],
      [214.5, 217, 'mia', '還沒完呢，哈爾登！'],
      [217.5, 221, 'halden', '愚蠢……停火什麼都改變不了！'],
      [226.5, 230.5, 'hq', '停火協議生效倒數，十、九、八……'],
      [244.5, 247.5, 'hq', '……停火協議，生效。'],
      [252, 253.8, 'ron', '你要去哪？'],
      [254.3, 258, 'hound', '去找真正該打的仗。奧林還沒倒。'],
      [258.8, 261.6, 'ron', '下次見面，別再是敵人。'],
      [262, 264.5, 'hound', '……那要看你了，鐵鴉。'],
      [267, 268.6, 'karl', '結束了嗎？'],
      [269, 271, 'ron', '這一場，結束了。'],
      [272, 275.5, 'mia', '回家吧。我請你們喝一杯——這次是真的。'],
      [276, 277.8, 'ron', '……還有番茄。'],
      [278, 279, 'karl', '哈。'],
    ],
    en: [
      [6, 10, 'hq', 'All units: the ceasefire comes into force in five minutes. Repeat, five minutes.'],
      [12, 14.8, 'karl', 'In that state, and you still want to walk it yourself?'],
      [15, 17.5, 'ron', 'I said I’d see it signed with my own eyes.'],
      [19, 22, 'mia', 'I’ve got you two old men from up here. Don’t wander off.'],
      [22.3, 23.5, 'karl', 'Who’s old.'],
      [27, 30, 'ron', 'Karl, when the war’s over, what will you do?'],
      [30.3, 32.2, 'karl', 'Go home. Grow tomatoes.'],
      [32.5, 34, 'ron', '...Tomatoes.'],
      [40, 41.8, 'hq', 'Three minutes.'],
      [47, 49.5, 'guard', 'Halt! One more step and we fire!'],
      [50, 52.4, 'ron', 'We came to see the ceasefire.'],
      [55.4, 56.9, 'guard', '...Lower your weapons.'],
      [63, 65, 'karl', 'That wasn’t us!'],
      [65.5, 68, 'mia', 'Above you! Something’s coming down out of the cloud!'],
      [76, 80, 'halden', 'A ceasefire? War is a business, and business... never stops.'],
      [81, 82.2, 'ron', 'Stop!'],
      [101.6, 104.6, 'mia', 'I’m hit! Rotor damage, I have to pull out!'],
      [102.0, 103.0, 'ron', 'Mia!'],
      [114, 116.4, 'karl', 'Ron, get up...!'],
      [122, 125.5, 'halden', 'Do you know why this city has burned for ten years?'],
      [126, 129, 'halden', 'Because every round fired is paid for.'],
      [129.5, 133, 'halden', 'Alliance, Union: both sides’ bills come to Orrin.'],
      [134, 137, 'ron', '...So the ceasefire is bad for business.'],
      [137.5, 141, 'halden', 'The day the guns stop is the day Orrin goes under.'],
      [143.6, 145.2, 'hq', 'One minute to the ceasefire.'],
      [146, 148, 'ron', '...It’s... not... over...'],
      [155, 158, 'hound', 'Orrin’s dogs can bite the hand too.'],
      [158.5, 161.5, 'halden', 'Hound... didn’t you die in this street?'],
      [162, 164.5, 'hound', 'A man who’s died once is the hardest to kill.'],
      [170, 173.5, 'halden', 'Three of us. Only one walks out of this street.'],
      [175, 177.5, 'hound', 'Ron. This time I’m not fighting you.'],
      [178, 179.6, 'ron', '...Then together.'],
      [201, 203.5, 'mia', 'I’m back! Give me thirty seconds!'],
      [214.5, 217, 'mia', 'It isn’t over, Halden!'],
      [217.5, 221, 'halden', 'Fools... a ceasefire changes nothing!'],
      [226.5, 230.5, 'hq', 'Ceasefire in ten, nine, eight...'],
      [244.5, 247.5, 'hq', '...The ceasefire is in force.'],
      [252, 253.8, 'ron', 'Where will you go?'],
      [254.3, 258, 'hound', 'To find the war worth fighting. Orrin isn’t finished.'],
      [258.8, 261.6, 'ron', 'Next time, let’s not be enemies.'],
      [262, 264.5, 'hound', '...That’s up to you, Raven.'],
      [267, 268.6, 'karl', 'Is it over?'],
      [269, 271, 'ron', 'This one is.'],
      [272, 275.5, 'mia', 'Let’s go home. Drinks are on me — for real this time.'],
      [276, 277.8, 'ron', '...And tomatoes.'],
      [278, 279, 'karl', 'Ha.'],
    ],
  },

  // ---------------------------------------------------------------- the rest of what is seen and heard
  cues: [
    ...[61, 82, 145.5, 150.4, 182.9, 192.3, 214.8, 236.95, 243.0].map((t, i) => ({ t, kind: 'flash', k: [0.4, 0.25, 0.35, 0.35, 0.3, 0.35, 0.35, 0.5, 0.5][i] })),
    ...[[61, 0.15], [74, 0.14], [89.6, 0.06], [110.2, 0.08], [111.2, 0.06], [116.0, 0.05], [145.5, 0.08], [150.4, 0.1], [192.3, 0.08], [214.8, 0.12], [236.95, 0.1], [243.0, 0.25]].map(([t, k]) => ({ t, kind: 'shake', k })),
    { t: 83.0, kind: 'explosion', at: 'guard2.chest', k: 1.3 },
    { t: 192.35, kind: 'explosion', at: 'halden.shoulderR', k: 0.5 },
    { t: 192.3, t1: 243, kind: 'smoke', at: 'halden.shoulderR' }, { t: 214.9, t1: 243, kind: 'smoke', at: 'halden.chest' },
    { t: 215, t1: 243, kind: 'sparks', every: 0.45, at: 'halden.chest', k: 0.3 },
    { t: 101.3, t1: 108, kind: 'smoke', at: 'mia.body' }, { t: 212, t1: 300, kind: 'smoke', at: 'mia.body' }, { t: 101.3, t1: 107, kind: 'sparks', every: 0.3, at: 'mia.body', k: 0.3 },
    { t: 112, t1: 300, kind: 'sparks', every: 0.7, at: 'ron.shoulderR', k: 0.22 },
    { t: 240.6, kind: 'sparks', at: 'halden.chest', k: 1.2 }, { t: 241.4, kind: 'explosion', at: 'halden.chest', k: 0.6 },
    { t: T.pod, kind: 'pod', at: { actor: 'halden', part: 'head', off: [0, 0.2, 0] }, v: [-0.6, 6.5, 1.0] },
    { t: T.boomEnd, kind: 'explosion', at: { actor: 'halden', part: 'chest', off: [0, 0.2, 0] }, k: 2.2 },
    { t: 243.5, kind: 'fire', at: { actor: 'halden', part: 'root', off: [0.5, 0.25, 0] }, k: 0.8 },
    { t: 236.95, t1: 237.3, kind: 'arc', a: 'ron.tipL', b: 'halden.chest', n: 2, spread: 0.6 },
    ...[5.9, 39.9, 143.5, 226.4, 244.4].map((t) => ({ t, kind: 'snd', name: 'radio' })),
  ],

  // ---------------------------------------------------------------- the music
  music: [
    // the walk: a slow, sad tune over low strings
    { pad: 'CB', n: 'D1', t: 0, d: 12, g: 0.4 }, { pad: 'VC', n: 'D2', t: 0.5, d: 11, g: 0.3 }, { pad: 'VA', n: 'A2', t: 2, d: 10, g: 0.22 }, { hit: 'gong', t: 0.8, g: 0.22 },
    { pad: 'CB', n: 'Bb0', t: 12, d: 10, g: 0.4 }, { pad: 'VC', n: 'F2', t: 12, d: 10, g: 0.3 }, { pad: 'VA', n: 'D3', t: 12.5, d: 9.5, g: 0.22 },
    { pad: 'CB', n: 'G1', t: 22, d: 12, g: 0.4 }, { pad: 'VC', n: 'D2', t: 22, d: 12, g: 0.3 }, { pad: 'VA', n: 'Bb2', t: 22.5, d: 11, g: 0.22 },
    { line: 'HN', g: 0.28, notes: [['A3', 8, 1.4], ['D4', 9.6, 1.2], ['F4', 11, 2.2], ['E4', 13.6, 0.8], ['D4', 14.6, 0.8], ['C4', 15.6, 2.2], ['D4', 18.2, 1.2], ['A3', 19.6, 2.6],
      ['Bb3', 23, 1.2], ['A3', 24.4, 0.8], ['G3', 25.4, 0.8], ['F3', 26.4, 1.8], ['G3', 28.6, 1.2], ['A3', 30, 3.2]] },
    { pad: 'CB', n: 'A0', t: 34, d: 12, g: 0.4 }, { pad: 'VC', n: 'E2', t: 34, d: 12, g: 0.28 }, { pad: 'VN', n: 'C#4', t: 36, d: 10, g: 0.16 },
    // the standoff: a held low tremble, a slow tick in the timpani
    { pad: 'VCt', n: 'D2', t: 46, d: 12, g: 0.35 }, { pad: 'CB', n: 'D1', t: 46, d: 12, g: 0.35 }, { pad: 'VNt', n: 'A4', t: 50, d: 7.6, g: 0.18 },
    ...[46, 47.5, 49, 50.5, 52, 53.4, 54.8, 56.1, 57.3].map((t) => ({ hit: 'timp', t, g: 0.3 })),
    // the missile, the prototype coming down
    { stab: 'D', t: 61, g: 1.1 }, { hit: 'gong', t: 61, g: 0.4 },
    { pad: 'TB', n: 'D2', t: 70, d: 4, g: 0.35 }, { pad: 'TU', n: 'D1', t: 70, d: 4, g: 0.4 }, { pad: 'HN', n: 'Eb3', t: 71, d: 3, g: 0.25 }, { hit: 'roll', t: 71, g: 0.45 },
    { stab: 'D', t: 74, g: 1.2 }, { hit: 'gong', t: 74, g: 0.5 }, { pad: 'VCt', n: 'D2', t: 74.5, d: 5.5, g: 0.35 }, { pad: 'HN', n: 'Eb3', t: 76, d: 4, g: 0.22 },
    // fight one and two
    { drive: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb'], t: 80.4, t1: 96, build: 0 },
    ...[82, 88, 89.6, 92.8, 95.1].map((t) => ({ stab: 'D', t, g: 0.8 })),
    { pad: 'VNt', n: 'D5', t: 97, d: 4.5, g: 0.35 }, { pad: 'VNt', n: 'A5', t: 98.5, d: 3, g: 0.25 }, { hit: 'susp', t: 98.8, g: 0.3 }, { stab: 'Eb', t: 101.3, g: 1.0 },
    { drive: ['Dm', 'C', 'Bb', 'A', 'Dm'], t: 105.4, t1: 117, build: 1 },
    ...[107.8, 109.4, 110.2, 116].map((t) => ({ stab: 'D', t, g: 0.8 })),
    // the speech: a low drone, a slow clock speeding up to the swing
    { pad: 'CB', n: 'D1', t: 117.5, d: 28, g: 0.35 }, { pad: 'VC', n: 'A1', t: 117.5, d: 28, g: 0.22 }, { pad: 'HN', n: 'Eb3', t: 126, d: 6, g: 0.16 }, { pad: 'HN', n: 'D3', t: 133, d: 8, g: 0.16 },
    ...[118, 120.4, 122.6, 124.6, 126.4, 128, 129.4, 130.6, 131.7, 132.7, 133.6, 134.4, 135.1, 135.7, 136.3, 136.9, 137.5, 138.1, 138.7, 139.3, 139.9, 140.5, 141.1, 141.7, 142.3, 142.9, 143.5, 144.1, 144.7].map((t) => ({ hit: 'timp', t, g: 0.22 })),
    { pad: 'VNt', n: 'Eb5', t: 141, d: 4.5, g: 0.3 }, { stab: 'D', t: T.swing, g: 1.2 }, { pad: 'VCt', n: 'D2', t: 145.5, d: 4.8, g: 0.4 },
    // the Hound: a lonely horn call over a trembling string
    { stab: 'D', t: 150.4, g: 1.0 },
    { pad: 'VNt', n: 'D5', t: 151, d: 16, g: 0.18 }, { pad: 'CB', n: 'D1', t: 151, d: 16, g: 0.3 },
    { line: 'HN', g: 0.32, notes: [['D4', 152, 1.6], ['A4', 153.8, 2.4], ['G4', 156.4, 0.6], ['A4', 157.1, 0.6], ['F4', 157.8, 1.6], ['E4', 159.6, 0.6], ['D4', 160.3, 3.2]] },
    { line: 'TB', g: 0.25, notes: [['D2', 152, 4], ['Bb1', 156.2, 4], ['A1', 160.4, 6]] },
    // the triello: an ostinato that grows, a clock that runs faster, silence, then the shot
    { pad: 'CB', n: 'D1', t: 168, d: 13.8, g: 0.35 }, { pad: 'VCt', n: 'A2', t: 172, d: 9.8, g: 0.3 }, { pad: 'VNt', n: 'D5', t: 176, d: 5.8, g: 0.3 }, { pad: 'VNt', n: 'A5', t: 178.5, d: 3.3, g: 0.25 },
    ...[168, 169.8, 171.4, 172.8, 174, 175, 175.9, 176.7, 177.4, 178, 178.6, 179.1, 179.6, 180.0, 180.4, 180.8, 181.1, 181.4].map((t) => ({ hit: 'timp', t, g: 0.26 })),
    { hit: 'susp', t: 179.2, g: 0.35 },
    { stab: 'D', t: T.fire3, g: 1.3 }, { hit: 'gong', t: T.fire3, g: 0.5 },
    // fight three: everything
    { drive: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm'], t: 182.6, t1: 217.4, build: 1 },
    ...[187.8, 189.9, 192.3, 197.2, 198.8, 200.1, 207, 213.2, 214.8].map((t) => ({ stab: 'D', t, g: 0.85 })),
    // the walk in: the heroic tune, slow, in the brass
    { pad: 'CB', n: 'D1', t: 217.6, d: 18.5, g: 0.35 }, { pad: 'VC', n: 'A1', t: 217.6, d: 18.5, g: 0.25 }, { pad: 'VA', n: 'F2', t: 222, d: 14, g: 0.2 },
    { line: 'HN', g: 0.34, notes: [['D3', 222, 1.2], ['F3', 223.3, 0.6], ['A3', 224, 2.0], ['G3', 226.2, 0.6], ['F3', 226.9, 0.6], ['E3', 227.6, 2.0], ['D3', 229.8, 1.2], ['A3', 231.1, 2.4], ['D4', 233.6, 2.4]] },
    { line: 'TB', g: 0.28, notes: [['D2', 222, 4], ['C2', 226.2, 3.6], ['Bb1', 229.8, 3.6], ['A1', 233.6, 2.4]] },
    ...[222, 223.6, 225.2, 226.8, 228.4, 230.0, 231.6, 233.2, 234.4, 235.2].map((t) => ({ hit: 'taiko', t, g: 0.45 })),
    // slowed down: only a high tremble; then nothing at all
    { pad: 'VNt', n: 'D5', t: 236.6, d: 1.8, g: 0.4 }, { pad: 'VNt', n: 'A5', t: 236.7, d: 1.7, g: 0.3 },
    { tutti: 'Dm', t: T.boomEnd, d: 3.8, g: 1.0 }, { hit: 'gong', t: T.boomEnd, g: 0.7 },
    // dawn
    { tutti: 'D', t: 249.2, d: 14, g: 0.4, soft: true },
    { line: 'HN', g: 0.3, notes: [['A3', 250, 1.6], ['D4', 251.8, 1.4], ['F#4', 253.4, 2.6], ['E4', 256.2, 0.8], ['D4', 257.1, 0.8], ['C#4', 258, 1.6], ['D4', 259.8, 3.2]] },
    { tutti: 'Bb', t: 263.4, d: 7, g: 0.35, soft: true }, { tutti: 'D', t: 270.6, d: 10, g: 0.38, soft: true },
    { line: 'HN', g: 0.3, notes: [['D4', 280.4, 1.4], ['F#4', 282, 1.2], ['A4', 283.4, 3], ['G4', 286.6, 0.8], ['F#4', 287.5, 0.8], ['E4', 288.4, 1.4], ['D4', 290, 3.5]] },
    { tutti: 'D', t: 280.4, d: 13.4, g: 0.45, soft: true }, { hit: 'gong', t: 290.2, g: 0.2 },
  ],
};
