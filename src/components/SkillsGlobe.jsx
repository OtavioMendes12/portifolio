import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { skillGroups } from '../data/skills';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useTheme } from '../theme/themeContext';

const SKILLS = skillGroups.flatMap((g) => g.items.map((s) => s.name.replace(/ \(.*\)/, '')));

// pontos espalhados uniformemente numa esfera (espiral de Fibonacci)
const POINTS = SKILLS.map((name, i) => {
  const y = 1 - (2 * (i + 0.5)) / SKILLS.length;
  const r = Math.sqrt(1 - y * y);
  const phi = i * Math.PI * (3 - Math.sqrt(5));
  return { name, x: Math.cos(phi) * r, y, z: Math.sin(phi) * r };
});

/** Nuvem 3D de habilidades girando. Arraste para girar. */
export default function SkillsGlobe() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const colors = { accent: '', text: '', font: '' };
    // lido num frame seguinte: o data-theme novo é aplicado pelo efeito do ThemeProvider, que roda depois deste
    const readColors = () => {
      const css = getComputedStyle(canvas);
      colors.accent = css.getPropertyValue('--accent').trim();
      colors.text = css.getPropertyValue('--text').trim();
      colors.font = css.getPropertyValue('--font-mono');
    };
    readColors();
    let w = 0;
    let h = 0;
    let rotX = 0.35;
    let rotY = 0;
    let vx = 0.0016;
    let vy = 0.0042;
    let raf = 0;
    let visible = true;
    let drag = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const radius = Math.min(w, h) * 0.4;
      const [sx, cx] = [Math.sin(rotX), Math.cos(rotX)];
      const [sy, cy] = [Math.sin(rotY), Math.cos(rotY)];
      const projected = POINTS.map((p) => {
        const x1 = p.x * cy + p.z * sy;
        const z1 = -p.x * sy + p.z * cy;
        const y1 = p.y * cx - z1 * sx;
        const z2 = p.y * sx + z1 * cx;
        const scale = 1 / (1.9 - z2 * 0.6);
        return { name: p.name, x: w / 2 + x1 * radius * scale * 1.3, y: h / 2 + y1 * radius * scale * 1.3, z: z2, scale };
      });
      projected.sort((a, b) => a.z - b.z);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const p of projected) {
        const depth = (p.z + 1) / 2; // 0 (fundo) → 1 (frente)
        ctx.globalAlpha = 0.25 + depth * 0.75;
        ctx.fillStyle = depth > 0.55 ? colors.accent : colors.text;
        ctx.font = `${Math.round(11 + 9 * p.scale * depth)}px ${colors.font}`;
        ctx.fillText(p.name, p.x, p.y);
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      if (!drag) {
        rotX += vx;
        rotY += vy;
      }
      draw();
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    const onDown = (e) => {
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      rotY += dx * 0.01;
      rotX += dy * 0.01;
      vy = Math.max(-0.03, Math.min(0.03, dx * 0.002)) || vy;
      vx = Math.max(-0.03, Math.min(0.03, dy * 0.002)) || vx;
      drag = { x: e.clientX, y: e.clientY };
      if (reduced) draw();
    };
    const onUp = () => {
      drag = null;
    };

    resize();
    draw();
    const first = requestAnimationFrame(() => {
      readColors();
      draw();
    });
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    if (!reduced) raf = requestAnimationFrame(tick);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(first);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [reduced, theme]);

  return (
    <div className="globe">
      <canvas ref={canvasRef} role="img" aria-label={t('habilidades.globeLabel', { list: SKILLS.join(', ') })} />
      <p className="globe-hint">{t('habilidades.globeHint')}</p>
    </div>
  );
}
