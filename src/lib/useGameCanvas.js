import { useEffect, useRef } from 'react';
import { useTheme } from '../theme/themeContext';
import { storage } from './storage';

/** Lê as cores do tema atual para desenhar no canvas. */
export function readPalette(el) {
  const css = getComputedStyle(el);
  const get = (n) => css.getPropertyValue(n).trim();
  return {
    bg: get('--surface'),
    bg2: get('--surface-2'),
    border: get('--border'),
    text: get('--text'),
    muted: get('--text-muted'),
    dim: get('--text-dim'),
    accent: get('--accent'),
    success: get('--success'),
    warn: get('--warn'),
    info: get('--info'),
    busy: get('--busy'),
    font: get('--font-mono'),
  };
}

/**
 * Canvas de jogo com tamanho lógico fixo (W×H) escalado para a largura disponível.
 * setup(ctx, api) roda uma vez e devolve { frame(dt), key(e), pointer(e), dispose? }.
 * O loop pausa fora da tela; as cores são relidas quando o tema muda.
 */
export function useGameCanvas(W, H, setup) {
  const ref = useRef(null);
  const { theme } = useTheme();
  const paletteRef = useRef(null);
  const setupRef = useRef(setup);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    paletteRef.current = readPalette(canvas);
    const game = setupRef.current(ctx, { W, H, palette: () => paletteRef.current });

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const loop = (now) => {
      const dt = Math.min(50, now - last); // evita saltos depois de trocar de aba
      last = now;
      game.frame(dt);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(canvas);

    const onKey = (e) => game.key?.(e);
    const onPointer = (e) => {
      canvas.focus({ preventScroll: true });
      game.pointer?.(e);
    };
    canvas.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', onPointer);
    canvas.focus({ preventScroll: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointer);
      game.dispose?.();
    };
  }, [W, H]);

  // tema mudou: relê as cores no próximo frame (depois do ThemeProvider aplicar)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (ref.current) paletteRef.current = readPalette(ref.current);
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);

  return ref;
}

export const getBest = (key) => Number(storage.get(`best:${key}`, 0)) || 0;
export const saveBest = (key, value) => {
  if (value > getBest(key)) storage.set(`best:${key}`, value);
};
