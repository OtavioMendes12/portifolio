import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useTheme } from '../theme/themeContext';
import { useTerminal } from '../terminal/TerminalContext';
import { useLang } from '../data/pick';
import { normalize } from '../terminal/normalize';
import { SkillIcon } from './Skills';

/* ---------- geometria: icosaedro subdividido (esfera geodésica) ---------- */
function geodesic(subdivisions) {
  const p = (1 + Math.sqrt(5)) / 2;
  const unit = ([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return [x / l, y / l, z / l];
  };
  let verts = [
    [-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p],
    [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1],
  ].map(unit);
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let s = 0; s < subdivisions; s++) {
    const cache = new Map();
    const mid = (a, b) => {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!cache.has(key)) {
        verts.push(unit(verts[a].map((v, i) => (v + verts[b][i]) / 2)));
        cache.set(key, verts.length - 1);
      }
      return cache.get(key);
    };
    faces = faces.flatMap(([a, b, c]) => {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]];
    });
  }
  const edges = new Set();
  for (const [a, b, c] of faces) for (const [x, y] of [[a, b], [b, c], [c, a]]) edges.add(x < y ? `${x}-${y}` : `${y}-${x}`);
  return { verts, edges: [...edges].map((e) => e.split('-').map(Number)) };
}

const MESH = geodesic(2);

/** Globo de habilidades: esfera geodésica + ícones orbitando. Arraste para girar, clique para ver detalhes. */
export default function SkillsGlobe({ skills }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { theme } = useTheme();
  const { type } = useTerminal();
  const reduced = useReducedMotion();
  const boxRef = useRef(null);
  const canvasRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const n = skills.length;
    // ícones espalhados por igual (espiral de Fibonacci)
    const points = skills.map((_, i) => {
      const y = 1 - (2 * (i + 0.5)) / n;
      const r = Math.sqrt(1 - y * y);
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(phi) * r, y, Math.sin(phi) * r];
    });
    const colors = {};
    const readColors = () => {
      const css = getComputedStyle(box);
      colors.line = css.getPropertyValue('--accent').trim();
      colors.fill = css.getPropertyValue('--bg-terminal').trim();
      colors.rim = css.getPropertyValue('--border').trim();
    };
    let size = 0;
    let rotY = 0.5;
    let rotX = -0.25;
    let vy = 0.0035;
    let drag = null;
    let raf = 0;
    let visible = true;

    const rotate = ([x, y, z]) => {
      const [cy, sy, cx, sx] = [Math.cos(rotY), Math.sin(rotY), Math.cos(rotX), Math.sin(rotX)];
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = box.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const c = size / 2;
      const meshR = size * 0.3;
      const orbitR = size * 0.4;
      ctx.clearRect(0, 0, size, size);
      // bola
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.fill;
      ctx.strokeStyle = colors.rim;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(c, c, meshR + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // malha: arestas da frente mais fortes que as de trás
      const projected = MESH.verts.map(rotate);
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 0.7;
      for (const [a, b] of MESH.edges) {
        const pa = projected[a];
        const pb = projected[b];
        const depth = (pa[2] + pb[2]) / 4 + 0.5;
        ctx.globalAlpha = 0.06 + depth * 0.32;
        ctx.beginPath();
        ctx.moveTo(c + pa[0] * meshR, c + pa[1] * meshR);
        ctx.lineTo(c + pb[0] * meshR, c + pb[1] * meshR);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // ícones
      points.forEach((pt, i) => {
        const el = itemRefs.current[i];
        if (!el) return;
        const [x, y, z] = rotate(pt);
        const depth = (z + 1) / 2;
        el.style.transform = `translate(-50%, -50%) translate(${x * orbitR}px, ${y * orbitR}px) scale(${0.55 + depth * 0.6})`;
        el.style.opacity = String(0.25 + depth * 0.75);
        el.style.zIndex = String(Math.round(depth * 100));
        el.style.filter = depth < 0.45 ? 'blur(0.6px)' : 'none';
      });
    };

    const tick = () => {
      if (!drag) rotY += vy;
      draw();
      raf = visible && !reduced ? requestAnimationFrame(tick) : 0;
    };

    const onDown = (e) => {
      if (e.target.closest('button')) return; // clique no ícone abre detalhes
      drag = { x: e.clientX, y: e.clientY };
      box.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      rotY += dx * 0.008;
      rotX = Math.max(-1.2, Math.min(1.2, rotX + dy * 0.008));
      if (Math.abs(dx) > 0) vy = Math.sign(dx) * Math.min(0.02, Math.max(0.002, Math.abs(dx) * 0.0006));
      drag = { x: e.clientX, y: e.clientY };
      if (reduced) draw();
    };
    const onUp = () => {
      drag = null;
    };

    readColors();
    resize();
    draw();
    // cores do tema novo só existem depois do efeito do ThemeProvider
    const first = requestAnimationFrame(() => {
      readColors();
      draw();
    });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(tick);
    });
    io.observe(box);
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(box);
    box.addEventListener('pointerdown', onDown);
    box.addEventListener('pointermove', onMove);
    box.addEventListener('pointerup', onUp);
    box.addEventListener('pointercancel', onUp);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(first);
      io.disconnect();
      ro.disconnect();
      box.removeEventListener('pointerdown', onDown);
      box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerup', onUp);
      box.removeEventListener('pointercancel', onUp);
    };
  }, [skills, reduced, theme]);

  const cmd = lang === 'en' ? 'skills' : 'habilidades';

  return (
    <div className="globe">
      <div ref={boxRef} className="globe-box" data-keep-focus>
        <canvas ref={canvasRef} className="globe-mesh" aria-hidden="true" />
        <ul className="globe-items" aria-label={t('habilidades.globeLabel', { list: skills.map((s) => s.short).join(', ') })}>
          {skills.map((s, i) => (
            <li
              key={s.name}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="globe-item"
            >
              <button type="button" onClick={() => type(`${cmd} --info ${normalize(s.short).replace(/\s+/g, '-')}`)}>
                <SkillIcon skill={s} className="globe-icon" />
                <span className="globe-label">{s.short}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
