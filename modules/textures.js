import { mulberry32 } from './util.js';

const planetTextures = new Map();
const shipTextures = new Map();

export function generatePlanetTexture(seed, size) {
  const key = seed + '-' + size;
  if (planetTextures.has(key)) return planetTextures.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size * 2;
  const g = c.getContext('2d');
  const rng = mulberry32(seed);
  const hue = rng() * 360;
  g.fillStyle = `hsl(${hue},50%,50%)`;
  g.beginPath();
  g.arc(size, size, size, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 5; i++) {
    g.fillStyle = `hsl(${hue + rng() * 40 - 20},50%,${40 + rng() * 20}%)`;
    const rx = rng() * size - size / 2;
    const ry = rng() * size - size / 2;
    const r = rng() * size / 4;
    g.beginPath();
    g.arc(size + rx, size + ry, r, 0, Math.PI * 2);
    g.fill();
  }
  planetTextures.set(key, c);
  return c;
}

export function generateShipTexture(seed) {
  if (shipTextures.has(seed)) return shipTextures.get(seed);
  const c = document.createElement('canvas');
  const size = 24;
  c.width = c.height = size;
  const g = c.getContext('2d');
  const rng = mulberry32(seed);
  g.fillStyle = `hsl(${rng() * 360},70%,60%)`;
  g.beginPath();
  g.moveTo(size / 2, 0);
  g.lineTo(size, size);
  g.lineTo(0, size);
  g.closePath();
  g.fill();
  shipTextures.set(seed, c);
  return c;
}
