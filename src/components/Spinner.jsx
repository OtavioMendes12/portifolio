import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../lib/useReducedMotion';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export default function Spinner({ label }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 80);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <p className="spinner" role="status">
      <span className="spinner-frame" aria-hidden="true">{reduced ? '…' : FRAMES[frame]}</span> {label ?? t('ui.loading')}
    </p>
  );
}
