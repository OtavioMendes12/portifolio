import { Component } from 'react';
import { useTranslation } from 'react-i18next';

function FriendlyError() {
  const { t } = useTranslation();
  return <p className="out-error">✗ {t('errors.generic')}</p>;
}

/** Um comando que quebra não derruba o terminal inteiro. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('[terminal]', error);
  }

  render() {
    return this.state.error ? <FriendlyError /> : this.props.children;
  }
}
