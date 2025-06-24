import { state, ctx, canvas } from './state.js';
import { generatePlanetTexture, generateShipTexture } from './textures.js';
import { drawStarfieldTile, getNearbySystems } from './world.js';

export function shoot() {
  if (state.weaponHeat >= state.maxHeat) return;
  const angle = Math.atan2(
    state.mouseY - canvas.height / 2,
    state.mouseX - canvas.width / 2
  );
  const bulletSpeed = 8;
  state.bullets.push({
    x: state.playerX,
    y: state.playerY,
    vx: Math.cos(angle) * bulletSpeed,
    vy: Math.sin(angle) * bulletSpeed,
  });
  state.weaponHeat = Math.min(state.maxHeat, state.weaponHeat + 20);
}

function spawnEnemy() {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(canvas.width, canvas.height) * 0.75;
  state.enemies.push({
    x: state.playerX + Math.cos(angle) * dist,
    y: state.playerY + Math.sin(angle) * dist,
    health: 3,
    seed: Math.floor(Math.random() * 1e9),
  });
}

export function update() {
  state.tick += 1;
  state.weaponHeat = Math.max(0, state.weaponHeat - 0.5);
  if (Math.random() < 0.02) spawnEnemy();

  const orientation = Math.atan2(
    state.mouseY - canvas.height / 2,
    state.mouseX - canvas.width / 2
  );
  state.angle = orientation;

  const thrust = 0.2;
  if (state.keys.up && state.resources.fuel > 0) {
    state.playerVX += Math.cos(orientation) * thrust;
    state.playerVY += Math.sin(orientation) * thrust;
    state.resources.fuel = Math.max(0, state.resources.fuel - 0.5);
  }
  if (state.keys.down && state.resources.fuel > 0) {
    state.playerVX -= Math.cos(orientation) * thrust;
    state.playerVY -= Math.sin(orientation) * thrust;
    state.resources.fuel = Math.max(0, state.resources.fuel - 0.5);
  }
  if (state.keys.left && state.resources.fuel > 0) {
    state.playerVX -= Math.sin(orientation) * thrust;
    state.playerVY += Math.cos(orientation) * thrust;
    state.resources.fuel = Math.max(0, state.resources.fuel - 0.5);
  }
  if (state.keys.right && state.resources.fuel > 0) {
    state.playerVX += Math.sin(orientation) * thrust;
    state.playerVY -= Math.cos(orientation) * thrust;
    state.resources.fuel = Math.max(0, state.resources.fuel - 0.5);
  }


  // consume resources
  state.resources.oxygen = Math.max(0, state.resources.oxygen - 0.02);
  state.resources.food = Math.max(0, state.resources.food - 0.01);
  state.resources.fuel = Math.max(0, state.resources.fuel - 0.005);
  if (state.resources.fuel <= 0 || state.resources.oxygen <= 0 || state.resources.food <= 0) {
    state.playerHealth = Math.max(0, state.playerHealth - 0.1);
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    const ang = Math.atan2(state.playerY - e.y, state.playerX - e.x);
    const enemySpeed = 2;
    e.x += Math.cos(ang) * enemySpeed;
    e.y += Math.sin(ang) * enemySpeed;
    if (Math.random() < 0.01) {
      const bulletSpeed = 6;
      state.enemyBullets.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(ang) * bulletSpeed,
        vy: Math.sin(ang) * bulletSpeed,
      });
    }
  }

  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0 && !hit; j--) {
      const e = state.enemies[j];
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      if (dx * dx + dy * dy < 225) {
        e.health -= 1;
        if (e.health <= 0) state.enemies.splice(j, 1);
        hit = true;
      }
    }
    if (hit) state.bullets.splice(i, 1);
  }

  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const b = state.enemyBullets[i];
    b.x += b.vx;
    b.y += b.vy;
    const dx = b.x - state.playerX;
    const dy = b.y - state.playerY;
    if (dx * dx + dy * dy < 225) {
      state.playerHealth = Math.max(0, state.playerHealth - 5);
      state.enemyBullets.splice(i, 1);
    }
  }

  let landed = false;
  const systems = getNearbySystems(state, 300);
  for (const s of systems) {
    const dxs = s.x - state.playerX;
    const dys = s.y - state.playerY;
    const distStar = Math.hypot(dxs, dys);
    const starInfluence = 200 + s.size;
    if (distStar < starInfluence && distStar > 0) {
      const strength = (1 - distStar / starInfluence) * 0.1;

      state.playerX += (dxs / distStar) * strength;
      state.playerY += (dys / distStar) * strength;
    }
    for (const p of s.planets) {
      const angle = p.phase + state.tick * p.speed;
      const px = s.x + Math.cos(angle) * p.orbit;
      const py = s.y + Math.sin(angle) * p.orbit;
      const dx = px - state.playerX;
      const dy = py - state.playerY;
      const dist = Math.hypot(dx, dy);
      if (dist < p.size + 12) {
        landed = true;
        if (p.supplies.fuel) state.resources.fuel = state.maxResource;
        if (p.supplies.oxygen) state.resources.oxygen = state.maxResource;
        if (p.supplies.food) state.resources.food = state.maxResource;
      }
      const influence = 150 + p.size;
      if (dist < influence && dist > 0) {
        const strength = (1 - dist / influence) * 0.2;

        state.playerX += (dx / dist) * strength;
        state.playerY += (dy / dist) * strength;
      }
    }
  }
  if (landed) state.playerHealth = 100;

  state.playerX += state.playerVX;
  state.playerY += state.playerVY;
  state.playerVX *= 0.99;
  state.playerVY *= 0.99;

}

