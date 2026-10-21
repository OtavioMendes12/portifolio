import { useTranslation } from 'react-i18next';
import { SPOTIFY_PLAYLIST_ID } from '../config/spotify';
import './Spotify.css';

export default function Spotify() {
  const { t } = useTranslation();

  return (
    <div className="out spotify" data-keep-focus>
      <iframe
        className="spotify-embed"
        title={t('spotify.playlist')}
        src={`https://open.spotify.com/embed/playlist/${SPOTIFY_PLAYLIST_ID}?utm_source=generator&theme=0`}
        width="100%"
        height="360"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
