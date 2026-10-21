import { useTranslation } from 'react-i18next';
import { useLang } from '../data/pick';
import { titulos } from '../data/titulos';
import { profile } from '../data/profile';
import './Titles.css';

const ART = {
  cup: [' .-=====-. ', ' |   ★   | ', ' \\       / ', "  '.   .'  ", '    ) (    ', "  .'   '.  ", '  |_____|  '].join('\n'),
  star: ['     ★     ', '   ★ ★ ★   ', '  .-----.  ', '  |     |  ', '  |  ★  |  ', "  '.___.'  ", '   |___|   '].join('\n'),
  shield: [' ._______. ', ' |   ★   | ', ' |  ===  | ', ' |       | ', '  \\     /  ', "   '. .'   ", '     V     '].join('\n'),
};

const SCOPES = ['continental', 'nacional', 'estadual'];

export default function Titles() {
  const { t } = useTranslation();
  const { pick } = useLang();
  const total = titulos.reduce((sum, ti) => sum + (ti.count ?? ti.years.length), 0);

  return (
    <div className="out titles">
      <p className="out-title">{t('titulos.title', { total })}</p>
      {SCOPES.map((scope) => (
        <section key={scope} className="titles-group">
          <h3 className="titles-scope">{t(`titulos.scopes.${scope}`)}</h3>
          <div className="titles-grid">
            {titulos
              .filter((ti) => ti.scope === scope)
              .map((ti) => {
                const count = ti.count ?? ti.years.length;
                return (
                  <article key={ti.id} className="card trophy">
                    <pre className="trophy-art" aria-hidden="true">{ART[ti.icon]}</pre>
                    <h4 className="trophy-name">
                      <span className="trophy-count">{count}×</span> {pick(ti.name)}
                    </h4>
                    <ul className="badges">
                      {ti.years.map((y) => (
                        <li key={y} className="badge badge--accent">
                          {y}
                        </li>
                      ))}
                    </ul>
                    {ti.note && <p className="out-dim trophy-note">{pick(ti.note)}</p>}
                  </article>
                );
              })}
          </div>
        </section>
      ))}
      <p className="out-dim">
        {t('titulos.more')}{' '}
        <a href={profile.clubSite} target="_blank" rel="noreferrer">
          atletico.com.br
        </a>
      </p>
    </div>
  );
}
