import { canvas, state } from './state.js';

let shootFunc = () => {};

function handleKey(e) {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':

      state.playerY -= state.speed;
      state.resources.fuel = Math.max(0, state.resources.fuel - 0.5);
      break;
    case 'ArrowDown':
    case 's':
    case 'S':

      state.playerY += state.speed;
      state.resources.fuel = Math.max(0, state.resources.fuel - 0.5);
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':

      state.playerX -= state.speed;
      state.resources.fuel = Math.max(0, state.resources.fuel - 0.5);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':

      state.playerX += state.speed;
      state.resources.fuel = Math.max(0, state.resources.fuel - 0.5);
      break;
    case ' ':
      shootFunc();
      break;
  }
}


export function setupInput(shoot) {
  shootFunc = shoot;
  document.addEventListener('keydown', handleKey);

  canvas.addEventListener('mousemove', e => {
    state.mouseX = e.offsetX;
    state.mouseY = e.offsetY;
  });
  canvas.addEventListener('click', shootFunc);
}
