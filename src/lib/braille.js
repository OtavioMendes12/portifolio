/*
 * Converte uma imagem (ex.: o escudo.svg fornecido) em arte braille.
 * Cada caractere braille tem 2×4 pontos; um ponto acende quando o pixel
 * é opaco e não muito escuro.
 */
const DOTS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

export async function imageToBraille(src, { cols = 22, rows = 12, minLuma = 0.18 } = {}) {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  await img.decode();

  const w = cols * 2;
  const h = rows * 4;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const iw = img.naturalWidth || w;
  const ih = img.naturalHeight || h;
  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  const { data } = ctx.getImageData(0, 0, w, h);

  const on = (x, y) => {
    const i = (y * w + x) * 4;
    const luma = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    return data[i + 3] > 110 && luma >= minLuma;
  };

  const lines = [];
  for (let row = 0; row < rows; row++) {
    let line = '';
    for (let col = 0; col < cols; col++) {
      let code = 0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (on(col * 2 + dx, row * 4 + dy)) code |= DOTS[dy][dx];
        }
      }
      line += String.fromCharCode(0x2800 + code);
    }
    lines.push(line);
  }
  // remove linhas vazias no topo e no fim
  const blank = String.fromCharCode(0x2800).repeat(cols);
  while (lines.length && lines[0] === blank) lines.shift();
  while (lines.length && lines[lines.length - 1] === blank) lines.pop();
  return lines.join('\n');
}

/** SVG inline (ex.: a logo renderizada) → data URL, trocando currentColor por branco. */
export const svgElementToDataUrl = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    new XMLSerializer().serializeToString(svg).replaceAll('currentColor', '#ffffff'),
  )}`;
