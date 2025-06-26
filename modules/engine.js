import { state, ctx, canvas, resetState } from './state.js';
import { generatePlanetTexture, generateShipTexture } from './textures.js';
import { drawStarfieldTile, getNearbySystems, findNearestStar, ensurePlanetTurrets, ensureStarNear } from './world.js';

import { playIntro } from './intro.js';

const ENEMY_SPAWN_FRAMES = 60 * 30; // spawn roughly every 30 seconds
const TURRET_COOLDOWN_FRAMES = 60; // turret fires about once per second

  if (state.isOverheated || state.weaponHeat >= state.maxHeat) {
    if (state.weaponHeat >= state.maxHeat) state.isOverheated = true;
    return;
  }
  if (state.weaponHeat >= state.maxHeat) {
    state.isOverheated = true;
  }
export function shoot() {
  if (state.weaponHeat >= state.maxHeat) return;
  const angle = Math.atan2(
    state.mouseY - canvas.height / 2,
    state.mouseX - canvas.width / 2
  );
  const bulletSpeed = 8;
  const rot = state.angle + Math.PI / 2;
  for (const c of state.cannons) {
    const ox =
      (c.x * Math.cos(rot) - c.y * Math.sin(rot)) * state.shipScale;
    const oy =
      (c.x * Math.sin(rot) + c.y * Math.cos(rot)) * state.shipScale;
    state.bullets.push({
      x: state.playerX + ox,
      y: state.playerY + oy,
      vx: Math.cos(angle) * bulletSpeed,
      vy: Math.sin(angle) * bulletSpeed,
    });
  }
  state.weaponHeat = Math.min(state.maxHeat, state.weaponHeat + 20);
}

function spawnEnemy() {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(canvas.width, canvas.height) * 0.75;
  const hp = 5 + Math.floor(Math.random() * 11); // 5-15 shots
  state.enemies.push({
    x: state.playerX + Math.cos(angle) * dist,
    y: state.playerY + Math.sin(angle) * dist,
    health: hp,
    maxHealth: hp,
    seed: Math.floor(Math.random() * 1e9),
  });
}

function tradeWithVendor(vendor) {
  if (!vendor) return;
  let msg = '';
  if (state.inventory.ore > 0) {
    const earnings = state.inventory.ore * vendor.sellPrice;
    state.credits += earnings;
    msg += `Sold ${state.inventory.ore} ore for ${earnings}c. `;
    state.inventory.ore = 0;
  }
  const space = state.maxInventory - state.inventory.ore;
  const affordable = Math.floor(state.credits / vendor.buyPrice);
  const amount = Math.min(space, affordable);
  if (amount > 0) {
    state.inventory.ore += amount;
    state.credits -= amount * vendor.buyPrice;
    msg += `Bought ${amount} ore for ${amount * vendor.buyPrice}c.`;
  }
  if (msg) {
    state.message = msg.trim();
    state.messageTimer = 180; // about 3 seconds
  }
}

function checkMissionCompletion(star, planet) {
  const m = state.mission;
  if (
    m &&
    star.gx === m.gx &&
    star.gy === m.gy &&
    planet.index === m.planetIndex
  ) {
    state.credits += m.reward;
    state.message = `Mission complete! Earned ${m.reward}c`;
    state.messageTimer = 240;
    state.mission = null;
  }
}

function maybeStartMission(currentStar, currentPlanet) {
  if (state.mission || Math.random() > 0.3) return;
  const systems = getNearbySystems(state, state.radarRadius * 2);
  const choices = [];
  for (const s of systems) {
    for (const p of s.planets) {
      if (
        p.vendor &&
        (s.gx !== currentStar.gx || s.gy !== currentStar.gy || p.index !== currentPlanet.index)
      ) {
        choices.push({ s, p });
      }
    }
  }
  if (choices.length === 0) return;
  const dest = choices[Math.floor(Math.random() * choices.length)];
  const reward = Math.floor(200 + Math.random() * 300);
  state.mission = {
    gx: dest.s.gx,
    gy: dest.s.gy,
    planetIndex: dest.p.index,
    reward,
  };
  state.message = `Cargo mission: deliver goods to (${dest.s.gx},${dest.s.gy}) planet ${dest.p.index} for ${reward}c`;
  state.messageTimer = 240;
}

function restartGame() {
  resetState();
  playIntro().then(draw);
}

function saveBuildings() {
  localStorage.setItem('buildings', JSON.stringify(state.buildings));
}

