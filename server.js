import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map();
let nextId = 1;

wss.on('connection', ws => {
  const id = nextId++;
  clients.set(id, { ws, cannons: 1 });
  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', data => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    if (msg.type === 'state') {
      const c = clients.get(id);
      if (c) c.cannons = msg.cannons;
      const payload = JSON.stringify({
        type: 'state',
        id,
        x: msg.x,
        y: msg.y,
        angle: msg.angle,
        cannons: msg.cannons
      });
      for (const [otherId, client] of clients) {
        if (otherId !== id && client.ws.readyState === 1) {
          client.ws.send(payload);
        }
      }
    } else if (msg.type === 'bullet') {
      const payload = JSON.stringify({
        type: 'bullet',
        id,
        x: msg.x,
        y: msg.y,
        vx: msg.vx,
        vy: msg.vy
      });
      for (const [otherId, client] of clients) {
        if (otherId !== id && client.ws.readyState === 1) {
          client.ws.send(payload);
        }
      }
    } else if (msg.type === 'kill') {
      const victim = clients.get(msg.victim);
      const cannons = victim ? Math.floor(victim.cannons * 0.5) : 0;
      if (victim) victim.cannons -= cannons;
      const payload = JSON.stringify({
        type: 'kill',
        killer: id,
        victim: msg.victim,
        cannons
      });
      for (const client of clients.values()) {
        if (client.ws.readyState === 1) client.ws.send(payload);
      }
    }
  });

  ws.on('close', () => {
    clients.delete(id);
    const payload = JSON.stringify({ type: 'leave', id });
    for (const client of clients.values()) {
      if (client.ws.readyState === 1) client.ws.send(payload);
    }
  });
});

console.log('WebSocket server running on ws://localhost:8080');
