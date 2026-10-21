import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Countdown.css';

const split = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
};

/** Contagem regressiva ao vivo (dias, horas, min, seg). */
export default function Countdown({ to }) {
  const { t } = useTranslation();
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = target - now;
  if (left <= 0) return <p className="countdown-done accent">{t('campeonato.kickoff')}</p>;
  const parts = split(left);

  return (
    <div className="countdown" role="timer" aria-label={t('campeonato.countdownLabel', parts)}>
      {['days', 'hours', 'minutes', 'seconds'].map((k) => (
        <div key={k} className="countdown-cell" aria-hidden="true">
          <span className="countdown-value">{String(parts[k]).padStart(2, '0')}</span>
          <span className="countdown-unit">{t(`campeonato.units.${k}`)}</span>
        </div>
      ))}
    </div>
  );
}
