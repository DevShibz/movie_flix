import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const POSITIONS = {
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

const TYPES = {
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', bar: 'bg-emerald-500', icon: '✓' },
  error: { box: 'border-red-200 bg-red-50 text-red-900', bar: 'bg-red-500', icon: '✕' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', bar: 'bg-amber-500', icon: '!' },
  info: { box: 'border-sky-200 bg-sky-50 text-sky-900', bar: 'bg-sky-500', icon: 'i' },
};

function ToastItem({ toast, onClose }) {
  const style = TYPES[toast.type] || TYPES.info;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-80 max-w-[90vw] overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ${style.box} ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <div className={`w-1.5 shrink-0 ${style.bar}`} />
      <div className="flex flex-1 items-start gap-3 p-3">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${style.bar}`}>
          {style.icon}
        </span>
        <div className="min-w-0 flex-1">
          {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
          {toast.message && <p className="break-words text-sm opacity-90">{toast.message}</p>}
        </div>
        {toast.dismissible && (
          <button
            type="button"
            aria-label="Close notification"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-lg leading-none opacity-60 transition hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Provider-level defaults (all optional):
 *   position   top-right | top-left | top-center | bottom-right | bottom-left | bottom-center
 *   duration   ms before auto close (0 = stays until dismissed)
 *   maxToasts  how many are shown at once
 *   dismissible  show the close button
 */
export function ToastProvider({ children, position = 'top-right', duration = 4000, maxToasts = 5, dismissible = true }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const idCounter = useRef(0);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (input) => {
      const options = typeof input === 'string' ? { message: input } : input;
      const id = ++idCounter.current;
      const toast = { type: 'info', duration, dismissible, ...options, id };

      setToasts((list) => [...list, toast].slice(-maxToasts));
      if (toast.duration > 0) {
        timers.current.set(id, setTimeout(() => dismiss(id), toast.duration));
      }
      return id;
    },
    [duration, dismissible, maxToasts, dismiss]
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show({ ...options, type: 'success', message }),
      error: (message, options) => show({ ...options, type: 'error', message }),
      warning: (message, options) => show({ ...options, type: 'warning', message }),
      info: (message, options) => show({ ...options, type: 'info', message }),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={`pointer-events-none fixed z-[100] flex flex-col gap-2 ${POSITIONS[position] || POSITIONS['top-right']}`}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
