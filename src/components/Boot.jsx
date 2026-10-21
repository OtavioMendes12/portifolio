import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Boot.css';

/** Sequência de boot fake. Qualquer tecla ou toque pula. */
export default function Boot({ onDone }) {
  const { t } = useTranslation();
  const lines = t('boot.lines', { returnObjects: true });
  const [count, setCount] = useState(0);
  const finish = useEffectEvent(onDone);

  useEffect(() => {
    const delay = count >= lines.length ? 380 : 90 + Math.random() * 140;
    const id = setTimeout(() => (count >= lines.length ? finish() : setCount((c) => c + 1)), delay);
    return () => clearTimeout(id);
  }, [count, lines.length]);

  useEffect(() => {
    const skip = (e) => {
      if (e.type === 'keydown') {
        e.preventDefault();
        e.stopPropagation();
      }
      finish();
    };
    window.addEventListener('keydown', skip, true);
    window.addEventListener('pointerdown', skip, true);
    return () => {
      window.removeEventListener('keydown', skip, true);
      window.removeEventListener('pointerdown', skip, true);
    };
  }, []);

  return (
    <div className="boot">
      {lines.slice(0, count).map((line) => (
        <p key={line} className="boot-line">
          <span className="boot-ok">[ OK ]</span> {line}
        </p>
      ))}
      <p className="boot-skip">{t('boot.skip')}</p>
    </div>
  );
}
