import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

let scene, camera, renderer, ship;
const velocity = new THREE.Vector3();
const keys = {};
const bullets = [];
const enemies = [];
let enemySpawnTimer = 0;
const state = {
  health: 100,
  resources: { fuel: 1000, oxygen: 100, food: 100 },
  maxFuel: 1000,
  maxRes: 100,
  credits: 1000,
  ore: 0,
  buildings: [],
};

const tileSize = 2000;
const loadedSystems = new Map();
const starfield = new THREE.Group();
const clock = new THREE.Clock();
const hud = document.getElementById('hud');
const hudCtx = hud.getContext('2d');
const radarTargets = [];
const radarSize = 150;
const radarRadius = 1000;

init();
animate();

function mulberry32(a) {
  return function() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getRandom(gx, gy, gz) {
  const seed = (gx * 73856093) ^ (gy * 19349663) ^ (gz * 83492791);
  return mulberry32(seed >>> 0);
}

function getStarSystem(gx, gy, gz) {
  const rng = getRandom(gx, gy, gz);
  if (rng() < 0.97) return null;
  const sys = {
    x: gx * tileSize + rng() * tileSize,
    y: gy * tileSize + rng() * tileSize,
    z: gz * tileSize + rng() * tileSize,
    size: rng() * 100 + 450,
    hue: rng() * 60 + 30,
    gx,
    gy,
    gz,
    planets: []
  };
  const count = Math.floor(rng() * 4);
  for (let i = 0; i < count; i++) {
    const basePrice = Math.floor(rng() * 40 + 10);
    sys.planets.push({
      index: i,
      orbit: sys.size + rng() * 400 + 200,
      size: rng() * 20 + 90,
      speed: rng() * 0.0005 + 0.0002,
      phase: rng() * Math.PI * 2,
      plane: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
      supplies: {
        fuel: rng() > 0.5,
        oxygen: rng() > 0.5,
        food: rng() > 0.5,
      },
      vendor:
        rng() > 0.5
          ? { buyPrice: basePrice, sellPrice: Math.floor(basePrice * 0.8) }
          : null,
    });
  }
  return sys;
}

function init() {
  const canvas = document.getElementById('game');
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  hud.width = window.innerWidth;
  hud.height = window.innerHeight;
  hudCtx.font = '14px sans-serif';
  hudCtx.fillStyle = 'white';
  hud.addEventListener('click', onHudClick);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100000
  );
  camera.position.set(0, 2, 10);

  const geometry = new THREE.ConeGeometry(0.5, 1, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  ship = new THREE.Mesh(geometry, material);
  scene.add(ship);

  const starGeometry = new THREE.BufferGeometry();
  const verts = [];
  for (let i = 0; i < 2000; i++) {
    const x = THREE.MathUtils.randFloatSpread(10000);
    const y = THREE.MathUtils.randFloatSpread(10000);
    const z = THREE.MathUtils.randFloatSpread(10000);
    verts.push(x, y, z);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
  const starPoints = new THREE.Points(starGeometry, starMaterial);
  starfield.add(starPoints);
  scene.add(starfield);

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') shoot();
    if (e.code === 'KeyB') placeBuilding();
  });
  document.addEventListener('keyup', e => (keys[e.code] = false));
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  hud.width = window.innerWidth;
  hud.height = window.innerHeight;
}

function getForwardVector() {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
}

function getRightVector() {
  return new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion);
}

function shoot() {
  const geometry = new THREE.SphereGeometry(0.1, 6, 6);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(ship.position);
  scene.add(mesh);
  const vel = getForwardVector().multiplyScalar(50);
  bullets.push({ mesh, vel, life: 5 });
}

function placeBuilding() {
  for (const sys of loadedSystems.values()) {
    if (!sys) continue;
    const t = clock.elapsedTime;
    for (const p of sys.planets) {
      const angle = p.phase + t * p.speed;
      const pos = new THREE.Vector3(0, 0, 1)
        .applyAxisAngle(p.plane, angle)
        .multiplyScalar(p.orbit)
        .add(sys.group.position);
      if (ship.position.distanceTo(pos) < p.size + 5) {
        if (state.ore < 10) return;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(2, 2, 2),
          new THREE.MeshBasicMaterial({ color: 0x8b4513 })
        );
        mesh.position.copy(ship.position);
        scene.add(mesh);
        state.buildings.push({ position: mesh.position.clone(), mesh });
        state.ore -= 10;
        return;
      }
    }
  }
}

function spawnEnemy() {
  const dir = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(1),
    THREE.MathUtils.randFloatSpread(1),
    THREE.MathUtils.randFloatSpread(1)
  ).normalize();
  const distance = 200;
  const pos = ship.position.clone().addScaledVector(dir, distance);
  const geometry = new THREE.ConeGeometry(0.6, 1.5, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(pos);
  scene.add(mesh);
  enemies.push({ mesh, vel: new THREE.Vector3() });
}

