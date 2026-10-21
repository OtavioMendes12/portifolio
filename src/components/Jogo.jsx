import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../data/pick';
import Spinner from './Spinner';
import CmdLink from './CmdLink';
import './Jogo.css';

const GAMES = {
  penalti: lazy(() => import('./GamePenalti.jsx')),
  'galo-run': lazy(() => import('./GameGaloRun.jsx')),
};

export default function Jogo({ flags = {} }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const cmd = lang === 'en' ? 'game' : 'jogo';
  const id = flags.penalti ? 'penalti' : flags['galo-run'] ? 'galo-run' : null;

  if (!id) {
    return (
      <div className="out">
        <p className="out-title">{t('jogo.title')}</p>
        <ul className="jogo-menu">
          <li>
            <CmdLink cmd={`${cmd} --penalti`} /> <span className="out-muted">{t('jogo.penalti.desc')}</span>
          </li>
          <li>
            <CmdLink cmd={`${cmd} --galo-run`} /> <span className="out-muted">{t('jogo.run.desc')}</span>
          </li>
        </ul>
      </div>
    );
  }

  const Game = GAMES[id];
  return (
    <div className="out jogo">
      <Suspense fallback={<Spinner />}>
        <Game />
      </Suspense>
      <p className="out-dim jogo-help">{t(id === 'penalti' ? 'jogo.penalti.controls' : 'jogo.run.controls')}</p>
    </div>
  );
}
