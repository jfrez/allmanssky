import { state } from './modules/state.js';
import { draw, shoot } from './modules/engine.js';
import { setupInput, setupMobileControls } from './modules/input.js';
import { playIntro } from './modules/intro.js';

setupInput(shoot);
setupMobileControls(shoot);
playIntro().then(draw);