function updateSystems() {
  const px = ship.position.x;
  const py = ship.position.y;
  const pz = ship.position.z;
  const range = 2;
  const startGX = Math.floor(px / tileSize) - range;
  const startGY = Math.floor(py / tileSize) - range;
  const startGZ = Math.floor(pz / tileSize) - range;
  const endGX = startGX + range * 2;
  const endGY = startGY + range * 2;
  const endGZ = startGZ + range * 2;

  for (let gx = startGX; gx <= endGX; gx++) {
    for (let gy = startGY; gy <= endGY; gy++) {
      for (let gz = startGZ; gz <= endGZ; gz++) {
        const key = `${gx},${gy},${gz}`;
        if (!loadedSystems.has(key)) {
          const sys = getStarSystem(gx, gy, gz);
          if (sys) {
            const group = new THREE.Group();
            group.position.set(sys.x, sys.y, sys.z);
            const starColor = new THREE.Color(`hsl(${sys.hue},80%,60%)`);
            const starMesh = new THREE.Mesh(
              new THREE.SphereGeometry(sys.size, 16, 16),
              new THREE.MeshBasicMaterial({ color: starColor })
            );
            group.add(starMesh);
            for (const p of sys.planets) {
              const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(p.size, 12, 12),
                new THREE.MeshBasicMaterial({ color: 0x999999 })
              );
              p.mesh = mesh;
              group.add(mesh);
            }
            scene.add(group);
            sys.group = group;
            loadedSystems.set(key, sys);
          } else {
            loadedSystems.set(key, null);
          }
        }
      }
    }
  }

  for (const [key, sys] of loadedSystems) {
    if (!sys) continue;
    const distSq = ship.position.distanceToSquared(sys.group.position);
    if (distSq > Math.pow(range * tileSize * 3, 2)) {
      scene.remove(sys.group);
      loadedSystems.delete(key);
    }
  }
}

function drawRadar() {
  hudCtx.clearRect(0, 0, hud.width, hud.height);
  drawStats();
  const rx = hud.width - radarSize - 20;
  const ry = 20;
  hudCtx.fillStyle = 'rgba(0,0,0,0.5)';
  hudCtx.fillRect(rx, ry, radarSize, radarSize);
  hudCtx.strokeStyle = 'white';
  hudCtx.strokeRect(rx, ry, radarSize, radarSize);
  hudCtx.fillStyle = 'cyan';
  hudCtx.fillRect(rx + radarSize / 2 - 2, ry + radarSize / 2 - 2, 4, 4);
  radarTargets.length = 0;

  const t = clock.elapsedTime;
  for (const sys of loadedSystems.values()) {
    if (!sys) continue;
    for (const p of sys.planets) {
      const angle = p.phase + t * p.speed;
      const pos = new THREE.Vector3(0, 0, 1)
        .applyAxisAngle(p.plane, angle)
        .multiplyScalar(p.orbit)
        .add(sys.group.position);
      const dx = (pos.x - ship.position.x) / radarRadius;
      const dz = (pos.z - ship.position.z) / radarRadius;
      if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) {
        const sx = rx + radarSize / 2 + dx * radarSize / 2;
        const sy = ry + radarSize / 2 + dz * radarSize / 2;
        hudCtx.fillStyle = 'orange';
        hudCtx.beginPath();
        hudCtx.arc(sx, sy, 3, 0, Math.PI * 2);
        hudCtx.fill();
        radarTargets.push({ sx, sy, pos });
      }
    }
  }
  for (const b of state.buildings) {
    const dx = (b.position.x - ship.position.x) / radarRadius;
    const dz = (b.position.z - ship.position.z) / radarRadius;
    if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) {
      const sx = rx + radarSize / 2 + dx * radarSize / 2;
      const sy = ry + radarSize / 2 + dz * radarSize / 2;
      hudCtx.fillStyle = 'purple';
      hudCtx.fillRect(sx - 2, sy - 2, 4, 4);
    }
  }
}

function drawStats() {
  const barWidth = 100;
  hudCtx.fillStyle = 'grey';
  hudCtx.fillRect(20, 20, barWidth + 4, 14);
  hudCtx.fillStyle = 'lime';
  hudCtx.fillRect(22, 22, (state.health) , 10);
  hudCtx.strokeStyle = 'white';
  hudCtx.strokeRect(20, 20, barWidth + 4, 14);

  hudCtx.fillStyle = 'grey';
  hudCtx.fillRect(20, 40, barWidth + 4, 14);
  hudCtx.fillStyle = 'orange';
  hudCtx.fillRect(22, 42, (state.resources.fuel / state.maxFuel) * barWidth, 10);
  hudCtx.strokeStyle = 'white';
  hudCtx.strokeRect(20, 40, barWidth + 4, 14);

  hudCtx.fillStyle = 'grey';
  hudCtx.fillRect(20, 60, barWidth + 4, 14);
  hudCtx.fillStyle = 'aqua';
  hudCtx.fillRect(22, 62, (state.resources.oxygen / state.maxRes) * barWidth, 10);
  hudCtx.strokeStyle = 'white';
  hudCtx.strokeRect(20, 60, barWidth + 4, 14);

  hudCtx.fillStyle = 'grey';
  hudCtx.fillRect(20, 80, barWidth + 4, 14);
  hudCtx.fillStyle = 'magenta';
  hudCtx.fillRect(22, 82, (state.resources.food / state.maxRes) * barWidth, 10);
  hudCtx.strokeStyle = 'white';
  hudCtx.strokeRect(20, 80, barWidth + 4, 14);

  hudCtx.fillStyle = 'white';
  hudCtx.fillText(`Credits: ${state.credits} Ore: ${state.ore}`, 20, 110);
}

