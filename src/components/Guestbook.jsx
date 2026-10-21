import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../lib/useAsync';
import { LIMITS, hasBlockedWords, listMessages, signGuestbook } from '../lib/guestbook';
import { isNotConfigured } from '../lib/integrations';
import { relativeTime } from '../lib/relativeTime';
import { useLang } from '../data/pick';
import Spinner from './Spinner';
import NotConfigured from './NotConfigured';
import './Guestbook.css';

function validate({ name, message }, t) {
  const errors = {};
  const n = name.trim();
  const m = message.trim();
  if (n.length < LIMITS.name[0] || n.length > LIMITS.name[1]) errors.name = t('guestbook.errors.name', { max: LIMITS.name[1] });
  if (m.length < LIMITS.message[0] || m.length > LIMITS.message[1]) errors.message = t('guestbook.errors.message', { max: LIMITS.message[1] });
  if (!errors.name && !errors.message && hasBlockedWords(`${n} ${m}`)) errors.message = t('guestbook.errors.blocked');
  return errors;
}

function Form({ onSigned }) {
  const { t } = useTranslation();
  const [values, setValues] = useState({ name: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(values, t);
    setErrors(found);
    if (Object.keys(found).length) return setStatus('idle');
    if (values.website) return setStatus('sent'); // honeypot: bot finge que deu certo
    setStatus('sending');
    try {
      await signGuestbook(values);
      setValues((v) => ({ ...v, message: '' })); // mantém o nome para quem quiser escrever de novo
      setStatus('sent');
      onSigned();
    } catch (err) {
      setStatus(err.code ?? 'failed');
    }
  };

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <form className="card guestbook-form" onSubmit={submit} noValidate>
      <p className="out-muted">{t('guestbook.sign')}</p>
      <div className="field">
        <label htmlFor="gb-name">{t('guestbook.name')}</label>
        <input
          id="gb-name"
          className="input"
          value={values.name}
          onChange={set('name')}
          maxLength={LIMITS.name[1]}
          autoComplete="nickname"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'gb-name-err' : undefined}
        />
        {errors.name && (
          <span id="gb-name-err" className="field-error">
            {errors.name}
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor="gb-message">{t('guestbook.message')}</label>
        <textarea
          id="gb-message"
          className="input"
          rows={3}
          value={values.message}
          onChange={set('message')}
          maxLength={LIMITS.message[1]}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'gb-message-err' : undefined}
        />
        {errors.message && (
          <span id="gb-message-err" className="field-error">
            {errors.message}
          </span>
        )}
      </div>
      <div className="guestbook-hp" aria-hidden="true">
        <label htmlFor="gb-website">Website</label>
        <input id="gb-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </div>
      <div className="guestbook-submit">
        <button type="submit" className="btn" disabled={status === 'sending'}>
          {status === 'sending' ? t('guestbook.sending') : t('guestbook.send')}
        </button>
        <span className="out-dim guestbook-count">
          {values.message.length}/{LIMITS.message[1]}
        </span>
      </div>
      <p className="guestbook-status" role="status">
        {status === 'sent' && <span className="out-success">✓ {t('guestbook.sent')}</span>}
        {['rate_limited', 'blocked', 'failed'].includes(status) && <span className="out-error">✗ {t(`guestbook.errors.${status}`)}</span>}
      </p>
    </form>
  );
}

export default function Guestbook() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const [version, setVersion] = useState(0);
  const state = useAsync(`gb-${version}`, () => listMessages());

  if (state.status === 'error' && isNotConfigured(state.error)) {
    return <NotConfigured name={t('guestbook.title')} envVar="VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY" />;
  }

  return (
    <div className="out guestbook">
      <p className="out-title">{t('guestbook.title')}</p>
      {state.status === 'loading' && <Spinner label={t('guestbook.loading')} />}
      {state.status === 'error' && <p className="out-error">✗ {t('errors.network')}</p>}
      {state.status === 'success' &&
        (state.data.length ? (
          <ol className="guestbook-list">
            {state.data.map((m) => (
              <li key={m.id}>
                <p className="guestbook-meta">
                  <span className="accent">{m.name}</span> <span className="out-dim">· {relativeTime(m.created_at, lang)}</span>
                </p>
                <p className="guestbook-msg">{m.message}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="out-muted">{t('guestbook.empty')}</p>
        ))}
      <Form onSigned={() => setVersion((v) => v + 1)} />
    </div>
  );
}
