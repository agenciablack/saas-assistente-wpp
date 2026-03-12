import { useEffect, useRef } from 'react';

/**
 * Executa o callback quando a aba volta ao foco (visibilitychange)
 * e opcionalmente quando a rede reconecta (online event).
 * Inclui debounce para evitar múltiplas chamadas rápidas.
 */
export function useVisibilityRefresh(callback: () => void, debounceMs = 2000) {
  const lastRun = useRef(0);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const run = () => {
      const now = Date.now();
      if (now - lastRun.current < debounceMs) return;
      lastRun.current = now;
      callbackRef.current();
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', run);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', run);
    };
  }, [debounceMs]);
}
