# 鋼魂戰線：鐵鴉之夜 · Iron Front: Night of the Ravens

An animated short filmed with the 3D engine of [Iron Front](https://github.com/ywchen0711/ironfront): a 30-second fight
at sunset in a ruined city street. Ron, in the olive Pallas wanzer "Raven One", walks towards the ceasefire line; the
Black Hound drops from a rooftop. The guns, two missiles, a charge on the jets, blade against shock rod, an arm cut
off, and the last blow from above.

Play: https://ywchen0711.github.io/ironfilm/ (space to play or pause, ← → to skip, Chinese or English subtitles).

- `engine/` — Iron Front's renderer, copied unchanged: the wanzer models and their poses (`mech3d.js`), materials, three.js r160.
- `js/cast.js` — the choreography: where each machine is and how it stands, worked out from the time alone.
- `js/feet.js`, `js/motion.js` — footwork: each foot stays planted until the body moves off it, then steps ahead of where the body is going; both tuck up in a jump and land together.
- `js/rig.js` — more joints over the engine's wanzer (toes, a hip that turns and swings out, an ankle that rolls to the ground, pelvis and chest turning against each other, shoulders lifting, a head that watches the other machine); two-bone IK for the legs; the upper body played through springs so blows follow through.
- `js/film.js` — the stage, thirteen camera shots with hard cuts, shake and flashes, subtitles, the player.
- `js/set.js` — the street: buildings with lit windows, ruins, wrecks, lamps, the sky dome.
- `js/fx.js` — fire, smoke, sparks, dust, tracers, thrusters and electric arcs, all computed from the time, so any frame can be drawn on its own.
- `js/score.js` — plays the soundtrack from wherever the film is.
- `tools/mix.py` — builds `audio/soundtrack.mp3`: real recordings and a sampled orchestra mixed to the film's timeline (`tools/cues.mjs` exports every beat, gunshot and footstep from the film's own code).

## Sound

All CC0 (public domain):
- [The Free Firearm Sound Library](https://opengameart.org/content/the-free-firearm-sound-library) — the machine gun (an AK-47, single shots cut from a recording and pitched down)
- [Versilian Studios Chamber Orchestra 2 Community Edition](https://github.com/sgossner/VSCO-2-CE) — strings, horns, trombones, tuba, timpani, drums, cymbals and gong for the score
- [Kenney](https://kenney.nl): Impact Sounds and Sci-fi Sounds — steps, metal, thrusters, explosions, the shock rod's hum
- [Kaiju Night](https://github.com/ywchen0711/kaiju-night)'s designed effects (themselves built from CC0 recordings) — swings, metal clashes, electric bolts, the collapse

`?t=12` starts at second 12; `?lang=en` for English.
