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
}

function handleKeyDown(e) {
  if (e.key === ' ') {
    shootFunc();
  } else {
    setKey(e.key, true);
  }
}

function handleKeyDown(e) {
  if (e.key === ' ') {
    shootFunc();
  } else if (e.key === 'm' || e.key === 'M') {
    state.showRadar = !state.showRadar;
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
    return;

  }
  for (const t of radarTargets) {
    const dx = e.offsetX - t.sx;
    const dy = e.offsetY - t.sy;
    if (dx * dx + dy * dy < 25) {
      state.playerX = t.x;
      state.playerY = t.y;
      state.playerVX = 0;
      state.playerVY = 0;
      state.showRadar = false;
      break;
    }
  }

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
    if (state.showRadar) {
      handleRadarClick(e);
    } else {

      shootFunc();
    }
  });
}
