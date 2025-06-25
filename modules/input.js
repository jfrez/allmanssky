import { canvas, state } from './state.js';
import { placeBuilding } from './engine.js';

let shootFunc = () => {};

function setKey(key, val) {

  if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    state.keys.up = val;
  } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    state.keys.down = val;
  } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    state.keys.left = val;
  } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    state.keys.right = val;

  }
}

function handleKeyDown(e) {
  if (e.key === ' ') {
    shootFunc();
  } else if (e.key === 'b' || e.key === 'B') {
    placeBuilding();
  } else if (e.key === 'r' || e.key === 'R') {
    state.buildRotation = (state.buildRotation + 90) % 360;

  } else {
    setKey(e.key, true);
  }
}


function handleKeyUp(e) {
  setKey(e.key, false);
}

function handleRadarClick(e) {
  const { radarSize, radarTargets } = state;
  const rx = canvas.width - radarSize - 20;
  const ry = 20;
  if (e.offsetX < rx || e.offsetX > rx + radarSize || e.offsetY < ry || e.offsetY > ry + radarSize) {
    return false;
  }
  for (const t of radarTargets) {
    const dx = e.offsetX - t.sx;
    const dy = e.offsetY - t.sy;
    if (dx * dx + dy * dy < 25) {
      state.playerX = t.x;
      state.playerY = t.y;
      state.playerVX = 0;
      state.playerVY = 0;
      return true;
    }
  }
  return false;

}

export function setupInput(shoot) {
  shootFunc = shoot;
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  canvas.addEventListener('mousemove', e => {
    state.mouseX = e.offsetX;
    state.mouseY = e.offsetY;
  });
  canvas.addEventListener('click', e => {
    if (!handleRadarClick(e)) {
      shootFunc();
    }
  });
}
