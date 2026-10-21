import { memo, Suspense } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { registry } from '../commands';
import { useLang } from '../data/pick';
import ErrorBoundary from './ErrorBoundary';
import Spinner from './Spinner';
import CmdLink from './CmdLink';

function NotFound({ name, suggestion }) {
  const { lang } = useLang();
  const suggested = suggestion ? registry.find(suggestion) : null;
  return (
    <div className="out">
      <p className="out-error">
        <Trans i18nKey="notFound.message" values={{ name }} />
      </p>
      <p className="out-muted">
        {suggested ? (
          <Trans
            i18nKey="notFound.suggestion"
            values={{ suggestion: registry.displayName(suggested, lang) }}
            components={{ cmd: <CmdLink /> }}
          />
        ) : (
          <Trans i18nKey="notFound.help" components={{ cmd: <CmdLink /> }} />
        )}
      </p>
    </div>
  );
}

/** Um item do histórico: a linha digitada + a saída do comando. */
function Entry({ entry }) {
  const { t } = useTranslation();
  const Output = entry.cmdName ? registry.find(entry.cmdName)?.component : null;

  return (
    <section className="entry" data-entry-id={entry.id}>
      <p className="echo">
        <span className="echo-prompt">{entry.chat ? t('ui.chatPrompt') : t('ui.prompt')}</span> <span className="echo-input">{entry.input}</span>
      </p>
      {entry.notFound && <NotFound {...entry.notFound} />}
      {Output && (
        <ErrorBoundary>
          <Suspense fallback={<Spinner />}>
            <Output {...entry.props} />
          </Suspense>
        </ErrorBoundary>
      )}
    </section>
  );
}

export default memo(Entry);
