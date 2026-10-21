import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/** Chuva de estrelas douradas na tela inteira por alguns segundos. */
export default function StarRain({ duration = 4500, onEnd }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const accent = getComputedStyle(canvas).getPropertyValue('--accent').trim();
    const stars = Array.from({ length: Math.round(w / 9) }, () => ({
      x: Math.random() * w,
      y: -Math.random() * h,
      size: 12 + Math.random() * 22,
      speed: 2 + Math.random() * 4,
      spin: (Math.random() - 0.5) * 0.1,
      angle: Math.random() * Math.PI,
    }));
    const start = performance.now();
    let raf = 0;

    const frame = (now) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = accent;
      ctx.globalAlpha = elapsed > duration - 800 ? Math.max(0, (duration - elapsed) / 800) : 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const s of stars) {
        s.y += s.speed;
        s.angle += s.spin;
        if (s.y > h + 30) s.y = -30;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.font = `${s.size}px sans-serif`;
        ctx.fillText('★', 0, 0);
        ctx.restore();
      }
      if (elapsed < duration) raf = requestAnimationFrame(frame);
      else onEnd?.();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [duration, onEnd]);

  return createPortal(<canvas ref={ref} className="star-rain" aria-hidden="true" />, document.body);
}
