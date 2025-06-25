import { getRandom } from './util.js';

const starfieldTiles = new Map();

export function drawStarfieldTile(gx, gy, offsetX, offsetY, ctx, tileSize) {
  const key = `${gx},${gy}`;
  if (!starfieldTiles.has(key)) {
    const c = document.createElement('canvas');
    c.width = c.height = tileSize;
    const g = c.getContext('2d');
    const rng = getRandom(gx, gy);
    g.fillStyle = 'black';
    g.fillRect(0, 0, tileSize, tileSize);
    const count = 20;
    for (let i = 0; i < count; i++) {
      g.fillStyle = `rgba(255,255,255,${0.5 + rng() * 0.5})`;
      g.fillRect(rng() * tileSize, rng() * tileSize, 2, 2);
    }
    starfieldTiles.set(key, c);
  }
  const img = starfieldTiles.get(key);
  ctx.drawImage(img, gx * tileSize - offsetX, gy * tileSize - offsetY);
}

export function getStarSystem(gx, gy, tileSize) {
  const rng = getRandom(gx, gy);
  if (rng() < 0.97) return null;
  const star = {
    x: gx * tileSize + rng() * tileSize,
    y: gy * tileSize + rng() * tileSize,
    size: rng() * 100 + 450, // around 500 units wide
    hue: rng() * 60 + 30,
    gx,
    gy,
    planets: [],
  };
  const count = Math.floor(rng() * 4);
  for (let i = 0; i < count; i++) {
    const orbit = star.size + rng() * 400 + 200;
    const size = rng() * 20 + 90; // around 100 unit planets
    const speed = rng() * 0.0005 + 0.0002;
    const phase = rng() * Math.PI * 2;
    const hasVendor = rng() > 0.5;
    const basePrice = Math.floor(rng() * 40 + 10);
    star.planets.push({
      index: i,
      orbit,
      size,
      speed,
      phase,
      seed: (gx * 1000 + gy) * 10 + i,
      supplies: {
        fuel: rng() > 0.5,
        oxygen: rng() > 0.5,
        food: rng() > 0.5
      },
      resources: {
        metal: rng() > 0.5,
        carbon: rng() > 0.5
      },
      vendor: hasVendor
        ? { buyPrice: basePrice, sellPrice: Math.floor(basePrice * 0.8) }
        : null,
    });
  }
  return star;
}

export function getNearbySystems(state, radius) {
  const { playerX, playerY, tileSize } = state;
  const systems = [];
  const startGX = Math.floor((playerX - radius) / tileSize);
  const startGY = Math.floor((playerY - radius) / tileSize);
  const endGX = Math.floor((playerX + radius) / tileSize);
  const endGY = Math.floor((playerY + radius) / tileSize);
  for (let gx = startGX; gx <= endGX; gx++) {
    for (let gy = startGY; gy <= endGY; gy++) {
      const sys = getStarSystem(gx, gy, tileSize);
      if (sys) systems.push(sys);
    }
  }
  return systems;
}
