import { useTranslation } from 'react-i18next';
import { getBest, saveBest, useGameCanvas } from '../lib/useGameCanvas';
import { drawGoalkeeper, drawShadow, drawSoccerBall } from '../lib/gameArt';

const W = 640;
const H = 360;
const GOAL = { left: 170, right: 470, top: 80, ground: 255 };
const SPOT = { x: 320, y: 322 };
const KICKS = 5;
const ZONES = [235, 320, 405]; // de onde o goleiro mergulha: esquerda, meio, direita

/** Mesma transformação do drawGoalkeeper: ponto do corpo (pés na origem) → tela. */
function toWorld([px, py], x, dive, lift) {
  const a = dive * 1.15;
  const y0 = GOAL.ground - Math.abs(dive) * 28 + lift;
  const ry = py + 56; // gira em torno do quadril (0, -56)
  return [x + px * Math.cos(a) - ry * Math.sin(a), y0 - 56 + px * Math.sin(a) + ry * Math.cos(a)];
}

const distToSegment = ([x, y], [ax, ay], [bx, by]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const k = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + k * dx), y - (ay + k * dy));
};

/** A bola encosta no goleiro na pose final? (corpo e braços como segmentos grossos) */
function isSaved(target, zone) {
  const dive = [-1, 0, 1][zone];
  const lift = zone === 1 ? -18 : 0; // no meio ele dá um pulinho
  const x = ZONES[zone];
  const w = (pt) => toWorld(pt, x, dive, lift);
  const arms = dive
    ? [[[-18, -100], [-14, -158]], [[18, -100], [14, -158]]]
    : [[[-18, -100], [-48, -76]], [[18, -100], [48, -76]]];
  const ball = [target.x, target.y];
  if (distToSegment(ball, w([0, 0]), w([0, -138])) < 26) return true; // corpo e cabeça
  return arms.some(([s, h]) => distToSegment(ball, w(s), w(h)) < 20); // braços e luvas
}

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
      const zone = Math.random() < 0.45 ? ballZone : Math.floor(Math.random() * 3);
      const keeperX = ZONES[zone];
      const out = target.x < GOAL.left + 6 || target.x > GOAL.right - 6 || target.y < GOAL.top + 6;
      const saved = !out && isSaved(target, zone);
      shot = { target, keeperX, zone, start: time, outcome: out ? 'wide' : saved ? 'saved' : 'goal' };
      state = 'shot';
    };

    const keeper = (p, x, dive, bounce = 0) => {
      drawShadow(ctx, x + dive * 40, GOAL.ground + 2, 30 + Math.abs(dive) * 30, 0.3);
      drawGoalkeeper(ctx, p.art, x, GOAL.ground, dive, bounce);
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
          x: 320 + Math.sin(time / 520) * 162,
          y: 170 + Math.sin(time / 330 + 1) * 84,
        };
        keeper(p, 320 + Math.sin(time / 300) * 12, 0, Math.abs(Math.sin(time / 180)) * -3);
        drawShadow(ctx, SPOT.x, SPOT.y + 15, 15);
        drawSoccerBall(ctx, p.art, SPOT.x, SPOT.y, 16);
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
        const dive = [-1, 0, 1][shot.zone] * ease;
        const keeperX = 320 + (shot.keeperX - 320) * ease;
        keeper(p, keeperX, shot.zone === 1 ? 0 : dive, shot.zone === 1 ? -ease * 18 : 0);
        const bx = SPOT.x + (shot.target.x - SPOT.x) * ease;
        const by = SPOT.y + (shot.target.y - SPOT.y) * ease - Math.sin(ease * Math.PI) * 30;
        const groundY = SPOT.y + 12 + (GOAL.ground - SPOT.y - 12) * ease;
        drawShadow(ctx, bx, groundY, 13 - ease * 5, 0.3 - ease * 0.15);
        drawSoccerBall(ctx, p.art, bx, by, 16 - ease * 6, ease * 9);
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
        keeper(p, 320, 0);
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
