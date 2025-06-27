import { state, gainCannons, loseCannons } from './state.js';

let socket;
const bulletQueue = [];

export function connect(url = 'ws://localhost:8080') {
  socket = new WebSocket(url);
  socket.addEventListener('message', evt => {
    let msg;
    try {
      msg = JSON.parse(evt.data);
    } catch {
      return;
    }
    if (msg.type === 'id') {
      state.clientId = msg.id;
    } else if (msg.type === 'state') {
      state.remotePlayers[msg.id] = {
        x: msg.x,
        y: msg.y,
        angle: msg.angle,
        cannons: msg.cannons
      };
    } else if (msg.type === 'bullet') {
      state.enemyBullets.push({
        x: msg.x,
        y: msg.y,
        vx: msg.vx,
        vy: msg.vy
      });
    } else if (msg.type === 'kill') {
      if (msg.killer === state.clientId) {
        gainCannons(msg.cannons);
      } else if (msg.victim === state.clientId) {
        loseCannons(msg.cannons);
        state.playerHealth = 0;
      }
      delete state.remotePlayers[msg.victim];
    } else if (msg.type === 'leave') {
      delete state.remotePlayers[msg.id];
    }
  });
}

export function sendState() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(
    JSON.stringify({
      type: 'state',
      x: state.playerX,
      y: state.playerY,
      angle: state.angle,
      cannons: state.cannons.length
    })
  );
  while (bulletQueue.length) {
    const b = bulletQueue.shift();
    socket.send(
      JSON.stringify({
        type: 'bullet',
        x: b.x,
        y: b.y,
        vx: b.vx,
        vy: b.vy
      })
    );
  }
}

export function queueBullet(b) {
  bulletQueue.push(b);
}

export function sendKill(victim) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'kill', victim }));
}
