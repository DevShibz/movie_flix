import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, httpRequest } from '../lib/http';
import { useToast } from '../components/Toast';

/**
 * const { data, error, loading, get, post, put, patch, del, request, cancel, reset } = useApi(options)
 *
 * Every method resolves to { data, error } and never throws.
 * Options can be set on the hook and overridden per call:
 *   baseUrl, headers, query, timeout (ms, 0 = none), messages ({ [status]: text }),
 *   useServerMessage (use the server's `error`/`message` text), onSuccess(data), onError(error),
 *   toast: false | {
 *     enabled, type ('error'), title, message (string | fn(error)),
 *     duration, dismissible, ignoreStatuses: [401], ignoreCodes: ['ABORTED']
 *   }
 */
export function useApi(hookOptions = {}) {
  const toast = useToast();
  const optionsRef = useRef(hookOptions);
  optionsRef.current = hookOptions;

  const [state, setState] = useState({ data: null, error: null });
  const [pending, setPending] = useState(0);
  const controllers = useRef(new Set());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const active = controllers.current;
    return () => {
      mounted.current = false;
      active.forEach((c) => c.abort());
      active.clear();
    };
  }, []);

  const notify = useCallback(
    (error, config) => {
      if (config === false || config?.enabled === false) return;
      const cfg = config || {};
      if (error.code === 'ABORTED') return;
      if (cfg.ignoreCodes?.includes(error.code)) return;
      if (cfg.ignoreStatuses?.includes(error.status)) return;

      const message = typeof cfg.message === 'function' ? cfg.message(error) : cfg.message ?? error.message;
      toast.show({
        type: cfg.type || 'error',
        title: cfg.title ?? error.title,
        message,
        duration: cfg.duration,
        dismissible: cfg.dismissible,
      });
    },
    [toast]
  );

  const request = useCallback(
    async (url, callOptions = {}) => {
      const base = optionsRef.current;
      const opts = {
        ...base,
        ...callOptions,
        headers: { ...base.headers, ...callOptions.headers },
        messages: { ...base.messages, ...callOptions.messages },
        toast: callOptions.toast !== undefined ? callOptions.toast : base.toast,
      };

      const controller = new AbortController();
      controllers.current.add(controller);
      if (callOptions.signal) {
        if (callOptions.signal.aborted) controller.abort();
        else callOptions.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      setPending((n) => n + 1);
      try {
        const data = await httpRequest(url, { ...opts, signal: controller.signal });
        if (mounted.current) setState({ data, error: null });
        opts.onSuccess?.(data);
        return { data, error: null };
      } catch (err) {
        const error = err instanceof ApiError ? err : new ApiError({ message: err?.message || 'Something went wrong.' });
        if (error.code !== 'ABORTED') {
          if (mounted.current) setState((prev) => ({ ...prev, error }));
          notify(error, opts.toast);
          opts.onError?.(error);
        }
        return { data: null, error };
      } finally {
        controllers.current.delete(controller);
        if (mounted.current) setPending((n) => n - 1);
      }
    },
    [notify]
  );

  const cancel = useCallback(() => {
    controllers.current.forEach((c) => c.abort());
    controllers.current.clear();
  }, []);

  const reset = useCallback(() => setState({ data: null, error: null }), []);

  const methods = useMemo(
    () => ({
      get: (url, opts) => request(url, { ...opts, method: 'GET' }),
      post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
      put: (url, body, opts) => request(url, { ...opts, method: 'PUT', body }),
      patch: (url, body, opts) => request(url, { ...opts, method: 'PATCH', body }),
      del: (url, opts) => request(url, { ...opts, method: 'DELETE' }),
    }),
    [request]
  );

  return {
    data: state.data,
    error: state.error,
    loading: pending > 0,
    request,
    cancel,
    reset,
    ...methods,
  };
}
