import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalize } from '../terminal/normalize';
import { useReducedMotion } from '../lib/useReducedMotion';
import StarRain from './StarRain';

export default function VamoGalo({ args = [] }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [raining, setRaining] = useState(!reduced);
  const stop = useCallback(() => setRaining(false), []);

  if (normalize(args[0] ?? '') !== 'galo') return <p className="out-muted">{t('eggs.vamoWhat')}</p>;

  return (
    <div className="out">
      <p className="accent galo-shout">{t('eggs.vamoGalo')}</p>
      {raining && <StarRain onEnd={stop} />}
    </div>
  );
}
