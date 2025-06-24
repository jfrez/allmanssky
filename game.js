import { state } from './modules/state.js';
import { draw, shoot } from './modules/engine.js';
import { setupInput } from './modules/input.js';
import { playIntro } from './modules/intro.js';

setupInput(shoot);
playIntro().then(draw);

