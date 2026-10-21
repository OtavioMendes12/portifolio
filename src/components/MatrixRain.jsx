import { useEffect, useRef } from 'react';

const CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789GALO1908';

/** Chuva de caracteres atrás do terminal (tema matrix). Quem renderiza decide se há movimento. */
export default function MatrixRain() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    // cores lidas no 1º frame: o data-theme novo é aplicado depois deste efeito
    let color = '';
    let bg = '';
    const font = 16;
    let drops = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drops = Array.from({ length: Math.ceil(canvas.width / font) }, () => Math.random() * -50);
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 55 || document.hidden) return; // ~18 fps basta e economiza bateria
      last = now;
      if (!color) {
        const css = getComputedStyle(canvas);
        color = css.getPropertyValue('--accent').trim();
        bg = css.getPropertyValue('--bg-page').trim();
      }
      ctx.globalAlpha = 0.12; // rastro: pinta o fundo por cima com transparência
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.font = `${font}px monospace`;
      drops.forEach((d, i) => {
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * font, d * font);
        drops[i] = d * font > canvas.height && Math.random() > 0.975 ? 0 : d + 1;
      });
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="matrix-rain" aria-hidden="true" />;
}
