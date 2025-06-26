export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});


export const state = {
  playerX: 0,
  playerY: 0,
  playerVX: 0,
  playerVY: 0,
  angle: 0,
  playerHealth: 100,
  resources: { fuel: 100000, oxygen: 100, food: 100 },
  maxFuel: 100000,
  maxResource: 100,
  speed: 4,

  tileSize: 512,
  enemies: [],
  bullets: [],
  enemyBullets: [],
  weaponHeat: 0,
  maxHeat: 100,
  tick: 0,
  mouseX: canvas.width / 2,
  mouseY: canvas.height / 2,
  keys: { up: false, down: false, left: false, right: false },
  showRadar: true,
  radarSize: 150,
  radarRadius: 3000,
  radarTargets: [],
  credits: 1000,
  inventory: { ore: 0, metal: 0, carbon: 0 },
  maxInventory: 50,
  isLanded: false,
  landing: null,
  landedGX: null,
  landedGY: null,
  landedPlanetIndex: null,
  isDead: false,
  isRestarting: false,
  message: '',
  messageTimer: 0,
  mission: null,
  buildRotation: 0,
  buildings: JSON.parse(localStorage.getItem('buildings') || '[]'),
  turrets: {},

};

export function resetState() {
  Object.assign(state, {
    playerX: 0,
    playerY: 0,
    playerVX: 0,
    playerVY: 0,
    angle: 0,
    playerHealth: 100,
    resources: { fuel: 100000, oxygen: 100, food: 100 },
    enemies: [],
    bullets: [],
    enemyBullets: [],
    weaponHeat: 0,
    tick: 0,
    mouseX: canvas.width / 2,
    mouseY: canvas.height / 2,
    keys: { up: false, down: false, left: false, right: false },
    showRadar: true,
    radarTargets: [],
    credits: 1000,
    inventory: { ore: 0, metal: 0, carbon: 0 },
    isLanded: false,
    landing: null,
    landedGX: null,
    landedGY: null,
    landedPlanetIndex: null,
    isDead: false,
    isRestarting: false,
    message: '',
    messageTimer: 0,
    mission: null,
    buildRotation: 0,
    turrets: {},
  });
}