function onHudClick(e) {
  const rect = hud.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  for (const t of radarTargets) {
    if (Math.hypot(x - t.sx, y - t.sy) < 5) {
      ship.position.copy(t.pos.clone().add(new THREE.Vector3(0, 10, 0)));
      velocity.set(0, 0, 0);
      break;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  const thrust = 20 * dt;
  const forward = getForwardVector();
  const right = getRightVector();

  if (keys['KeyW']) velocity.addScaledVector(forward, thrust);
  if (keys['KeyS']) velocity.addScaledVector(forward, -thrust);
  if (keys['KeyA']) velocity.addScaledVector(right, -thrust);
  if (keys['KeyD']) velocity.addScaledVector(right, thrust);
  if (keys['KeyR']) velocity.y += thrust;
  if (keys['KeyF']) velocity.y -= thrust;

  const rotSpeed = 1.5 * dt;
  if (keys['ArrowLeft']) ship.rotation.y += rotSpeed;
  if (keys['ArrowRight']) ship.rotation.y -= rotSpeed;
  if (keys['ArrowUp']) ship.rotation.x += rotSpeed;
  if (keys['ArrowDown']) ship.rotation.x -= rotSpeed;

  ship.position.add(velocity);
  velocity.multiplyScalar(0.995);

  starfield.position.copy(ship.position);

  state.resources.oxygen = Math.max(0, state.resources.oxygen - 0.02 * dt * 60);
  state.resources.food = Math.max(0, state.resources.food - 0.01 * dt * 60);
  state.resources.fuel = Math.max(0, state.resources.fuel - 0.005 * dt * 60);
  if (state.resources.fuel <= 0 || state.resources.oxygen <= 0 || state.resources.food <= 0) {
    state.health = Math.max(0, state.health - 0.1 * dt * 60);
  }

  enemySpawnTimer += dt;
  if (enemySpawnTimer > 300) {
    spawnEnemy();
    enemySpawnTimer = 0;
  }

  for (const b of bullets) {
    b.mesh.position.addScaledVector(b.vel, dt);
    b.life -= dt;
  }
  bullets.forEach((b, i) => {
    if (b.life <= 0) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  });

  for (const e of enemies) {
    const toShip = ship.position.clone().sub(e.mesh.position).normalize();
    e.vel.addScaledVector(toShip, dt * 5);
    e.mesh.position.addScaledVector(e.vel, dt);
    e.mesh.lookAt(ship.position);
  }
  enemies.forEach((e, ei) => {
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (b.mesh.position.distanceTo(e.mesh.position) < 1) {
        scene.remove(e.mesh);
        scene.remove(b.mesh);
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        break;
      }
    }
  });

  updateSystems();
  for (const sys of loadedSystems.values()) {
    if (!sys) continue;
    const distStar = ship.position.distanceTo(sys.group.position);
    const starInfluence = 200 + sys.size;
    if (distStar < starInfluence && distStar > 0) {
      const dir = sys.group.position.clone().sub(ship.position).normalize();
      const strength = (1 - distStar / starInfluence) * 0.1;
      ship.position.addScaledVector(dir, strength);
      if (distStar < sys.size) state.health = Math.max(0, state.health - 1 * dt * 60);
    }
    const t = clock.elapsedTime;
    sys.planets.forEach(p => {
      const angle = p.phase + t * p.speed;
      const localPos = new THREE.Vector3(0, 0, 1)
        .applyAxisAngle(p.plane, angle)
        .multiplyScalar(p.orbit);
      p.mesh.position.copy(localPos);
      const worldPos = sys.group.localToWorld(localPos.clone());

      if (ship.position.distanceTo(worldPos) < p.size + 5) {
        if (p.supplies.fuel) state.resources.fuel = state.maxFuel;
        if (p.supplies.oxygen) state.resources.oxygen = state.maxRes;
        if (p.supplies.food) state.resources.food = state.maxRes;
        if (p.vendor) {
          if (state.ore > 0) {
            state.credits += state.ore * p.vendor.sellPrice;
            state.ore = 0;
          }
        }
        state.health = 100;
      }
    });
  }

  drawRadar();

  const camOffset = forward.clone().multiplyScalar(-5).add(new THREE.Vector3(0, 2, 0));
  camera.position.copy(ship.position).add(camOffset);
  camera.lookAt(ship.position);

  renderer.render(scene, camera);
}
