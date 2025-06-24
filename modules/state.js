export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');


export const state = {
  playerX: 0,
  playerY: 0,
  playerHealth: 100,
  resources: { fuel: 100, oxygen: 100, food: 100 },
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
};
