// Episode 1 — 鐵鴉之夜 / Night of the Ravens.
// The night before the truce. Ron walks Raven One towards the ceasefire line; the Black Hound drops from a rooftop.
// The Hound has the better of him: the gun is knocked from his hand and he goes down on one knee. As the blade comes
// up, Mia's helicopter comes in over the rooftops, rockets first. Ron gets up, and they finish it together.
//
// A story is only data: who is in it (characters from js/cast/characters.js), where they start, what each one does
// and when (the moves in js/core/actions.js), the camera's shots, the words, a few extra cues and the music.
// To write another episode, copy this file, change it, and point index.html's ?ep= (or film.js) at it.
const BLOCK = { s: -1.35, e: -1.2 };
const mid = (off) => ({ mid: ['ron', 'hound'], off });
const at = (actor, off) => ({ at: actor, off });

export const T = {
  stop: 6.6, land: 7.1, raise: 9.05, burst1: 9.5, burst2: 10.9, missile1: 10.6, missile2: 10.78, boom1: 12.25, boom2: 12.45,
  leap: 12.0, leapLand: 12.6, charge: 13.9, clash: 15.4, shove: 16.4, parry: 17.4, disarm: 18.2, beatDown: 19.0, cut: 19.8, kneel: 20.1,
  raiseBlade: 21.3, rockets: 22.0, rocketsHit: 22.55, heliOver: 23.2, gun1: 23.6, hMissile: 25.0, flares: 25.3, decoy: 25.9, rise: 25.7,
  charge2: 27.1, counter: 28.6, armOff: 28.7, gun2: 29.8, jump: 30.0, strike: 31.4, land2: 31.65, boomA: 32.2, boomB: 33.1, fall: 33.15, spot: 34.0,
};

