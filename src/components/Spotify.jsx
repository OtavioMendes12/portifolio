import { useTranslation } from 'react-i18next';
import { useAsync } from '../lib/useAsync';
import { getRecentTracks, isNotConfigured } from '../lib/integrations';
import { useLang } from '../data/pick';
import { relativeTime } from '../lib/relativeTime';
import { LASTFM_USER } from '../config/lastfm';
import Spinner from './Spinner';
import NotConfigured from './NotConfigured';
import './Spotify.css';

export default function Spotify() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const state = useAsync('tracks', (signal) => getRecentTracks({ limit: 10, signal }));

  if (state.status === 'loading') return <Spinner label={t('spotify.loading')} />;
  if (state.status === 'error') {
    return isNotConfigured(state.error) ? (
      <NotConfigured name="Last.fm" envVar="VITE_LASTFM_API_KEY + src/config/lastfm.js" />
    ) : (
      <p className="out-error">✗ {t('errors.network')}</p>
    );
  }

  const tracks = state.data;
  const playing = tracks.find((tr) => tr.nowPlaying);
  const recent = tracks.filter((tr) => !tr.nowPlaying).slice(0, 10);

  return (
    <div className="out spotify">
      {playing ? (
        <article className="card now-playing">
          {playing.image && <img src={playing.image} alt="" width="64" height="64" loading="lazy" />}
          <div>
            <p className="now-playing-label">
              <span className="eq" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              {t('spotify.nowPlaying')}
            </p>
            <p>
              <a href={playing.url} target="_blank" rel="noreferrer">
                {playing.name}
              </a>
            </p>
            <p className="out-muted">{playing.artist}</p>
          </div>
        </article>
      ) : (
        <p className="out-muted">{t('spotify.silence')}</p>
      )}
      <p className="out-title">{t('spotify.recent')}</p>
      <ol className="tracks">
        {recent.map((tr) => (
          <li key={`${tr.name}-${tr.playedAt}`}>
            <span className="track-name">{tr.name}</span> <span className="out-muted">— {tr.artist}</span>
            {tr.playedAt && <span className="out-dim track-when"> · {relativeTime(tr.playedAt, lang)}</span>}
          </li>
        ))}
      </ol>
      <p className="out-dim">
        via{' '}
        <a href={`https://www.last.fm/user/${LASTFM_USER}`} target="_blank" rel="noreferrer">
          last.fm/user/{LASTFM_USER}
        </a>
      </p>
    </div>
  );
}
