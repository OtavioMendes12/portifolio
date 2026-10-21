/*
 * Converte o STL do escudo (ASCII ou binário) num binário compacto para o site:
 *   public/galo/escudo-3d.bin
 * Formato: [uint32 nTriângulos] + nTri*9 int16 (posições, normalizadas em ±32767)
 *          + nTri uint8 (camada da face: 0 fundo/lados, 1 face, 2 relevo).
 * A camada vem da altura (eixo da espessura): o modelo não tem cor, então
 * pintamos por relevo (listras e letras elevadas em branco, face em preto).
 * Uso: node scripts/stl-to-mesh.mjs [entrada.stl] [saida.bin]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [input = '1-atletico_mineiro_escudo.stl', output = 'public/galo/escudo-3d.bin'] = process.argv.slice(2);
const buf = readFileSync(input);

function parse() {
  const head = buf.subarray(0, 5).toString();
  const n = buf.readUInt32LE(80);
  if (head !== 'solid' || buf.length === 84 + n * 50) {
    const tris = [];
    for (let i = 0; i < n; i++) {
      const o = 84 + i * 50 + 12;
      tris.push(Array.from({ length: 9 }, (_, k) => buf.readFloatLE(o + k * 4)));
    }
    return tris;
  }
  const v = [...buf.toString('utf8').matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)].map((m) => [+m[1], +m[2], +m[3]]);
  const tris = [];
  for (let i = 0; i < v.length; i += 3) tris.push([...v[i], ...v[i + 1], ...v[i + 2]]);
  return tris;
}

const tris = parse();
const all = tris.flatMap((t) => [[t[0], t[1], t[2]], [t[3], t[4], t[5]], [t[6], t[7], t[8]]]);
const min = [0, 1, 2].map((i) => Math.min(...all.map((p) => p[i])));
const max = [0, 1, 2].map((i) => Math.max(...all.map((p) => p[i])));
const size = max.map((m, i) => m - min[i]);
const thick = size.indexOf(Math.min(...size)); // eixo da espessura
const center = max.map((m, i) => (m + min[i]) / 2);
const half = Math.max(...size) / 2;

const zTop = max[thick];
const zs = [...new Set(all.map((p) => p[thick].toFixed(2)))].map(Number).sort((a, b) => b - a);
const zFace = zs.find((z) => z < zTop - 0.2) ?? zTop;

const out = Buffer.alloc(4 + tris.length * 18 + tris.length);
out.writeUInt32LE(tris.length, 0);
tris.forEach((t, i) => {
  for (let k = 0; k < 9; k++) {
    const axis = k % 3;
    const q = Math.round(((t[k] - center[axis]) / half) * 32767);
    out.writeInt16LE(Math.max(-32767, Math.min(32767, q)), 4 + i * 18 + k * 2);
  }
  const zsT = [t[thick], t[thick + 3], t[thick + 6]];
  const flat = Math.max(...zsT) - Math.min(...zsT) < 0.05;
  const layer = flat && Math.abs(zsT[0] - zTop) < 0.05 ? 2 : flat && Math.abs(zsT[0] - zFace) < 0.05 ? 1 : 0;
  out.writeUInt8(layer, 4 + tris.length * 18 + i);
});
writeFileSync(output, out);
const counts = [0, 0, 0];
for (let i = 0; i < tris.length; i++) counts[out[4 + tris.length * 18 + i]]++;
console.log(`${tris.length} triângulos · eixo da espessura: ${'xyz'[thick]} · camadas [lados, face, relevo] = ${counts} · ${(out.length / 1024).toFixed(0)} KB → ${output}`);