function upgradeShip() {
  state.upgradeLevel += 1;
  state.shipScale += 0.2;
  const t = state.upgradeLevel * 0.2;
  const x = 8 * t;
  const y = -12 + 22 * t;
  state.cannons.push({ x, y }, { x: -x, y });

  state.message = 'Ship upgraded with new cannons!';
  state.messageTimer = 180;
}

export function toggleLanding() {
  if (state.isLanded) {
    state.isLanded = false;
    state.message = 'Taking off';
    state.messageTimer = 120;
    return true;
  }
  if (state.landing) return false;
  const systems = getNearbySystems(state, 1000);
  let closest = null;
  for (const s of systems) {
    for (const p of s.planets) {
      const angle = p.phase + state.tick * p.speed;
      const px = s.x + Math.cos(angle) * p.orbit;
      const py = s.y + Math.sin(angle) * p.orbit;
      const dist = Math.hypot(px - state.playerX, py - state.playerY);
      if (!closest || dist < closest.dist) {
        closest = { s, p, px, py, dist };
      }
    }
  }
  if (closest && closest.dist <= closest.p.size * 1.1) {
    const { s, p, px, py } = closest;
    const dx = state.playerX - px;
    const dy = state.playerY - py;
    const ang = Math.atan2(dy, dx);
    state.landing = {
      targetX: px + Math.cos(ang) * p.size,
      targetY: py + Math.sin(ang) * p.size,
      frames: 30,
      star: s,
      planet: p,
    };
    state.playerVX = 0;
    state.playerVY = 0;
    state.message = 'Landing...';
    state.messageTimer = 60;
    return true;
  }
  state.message = 'No planet to land on';
  state.messageTimer = 120;
  return false;
}

export function harvestResource() {
  if (!state.isLanded) {
    state.message = 'Land first with E';
    state.messageTimer = 120;
    return false;
  }
  const systems = getNearbySystems(state, 300);
  for (const s of systems) {
    if (s.gx !== state.landedGX || s.gy !== state.landedGY) continue;
    for (const p of s.planets) {
      if (p.index !== state.landedPlanetIndex) continue;
      if (p.resources) {
        let harvested = false;
        if (p.resources.metal) {
          state.inventory.metal += 1;
          harvested = true;
        }
        if (p.resources.carbon) {
          state.inventory.carbon += 1;
          harvested = true;
        }
        if (harvested) {
          state.message = 'Harvested resources';
          state.messageTimer = 120;
          return true;
        }
      }
    }
  }
  state.message = 'No resources here';
  state.messageTimer = 120;
  return false;
}

export function placeBuilding() {
  if (!state.isLanded) {
    state.message = 'Must be landed on a planet';
    state.messageTimer = 180;
    return false;
  }
  const systems = getNearbySystems(state, 300);
  for (const s of systems) {
    if (s.gx === state.landedGX && s.gy === state.landedGY) {
      for (const p of s.planets) {
        if (p.index === state.landedPlanetIndex) {
          if (
            state.inventory.ore < 10 ||
            state.inventory.metal < 5 ||
            state.inventory.carbon < 5
          ) {
            state.message = 'Need 10 ore, 5 metal, 5 carbon to build';
            state.messageTimer = 180;
            return false;
          }
          state.inventory.ore -= 10;
          state.inventory.metal -= 5;
  if (state.isOverheated && state.weaponHeat <= 0) {
    state.isOverheated = false;
  }
          state.inventory.carbon -= 5;
          state.buildings.push({
            gx: s.gx,
            gy: s.gy,
            planetIndex: p.index,
            x: state.playerX,
            y: state.playerY,
            rot: state.buildRotation,
          });
          saveBuildings();
          state.message = 'Placed building module';
          state.messageTimer = 180;
          return true;
        }
      }
    }
  }
  state.message = 'No place to build';
  state.messageTimer = 180;
  return false;
}


