import { useState, useCallback, useEffect, useRef } from 'react';

export interface ToastData {
  type: 'success' | 'error';
  message: string;
}

export function useToast(autoHideMs = 4000) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: ToastData['type'], message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ type, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    timerRef.current = setTimeout(() => setToast(null), autoHideMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast, autoHideMs]);

  return { toast, showToast, hideToast };
}
