import { useTranslation } from 'react-i18next';
import { getBest, saveBest, useGameCanvas } from '../lib/useGameCanvas';

const W = 640;
const H = 200;
const GROUND = 168;
const PX = 3; // tamanho do "pixel" do galo

// Galo em pixel art (12×12). R crista, Y bico, W corpo, T cauda, O olho, L pernas.
const ROOSTER = [
  '....RR......',
  '...RRRR.....',
  '...WWWW.....',
  '..WWOWWY....',
  '..WWWWWYY...',
  '...WWWW.....',
  'T..WWWWW....',
  'TT.WWWWWW...',
  'TTWWWWWWWW..',
  '.TWWWWWWW...',
  '...L....L...',
  '...LL...LL..',
];
const LEGS_B = ['....L..L....', '....LL.LL...']; // passo alternado

/** Galo Run: pule os obstáculos (espaço, ↑ ou toque). */
export default function GameGaloRun() {
  const { t } = useTranslation();
  const text = {
    start: t('jogo.run.start'),
    over: t('jogo.run.over'),
    score: (s) => t('jogo.run.score', { score: s }),
    best: (b) => t('jogo.best', { best: b }),
  };

  const ref = useGameCanvas(W, H, (ctx, { palette }) => {
    let state = 'ready'; // ready | run | over
    let y = 0; // altura do galo acima do chão
    let vy = 0;
    let speed = 0.32; // px/ms
    let distance = 0;
    let obstacles = [];
    let nextGap = 600;
    let groundOffset = 0;
    let stepTime = 0;

    const reset = () => {
      state = 'run';
      y = 0;
      vy = 0;
      speed = 0.32;
      distance = 0;
      obstacles = [];
      nextGap = 500;
    };

    const jump = () => {
      if (state !== 'run') return reset();
      if (y === 0) vy = 0.78;
    };

    const drawRooster = (p, x, top, legsFrame) => {
      const colors = { R: p.busy, Y: p.accent, W: p.text, T: p.dim, O: p.bg, L: p.accent };
      const rows = legsFrame ? [...ROOSTER.slice(0, 10), ...LEGS_B] : ROOSTER;
      rows.forEach((row, r) => {
        [...row].forEach((c, col) => {
          if (c === '.') return;
          ctx.fillStyle = colors[c];
          ctx.fillRect(x + col * PX, top + r * PX, PX, PX);
        });
      });
    };

    const spawn = () => {
      const tall = Math.random() < 0.3;
      const double = !tall && Math.random() < 0.3;
      obstacles.push({ x: W + 20, w: double ? 34 : 16, h: tall ? 40 : 26, tall });
      nextGap = 260 + Math.random() * 320 + speed * 400;
    };

    const frame = (dt) => {
      const p = palette();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, W, H);

      if (state === 'run') {
        speed = Math.min(0.75, 0.32 + distance / 60000);
        distance += speed * dt;
        groundOffset = (groundOffset + speed * dt) % 24;
        stepTime += dt;
        vy -= 0.0024 * dt;
        y = Math.max(0, y + vy * dt);
        if (y === 0) vy = 0;
        nextGap -= speed * dt;
        if (nextGap <= 0) spawn();
        obstacles.forEach((o) => {
          o.x -= speed * dt;
        });
        obstacles = obstacles.filter((o) => o.x + o.w > -10);
        // colisão (caixa do galo um pouco menor que o desenho)
        const gx = 60 + 6;
        const gw = 12 * PX - 12;
        const gBottom = GROUND - y;
        const gTop = gBottom - 12 * PX + 6;
        if (obstacles.some((o) => o.x < gx + gw && o.x + o.w > gx && GROUND - o.h < gBottom - 2 && GROUND > gTop)) {
          state = 'over';
          saveBest('galo-run', Math.floor(distance / 10));
        }
      }

      // chão tracejado
      ctx.strokeStyle = p.dim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 1);
      ctx.lineTo(W, GROUND + 1);
      ctx.stroke();
      ctx.fillStyle = p.border;
      for (let x = -groundOffset; x < W; x += 24) ctx.fillRect(x, GROUND + 8, 10, 2);

      // obstáculos: cones (baixos) e barreiras (altas)
      obstacles.forEach((o) => {
        if (o.tall) {
          ctx.fillStyle = p.warn;
          ctx.fillRect(o.x, GROUND - o.h, 5, o.h);
          ctx.fillRect(o.x + o.w - 5, GROUND - o.h, 5, o.h);
          ctx.fillStyle = p.text;
          ctx.fillRect(o.x - 3, GROUND - o.h, o.w + 6, 8);
        } else {
          for (let cx = o.x; cx < o.x + o.w - 4; cx += 18) {
            ctx.fillStyle = p.warn;
            ctx.beginPath();
            ctx.moveTo(cx, GROUND);
            ctx.lineTo(cx + 8, GROUND - o.h);
            ctx.lineTo(cx + 16, GROUND);
            ctx.fill();
            ctx.fillStyle = p.text;
            ctx.fillRect(cx + 4, GROUND - o.h * 0.5, 8, 4);
          }
        }
      });

      const legs = state === 'run' && y === 0 && Math.floor(stepTime / 120) % 2 === 1;
      drawRooster(p, 60, GROUND - y - 12 * PX, legs);

      ctx.textAlign = 'right';
      ctx.font = `15px ${p.font}`;
      ctx.fillStyle = p.muted;
      ctx.fillText(`${text.best(getBest('galo-run'))}   ${text.score(Math.floor(distance / 10))}`, W - 16, 26);
      ctx.textAlign = 'center';
      if (state !== 'run') {
        ctx.font = `bold 20px ${p.font}`;
        ctx.fillStyle = p.accent;
        ctx.fillText(state === 'ready' ? text.start : text.over, W / 2, 80);
      }
    };

    const key = (e) => {
      if ([' ', 'ArrowUp', 'w', 'Enter'].includes(e.key)) {
        e.preventDefault();
        jump();
      }
    };
    return { frame, key, pointer: jump };
  });

  return <canvas ref={ref} className="game-canvas" tabIndex={0} data-keep-focus aria-label={t('jogo.run.label')} style={{ aspectRatio: `${W} / ${H}` }} />;
}