export function update() {
  state.tick += 1;
  if (state.messageTimer > 0) state.messageTimer -= 1;
  state.weaponHeat = Math.max(0, state.weaponHeat - 0.5);
  ensureStarNear(state.playerX, state.playerY);
  if (state.tick > 0 && state.tick % ENEMY_SPAWN_FRAMES === 0) {
    spawnEnemy();
  }

  const orientation = Math.atan2(
    state.mouseY - canvas.height / 2,
    state.mouseX - canvas.width / 2
  );
  state.angle = orientation;

  if (state.landing) {
    const l = state.landing;
    state.playerX += (l.targetX - state.playerX) * 0.2;
    state.playerY += (l.targetY - state.playerY) * 0.2;
    if (--l.frames <= 0) {
      state.playerX = l.targetX;
      state.playerY = l.targetY;
      state.isLanded = true;
      state.landedGX = l.star.gx;
      state.landedGY = l.star.gy;
      state.landedPlanetIndex = l.planet.index;
      if (l.planet.supplies.fuel) state.resources.fuel = state.maxFuel;
      if (l.planet.supplies.oxygen) state.resources.oxygen = state.maxResource;
      if (l.planet.supplies.food) state.resources.food = state.maxResource;
      if (l.planet.vendor && state.messageTimer === 0) {
        tradeWithVendor(l.planet.vendor);
        checkMissionCompletion(l.star, l.planet);
        maybeStartMission(l.star, l.planet);
      }
      const key = `${l.star.gx},${l.star.gy},${l.planet.index}`;
      if (!state.visitedPlanets[key]) {
        state.visitedPlanets[key] = true;
        const turrets = ensurePlanetTurrets(
          l.star.gx,
          l.star.gy,
          l.planet.index,
          l.planet.size
        );
        if (turrets.length === 0) {
          upgradeShip();
        }
      }

      state.landing = null;
      state.message = 'Landed - press E to take off';
      state.messageTimer = 120;
    }
    return;
  }

  const thrust = 0.2;
  if (!state.isLanded) {
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

    const bulletSystems = getNearbySystems(state, 1000);
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
          if (e.health <= 0) {
            state.enemies.splice(j, 1);
            state.credits += 200;
            state.message = 'Enemy destroyed +200c';
            state.messageTimer = 120;
          }
          hit = true;
        }
      }
      for (const s of bulletSystems) {
        if (hit) break;
        for (const p of s.planets) {
          if (hit) break;
          const turrets = ensurePlanetTurrets(s.gx, s.gy, p.index, p.size);
          const angle = p.phase + state.tick * p.speed;
          const px = s.x + Math.cos(angle) * p.orbit;
          const py = s.y + Math.sin(angle) * p.orbit;
          for (let t = turrets.length - 1; t >= 0 && !hit; t--) {
            const turret = turrets[t];
            const tx = px + Math.cos(turret.angle) * (p.size + 10);
            const ty = py + Math.sin(turret.angle) * (p.size + 10);
            const dx = b.x - tx;
            const dy = b.y - ty;
            if (dx * dx + dy * dy < 225) {
              turret.health -= 1;
              if (turret.health <= 0) turrets.splice(t, 1);
              hit = true;
            }
          }
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
    if (!state.isLanded && distStar < starInfluence && distStar > 0) {
      const strength = (1 - distStar / starInfluence) * 0.1;

      state.playerX += (dxs / distStar) * strength;
      state.playerY += (dys / distStar) * strength;
      if (distStar < s.size) {
        state.playerHealth = Math.max(0, state.playerHealth - 1);
      }
    }
      for (const p of s.planets) {
        const angle = p.phase + state.tick * p.speed;
        const px = s.x + Math.cos(angle) * p.orbit;
        const py = s.y + Math.sin(angle) * p.orbit;
        const dx = px - state.playerX;
        const dy = py - state.playerY;
        const dist = Math.hypot(dx, dy);
        const turrets = ensurePlanetTurrets(s.gx, s.gy, p.index, p.size);
        for (const t of turrets) {
          if (t.cooldown > 0) t.cooldown -= 1;
          if (dist < p.size * 10 && t.cooldown <= 0) {

            const tx = px + Math.cos(t.angle) * (p.size + 10);
            const ty = py + Math.sin(t.angle) * (p.size + 10);
            const ang = Math.atan2(state.playerY - ty, state.playerX - tx);
            const speed = 6;
            state.enemyBullets.push({
              x: tx,
              y: ty,
              vx: Math.cos(ang) * speed,
              vy: Math.sin(ang) * speed,
            });
            t.cooldown = TURRET_COOLDOWN_FRAMES;
          }
        }
        if (
          state.isLanded &&
          s.gx === state.landedGX &&
          s.gy === state.landedGY &&
          p.index === state.landedPlanetIndex

      ) {
        state.playerX = px;
        state.playerY = py;
        landed = true;
        if (p.supplies.fuel) state.resources.fuel = state.maxFuel;
        if (p.supplies.oxygen) state.resources.oxygen = state.maxResource;
        if (p.supplies.food) state.resources.food = state.maxResource;
        if (p.vendor && state.messageTimer === 0) {
          tradeWithVendor(p.vendor);
          checkMissionCompletion(s, p);
          maybeStartMission(s, p);
        }
  if (!state.isDead && state.playerHealth <= 0) {
    const quotes = [
      'La oscuridad del espacio te reclama...',
      'Tu nave se pierde entre las estrellas muertas...',
      'En el vacío solo queda silencio...',
      'Explorador caído en el infinito...',
      'Una nova envuelve tus restos cósmicos...'
    ];
    state.isDead = true;
    state.message = quotes[Math.floor(Math.random() * quotes.length)];
    state.messageTimer = 180;
  }
  if (state.isDead && state.messageTimer === 0) {
    state.isRestarting = true;
  }

      } else if (!state.isLanded) {
        const influence = 150 + p.size;
        if (dist < influence && dist > 0) {
          const strength = (1 - dist / influence) * 0.2;

          state.playerX += (dx / dist) * strength;
          state.playerY += (dy / dist) * strength;
        }
      }
    }
  }
  if (state.isLanded && !landed) {
    state.isLanded = false;
  }
  if (landed) state.playerHealth = 100;

  if (!state.isLanded) {
    state.playerX += state.playerVX;
    state.playerY += state.playerVY;
  } else {
    state.playerVX = 0;
    state.playerVY = 0;
  }
  state.playerVX *= 0.99;
  state.playerVY *= 0.99;

  if (!state.isDead && state.playerHealth <= 0) {
    const quotes = [
      'La oscuridad del espacio te reclama...',
      'Tu nave se pierde entre las estrellas muertas...',
      'En el vacío solo queda silencio...',
      'Explorador caído en el infinito...',
      'Una nova envuelve tus restos cósmicos...'
    ];
    state.isDead = true;
    state.message = quotes[Math.floor(Math.random() * quotes.length)];
    state.messageTimer = 180;
  }
  if (state.isDead && state.messageTimer === 0) {
    state.isRestarting = true;
  }

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
      const img = generatePlanetTexture(p.seed, p.size, p.resources);
      ctx.drawImage(img, px - p.size, py - p.size);
      if (p.supplies.fuel || p.supplies.oxygen || p.supplies.food) {
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, p.size + 1, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (p.resources && (p.resources.metal || p.resources.carbon)) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, p.size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      const turrets = ensurePlanetTurrets(s.gx, s.gy, p.index, p.size);
      for (const t of turrets) {
        const tx = px + Math.cos(t.angle) * (p.size + 10);
        const ty = py + Math.sin(t.angle) * (p.size + 10);
        ctx.fillStyle = 'red';
        ctx.fillRect(tx - 3, ty - 3, 6, 6);
        ctx.fillStyle = 'grey';
        ctx.fillRect(tx - 5, ty - 8, 10, 3);
        ctx.fillStyle = 'lime';
        ctx.fillRect(tx - 5, ty - 8, (t.health / t.maxHealth) * 10, 3);

      }
    }
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(state.angle + Math.PI / 2);
  ctx.scale(state.shipScale, state.shipScale);

  if (!state.isLanded && !state.landing) {
    ctx.fillStyle = 'orange';
    if (state.keys.up) {
      const len = 8 + Math.random() * 4;
      ctx.beginPath();
      ctx.moveTo(-3, 10);
      ctx.lineTo(0, 10 + len);
      ctx.lineTo(3, 10);
      ctx.closePath();
      ctx.fill();
    }
    if (state.keys.down) {
      const len = 6 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(-2, -10);
      ctx.lineTo(0, -10 - len);
      ctx.lineTo(2, -10);
      ctx.closePath();
      ctx.fill();
    }
    if (state.keys.left) {
      const len = 6 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(-10 - len, 0);
      ctx.lineTo(-10, 2);
      ctx.closePath();
      ctx.fill();
    }
    if (state.keys.right) {
      const len = 6 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(10 + len, 0);
      ctx.lineTo(10, 2);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = 'grey';
  for (const c of state.cannons) {
    ctx.fillRect(c.x - 1, c.y - 4, 2, 4);
  }
  ctx.fillStyle = 'cyan';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  for (const base of state.buildings) {
    const bx = base.x - offsetX;
    const by = base.y - offsetY;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate((base.rot * Math.PI) / 180);
    ctx.fillStyle = 'brown';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.restore();
  }

  for (const e of state.enemies) {
    const img = generateShipTexture(e.seed);
    ctx.drawImage(img, e.x - offsetX - img.width / 2, e.y - offsetY - img.height / 2);
    ctx.fillStyle = 'grey';
    ctx.fillRect(e.x - offsetX - 12, e.y - offsetY - img.height / 2 - 6, 24, 3);
    ctx.fillStyle = 'lime';
    const ew = (e.health / e.maxHealth) * 24;
    ctx.fillRect(e.x - offsetX - 12, e.y - offsetY - img.height / 2 - 6, ew, 3);
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
  ctx.fillStyle = state.isOverheated ? 'red' : 'orange';
  if (state.isOverheated) {
  ctx.fillRect(22, 22, state.playerHealth, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(20, 20, 104, 14);

  ctx.fillStyle = 'grey';
  ctx.fillRect(20, 40, 104, 14);
  ctx.fillStyle = 'orange';
  const fuelWidth = (state.resources.fuel / state.maxFuel) * 100;
  ctx.fillRect(22, 42, fuelWidth, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(20, 40, 104, 14);

  ctx.fillStyle = 'grey';
  ctx.fillRect(20, 60, 104, 14);
  ctx.fillStyle = 'aqua';
  const oxyWidth = (state.resources.oxygen / state.maxResource) * 100;
  ctx.fillRect(22, 62, oxyWidth, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(20, 60, 104, 14);

  ctx.fillStyle = 'grey';
  ctx.fillRect(20, 80, 104, 14);
  ctx.fillStyle = 'magenta';
  const foodWidth = (state.resources.food / state.maxResource) * 100;
  ctx.fillRect(22, 82, foodWidth, 10);
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
  ctx.fillText(
    `Credits: ${state.credits} Ore: ${state.inventory.ore} Metal: ${state.inventory.metal} Carbon: ${state.inventory.carbon}`,
    20,
    canvas.height - 36
  );
  if (state.mission) {
    ctx.fillText(
      `Mission: (${state.mission.gx},${state.mission.gy}) planet ${state.mission.planetIndex} reward ${state.mission.reward}c`,
      20,
      canvas.height - 52
    );
  }
  ctx.fillText(
    'Keys: WASD move Space shoot E land/take off H harvest B build R rotate',
    20,
    canvas.height - 68
  );
  if (state.messageTimer > 0) {
    ctx.fillStyle = 'yellow';
    const text = state.message;
    const w = ctx.measureText(text).width;
    ctx.fillText(text, canvas.width / 2 - w / 2, 50);
    ctx.fillStyle = 'white';
  }

  if (state.showRadar) {
    const size = state.radarSize;
    const radius = state.radarRadius;
    const rx = canvas.width - size - 20;
    const ry = 20;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(rx, ry, size, size);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(rx, ry, size, size);
    ctx.fillStyle = 'cyan';
    ctx.fillRect(rx + size / 2 - 2, ry + size / 2 - 2, 4, 4);
    state.radarTargets = [];
    const systems = getNearbySystems(state, radius);
    for (const s of systems) {
      for (const p of s.planets) {
        const angle = p.phase + state.tick * p.speed;
        const px = s.x + Math.cos(angle) * p.orbit;
        const py = s.y + Math.sin(angle) * p.orbit;
        const dx = (px - state.playerX) / radius;
        const dy = (py - state.playerY) / radius;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
          const sx = rx + size / 2 + dx * size / 2;
          const sy = ry + size / 2 + dy * size / 2;
          ctx.fillStyle = 'orange';
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
          state.radarTargets.push({ sx, sy, x: px, y: py });
        }
      }
      for (const b of state.buildings) {
        if (b.gx === s.gx && b.gy === s.gy) {
          const dx = (b.x - state.playerX) / radius;
          const dy = (b.y - state.playerY) / radius;
          if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
            const sx = rx + size / 2 + dx * size / 2;
            const sy = ry + size / 2 + dy * size / 2;
            ctx.fillStyle = 'purple';
            ctx.fillRect(sx - 2, sy - 2, 4, 4);
          }
        }
      }
    }
    const nearest = findNearestStar(state.playerX, state.playerY);
    if (nearest) {
      let dx = (nearest.x - state.playerX) / radius;
      let dy = (nearest.y - state.playerY) / radius;
  if (state.isRestarting) {
    state.isRestarting = false;
    restartGame();
  } else {
    requestAnimationFrame(draw);
  }
      if (mag > 1) {
        dx /= mag;
        dy /= mag;
      }
      const sx = rx + size / 2 + dx * size / 2;
      const sy = ry + size / 2 + dy * size / 2;
      const ang = Math.atan2(dy, dx);
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(ang) * 6, sy + Math.sin(ang) * 6);
      ctx.lineTo(
        sx + Math.cos(ang + Math.PI * 0.75) * 6,
        sy + Math.sin(ang + Math.PI * 0.75) * 6
      );
      ctx.lineTo(
        sx + Math.cos(ang - Math.PI * 0.75) * 6,
        sy + Math.sin(ang - Math.PI * 0.75) * 6
      );
      ctx.closePath();
      ctx.fill();
    }
  } else {
    state.radarTargets = [];
  }

  if (state.isRestarting) {
    state.isRestarting = false;
    restartGame();
  } else {
    requestAnimationFrame(draw);
  }
}
