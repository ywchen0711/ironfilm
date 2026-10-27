// Everyone who can appear in a story. To add a character: give it an id, its names, a kind and how it is built.
//   kind 'wanzer': kit = the Iron Front parts (engine/data.js ids), paint = a hangar scheme; weapons = which detailed
//                  model (js/models/weapons.js) each slot carries: wR / wL in the hands, sh on the shoulder
//   kind 'heli':   an attack helicopter (js/models/heli.js), paint = 'olive', 'navy' or 'arctic'
//   kind 'voice':  heard only (on the radio)
export const CHARACTERS = {
  ron: {
    zh: '洛恩', en: 'Ron', kind: 'wanzer', eye: '#7af4ff',
    kit: { body: 'B1', armL: 'A1', armR: 'A1', legs: 'L1', wL: 'RD1', wR: 'MG1', sh: null, paint: 'olive', side: 'p', ri: 0 },
    weapons: { wR: 'mg', wL: 'rod' },
  },
  hound: {
    zh: '黑犬', en: 'Black Hound', kind: 'wanzer', eye: '#ff3a24', blink: true, kx: 0.88,
    kit: { body: 'B4', armL: 'A4', armR: 'A4', legs: 'L4', wL: null, wR: 'W-blade1', sh: 'MS1', paint: 'black', side: 'e', boss: true, x: 3, y: 7 },
    weapons: { wR: 'blade', sh: 'launcher' },
  },
  karl: {
    zh: '卡爾', en: 'Karl', kind: 'wanzer', eye: '#ffd060', kx: 1.14,
    kit: { body: 'B2', armL: 'A2', armR: 'A2', legs: 'L2', wL: 'SH2', wR: 'SG1', sh: null, paint: 'navy', side: 'p', ri: 2 },
    weapons: { wR: 'shotgun', wL: 'shield' },
  },
  guard: {
    zh: '同盟哨兵', en: 'Alliance sentry', kind: 'wanzer', eye: '#e8f0ff',
    kit: { body: 'B1', armL: 'A1', armR: 'A1', legs: 'L1', wL: null, wR: 'RF1', sh: null, paint: null, side: 'e', x: 5, y: 9 },
    weapons: { wR: 'rifle' },
  },
  halden: {
    zh: '哈爾登', en: 'Halden', kind: 'wanzer', eye: '#ff2a20', blink: true, kx: 1.14,
    kit: { body: 'B3', armL: 'A3', armR: 'A3', legs: 'L2', wL: 'W-blade1', wR: 'W-blade1', sh: 'MS2', paint: 'arctic', side: 'e', boss: true, x: 1, y: 1 },
    weapons: { wR: 'greatblade', wL: 'greatblade', sh: 'swarm' },
  },
  mia: { zh: '米雅', en: 'Mia', kind: 'heli', paint: 'olive' },
  hq: { zh: '指揮部', en: 'HQ', kind: 'voice' },
};
export const nameOf = (id, lang) => CHARACTERS[id]?.[lang] || id;
