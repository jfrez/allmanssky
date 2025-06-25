import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

let scene, camera, renderer, ship;
const velocity = new THREE.Vector3();
const keys = {};

const tileSize = 2000;
const loadedSystems = new Map();
const starfield = new THREE.Group();
const clock = new THREE.Clock();

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
    sys.planets.push({
      orbit: sys.size + rng() * 400 + 200,
      size: rng() * 20 + 90,
      speed: rng() * 0.0005 + 0.0002,
      phase: rng() * Math.PI * 2,
      plane: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize()
    });
  }
  return sys;
}

function init() {
  const canvas = document.getElementById('game');
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

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
  document.addEventListener('keydown', e => (keys[e.code] = true));
  document.addEventListener('keyup', e => (keys[e.code] = false));
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function getForwardVector() {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
}

function getRightVector() {
  return new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion);
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

  updateSystems();
  for (const sys of loadedSystems.values()) {
    if (!sys) continue;
    const t = clock.elapsedTime;
    sys.planets.forEach(p => {
      const angle = p.phase + t * p.speed;
      const pos = new THREE.Vector3(0, 0, 1)
        .applyAxisAngle(p.plane, angle)
        .multiplyScalar(p.orbit);
      p.mesh.position.copy(pos);
    });
  }

  const camOffset = forward.clone().multiplyScalar(-5).add(new THREE.Vector3(0, 2, 0));
  camera.position.copy(ship.position).add(camOffset);
  camera.lookAt(ship.position);

  renderer.render(scene, camera);
}
