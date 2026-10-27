# 鋼魂戰線：鐵鴉之夜 · Iron Front: Night of the Ravens

An animated short filmed with the 3D engine of [Iron Front](https://github.com/ywchen0711/ironfront): a 30-second fight
at sunset in a ruined city street. Ron, in the olive Pallas wanzer "Raven One", walks towards the ceasefire line; the
Black Hound drops from a rooftop. The guns, two missiles, a charge on the jets, blade against shock rod, an arm cut
off, and the last blow from above.

Play: https://ywchen0711.github.io/ironfilm/ (space to play or pause, ← → to skip, Chinese or English subtitles).

- `engine/` — Iron Front's renderer, copied unchanged: the wanzer models and their poses (`mech3d.js`), materials, three.js r160.
- `js/cast.js` — the choreography: where each machine is and how it stands, worked out from the time alone.
- `js/film.js` — the stage, thirteen camera shots with hard cuts, shake and flashes, subtitles, the player.
- `js/set.js` — the street: buildings with lit windows, ruins, wrecks, lamps, the sky dome.
- `js/fx.js` — fire, smoke, sparks, dust, tracers, thrusters and electric arcs, all computed from the time, so any frame can be drawn on its own.
- `js/score.js` — synthesized sound effects and music, scheduled on the audio clock.

`?t=12` starts at second 12; `?lang=en` for English.
