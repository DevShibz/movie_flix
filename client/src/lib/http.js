export const STATUS_MESSAGES = {
  400: 'The request was invalid. Please check your input.',
  401: 'You are not signed in. Please log in and try again.',
  402: 'Payment is required to access this resource.',
  403: 'You do not have permission to do that.',
  404: 'The requested resource was not found.',
  405: 'This action is not allowed.',
  406: 'The server cannot return a response in the requested format.',
  408: 'The server timed out waiting for the request.',
  409: 'This conflicts with existing data.',
  410: 'This resource is no longer available.',
  413: 'The data you sent is too large.',
  415: 'This file or data type is not supported.',
  422: 'Some of the submitted data is invalid.',
  423: 'This resource is locked.',
  429: 'Too many requests. Please slow down and try again shortly.',
  500: 'Something went wrong on the server. Please try again.',
  501: 'This feature is not supported by the server.',
  502: 'The server received a bad response. Please try again.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The server took too long to respond. Please try again.',
};

const NETWORK_MESSAGE = 'Unable to reach the server. Check your internet connection.';
const TIMEOUT_MESSAGE = 'The request took too long and was cancelled.';
const PARSE_MESSAGE = 'The server sent a response that could not be read.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

// code: HTTP | NETWORK | TIMEOUT | ABORTED | PARSE | UNKNOWN
export class ApiError extends Error {
  constructor({ message, status = 0, data = null, code = 'UNKNOWN', title }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
    this.title = title || defaultTitle(code, status);
  }
}

function defaultTitle(code, status) {
  if (code === 'NETWORK') return 'Connection problem';
  if (code === 'TIMEOUT') return 'Request timed out';
  if (code === 'PARSE') return 'Invalid response';
  if (code === 'HTTP' && status) return `Error ${status}`;
  return 'Error';
}

function statusMessage(status, data, messages, useServerMessage) {
  if (messages && messages[status]) return messages[status];

  if (useServerMessage && data) {
    if (typeof data === 'string' && data.trim() && data.length < 200 && !data.trim().startsWith('<')) {
      return data.trim();
    }
    const fromBody = data.error || data.message;
    if (typeof fromBody === 'string' && fromBody.trim()) return fromBody;
  }

  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return STATUS_MESSAGES[500];
  if (status >= 400) return 'The request could not be completed.';
  return GENERIC_MESSAGE;
}

async function readBody(res) {
  if (res.status === 204 || res.status === 205 || res.status === 304) return null;
  const text = await res.text();
  if (!text) return null;

  const type = res.headers.get('content-type') || '';
  if (type.includes('json')) return JSON.parse(text);
  return text;
}

// Every API call lives under /api. Set VITE_API_URL (for example https://api.example.com)
// only if the API is hosted on a different origin than the website.
const API_BASE = `${(import.meta.env?.VITE_API_URL ?? '').replace(/\/$/, '')}/api`

function buildUrl(url, baseUrl = '', query) {
  const isAbsolute = /^https?:\/\//i.test(url);
  let full = isAbsolute ? url : `${baseUrl}${url}`;
  if (query && Object.keys(query).length) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.append(key, value);
    });
    full += `${full.includes('?') ? '&' : '?'}${params.toString()}`;
  }
  return full;
}

function buildBody(body, headers) {
  if (body === undefined || body === null) return undefined;
  const isRaw =
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer;
  if (isRaw) return body;

  if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }
  return JSON.stringify(body);
}

/**
 * Plain fetch wrapper. Resolves with the parsed body, rejects with ApiError.
 * options: method, body, headers, query, baseUrl, timeout (ms, 0 = none),
 *          signal, messages ({ [status]: text }), useServerMessage
 */
export async function httpRequest(url, options = {}) {
  const {
    method = 'GET',
    body,
    headers: inputHeaders = {},
    query,
    baseUrl = API_BASE,
    timeout = 15000,
    signal,
    messages,
    useServerMessage = true,
  } = options;

  const headers = { Accept: 'application/json, text/plain, */*', ...inputHeaders };
  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const timer = timeout
    ? setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeout)
    : null;

  try {
    let res;
    let data;
    try {
      res = await fetch(buildUrl(url, baseUrl, query), {
        method: method.toUpperCase(),
        headers,
        body: buildBody(body, headers),
        signal: controller.signal,
      });
      data = await readBody(res);
    } catch (err) {
      if (timedOut) throw new ApiError({ message: TIMEOUT_MESSAGE, code: 'TIMEOUT' });
      if (controller.signal.aborted || err.name === 'AbortError') {
        throw new ApiError({ message: 'Request cancelled.', code: 'ABORTED' });
      }
      if (err instanceof SyntaxError) {
        throw new ApiError({ message: PARSE_MESSAGE, status: res?.status, code: 'PARSE' });
      }
      throw new ApiError({ message: NETWORK_MESSAGE, code: 'NETWORK' });
    }

    if (!res.ok) {
      throw new ApiError({
        message: statusMessage(res.status, data, messages, useServerMessage),
        status: res.status,
        data,
        code: 'HTTP',
      });
    }
    return data;
  } finally {
    if (timer) clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }
}
