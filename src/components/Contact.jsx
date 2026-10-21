import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaGithub, FaLinkedin, FaWhatsapp } from 'react-icons/fa6';
import { profile } from '../data/profile';
import { storage } from '../lib/storage';
import { emailjsConfig, isEmailjsConfigured } from '../config/emailjs';
import './Contact.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = { name: [2, 80], message: [10, 1500] };
const COOLDOWN_MS = 60_000;

function validate({ name, email, message }, t) {
  const errors = {};
  if (name.trim().length < LIMITS.name[0] || name.length > LIMITS.name[1]) errors.name = t('contato.errors.name');
  if (!EMAIL_RE.test(email.trim())) errors.email = t('contato.errors.email');
  if (message.trim().length < LIMITS.message[0] || message.length > LIMITS.message[1]) {
    errors.message = t('contato.errors.message', { min: LIMITS.message[0], max: LIMITS.message[1] });
  }
  return errors;
}

function CopyEmail() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard bloqueado: o link mailto continua ali */
    }
  };
  return (
    <button type="button" className="btn btn--ghost contact-copy" onClick={copy}>
      {copied ? t('ui.copied') : t('ui.copy')}
    </button>
  );
}

export default function Contact() {
  const { t } = useTranslation();
  const configured = isEmailjsConfigured();
  const [values, setValues] = useState({ name: '', email: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error | cooldown
  const [openedAt] = useState(() => Date.now());
  const formRef = useRef(null);

  const update = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, t);
    setErrors(found);
    if (Object.keys(found).length) {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    // honeypot preenchido ou envio rápido demais = robô: finge que deu certo
    if (values.website || Date.now() - openedAt < 2500) {
      setStatus('sent');
      return;
    }
    const last = storage.get('contact-last', 0);
    if (Date.now() - last < COOLDOWN_MS) {
      setStatus('cooldown');
      return;
    }

    if (!configured) {
      const subject = encodeURIComponent(`Portfólio · ${values.name}`);
      const body = encodeURIComponent(`${values.message}\n\n${values.name} <${values.email}>`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      return;
    }

    setStatus('sending');
    try {
      const { default: emailjs } = await import('@emailjs/browser');
      const params = {
        from_name: values.name.trim(),
        from_email: values.email.trim(),
        reply_to: values.email.trim(),
        message: values.message.trim(),
      };
      const opts = { publicKey: emailjsConfig.publicKey };
      await emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateForMe, params, opts);
      if (emailjsConfig.templateForSender) {
        // a confirmação para quem enviou é "best effort"
        await emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateForSender, params, opts).catch(() => {});
      }
      storage.set('contact-last', Date.now());
      setValues({ name: '', email: '', message: '', website: '' });
      setStatus('sent');
    } catch (err) {
      console.error('[contato]', err);
      setStatus('error');
    }
  };

  const links = [
    { Icon: FaEnvelope, label: profile.email, href: `mailto:${profile.email}`, extra: <CopyEmail /> },
    { Icon: FaLinkedin, label: profile.linkedin.label, href: profile.linkedin.url },
    { Icon: FaGithub, label: `@${profile.github.user}`, href: profile.github.url },
    { Icon: FaWhatsapp, label: profile.whatsapp.label, href: profile.whatsapp.url },
  ];

  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={`contact-${name}`}>{label}</label>
      {props.as === 'textarea' ? (
        <textarea
          id={`contact-${name}`}
          className="input"
          rows={5}
          value={values[name]}
          onChange={update(name)}
          maxLength={LIMITS.message[1]}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `contact-${name}-err` : undefined}
          required
        />
      ) : (
        <input
          id={`contact-${name}`}
          className="input"
          value={values[name]}
          onChange={update(name)}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `contact-${name}-err` : undefined}
          required
          {...props}
        />
      )}
      {errors[name] && (
        <span id={`contact-${name}-err`} className="field-error">
          {errors[name]}
        </span>
      )}
    </div>
  );

  return (
    <div className="out contact">
      <p className="out-title">{t('contato.title')}</p>
      <ul className="contact-links">
        {links.map(({ Icon, label, href, extra }) => (
          <li key={href}>
            <Icon className="accent" aria-hidden="true" />
            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              {label}
            </a>
            {extra}
          </li>
        ))}
      </ul>

      <form ref={formRef} className="card contact-form" onSubmit={onSubmit} noValidate>
        <p className="out-muted">{t('contato.formIntro')}</p>
        {!configured && <p className="out-dim">{t('contato.notConfigured')}</p>}
        <div className="contact-row">
          {field('name', t('contato.name'), { autoComplete: 'name', maxLength: LIMITS.name[1] })}
          {field('email', t('contato.email'), { type: 'email', autoComplete: 'email', inputMode: 'email' })}
        </div>
        {field('message', t('contato.message'), { as: 'textarea' })}
        {/* honeypot: invisível para pessoas, tentador para bots */}
        <div className="contact-hp" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update('website')} />
        </div>
        <div className="contact-submit">
          <button type="submit" className="btn" disabled={status === 'sending'}>
            {status === 'sending' ? t('contato.sending') : t('contato.send')}
          </button>
          <span className="contact-count out-dim">
            {values.message.length}/{LIMITS.message[1]}
          </span>
        </div>
        <p className="contact-status" role="status">
          {status === 'sent' && <span className="out-success">✓ {t('contato.sent')}</span>}
          {status === 'error' && <span className="out-error">✗ {t('contato.failed')}</span>}
          {status === 'cooldown' && <span className="out-error">{t('contato.cooldown')}</span>}
        </p>
      </form>
    </div>
  );
}
