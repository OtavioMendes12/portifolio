import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Terminal from 'react-terminal-ui';
import { registry } from './commands';
import { LANGS } from './i18n';
import { useTheme } from './theme/themeContext';
import { storage } from './lib/storage';
import { prefersReducedMotion, useReducedMotion } from './lib/useReducedMotion';
import { parseCommand } from './terminal/parser';
import { createHistory } from './terminal/history';
import { complete } from './terminal/autocomplete';
import { writeInput, focusInput } from './terminal/inputBridge';
import { TerminalContext } from './terminal/TerminalContext';
import { useTerminalKeys } from './terminal/useTerminalKeys';
import { useFocusGuard } from './terminal/useFocusGuard';
import { useTerminalA11y } from './terminal/useTerminalA11y';
import TitleBar from './components/TitleBar';
import Boot from './components/Boot';
import Header from './components/Header';
import Entry from './components/Entry';
import './components/ui.css';

const MatrixRain = lazy(() => import('./components/MatrixRain.jsx'));
import './App.css';

const MAX_ENTRIES = 150;
// onInput precisa ser estável e não-nulo (senão a lib some com o prompt).
// O Enter de verdade é tratado em useTerminalKeys.
const noop = () => {};

const shouldBoot = () => !storage.get('booted', false, 'session') && !prefersReducedMotion();

export default function App() {
  const { t, i18n } = useTranslation();
  const themeApi = useTheme();
  const reducedMotion = useReducedMotion();
  const [searchParams] = useSearchParams();

  const [booting, setBooting] = useState(shouldBoot);
  const [entries, setEntries] = useState([]);
  const [tabOptions, setTabOptions] = useState(null);
  const [maximized, setMaximized] = useState(false);
  const [history] = useState(createHistory);

  const nextId = useRef(0);
  const scrollTo = useRef(null);
  const lastTab = useRef({ value: null, at: 0 });
  const deepLinked = useRef(false);
  const runRef = useRef(null);

  // Limpa só o que foi digitado e as respostas; o cabeçalho (nome, status, cartão) fica.
  const clear = useCallback(() => {
    setEntries([]);
    setTabOptions(null);
    requestAnimationFrame(() => document.querySelector('.react-terminal')?.scrollTo({ top: 0 }));
  }, []);

  const addEntry = useCallback((entry) => {
    scrollTo.current = entry.id;
    setEntries((list) => [...list, entry].slice(-MAX_ENTRIES));
  }, []);

  const run = useCallback(
    (raw) => {
      setTabOptions(null);
      const input = raw ?? '';
      history.push(input.trim());
      const parsed = parseCommand(input, registry.find);
      const id = nextId.current++;
      let entry = { id, input };

      if (parsed.name && !parsed.cmd) {
        entry.notFound = { name: parsed.name, suggestion: registry.suggest(parsed.name)?.name ?? null };
      } else if (parsed.cmd) {
        let result = null;
        try {
          result =
            parsed.cmd.run?.({ ...parsed, theme: themeApi, i18n, clear, run: (c) => runRef.current?.(c) }) ?? null;
        } catch (err) {
          console.error('[terminal]', err);
          result = { error: true };
        }
        if (parsed.cmd.noEntry) return;
        const { args, flags, rest } = parsed;
        entry = { ...entry, cmdName: parsed.cmd.name, props: { args, flags, rest, ...result } };
      }

      addEntry(entry);
    },
    [history, themeApi, i18n, clear, addEntry],
  );

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  const type = useCallback((text) => writeInput(text), []);

  // Tab completa; Tab de novo na mesma linha lista as opções.
  const onTab = useCallback((value) => {
    const { value: completed, options } = complete(value, registry);
    const now = Date.now();
    const again = lastTab.current.value === value && now - lastTab.current.at < 1500;
    if (completed !== value) {
      writeInput(completed);
      setTabOptions(null);
    } else if (options.length > 1 && again) {
      setTabOptions(options);
    }
    lastTab.current = { value: completed, at: now };
  }, []);

  useTerminalKeys({ history, onSubmit: run, onTab, onClear: clear, disabled: booting });
  useFocusGuard();
  useTerminalA11y(t('ui.inputLabel'));

  // Depois de cada comando, rola até o TOPO da saída nova (não até o fim).
  // A saída costuma ser lazy/assíncrona e cresce depois: re-alinhamos enquanto
  // ela cresce, até o visitante rolar por conta própria (ou 8s).
  useLayoutEffect(() => {
    const id = scrollTo.current;
    if (id === null) return undefined;
    scrollTo.current = null;
    const el = document.querySelector(`[data-entry-id="${id}"]`);
    const scroller = el?.closest('.react-terminal');
    if (!el || !scroller) return undefined;

    const align = (behavior) => scroller.scrollTo({ top: Math.max(0, el.offsetTop - 12), behavior });
    align(prefersReducedMotion() ? 'auto' : 'smooth');

    const observer = new ResizeObserver(() => align('auto'));
    observer.observe(el);
    const stop = () => {
      observer.disconnect();
      clearTimeout(timer);
      scroller.removeEventListener('wheel', stop);
      scroller.removeEventListener('touchmove', stop);
    };
    const timer = setTimeout(stop, 8000);
    scroller.addEventListener('wheel', stop, { passive: true });
    scroller.addEventListener('touchmove', stop, { passive: true });
    return stop;
  }, [entries]);

  // Deep link: ?cmd=projetos&lang=en roda depois do boot, uma vez só (StrictMode monta 2x).
  useEffect(() => {
    if (booting || deepLinked.current) return;
    deepLinked.current = true;
    const lang = searchParams.get('lang');
    if (LANGS.includes(lang) && i18n.language !== lang) i18n.changeLanguage(lang);
    const cmd = searchParams.get('cmd');
    if (cmd) queueMicrotask(() => run(cmd));
    focusInput();
  }, [booting, searchParams, i18n, run]);

  const finishBoot = useCallback(() => {
    storage.set('booted', true, 'session');
    setBooting(false);
  }, []);

  const scrollTop = useCallback(() => {
    document.querySelector('.react-terminal')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const toggleMax = useCallback(() => setMaximized((m) => !m), []);

  const ctx = useMemo(() => ({ run, type, clear, registry }), [run, type, clear]);

  return (
    <TerminalContext.Provider value={ctx}>
      {themeApi.theme === 'matrix' && !reducedMotion && (
        <Suspense fallback={null}>
          <MatrixRain />
        </Suspense>
      )}
      <main className={`app${maximized ? ' app--max' : ''}${booting ? ' is-booting' : ''}`}>
        <Terminal
          name={t('ui.title')}
          prompt={t('ui.prompt')}
          height="auto"
          onInput={noop}
          TopButtonsPanel={TitleBar}
          redBtnCallback={clear}
          yellowBtnCallback={scrollTop}
          greenBtnCallback={toggleMax}
        >
          <div className="log" role="log" aria-live="polite" aria-label={t('ui.terminalLabel')}>
            {booting ? (
              <Boot onDone={finishBoot} />
            ) : (
              <>
                <Header />
                {entries.map((entry) => (
                  <Entry key={entry.id} entry={entry} />
                ))}
              </>
            )}
          </div>
          {tabOptions && (
            <p className="tab-options">
              {tabOptions.map((o) => (
                <span key={o}>{o}</span>
              ))}
            </p>
          )}
        </Terminal>
      </main>
    </TerminalContext.Provider>
  );
}
