import { canvas, state } from './state.js';
import { placeBuilding, harvestResource, toggleLanding } from './engine.js';

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
  } else if (e.key === 't' || e.key === 'T') {
    placeBuilding('turret');
  } else if (e.key === 'e' || e.key === 'E') {
    toggleLanding();
  } else if (e.key === 'h' || e.key === 'H') {
    harvestResource();
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

export function setupMobileControls(shoot) {
  if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;
  shootFunc = shoot;
  const controls = document.getElementById('mobile-controls');
  if (controls) controls.style.display = 'block';

  function bindButton(id, down, up) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', e => {
      e.preventDefault();
      down();
    });
    el.addEventListener('touchend', e => {
      e.preventDefault();
      up();
    });
  }

  bindButton('btn-up', () => setKey('ArrowUp', true), () => setKey('ArrowUp', false));
  bindButton('btn-down', () => setKey('ArrowDown', true), () => setKey('ArrowDown', false));
  // swap left/right thruster mapping for correct direction
  bindButton('btn-left', () => setKey('ArrowRight', true), () => setKey('ArrowRight', false));
  bindButton('btn-right', () => setKey('ArrowLeft', true), () => setKey('ArrowLeft', false));

  bindButton('btn-fire', () => shootFunc(), () => {});
  bindButton('btn-land', () => toggleLanding(), () => {});
  bindButton('btn-build', () => placeBuilding(), () => {});
  bindButton('btn-harvest', () => harvestResource(), () => {});

  const joystick = document.getElementById('joystick');
  if (joystick) {
    const updateAngle = e => {
      const rect = joystick.getBoundingClientRect();
      const x = e.touches[0].clientX - (rect.left + rect.width / 2);
      const y = e.touches[0].clientY - (rect.top + rect.height / 2);
      const ang = Math.atan2(y, x);
      state.mouseX = canvas.width / 2 + Math.cos(ang) * 100;
      state.mouseY = canvas.height / 2 + Math.sin(ang) * 100;
    };
    joystick.addEventListener('touchstart', e => { e.preventDefault(); updateAngle(e); });
    joystick.addEventListener('touchmove', e => { e.preventDefault(); updateAngle(e); });
  }
}
