import { canvas, ctx, state } from './state.js';

export function playIntro() {
  return new Promise(resolve => {
    let frame = 0;
    function anim() {
      frame++;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      for (let i = 0; i < 20; i++) {
        const angle = frame * 0.1 + i * 0.4;
        const r = 30 + i * 4;
        ctx.strokeStyle = `hsla(260,100%,70%,${0.6 - i * 0.03})`;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      const t = Math.min(1, frame / 120);
      const shipX = canvas.width * (1 - t) + canvas.width / 2 * t;
      const shipY = canvas.height / 2;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(shipX, shipY - 10);
      ctx.lineTo(shipX - 10, shipY + 10);
      ctx.lineTo(shipX + 10, shipY + 10);
      ctx.closePath();
      ctx.fill();

      if (frame < 120) {
        requestAnimationFrame(anim);
      } else {
        state.playerX = (Math.random() - 0.5) * 1e6;
        state.playerY = (Math.random() - 0.5) * 1e6;
        resolve();
      }
    }
    anim();
  });
}
