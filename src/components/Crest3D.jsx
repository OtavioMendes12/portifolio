import { useEffect, useRef, useState } from 'react';
import { loadCrestGeometry, createCrestScene } from '../lib/crest3d';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useTheme } from '../theme/themeContext';

const W = 112;
const H = 128;

/** Escudo 3D balançando devagar; arraste para girar. Sem WebGL, some (o pescador já está ao lado). */
export default function Crest3D({ label }) {
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let scene = null;
    let raf = 0;
    let visible = true;
    let drag = null;
    let offset = 0;
    const canvas = canvasRef.current;
    const t0 = performance.now();

    const frame = (now) => {
      const t = (now - t0) / 1000;
      scene.mesh.rotation.y = (reduced ? -0.35 : Math.sin(t * 0.7) * 0.6) + offset;
      scene.mesh.rotation.x = reduced ? 0.05 : Math.sin(t * 0.45) * 0.08;
      scene.render();
      raf = visible && !reduced ? requestAnimationFrame(frame) : 0;
    };

    const onDown = (e) => {
      drag = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (drag === null) return;
      offset += (e.clientX - drag) * 0.015;
      drag = e.clientX;
      if (reduced) frame(performance.now());
    };
    const onUp = () => {
      drag = null;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && scene && !raf && !reduced) raf = requestAnimationFrame(frame);
    });

    loadCrestGeometry()
      .then((geometry) => {
        if (!alive) return;
        const rim = getComputedStyle(canvas).getPropertyValue('--accent').trim() || undefined;
        scene = createCrestScene(canvas, geometry, { width: W, height: H, rim });
        frame(performance.now());
        io.observe(canvas);
        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', onUp);
      })
      .catch(() => alive && setFailed(true));

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      scene?.dispose();
    };
  }, [reduced, theme]);

  if (failed) return null;
  return <canvas ref={canvasRef} className="crest-3d" width={W} height={H} role="img" aria-label={label} data-keep-focus />;
}
