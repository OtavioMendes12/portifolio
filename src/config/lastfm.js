// Last.fm: a API key é pública (VITE_LASTFM_API_KEY); o usuário é o seu perfil no last.fm.
export const LASTFM_USER = ''; // preencher, ex.: 'otaviomendes'
export const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
export const isLastfmConfigured = () => Boolean(LASTFM_USER && LASTFM_API_KEY);
