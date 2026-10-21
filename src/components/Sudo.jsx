import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalize } from '../terminal/normalize';
import { useReducedMotion } from '../lib/useReducedMotion';

const VICTIMS = ['/bin', '/boot', '/etc', '/home/visitante', '/usr/lib/node_modules', '/var/log', '/opt/spring-boot', '/arena-mrv'];

function RmRf() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(reduced ? VICTIMS.length + 1 : 0);

  useEffect(() => {
    if (step > VICTIMS.length) return undefined;
    const id = setTimeout(() => setStep((s) => s + 1), 260);
    return () => clearTimeout(id);
  }, [step]);

  const done = Math.min(step, VICTIMS.length);
  const bar = '█'.repeat(done * 2) + '░'.repeat((VICTIMS.length - done) * 2);
  return (
    <div className="out">
      {VICTIMS.slice(0, done).map((v) => (
        <p key={v} className="out-error">
          rm: {t('eggs.removing')} {v}
        </p>
      ))}
      <p className="out-muted">
        [{bar}] {Math.round((done / VICTIMS.length) * 100)}%
      </p>
      {step > VICTIMS.length && <p className="accent">{t('eggs.justKidding')}</p>}
    </div>
  );
}

export default function Sudo({ rest = '' }) {
  const { t } = useTranslation();
  const line = normalize(rest).replace(/\s+/g, ' ');
  if (/^virar cruzeirense/.test(line)) return <p className="out-error">{t('eggs.cruzeirense')}</p>;
  if (/^rm -(rf|fr) \/\*?$/.test(line)) return <RmRf />;
  if (!line) return <p className="out-muted">{t('eggs.sudoUsage')}</p>;
  return <p className="out-error">{t('eggs.sudoers')}</p>;
}
