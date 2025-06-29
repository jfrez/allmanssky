import { getRandom, randomNormal, mulberry32 } from './util.js';
import { state, canvas } from './state.js';



export const STAR_SPACING = 500;
export const MIN_STAR_DISTANCE = 500;
export const MAX_STAR_DISTANCE = 2000;

const starfieldTiles = new Map();
const forcedStars = new Map();


function createStar(gx, gy, rng) {
  const star = {
    x: gx * STAR_SPACING + rng() * STAR_SPACING,
    y: gy * STAR_SPACING + rng() * STAR_SPACING,
    size: rng() * 100 + 450,
    hue: rng() * 60 + 30,
    gx,
    gy,
    planets: [],
  };
  const count = 1 + Math.floor(rng() * 9);
  for (let i = 0; i < count; i++) {
    const orbit = star.size + 300 + i * 300 + rng() * 100;
    const size = Math.max(20, randomNormal(rng, 100, 100));
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
        food: rng() > 0.5,
      },
      resources: {
        metal: rng() > 0.5,
        carbon: rng() > 0.5,

      },
      vendor: hasVendor
        ? { buyPrice: basePrice, sellPrice: Math.floor(basePrice * 0.8) }
        : null,
    });
  }
  return star;
}

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

export function getStarSystem(gx, gy) {
  const key = `${gx},${gy}`;
  if (forcedStars.has(key)) return forcedStars.get(key);
  const rng = getRandom(gx, gy);
  if (rng() < 0.97) return null;
  const star = createStar(gx, gy, rng);
  forcedStars.set(key, star);
  return star;
}

export function getNearbySystems(state, radius) {
  const { playerX, playerY } = state;
  const systems = [];
  const startGX = Math.floor((playerX - radius) / STAR_SPACING);
  const startGY = Math.floor((playerY - radius) / STAR_SPACING);
  const endGX = Math.floor((playerX + radius) / STAR_SPACING);
  const endGY = Math.floor((playerY + radius) / STAR_SPACING);
  for (let gx = startGX; gx <= endGX; gx++) {
    for (let gy = startGY; gy <= endGY; gy++) {
      const sys = getStarSystem(gx, gy);
      if (sys) systems.push(sys);
    }
  }
  return systems;
}

export function findNearestStar(x, y, searchRadius = STAR_SPACING * 20) {
  let closest = null;
  const startGX = Math.floor((x - searchRadius) / STAR_SPACING);
  const startGY = Math.floor((y - searchRadius) / STAR_SPACING);
  const endGX = Math.floor((x + searchRadius) / STAR_SPACING);
  const endGY = Math.floor((y + searchRadius) / STAR_SPACING);
  for (let gx = startGX; gx <= endGX; gx++) {
    for (let gy = startGY; gy <= endGY; gy++) {
      const sys = getStarSystem(gx, gy);
      if (!sys) continue;
      const dist = Math.hypot(sys.x - x, sys.y - y);
      if (!closest || dist < closest.dist) {
        closest = { star: sys, dist };
      }
    }
  }
  return closest ? closest.star : null;
}

export function ensureStarNear(x, y) {
  const nearest = findNearestStar(x, y, MAX_STAR_DISTANCE);
  if (nearest) {
    return nearest;
  }

  const view = Math.max(canvas.width, canvas.height) / 2;
  const minDist = Math.max(MIN_STAR_DISTANCE, view + 50);
  for (let i = 0; i < 10; i++) {
    const dist = minDist + Math.random() * (MAX_STAR_DISTANCE - minDist);
    const ang = Math.random() * Math.PI * 2;
    const nx = x + Math.cos(ang) * dist;
    const ny = y + Math.sin(ang) * dist;
    const conflict = findNearestStar(nx, ny, MIN_STAR_DISTANCE);
    if (conflict && Math.hypot(conflict.x - nx, conflict.y - ny) < MIN_STAR_DISTANCE) {
      continue;
    }
    const gx = Math.round(nx / STAR_SPACING);
    const gy = Math.round(ny / STAR_SPACING);
    const key = `${gx},${gy}`;
    if (forcedStars.has(key)) return forcedStars.get(key);
    const rng = mulberry32((gx * 97467) ^ (gy * 59359));
    const star = createStar(gx, gy, rng);
    star.x = nx;
    star.y = ny;
    forcedStars.set(key, star);
    return star;
  }
  return nearest;
}

export function ensurePlanetTurrets(gx, gy, planetIndex, size) {
  const key = `${gx},${gy},${planetIndex}`;
  if (!state.turrets[key]) {
    const rng = mulberry32((gx * 73856093) ^ (gy * 19349663) ^ (planetIndex * 83492791));
    const count = Math.min(10, Math.max(1, Math.round(size / 40)));
    state.turrets[key] = [];
    for (let i = 0; i < count; i++) {
      const hp = 3 + Math.floor(rng() * 8); // 3-10 shots
      state.turrets[key].push({
        angle: rng() * Math.PI * 2,
        health: hp,
        maxHealth: hp,
        cooldown: 0,
      });

    }
  }
  return state.turrets[key];
}
