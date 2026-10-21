import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { askStream } from '../lib/ask';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useTerminal } from '../terminal/TerminalContext';
import { useLang } from '../data/pick';
import Spinner from './Spinner';
import NotConfigured from './NotConfigured';
import CmdLink from './CmdLink';
import './Ask.css';

/** Revela o texto aos poucos (efeito de digitação), alcançando o que já chegou. */
function useTypewriter(target, instant) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (instant || shown >= target.length) return undefined;
    const id = setTimeout(() => setShown((n) => Math.min(target.length, n + Math.max(1, Math.ceil((target.length - n) / 10)))), 16);
    return () => clearTimeout(id);
  }, [target, shown, instant]);
  return instant ? target : target.slice(0, Math.min(shown, target.length));
}

function Answer({ question, history, chat }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const { recordChat } = useTerminal();
  const [state, setState] = useState({ status: 'loading', text: '' });
  const recorded = useRef(false);

  useEffect(() => {
    const ctrl = new AbortController();
    let text = '';
    // Começa no próximo tick: se o efeito for desmontado na hora (StrictMode,
    // limpar a tela), nenhuma requisição sai — cada pergunta gasta 1 do rate limit.
    const start = setTimeout(() => ask(), 0);
    const ask = () => askStream([...history, { role: 'user', content: question }], {
      signal: ctrl.signal,
      onEvent: (e) => {
        if (e.t === 'text') {
          text += e.v;
          setState({ status: 'streaming', text });
        } else if (e.t === 'reset') {
          text = '';
          setState({ status: 'loading', text: '' });
        } else if (e.t === 'done') {
          setState({ status: 'done', text, truncated: e.truncated });
          if (chat && !recorded.current) {
            recorded.current = true;
            recordChat(question, text);
          }
        } else if (e.t === 'refusal') {
          setState({ status: 'error', code: 'refusal', text: '' });
        } else if (e.t === 'error') {
          setState({ status: 'error', code: e.code, retryAfter: e.retryAfter, max: e.max, text: '' });
        }
      },
    }).catch((err) => {
      if (err.name !== 'AbortError') setState({ status: 'error', code: 'network', text: '' });
    });
    return () => {
      clearTimeout(start);
      ctrl.abort();
    };
  }, [question, history, chat, recordChat]);

  const visible = useTypewriter(state.text, reduced);

  if (state.status === 'error') {
    if (state.code === 'not_configured') return <NotConfigured name={t('pergunta.name')} envVar="OPENAI_API_KEY" />;
    const minutes = Math.max(1, Math.ceil((state.retryAfter ?? 60) / 60));
    return (
      <p className="out-error">
        ✗ {t(`pergunta.errors.${state.code}`, { defaultValue: t('pergunta.errors.upstream'), minutes, max: state.max })}
      </p>
    );
  }
  if (state.status === 'loading') return <Spinner label={t('pergunta.thinking')} />;

  const typing = state.status === 'streaming' || visible.length < state.text.length;
  return (
    <div className="ask-answer">
      <span className="ask-who">{t('pergunta.who')}</span>
      <p className="ask-text" aria-hidden="true">
        {visible}
        {typing && <span className="ask-caret" aria-hidden="true" />}
      </p>
      {!typing && state.truncated && <p className="out-dim">{t('pergunta.truncated')}</p>}
      {!typing && <span className="sr-only">{state.text}</span>}
    </div>
  );
}

const SUGGESTIONS = ['tcc', 'stack', 'galo', 'xp'];

function ChatIntro() {
  const { t } = useTranslation();
  return (
    <div className="out">
      <p className="accent">{t('pergunta.enter')}</p>
      <p className="out-muted">{t('pergunta.try')}</p>
      <ul className="ask-suggestions">
        {SUGGESTIONS.map((k) => (
          <li key={k}>
            <CmdLink cmd={t(`pergunta.examples.${k}`)} />
          </li>
        ))}
      </ul>
      <p className="out-dim">{t('pergunta.howToExit')}</p>
    </div>
  );
}

export default function Ask({ mode, question, history = [], chat = false }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  if (mode === 'enter') return <ChatIntro />;
  if (mode === 'exit') return <p className="out-muted">{t('pergunta.exit')}</p>;
  if (!question) return <p className="out-muted">{t('pergunta.usage', { cmd: lang === 'en' ? 'ask' : 'pergunta' })}</p>;
  return <Answer question={question} history={history} chat={chat} />;
}
