import * as THREE from './three.module.js';

let scene, camera, renderer, ship;
const velocity = new THREE.Vector3();
const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };

init();
animate();

function init() {
  const canvas = document.getElementById('game');
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 10;
  camera.position.y = 2;

  // simple ship
  const geometry = new THREE.ConeGeometry(0.5, 1, 8);
  const material = new THREE.MeshBasicMaterial({color: 0xffffff});
  ship = new THREE.Mesh(geometry, material);
  scene.add(ship);

  // starfield
  const stars = new THREE.BufferGeometry();
  const starVertices = [];
  for (let i = 0; i < 1000; i++) {
    const x = THREE.MathUtils.randFloatSpread(1000);
    const y = THREE.MathUtils.randFloatSpread(1000);
    const z = THREE.MathUtils.randFloatSpread(1000);
    starVertices.push(x, y, z);
  }
  stars.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
  const starPoints = new THREE.Points(stars, starMaterial);
  scene.add(starPoints);

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', e => { if (e.code in keys) keys[e.code] = true; });
  document.addEventListener('keyup', e => { if (e.code in keys) keys[e.code] = false; });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // controls
  if (keys.ArrowUp) velocity.z -= 0.02;
  if (keys.ArrowDown) velocity.z += 0.02;
  if (keys.ArrowLeft) ship.rotation.y += 0.05;
  if (keys.ArrowRight) ship.rotation.y -= 0.05;

  ship.position.add(velocity);
  velocity.multiplyScalar(0.98);

  const dir = new THREE.Vector3(0, 0, 1).applyEuler(ship.rotation).multiplyScalar(-5);
  camera.position.copy(ship.position).add(dir).add(new THREE.Vector3(0,2,0));
  camera.lookAt(ship.position);

  renderer.render(scene, camera);
}