export default {
  id: 'ep1', LEN: 40, T,
  title: { zh: ['鋼魂戰線', '鐵鴉之夜', '2097．艾瑞斯島．停戰前夜'], en: ['IRON FRONT', 'Night of the Ravens', '2097 · Ares Island · The night before the truce'] },
  end: { zh: ['鋼魂戰線　鐵鴉之夜', '第一幕　完'], en: ['IRON FRONT — Night of the Ravens', 'End of Act One'] },
  // the street (js/set.js) and what burns in it
  set: { kind: 'street', fires: [{ at: [-10.6, 0.5, -2.3], k: 1 }], columns: [[30, 0, -26], [-34, 0, 24], [58, 0, 12], [-62, 0, -20], [14, 0, 34]], embers: 160 },

  actors: [
    {
      id: 'ron', who: 'ron', start: [-13, 0], stance0: 0, face: 'hound',
      track: [
        { do: 'face', t: 0, t1: 6.9, yaw: Math.PI / 2, blend: 0.7 }, // down the street, until the Hound lands
        { do: 'walk', t: 0, t1: T.stop, v: [1.15, 0], stop: 0.8 },
        { do: 'stance', t: 6.9, t1: 7.6, k: 1 },
        // the firefight: the gun comes up, two bursts while side-stepping, then the jump back from the missiles
        { do: 'p', t: T.raise, t1: 12.3, set: { aim: 1 }, ramp: 0.4 },
        { do: 'move', t: 9.4, t1: 11.6, d: [0, -1.0] },
        { do: 'burst', t: T.burst1, n: 10, rate: 0.08, target: 'hound' },
        { do: 'burst', t: T.burst2, n: 9, rate: 0.08, target: 'hound', hits: [2, 4] },
        { do: 'jump', t: T.leap, t1: T.leapLand, h: 0.55, d: [-1.6, 0], jets: 1 },
        { do: 'p', t: 12.2, t1: 13.6, set: { guard: 0.8 }, shape: 'bump' },
        { do: 'react', t: T.boom1, part: 'head', k: 0.35 }, { do: 'react', t: T.boom2, part: 'head', k: 0.25 },
        { do: 'move', t: 13.4, t1: 14.6, d: [0, 0.8] },
        { do: 'rod', t: 13.8, t1: 37.6 },
        // the clash, and the Hound has the better of it: shoved back, the gun knocked away, cut, down on one knee
        { do: 'guard', t: 14.6, t1: 17.1, side: 'L', arm: BLOCK },
        { do: 'move', t: T.clash, t1: 15.65, d: [-0.25, 0] }, { do: 'move', t: 15.65, t1: T.shove, d: [-0.2, 0] },
        { do: 'p', t: T.clash, t1: T.shove, set: { crouch: 0.35, lean: 0.1 }, ramp: 0.15 },
        { do: 'move', t: T.shove, t1: 16.9, d: [-0.55, 0] }, { do: 'react', t: 16.45, part: 'body', k: 0.7 },
        { do: 'arm', side: 'L', keys: [[17.05, -1.35, -1.2, -0.5], [17.35, -1.5, -1.4, -0.5], [17.65, -1.4, -1.25, -0.5]] },
        { do: 'p', t: 17.05, t1: 17.8, set: { twist: 0.3 }, shape: 'bump' },
        { do: 'react', t: T.disarm, part: 'armR', k: 1.3 }, { do: 'disarm', t: T.disarm + 0.02, slot: 'wR', v: [-1.6, 2.8, -1.4] },
        { do: 'arm', side: 'L', keys: [[18.6, -1.4, -1.2, -0.5], [18.92, -2.6, -0.7, -0.5], [19.2, -2.3, -0.9, -0.4], [19.5, -1.4, -1.2, -0.4]] },
        { do: 'p', t: T.beatDown, t1: 19.7, set: { crouch: 0.55 }, shape: 'bump' },
        { do: 'react', t: T.cut, part: 'body', k: 1.4, decay: 2 }, { do: 'move', t: T.cut, t1: 20.3, d: [-0.6, 0] },
        { do: 'kneel', t: T.kneel, t1: 26.3, ramp: 0.45 },
        { do: 'arm', side: 'L', keys: [[20.7, -0.6, -0.9, 0], [21.8, -1.1, -1.3, -0.3], [22.45, -1.3, -1.4, -0.4], [23.0, -0.9, -1.1, -0.2]] },
        { do: 'lookat', t: 22.9, t1: 25.2, to: 'mia' },
        // up again, and at him
        { do: 'p', t: T.rise, t1: 26.8, set: { crouch: 0.35 }, shape: 'bump' },
        { do: 'charge', t: T.charge2, t1: 28.5, to: 'hound', gap: 0.95, jets: 0.9, hover: 0.02, skate: false, armBack: false },
        { do: 'blow', t: T.counter, style: 'upper', arm: 'L', result: 'hit', target: 'hound', part: 'shoulderR', close: false, k: 1.3 },
        { do: 'move', t: 29.0, t1: 29.5, d: [-0.25, 0] },
        { do: 'jump', t: T.jump, t1: T.land2, h: 1.55, d: [1.0, 0], jets: 1.2, burn: 0.7, land: 0.9, recover: 1.2, lean: -0.1 },
        { do: 'arm', side: 'L', keys: [[29.6, 0.3, -0.4, 0], [30.4, -2.95, -0.45, -0.4], [31.18, -2.95, -0.45, -0.4], [T.strike, -0.75, -0.2, 0], [32.6, -0.75, -0.2, 0], [33.4, -0.5, -0.9, 0]] },
        { do: 'p', t: 31.15, t1: 31.7, set: { lean: 0.3, headKick: -0.25 }, shape: 'bump' },
        { do: 'p', t: 28.9, t1: 30.0, set: { crouch: 0.8 }, shape: 'bump' },
        { do: 'p', t: T.land2, t1: 33.0, set: { crouch: 0.35 }, shape: 'out' },
        { do: 'lookat', t: 34.0, t1: 37.0, to: 'mia' },
        { do: 'p', t: 37.2, t1: 39.0, set: { look: -0.35 }, shape: 'in' },
      ],
    },
    {
      id: 'hound', who: 'hound', start: [3.5, 5.05], floor: [[0, 5], [6.3, 0]], face: 'ron',
      track: [
        { do: 'p', t: 0, t1: 6.3, set: { crouch: 0.2, lean: 0.12, headKick: -0.25 }, ramp: 0.01 },
        { do: 'drop', t: 6.3, t1: T.land, from: [3.5, 5, 5.05], to: [3.5, 0.4] },
        { do: 'arm', side: 'R', keys: [[0, -0.2, -0.4, 0], [6.25, -0.2, -0.4, 0], [6.45, 0.4, -0.3, 0], [7.1, 0.4, -0.3, 0], [7.6, -0.6, -0.5, 0.3], [9.2, -0.6, -0.5, 0.3]] },
        { do: 'p', t: 7.8, t1: 9.0, set: { headKick: 0.2, roll: 0.08 }, shape: 'bump' },
        // out of the line of fire on the jets, two missiles back, two rounds in the shoulder
        { do: 'move', t: 9.5, t1: 10.2, d: [0, 1.4] }, { do: 'jets', t: 9.45, t1: 10.3, shape: 'bump' },
        { do: 'p', t: 9.45, t1: 10.3, set: { crouch: 0.5, lean: 0.15, roll: -0.15 }, shape: 'bump' },
        { do: 'missile', t: T.missile1, to: [-4.5, 0.15, -0.65], at: T.boom1, side: 1.6, boom: 1.35 },
        { do: 'missile', t: T.missile2, to: [-5.3, 0.15, -1.6], at: T.boom2, side: -1.2, boom: 1.1 },
        { do: 'react', t: 11.26, part: 'armL', k: 0.45 }, { do: 'react', t: 11.42, part: 'armL', k: 0.45 },
        { do: 'move', t: 11.6, t1: 12.4, d: [0, -0.6] },
        // the charge and the clash; the blade held against the rod; the shove
        { do: 'charge', t: T.charge, t1: T.clash, to: 'ron', gap: 1.1 },
        { do: 'blow', t: T.clash, style: 'side', result: 'clash', target: 'ron', against: 'tipL', close: false, k: 1.4, bind: 1.0 },
        { do: 'arm', side: 'R', keys: [[T.clash, -1.45, -0.2, 1.1], [T.shove, -1.45, -0.2, 1.1]], blendIn: 0.02 },
        { do: 'p', t: T.clash, t1: T.shove, set: { lean: 0.3, crouch: 0.3, twist: -0.6 }, ramp: 0.1 },
        { do: 'anchor', t: T.clash, t1: 22.4, to: 'ron', dist: 1.1, blend: 0.05 },
        { do: 'arm', side: 'L', keys: [[16.2, -0.6, -1.0, 0], [16.45, -1.6, -0.1, 0], [16.8, -0.6, -0.9, 0]] },
        { do: 'p', t: 16.25, t1: 16.75, set: { lean: 0.35 }, shape: 'bump' },
        { do: 'dist', t: T.shove, t1: 16.9, d: 0.5 },
        { do: 'blow', t: T.parry, style: 'side', result: 'clash', target: 'ron', against: 'tipL' },
        { do: 'blow', t: T.disarm, style: 'thrust', result: 'hit', target: 'ron', part: 'shoulderR' },
        { do: 'blow', t: T.beatDown, style: 'over', result: 'clash', target: 'ron', against: 'tipL', k: 1.2, lean: 0.2 },
        { do: 'blow', t: T.cut, style: 'side', result: 'hit', target: 'ron', part: 'chest', k: 1.3 },
        // standing over him, the blade going up for the last blow...
        { do: 'dist', t: 20.4, t1: 21.4, d: -0.25 },
        { do: 'arm', side: 'R', keys: [[T.raiseBlade, -0.6, -0.5, 0.3], [22.1, -2.9, -0.35, 0.2], [22.5, -3.0, -0.3, 0.2]], blendOut: 0.35 },
        { do: 'p', t: T.raiseBlade, t1: 22.5, set: { lean: -0.1, twist: -0.2 }, shape: 'in' },
        { do: 'p', t: 22.5, t1: 22.9, set: { lean: -0.1, twist: -0.2 }, shape: 'out' },
        // ...when the rockets hit. Thrown back; the helicopter's gun; a missile at it, lost in the flares
        { do: 'pin', t: 22.4 },
        { do: 'react', t: 22.6, part: 'body', k: 1.3 }, { do: 'react', t: 22.85, part: 'armL', k: 0.8 },
        { do: 'move', t: 22.6, t1: 23.4, d: [1.2, 0.3] },
        { do: 'face', t: 24.0, t1: 27.8, to: 'mia', blend: 0.5 },
        { do: 'p', t: 23.5, t1: 24.6, set: { guard: 0.9 } },
        { do: 'react', t: 23.8, part: 'body', k: 0.4 }, { do: 'react', t: 24.1, part: 'armL', k: 0.4 },
        { do: 'missile', t: T.hMissile, to: [-0.6, 3.1, -3.7], at: T.decoy, side: 1.0, arc: 1.2, boom: 0.9 },
        // Ron comes at him; the arm comes off; the last blow from above; down, and gone
        { do: 'arm', side: 'R', keys: [[28.0, -0.6, -0.5, 0], [28.45, -1.6, -0.4, 0.6]] },
        { do: 'react', t: T.counter, part: 'armR', k: 1.4 }, { do: 'sever', t: T.armOff, part: 'armR', v: [1.3, 3.4, 1.5] },
        { do: 'move', t: 29.0, t1: 29.8, d: [0.8, 0] },
        { do: 'p', t: 29.0, t1: 31.4, set: { sway: 0.6, crouch: 0.12 } },
        { do: 'arm', side: 'L', keys: [[30.6, -0.3, -0.6, 0], [31.2, -1.5, -1.5, 0]], blendOut: 0.1 },
        { do: 'react', t: T.strike, part: 'head', k: 1.0 }, { do: 'look', t: T.strike, w: 0 },
        { do: 'p', t: T.strike, t1: 40, set: { lean: -0.2 }, ramp: 0.3 },
        { do: 'kneel', t: 31.5, t1: 40, ramp: 0.8 },
        { do: 'die', t: T.boomB }, { do: 'fall', t: T.fall, t1: 33.9 },
      ],
    },
    {
      id: 'mia', who: 'mia', start: [-40, -6, 10],
      track: [
        { do: 'fly', keys: [[0, -60, 11, -6], [20.0, -40, 11, -6], [21.6, -27, 10, -4], [22.4, -19, 8, -3], [23.2, -10, 5.6, -2.2], [24.0, -4.6, 4.3, -2.7], [25.0, -1.6, 4.0, -3.2],
          [26.0, 0.8, 5.2, -1.2], [27.0, 0.6, 5.0, 1.4], [28.5, -1.8, 4.7, 2.6], [30.0, -4.0, 4.4, 2.8], [32.0, -6.0, 4.9, 1.6], [34.0, -7.4, 4.3, -0.6], [36.0, -7.9, 3.9, -1.1], [40.0, -8.6, 4.4, -1.0]] },
        { do: 'face', t: 23.4, t1: 33.5, to: 'hound', blend: 0.8 },
        { do: 'face', t: 33.9, t1: 41, to: 'ron', blend: 0.8 },
        { do: 'rockets', t: T.rockets, n: 6, rate: 0.09, target: 'hound', at: T.rocketsHit, spread: 1.3, off: [0.6, 0, 0.2], boom: 0.7 },
        { do: 'burst', t: T.gun1, n: 12, rate: 0.07, target: 'hound', hits: [1, 3, 5, 7, 9], big: true, from: 'gun', fly: 0.15 },
        { do: 'flares', t: T.flares },
        { do: 'burst', t: T.gun2, n: 10, rate: 0.07, target: 'hound', hits: [2, 4, 6], big: true, from: 'gun', fly: 0.15 },
        { do: 'spot', t: T.spot, t1: 41 },
      ],
      // what the chin gun and the searchlight point at
      aim: [[0, 'hound.chest'], [33.5, 'ron.chest']],
    },
  ],

  // ---------------------------------------------------------------- the camera: each shot runs until the next
  shots: [
    { t: 0, pos: [[-26, 5.5, 2.8], [-21, 2.4, 1.6]], look: [[-8, 1.6, 0], [-11, 1.0, 0]], fov: 40 }, // over the street
    { t: 3.5, pos: [at('ron', [-1.1, 0.3, 2.3]), at('ron', [-0.8, 0.3, 2.3])], look: [at('ron', [0.4, 0.22, 0]), at('ron', [0.4, 1.12, 0])], fov: 42 }, // the feet
    { t: 6.0, pos: [-0.6, 0.5, -2.2], look: at('hound', [0, 0.8, 0]), fov: [24, 40] }, // the drop
    { t: 8.0, pos: [at('ron', [2.5, 0.55, -0.7]), at('ron', [2.15, 0.55, -0.7])], look: at('ron', [0, 1.15, 0]), fov: 30 }, // Ron, from the front
    { t: 9.2, pos: [at('ron', [-1.6, 1.45, -0.95]), at('ron', [-1.9, 1.45, -0.95])], look: at('hound', [0, 0.9, 0]), fov: 30 }, // over his shoulder: the guns
    { t: 10.5, pos: [at('hound', [1.9, 1.15, 1.3]), at('hound', [2.2, 1.15, 1.3])], look: at('ron', [0, 0.9, 0]), fov: 38 }, // behind the Hound: the missiles
    { t: 12.0, pos: { fixed: 'ron', time: 12.0, off: [-3.4, 1.4, -1.7] }, look: { fixed: 'ron', time: 12.0, off: [1.5, 0.9, 0.2] }, fov: 50 }, // behind Ron
    { t: 13.4, pos: at('ron', [-0.7, 0.45, -1.5]), look: at('hound', [0, 0.8, 0]), fov: 40 }, // the charge
    { t: T.clash, pos: [mid([0.2, 1.05, -2.9]), mid([0.2, 1.05, -2.4])], look: mid([0, 1.0, 0]), fov: 34 }, // the clash
    { t: 17.0, orbit: { c: mid([0, 0.95, 0]), r: 4.3, h: 0.4, a: [-1.9, -1.0] }, fov: 36 }, // round them: losing
    { t: 20.1, pos: at('ron', [-0.5, 0.35, -2.3]), look: at('hound', [0, 1.6, 0]), fov: 42 }, // up at the blade from behind Ron
    { t: 22.45, pos: mid([-0.8, 1.3, -4.0]), look: mid([0.4, 0.9, 0.4]), fov: 58 }, // the rockets
    { t: 23.3, pos: at('ron', [-1.6, 0.35, 1.6]), look: at('mia', [0, -0.3, 0]), fov: 48 }, // the helicopter overhead
    { t: 25.0, pos: [-3.5, 1.0, -3.9], look: at('mia', [0, -0.4, 0]), fov: 46 }, // the missile and the flares
    { t: 26.7, pos: at('hound', [1.5, 1.35, 1.1]), look: at('ron', [0, 0.9, 0]), fov: 40 }, // Ron gets up and comes on
    { t: 28.55, pos: mid([0.9, 0.55, 2.7]), look: mid([-0.1, 1.0, 0]), fov: 38, roll: 0.1 }, // the counter
    { t: T.jump, pos: { fixed: 'ron', time: T.jump, off: [1.6, 0.3, -2.6] }, look: at('ron', [0, 0.8, 0]), fov: 52 }, // up at the leap
    { t: T.land2, pos: [at('ron', [-2.4, 1.0, -2.8]), at('ron', [-2.8, 1.3, -2.8])], look: at('hound', [0, 0.6, 0]), fov: 40 }, // the end of the Hound
    { t: 34.2, pos: at('ron', [2.6, 0.5, 1.2]), look: at('ron', [-0.3, 1.7, -0.4]), fov: 46 }, // Ron and the helicopter
    { t: 37.2, pos: [at('ron', [3.0, 0.8, 2.2]), at('ron', [6.5, 3.2, 3.2])], look: [at('ron', [0, 1, 0]), at('ron', [-1, 2.2, -0.5])], fov: 40 }, // pulling away
  ],

  // ---------------------------------------------------------------- the words
  lines: {
    zh: [
      [4.0, 6.0, 'hq', '鐵鴉一號，停火線就在兩公里外。走過去，戰爭就結束了。'],
      [6.5, 8.0, 'hound', '結束？戰爭從來不會結束，洛恩。'],
      [8.15, 9.3, 'ron', '那今晚，就由我來結束它。'],
      [16.0, 17.0, 'hound', '你還是一樣天真！'],
      [20.6, 21.7, 'ron', '……可惡，動不了……'],
      [21.75, 22.5, 'hound', '結束了，鐵鴉。'],
      [23.3, 24.8, 'mia', '洛恩，趴低！米雅到了！'],
      [26.0, 27.2, 'ron', '米雅……來得正好！'],
      [34.6, 36.0, 'mia', '這次你欠我一杯。'],
      [36.1, 37.4, 'ron', '……記帳吧。'],
    ],
    en: [
      [4.0, 6.0, 'hq', 'Raven One, the ceasefire line is two clicks out. Walk across and the war is over.'],
      [6.5, 8.0, 'hound', 'Over? Wars never end, Ron.'],
      [8.15, 9.3, 'ron', 'Then tonight I end this one.'],
      [16.0, 17.0, 'hound', 'Still the same fool!'],
      [20.6, 21.7, 'ron', 'Damn it... can’t move...'],
      [21.75, 22.5, 'hound', 'It’s over, Raven.'],
      [23.3, 24.8, 'mia', 'Ron, get down! Mia’s here!'],
      [26.0, 27.2, 'ron', 'Mia... perfect timing!'],
      [34.6, 36.0, 'mia', 'You owe me a drink for this one.'],
      [36.1, 37.4, 'ron', '...Put it on my tab.'],
    ],
  },

  // ---------------------------------------------------------------- cues the moves do not set off by themselves
  cues: [
    { t: 12.25, kind: 'flash', k: 0.35 }, { t: T.clash, kind: 'flash', k: 0.45 }, { t: 22.6, kind: 'flash', k: 0.35 }, { t: T.armOff, kind: 'flash', k: 0.3 }, { t: T.strike, kind: 'flash', k: 0.4 }, { t: T.boomB, kind: 'flash', k: 0.45 },
    { t: T.land, kind: 'shake', k: 0.12 }, { t: T.leapLand, kind: 'shake', k: 0.05, dec: 6 }, { t: T.clash, kind: 'shake', k: 0.09, dec: 6 }, { t: T.disarm, kind: 'shake', k: 0.05, dec: 6 },
    { t: T.beatDown, kind: 'shake', k: 0.06, dec: 6 }, { t: T.cut, kind: 'shake', k: 0.07, dec: 6 }, { t: 20.4, kind: 'shake', k: 0.05, dec: 6 }, { t: T.strike, kind: 'shake', k: 0.16 }, { t: T.land2, kind: 'shake', k: 0.06, dec: 6 },
    { t: 28.55, t1: 28.8, kind: 'arc', a: 'ron.tipL', b: 'hound.shoulderR' },
    { t: 31.38, t1: 31.9, kind: 'arc', a: 'ron.tipL', b: 'hound.chest', n: 3, spread: 0.7, k: 1.5 },
    { t: T.strike, kind: 'hit', at: 'hound.chest', k: 2.2 }, { t: T.strike, kind: 'clash', a: 'ron.tipL', b: 'hound.chest', k: 1.6 },
    { t: 28.72, kind: 'explosion', at: 'hound.shoulderR', k: 0.45 },
    { t: T.boomA, kind: 'explosion', at: 'hound.chest', k: 0.7 },
    { t: T.boomB, kind: 'explosion', at: { actor: 'hound', part: 'chest', off: [0, 0.2, 0] }, k: 2.1 },
    { t: 18.9, t1: 40, kind: 'sparks', every: 0.63, at: 'ron.shoulderR', k: 0.25 },
    { t: 29.1, t1: T.boomB, kind: 'sparks', every: 0.4, at: 'hound.shoulderR', k: 0.3, dir: [0, 0.6, 0] },
    { t: 31.7, t1: T.boomB, kind: 'sparks', every: 0.27, at: 'hound.chest', k: 0.35 },
    { t: T.armOff, t1: 40, kind: 'smoke', at: 'hound.shoulderR' },
    { t: 33.5, kind: 'fire', at: { actor: 'hound', part: 'root', off: [0.5, 0.25, 0] }, k: 0.75 },
    { t: 3.95, kind: 'snd', name: 'radio' }, { t: 6.0, kind: 'snd', name: 'radio' }, { t: 23.25, kind: 'snd', name: 'radio' }, { t: 34.5, kind: 'snd', name: 'radio' },
  ],

  // ---------------------------------------------------------------- the music (tools/mix.py plays it from the VSCO 2 orchestra)
  // pad: a held note; line: a melody; hit: drums and metal; stab: the brass and drums together on a blow;
  // drive: eighth-note strings and drums over chords, a bar each; tutti: the whole orchestra on a chord
  music: [
    { pad: 'CB', n: 'D1', t: 0, d: 7.4, g: 0.5 }, { pad: 'VC', n: 'D2', t: 0.3, d: 7.0, g: 0.35 }, { pad: 'VA', n: 'A2', t: 1.2, d: 6.0, g: 0.25 },
    { hit: 'gong', t: 0.75, g: 0.25 }, { hit: 'roll', t: 0.2, g: 0.12 },
    { pad: 'VA', n: 'F3', t: 3.6, d: 3.6, g: 0.22 }, { pad: 'HN', n: 'D3', t: 4.4, d: 3.0, g: 0.22 }, { pad: 'HN', n: 'A3', t: 5.2, d: 2.2, g: 0.16 },
    { pad: 'VNt', n: 'A4', t: 5.9, d: 1.3, g: 0.35 }, { pad: 'VNt', n: 'D5', t: 6.3, d: 0.9, g: 0.3 },
    { stab: 'D', t: T.land, g: 1.0 }, { pad: 'TB', n: 'D2', t: T.land, d: 2.2, g: 0.4 }, { pad: 'TU', n: 'D1', t: T.land, d: 2.2, g: 0.45 }, { hit: 'gong', t: T.land, g: 0.35 },
    { pad: 'CB', n: 'Bb0', t: 7.6, d: 1.8, g: 0.5 }, { pad: 'VC', n: 'F2', t: 7.6, d: 1.8, g: 0.35 }, { pad: 'VA', n: 'D3', t: 7.7, d: 1.7, g: 0.25 }, { hit: 'roll', t: 8.0, g: 0.35 },
    { drive: ['Dm', 'Bb', 'Gm', 'A', 'Dm'], t: 9.2, t1: 20.4, build: 0 },
    { stab: 'D', t: T.boom1, g: 1.0 }, { stab: 'D', t: T.boom2, g: 0.7 }, { stab: 'D', t: T.clash, g: 1.2 }, { stab: 'D', t: T.parry, g: 0.6 }, { stab: 'Eb', t: T.disarm, g: 0.8 }, { stab: 'D', t: T.beatDown, g: 0.7 }, { stab: 'Eb', t: T.cut, g: 1.0 },
    // losing: the drive stops; a low trembling and a dissonant horn as the blade goes up
    { pad: 'VCt', n: 'D2', t: 20.4, d: 2.3, g: 0.45 }, { pad: 'CB', n: 'D1', t: 20.4, d: 2.2, g: 0.4 }, { pad: 'HN', n: 'Eb3', t: 20.9, d: 1.7, g: 0.2 }, { pad: 'VNt', n: 'Eb5', t: 21.4, d: 1.15, g: 0.25 },
    { hit: 'roll', t: 21.2, g: 0.45 },
    // the rescue: the rockets, then a rising major theme in the horns over the drive
    { stab: 'D', t: T.rocketsHit, g: 1.2 }, { hit: 'gong', t: T.rocketsHit, g: 0.5 },
    { drive: ['Bb', 'F', 'Gm', 'D'], t: 23.1, t1: 27.0, build: 2 },
    { line: 'HN', g: 0.36, notes: [['D4', 23.3, 0.55], ['F4', 23.9, 0.3], ['A4', 24.2, 0.95], ['G4', 25.2, 0.4], ['F4', 25.6, 0.4], ['A4', 26.0, 0.95]] },
    { line: 'TB', g: 0.3, notes: [['Bb2', 23.3, 1.1], ['F2', 24.5, 1.1], ['G2', 25.7, 0.6], ['D2', 26.3, 0.7]] },
    // together: the last push, a hush in the air, the blow, and what is left
    { drive: ['Dm', 'Bb', 'C', 'A'], t: 27.0, t1: 30.4, build: 2 },
    { stab: 'D', t: T.counter, g: 1.0 }, { stab: 'D', t: T.armOff, g: 0.8 },
    { pad: 'VNt', n: 'D5', t: 30.2, d: 1.2, g: 0.45 }, { pad: 'VNt', n: 'A5', t: 30.4, d: 1.0, g: 0.3 }, { hit: 'susp', t: 30.3, g: 0.25 },
    { tutti: 'Dm', t: T.strike, d: 3.4, g: 1.0 }, { hit: 'gong', t: T.strike, g: 0.7 },
    { hit: 'taiko', t: T.boomB, g: 0.9 }, { hit: 'timp', t: T.boomB, g: 0.6 },
    { tutti: 'D', t: 34.2, d: 5.6, g: 0.45, soft: true },
    { line: 'HN', g: 0.3, notes: [['A3', 34.6, 0.6], ['D4', 35.2, 0.5], ['F#4', 35.7, 0.5], ['E4', 36.2, 0.4], ['D4', 36.6, 1.6], ['A4', 38.2, 1.6]] },
    { hit: 'gong', t: 38.3, g: 0.18 },
  ],
};
