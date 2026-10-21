/*
 * Desenhos dos jogos (originais, em canvas). Cores vêm de palette.art
 * (tokens --game-* em theme.css).
 */

const lerp = (a, b, t) => a + (b - a) * t;

function pentagon(ctx, cx, cy, radius, rotation) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = rotation + (i * 2 * Math.PI) / 5;
    const px = cx + Math.cos(a) * radius;
    const py = cy + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/** Bola de futebol clássica (pentágonos pretos e costuras), girando por `spin`. */
export function drawSoccerBall(ctx, art, x, y, r, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = art.ball;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.rotate(spin);
  ctx.fillStyle = art.ballInk;
  ctx.strokeStyle = art.ballInk;
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  const inner = r * 0.36;
  pentagon(ctx, 0, 0, inner, -Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const dist = r * 1.02;
    pentagon(ctx, Math.cos(a) * dist, Math.sin(a) * dist, r * 0.34, a + Math.PI);
    // costura: do vértice do pentágono central até o pentágono de fora
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * (dist - r * 0.34), Math.sin(a) * (dist - r * 0.34));
    ctx.stroke();
    // costura entre os gomos externos
    const b = a + Math.PI / 5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(b) * r * 0.62, Math.sin(b) * r * 0.62);
    ctx.lineTo(Math.cos(b) * r * 1.1, Math.sin(b) * r * 1.1);
    ctx.stroke();
  }
  ctx.restore();
  // aro claro: mantém a silhueta redonda mesmo em fundo escuro
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.5, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.2, r * 0.1);
  ctx.strokeStyle = art.ball;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r + 0.6, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = art.ballInk;
  ctx.stroke();
  ctx.restore();
}

/** Sombra elíptica no chão. */
export function drawShadow(ctx, x, y, w, alpha = 0.35) {
  ctx.save();
  ctx.fillStyle = `rgb(0 0 0 / ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function glove(ctx, art, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = art.glove;
  ctx.beginPath();
  ctx.roundRect(-8, -9, 16, 18, 6);
  ctx.fill();
  ctx.fillStyle = art.glovePalm;
  ctx.fillRect(-8, 3, 16, 3); // punho
  ctx.restore();
}

/**
 * Goleiro com uniforme completo. Origem nos pés.
 * dive: -1 (mergulho à esquerda) … 0 (parado) … 1 (direita). bounce: balanço parado.
 */
export function drawGoalkeeper(ctx, art, x, ground, dive = 0, bounce = 0) {
  const d = Math.abs(dive);
  ctx.save();
  ctx.translate(x, ground - d * 28 + bounce);
  // gira o corpo em torno do quadril
  ctx.translate(0, -56);
  ctx.rotate(dive * 1.15);
  ctx.translate(0, 56);

  // pernas: chuteira, meião, joelho
  for (const side of [-1, 1]) {
    const lx = side * 9 + dive * -side * 4;
    ctx.fillStyle = art.boot;
    ctx.beginPath();
    ctx.roundRect(lx - 7 + side * 2, -7, 15, 7, 3);
    ctx.fill();
    ctx.fillStyle = art.keeper;
    ctx.fillRect(lx - 5, -36, 10, 30);
    ctx.fillStyle = art.keeperShade;
    ctx.fillRect(lx - 5, -36, 10, 4);
    ctx.fillStyle = art.skin;
    ctx.fillRect(lx - 5, -44, 10, 8);
  }
  // calção
  ctx.fillStyle = art.keeperShorts;
  ctx.beginPath();
  ctx.roundRect(-18, -64, 36, 22, 4);
  ctx.fill();
  // camisa
  ctx.fillStyle = art.keeper;
  ctx.beginPath();
  ctx.roundRect(-20, -106, 40, 46, 8);
  ctx.fill();
  ctx.fillStyle = art.keeperShade;
  ctx.fillRect(-20, -78, 40, 5); // faixa
  ctx.fillStyle = art.keeperShorts;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('1', 0, -84);

  // braços: abertos na espera, esticados acima da cabeça no mergulho
  const shoulders = [
    [-18, -100],
    [18, -100],
  ];
  const ready = [
    [-48, -76],
    [48, -76],
  ];
  const up = [
    [-14, -158],
    [14, -158],
  ];
  ctx.lineCap = 'round';
  shoulders.forEach(([sx, sy], i) => {
    const hx = lerp(ready[i][0], up[i][0], d);
    const hy = lerp(ready[i][1], up[i][1], d);
    ctx.strokeStyle = art.keeper;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    glove(ctx, art, hx, hy, Math.atan2(hy - sy, hx - sx) + Math.PI / 2);
  });

  // pescoço, cabeça e cabelo
  ctx.fillStyle = art.skinShade;
  ctx.fillRect(-5, -113, 10, 9);
  ctx.fillStyle = art.skin;
  ctx.beginPath();
  ctx.arc(0, -125, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = art.hair;
  ctx.beginPath();
  ctx.arc(0, -128, 13.5, Math.PI * 1.02, Math.PI * 1.98);
  ctx.lineTo(10, -127);
  ctx.quadraticCurveTo(0, -133, -12, -126);
  ctx.closePath();
  ctx.fill();
  // olhos
  ctx.fillStyle = art.hair;
  ctx.fillRect(-6, -125, 3, 3);
  ctx.fillRect(3, -125, 3, 3);
  ctx.restore();
}

/* ---------- pixel art (Galo Run) ---------- */

/** Desenha um sprite de texto: cada letra é uma cor de `colors`, '.' é transparente. */
export function drawSprite(ctx, rows, colors, x, y, px) {
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const color = colors[row[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + c * px, y + r * px, px, px);
    }
  });
}

// Troféu (taça com alças), escudinho rosa com estrelas e juiz com cartão amarelo.
export const SPRITES = {
  trophy: [
    'GGGGGGGGGG',
    'G.GGGGGG.G',
    'G.GGWGGG.G',
    '.GGGWGGGG.',
    '..GGGGGG..',
    '...GGGG...',
    '....DD....',
    '....DD....',
    '...DDDD...',
    '..BBBBBB..',
    '..BBBBBB..',
  ],
  crest: [
    '....PPPP....',
    '..PPQQQQPP..',
    '.PQQPPPPQQP.',
    '.PQPPPWPPQP.',
    'PQPPPPPPPPQP',
    'PQPPWPPPWPQP',
    'PQPPPPPWPPQP',
    'PQPPPPPPPPQP',
    '.PQPPPWPPQP.',
    '.PQQPPPPQQP.',
    '..PPQQQQPP..',
    '....PPPP....',
  ],
  referee: [
    '...HHHH...',
    '...SSSS..C',
    '...SSSS..C',
    '....SS...S',
    '..KKKKKKKS',
    '.KKKWKKKK.',
    '.S.KKKK...',
    '...KKKK...',
    '...KKKK...',
    '...KKKK...',
    '...S..S...',
    '...S..S...',
    '...K..K...',
    '..BB..BB..',
  ],
};

export const spriteColors = (art, p) => ({
  G: art.gold,
  D: art.goldShade,
  W: art.ball,
  B: p.dim,
  P: art.pink,
  Q: art.ball,
  H: art.hair,
  S: art.skin,
  C: art.card,
  K: art.ref,
});
