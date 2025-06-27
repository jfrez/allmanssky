import { state } from './modules/state.js';
import { draw, shoot } from './modules/engine.js';
import { setupInput, setupMobileControls } from './modules/input.js';
import { playIntro } from './modules/intro.js';
import { connect } from './modules/network.js';

setupInput(shoot);
setupMobileControls(shoot);
connect();
playIntro().then(draw);

