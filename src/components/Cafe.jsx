import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../lib/useReducedMotion';

const STEAM = ['   ) )  (  ', '  ( (  ) ) ', '   )  ( (  '];
const CUP = ['  .-------.  ', '  |       |-.', '  |  CAM  | |', "  |       |-'", "  '-------'  ", ' ~~~~~~~~~~~ '].join('\n');

export default function Cafe() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setFrame((f) => f + 1), 450);
    const stop = setTimeout(() => clearInterval(id), 9000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [reduced]);

  return (
    <div className="out">
      <pre className="ascii" aria-hidden="true">
        <span className="out-dim">{STEAM[frame % 3]}</span>
        {'\n'}
        <span className="out-dim">{STEAM[(frame + 1) % 3]}</span>
        {'\n'}
        <span className="accent">{CUP}</span>
      </pre>
      <p>{t('eggs.coffee')}</p>
    </div>
  );
}
