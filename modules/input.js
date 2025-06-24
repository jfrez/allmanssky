import { canvas, state } from './state.js';

let shootFunc = () => {};

function setKey(key, val) {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      state.keys.up = val;
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      state.keys.down = val;
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      state.keys.left = val;
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      state.keys.right = val;
      break;
  }
}

function handleKeyDown(e) {
  if (e.key === ' ') {
    shootFunc();
  } else {
    setKey(e.key, true);
  }
}

function handleKeyUp(e) {
  setKey(e.key, false);
}

export function setupInput(shoot) {
  shootFunc = shoot;
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  canvas.addEventListener('mousemove', e => {
    state.mouseX = e.offsetX;
    state.mouseY = e.offsetY;
  });
  canvas.addEventListener('click', shootFunc);
}
