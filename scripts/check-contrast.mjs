// Valida contraste WCAG AA (≥ 4.5:1) dos tokens de texto em todos os temas.
// Uso: npm run contrast
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/theme/theme.css', import.meta.url), 'utf8');
const TEXT_TOKENS = ['text', 'text-muted', 'text-dim', 'accent', 'terminal-chrome', 'success', 'warn', 'info', 'busy'];
const BACKGROUNDS = ['bg-terminal', 'surface'];

const themes = {};
for (const [, selector, body] of css.matchAll(/([^{}]*data-theme='(\w+)'[^{}]*)\{([^}]*)\}/g).map((m) => [m[0], m[2], m[3]])) {
  themes[selector] = Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failures = 0;
for (const [name, t] of Object.entries(themes)) {
  const rows = [];
  for (const bg of BACKGROUNDS) {
    for (const fg of TEXT_TOKENS) {
      const r = ratio(t[fg], t[bg]);
      if (r < 4.5) failures++;
      rows.push(`${r < 4.5 ? '✗' : '✓'} ${fg.padEnd(16)} on ${bg.padEnd(12)} ${r.toFixed(2)}`);
    }
  }
  const onAccent = ratio(t['on-accent'], t.accent);
  if (onAccent < 4.5) failures++;
  rows.push(`${onAccent < 4.5 ? '✗' : '✓'} on-accent        on accent       ${onAccent.toFixed(2)}`);
  console.log(`\n[${name}]\n  ${rows.join('\n  ')}`);
}

console.log(failures ? `\n${failures} combinação(ões) abaixo de 4.5:1` : '\nTodos os temas passam AA (4.5:1).');
process.exit(failures ? 1 : 0);