export function draw() {
  update();
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const offsetX = state.playerX - canvas.width / 2;
  const offsetY = state.playerY - canvas.height / 2;

  const startGX = Math.floor(state.playerX / state.tileSize) - 1;
  const startGY = Math.floor(state.playerY / state.tileSize) - 1;
  const endGX = startGX + Math.ceil(canvas.width / state.tileSize) + 2;
  const endGY = startGY + Math.ceil(canvas.height / state.tileSize) + 2;

  for (let gx = startGX; gx < endGX; gx++) {
    for (let gy = startGY; gy < endGY; gy++) {
      drawStarfieldTile(gx, gy, offsetX, offsetY, ctx, state.tileSize);
    }
  }

  const systems = getNearbySystems(state, Math.max(canvas.width, canvas.height));
  for (const s of systems) {
    const starX = s.x - offsetX;
    const starY = s.y - offsetY;
    ctx.fillStyle = `hsl(${s.hue},80%,60%)`;
    ctx.beginPath();
    ctx.arc(starX, starY, s.size, 0, Math.PI * 2);
    ctx.fill();
    for (const p of s.planets) {
      const angle = p.phase + state.tick * p.speed;
      const px = s.x + Math.cos(angle) * p.orbit - offsetX;
      const py = s.y + Math.sin(angle) * p.orbit - offsetY;
      const img = generatePlanetTexture(p.seed, p.size);
      ctx.drawImage(img, px - p.size, py - p.size);
      if (p.supplies.fuel || p.supplies.oxygen || p.supplies.food) {
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, p.size + 1, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(state.angle + Math.PI / 2);
  ctx.fillStyle = 'cyan';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();


  for (const e of state.enemies) {
    const img = generateShipTexture(e.seed);
    ctx.drawImage(img, e.x - offsetX - img.width / 2, e.y - offsetY - img.height / 2);
  }

  ctx.fillStyle = 'white';
  for (const b of state.bullets) {
    ctx.beginPath();
    ctx.arc(b.x - offsetX, b.y - offsetY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'yellow';
  for (const b of state.enemyBullets) {
    ctx.beginPath();
    ctx.arc(b.x - offsetX, b.y - offsetY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'grey';
  ctx.fillRect(20, 20, 104, 14);
  ctx.fillStyle = 'lime';
  ctx.fillRect(22, 22, state.playerHealth, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(20, 20, 104, 14);

  ctx.fillStyle = 'grey';
  ctx.fillRect(20, 40, 104, 14);
  ctx.fillStyle = 'orange';
  ctx.fillRect(22, 42, state.resources.fuel, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(20, 40, 104, 14);

  ctx.fillStyle = 'grey';
  ctx.fillRect(20, 60, 104, 14);
  ctx.fillStyle = 'aqua';
  ctx.fillRect(22, 62, state.resources.oxygen, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(20, 60, 104, 14);

  ctx.fillStyle = 'grey';
  ctx.fillRect(20, 80, 104, 14);
  ctx.fillStyle = 'magenta';
  ctx.fillRect(22, 82, state.resources.food, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(20, 80, 104, 14);

  ctx.fillStyle = 'grey';
  ctx.fillRect(20, 100, 104, 14);
  ctx.fillStyle = state.weaponHeat >= state.maxHeat ? 'red' : 'orange';
  ctx.fillRect(22, 102, state.weaponHeat, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(20, 100, 104, 14);
  if (state.weaponHeat >= state.maxHeat) {
    ctx.fillStyle = 'red';
    ctx.fillText('OVERHEATED', 130, 110);
  }

  ctx.fillStyle = 'white';
  ctx.font = '12px sans-serif';
  ctx.fillText(
    `X: ${state.playerX.toFixed(0)} Y: ${state.playerY.toFixed(0)}`,
    20,
    canvas.height - 20
  );

  requestAnimationFrame(draw);
}
