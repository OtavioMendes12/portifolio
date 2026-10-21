import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Carrega dados assíncronos com cancelamento.
 * Reexecuta quando `key` muda. Estado: { status: 'loading'|'success'|'error', data, error }.
 */
export function useAsync(key, load) {
  const [state, setState] = useState({ status: 'loading', key });
  const run = useEffectEvent((signal) => load(signal));

  useEffect(() => {
    const ctrl = new AbortController();
    run(ctrl.signal)
      .then((data) => !ctrl.signal.aborted && setState({ status: 'success', data, key }))
      .catch((error) => !ctrl.signal.aborted && setState({ status: 'error', error, key }));
    return () => ctrl.abort();
  }, [key]);

  // enquanto a chave nova carrega, não mostra dados da antiga
  return state.key === key ? state : { status: 'loading', key };
}
