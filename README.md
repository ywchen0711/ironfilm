# 鋼魂戰線：鐵鴉之夜 · Iron Front: Night of the Ravens

Animated shorts filmed with the 3D engine of [Iron Front](https://github.com/ywchen0711/ironfront).

**Episode 1 (40 s).** The night before the truce. Ron walks Raven One towards the ceasefire line; the Black Hound
drops from a rooftop. The Hound has the better of him: his gun is knocked from his hand and he goes down on one
knee. As the blade comes up, Mia's attack helicopter comes in over the rooftops, rockets first. Ron gets up, and
they finish it together.

**Episode 2 — The Ceasefire Line (5 min).** The same night, five minutes before the truce. At the checkpoint the
sentries raise their rifles and Ron lowers his first; then a missile falls out of the dark. Halden of Orrin, the arms
company that sells to both sides, has come in his prototype to keep the war alive. He cuts down the sentries, breaks
Karl's shield, drives Mia off with a swarm of missiles and beats Ron to his knees; then, down the burning street,
one-armed, comes the Black Hound. A three-way standoff; the Hound turns on Halden; Ron and the Hound fight him
together, and as the truce comes into force they cut him down crosswise. Dawn.

Filmed after the directors who taught us how: Kubrick's one-point perspective; Kurosawa's long lenses, the slow walk
through smoke, the pause before the fall; Leone's eyes and three-way standoff; John Woo's guns at each other's heads
and slow motion; Spielberg's face before the threat, a dolly zoom, one long take round the fighters; Ridley Scott's
silhouettes in the floodlights; Itano Ichirō's corkscrewing missile swarms; George Miller's centre framing; Michael
Mann's handheld gunfight; and a Nolan clock counting down to the truce.

Play: https://ywchen0711.github.io/ironfilm/ (space to play or pause, ← → to skip, Chinese or English subtitles;
`?t=12` starts at second 12, `?lang=en` in English, `?ep=ep1` picks the episode).

## How it is built

Everything a story needs is data; everything that draws, moves or sounds is shared.

| | |
|---|---|
| `js/story/ep1.js` | **an episode**: its beats, the set, the actors and their tracks of moves, the camera shots, the words, extra cues, the music cue sheet |
| `js/cast/characters.js` | **who can appear**: names, kind (wanzer, helicopter, voice), parts, paint, eye colour, which weapons |
| `js/core/actions.js` | **the move library**: walk, move, jump, drop, charge, anchor (keep a distance), pin, blow (side / over / thrust / upper; clash / hit / ground), react, burst, missile, rockets, flares, kneel, sever, disarm, fall, die, guard, arm (keyframes), p (any pose parameter over a shape), face, lookat, fly, spot… each knows how it moves, poses, and what cues it sets off |
| `js/core/runtime.js` | a story at work: where everyone is, which way they face, how they stand, at any moment; the full cue list. Pure arithmetic, shared with the sound tools |
| `js/core/actors3d.js` | builds each character in 3D and poses it; named points (chest, head, muzzle, tipL, launcher, gun, podL…) for effects and cameras |
| `js/core/director.js` | turns cues into effects: shots and tracers, missiles and rockets with smoke trails, blasts, clashes and arcs, sparks, flares, torn-off parts, fire |
| `js/core/camera.js` | shot types: moving between two points, following actors, fixed, circling, a dolly zoom (`vertigo`), handheld (`hand`), close-ups in a head's own frame (`local`) |
| `js/core/time.js` | slow motion: a story's `warp` slows its world down over stretches; the sound mix follows |
| `js/props.js` | set dressing: barriers, a boom gate, a booth, floodlight towers with real beams, waving flags, sandbags, wire, a tank wreck |
| `js/story/index.js` | the list of episodes for the start screen |
| `js/models/weapons.js` | detailed weapons: machine gun, shock rod, blade, shoulder launcher, missile, rocket |
| `js/models/heli.js` | the attack helicopter: rotors, stub wings and pods, chin gun, lights, searchlight |
| `js/feet.js`, `js/rig.js` | footwork (planted feet, steps, landings, kneeling), leg IK, extra joints, spring follow-through |
| `js/fx.js`, `js/set.js` | particles and arcs; the street, with dusk, night and dawn skies a story can move between (`set.sky`) |
| `engine/` | Iron Front's renderer, copied unchanged: the wanzer models (`mech3d.js`), materials, three.js r160 |
| `tools/cues.mjs`, `tools/mix.py` | the soundtrack: every cue, step and thruster burn exported from the story, then mixed from real recordings and an orchestra |

### A new episode

1. Copy `js/story/ep2.js` to `js/story/ep3.js` and change it: actors (`who` is a character id), their `track` of
   moves, `shots`, `lines`, `cues`, `music`, `LEN`.
2. `node tools/cues.mjs ep3 > tools/cues.json`, then `python -P tools/mix.py RAW KN FIRE VSCO HELI` → `audio/ep3.mp3`.
3. Add it to `js/story/index.js`; open `?ep=ep3`.

### A new character

Add an entry to `js/cast/characters.js`: a wanzer with its Iron Front parts (`engine/data.js` ids), paint and
weapons (`mg`, `rifle`, `shotgun`, `rod`, `blade`, `greatblade`, `shield`, `launcher`, `swarm`), or a helicopter with its paint. Then use its id as `who` in a story.

### A new move or weapon

A move is one entry in `ACT` (`js/core/actions.js`) with `move`, `pose` and/or `cues`. A weapon is a builder in
`js/models/weapons.js` returning its group and named points; add it to `BUILD` in `js/core/actors3d.js`.

## Sound

All CC0 (public domain):
- [The Free Firearm Sound Library](https://opengameart.org/content/the-free-firearm-sound-library) — the guns (an AK-47, single shots cut from a recording and pitched down; deeper still for the helicopter's cannon)
- [Versilian Studios Chamber Orchestra 2 Community Edition](https://github.com/sgossner/VSCO-2-CE) — strings, horns, trombones, tuba, timpani, drums, cymbals and gong for the score
- Helicopter recordings: [Helicopter Sounds](https://opengameart.org/content/helicopter-sounds) (aquinn) and [Helicopter SFX](https://opengameart.org/node/131039) (WuxiaScrub)
- [Kenney](https://kenney.nl): Impact Sounds and Sci-fi Sounds — steps, metal, thrusters, explosions, the shock rod's hum
- [Kaiju Night](https://github.com/ywchen0711/kaiju-night)'s designed effects (themselves built from CC0 recordings) — swings, metal clashes, electric bolts
