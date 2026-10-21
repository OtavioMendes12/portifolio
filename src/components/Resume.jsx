import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { FiDownload, FiExternalLink } from 'react-icons/fi';
import { useLang } from '../data/pick';
import { useTheme } from '../theme/themeContext';
import { cvFiles } from '../config/cv';
import Spinner from './Spinner';
import './Resume.css';

// Em dev/SPA, um arquivo inexistente pode voltar como index.html (200): checamos o content-type.
const pdfExists = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok && (res.headers.get('content-type') ?? '').includes('pdf');
  } catch {
    return false;
  }
};

export default function Resume() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { theme } = useTheme();
  const [file, setFile] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const wanted = cvFiles[lang];
      const other = cvFiles[lang === 'en' ? 'pt' : 'en'];
      const url = (await pdfExists(wanted)) ? wanted : (await pdfExists(other)) ? other : null;
      if (alive) setFile({ url, fallback: url !== wanted });
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  if (!file) return <Spinner />;
  if (!file.url) return <p className="out-error">{t('curriculo.missing')}</p>;

  return (
    <div className="out resume">
      <div className="resume-actions">
        <a className="btn" href={file.url} download>
          <FiDownload aria-hidden="true" /> {t('curriculo.download')}
        </a>
        <a className="btn btn--ghost" href={file.url} target="_blank" rel="noreferrer">
          <FiExternalLink aria-hidden="true" /> {t('curriculo.open')}
        </a>
      </div>
      {file.fallback && <p className="out-dim">{t('curriculo.fallback')}</p>}
      <div className="resume-viewer" data-keep-focus>
        <Worker workerUrl={workerUrl}>
          <Viewer
            fileUrl={file.url}
            defaultScale={SpecialZoomLevel.PageWidth}
            theme={{ theme: theme === 'claro' ? 'light' : 'dark' }}
            renderLoader={() => <Spinner />}
          />
        </Worker>
      </div>
    </div>
  );
}
