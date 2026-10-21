import { useTranslation } from 'react-i18next';
import { getBest, saveBest, useGameCanvas } from '../lib/useGameCanvas';

const W = 640;
const H = 360;
const GOAL = { left: 170, right: 470, top: 80, ground: 255 };
const SPOT = { x: 320, y: 322 };
const KICKS = 5;
const ZONES = [215, 320, 425]; // canto esquerdo, meio, canto direito

/** Pênaltis: a mira passeia pelo gol; espaço/clique/toque chuta. 5 cobranças. */
export default function GamePenalti() {
  const { t } = useTranslation();
  const text = {
    help: t('jogo.penalti.help'),
    goal: t('jogo.penalti.goal'),
    saved: t('jogo.penalti.saved'),
    wide: t('jogo.penalti.wide'),
    score: (g, k) => t('jogo.penalti.score', { goals: g, kicks: k, total: KICKS }),
    end: (g) => t('jogo.penalti.end', { goals: g, total: KICKS }),
    best: (b) => t('jogo.best', { best: b }),
    again: t('jogo.again'),
  };

  const ref = useGameCanvas(W, H, (ctx, { palette }) => {
    let state = 'aim'; // aim | shot | result | over
    let time = 0;
    let goals = 0;
    let kicks = 0;
    let aim = { x: 320, y: 160 };
    let shot = null; // { target, keeperX, keeperY, start, outcome }
    let message = '';

    const reset = () => {
      goals = 0;
      kicks = 0;
      state = 'aim';
      message = '';
    };

    const kick = () => {
      if (state === 'over') return reset();
      if (state !== 'aim') return;
      const target = { ...aim };
      // goleiro escolhe um canto; às vezes "lê" a cobrança
      const ballZone = target.x < 270 ? 0 : target.x > 370 ? 2 : 1;
      const zone = Math.random() < 0.38 ? ballZone : Math.floor(Math.random() * 3);
      const keeperX = ZONES[zone];
      const out = target.x < GOAL.left + 6 || target.x > GOAL.right - 6 || target.y < GOAL.top + 6;
      const reachTop = zone === 1 ? 150 : 115;
      const saved = !out && Math.abs(target.x - keeperX) < 58 && target.y > reachTop;
      shot = { target, keeperX, zone, start: time, outcome: out ? 'wide' : saved ? 'saved' : 'goal' };
      state = 'shot';
    };

    const drawKeeper = (p, x, lean) => {
      ctx.save();
      ctx.translate(x, GOAL.ground);
      ctx.rotate(lean);
      ctx.fillStyle = p.busy;
      ctx.fillRect(-14, -62, 28, 40); // tronco
      ctx.fillStyle = p.dim;
      ctx.fillRect(-12, -22, 9, 22); // pernas
      ctx.fillRect(3, -22, 9, 22);
      ctx.fillStyle = p.busy;
      ctx.fillRect(-34, -60, 20, 8); // braços abertos
      ctx.fillRect(14, -60, 20, 8);
      ctx.fillStyle = p.muted;
      ctx.beginPath();
      ctx.arc(0, -74, 11, 0, Math.PI * 2); // cabeça
      ctx.fill();
      ctx.restore();
    };

    const drawBall = (p, x, y, r) => {
      ctx.fillStyle = p.text;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.bg;
      ctx.beginPath();
      ctx.arc(x - r * 0.25, y - r * 0.2, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (dt) => {
      time += dt;
      const p = palette();
      ctx.font = `16px ${p.font}`;
      ctx.textAlign = 'center';
      ctx.clearRect(0, 0, W, H);

      // gramado em faixas
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? p.bg : p.bg2;
        ctx.fillRect(0, GOAL.ground + i * 20 - 20, W, 20);
      }
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, W, GOAL.ground - 20);

      // rede e trave
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 1;
      for (let x = GOAL.left; x <= GOAL.right; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, GOAL.top);
        ctx.lineTo(x, GOAL.ground);
        ctx.stroke();
      }
      for (let y = GOAL.top; y <= GOAL.ground; y += 16) {
        ctx.beginPath();
        ctx.moveTo(GOAL.left, y);
        ctx.lineTo(GOAL.right, y);
        ctx.stroke();
      }
      ctx.strokeStyle = p.text;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(GOAL.left, GOAL.ground);
      ctx.lineTo(GOAL.left, GOAL.top);
      ctx.lineTo(GOAL.right, GOAL.top);
      ctx.lineTo(GOAL.right, GOAL.ground);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.dim;
      ctx.beginPath();
      ctx.moveTo(40, GOAL.ground);
      ctx.lineTo(W - 40, GOAL.ground);
      ctx.stroke();

      if (state === 'aim') {
        // mira em curva de Lissajous: precisa de timing, não de pontaria parada
        aim = {
          x: 320 + Math.sin(time / 520) * 172,
          y: 168 + Math.sin(time / 330 + 1) * 92,
        };
        drawKeeper(p, 320 + Math.sin(time / 300) * 12, 0);
        drawBall(p, SPOT.x, SPOT.y, 11);
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(aim.x, aim.y, 12, 0, Math.PI * 2);
        ctx.moveTo(aim.x - 18, aim.y);
        ctx.lineTo(aim.x + 18, aim.y);
        ctx.moveTo(aim.x, aim.y - 18);
        ctx.lineTo(aim.x, aim.y + 18);
        ctx.stroke();
        ctx.fillStyle = p.muted;
        ctx.fillText(kicks === 0 ? text.help : text.score(goals, kicks), W / 2, 40);
      } else if (state === 'shot' || state === 'result') {
        const k = Math.min(1, (time - shot.start) / 480);
        const ease = 1 - (1 - k) ** 3;
        const lean = [-1.1, 0, 1.1][shot.zone] * ease;
        const keeperX = 320 + (shot.keeperX - 320) * ease;
        drawKeeper(p, keeperX, lean);
        const bx = SPOT.x + (shot.target.x - SPOT.x) * ease;
        const by = SPOT.y + (shot.target.y - SPOT.y) * ease - Math.sin(ease * Math.PI) * 30;
        drawBall(p, bx, by, 11 - ease * 4);
        if (k >= 1 && state === 'shot') {
          state = 'result';
          kicks += 1;
          if (shot.outcome === 'goal') goals += 1;
          message = text[shot.outcome];
          shot.end = time;
        }
        if (state === 'result') {
          ctx.font = `bold 34px ${p.font}`;
          ctx.fillStyle = shot.outcome === 'goal' ? p.accent : p.busy;
          ctx.fillText(message, W / 2, 50);
          if (time - shot.end > 1100) {
            if (kicks >= KICKS) {
              state = 'over';
              saveBest('penalti', goals);
            } else state = 'aim';
          }
        }
      } else if (state === 'over') {
        drawKeeper(p, 320, 0);
        ctx.font = `bold 28px ${p.font}`;
        ctx.fillStyle = p.accent;
        ctx.fillText(text.end(goals), W / 2, 46);
        ctx.font = `16px ${p.font}`;
        ctx.fillStyle = p.muted;
        ctx.fillText(`${text.best(getBest('penalti'))} · ${text.again}`, W / 2, 74);
      }
    };

    const key = (e) => {
      if ([' ', 'Enter', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        kick();
      }
    };
    return { frame, key, pointer: kick };
  });

  return <canvas ref={ref} className="game-canvas" tabIndex={0} data-keep-focus aria-label={t('jogo.penalti.label')} style={{ aspectRatio: `${W} / ${H}` }} />;
}
