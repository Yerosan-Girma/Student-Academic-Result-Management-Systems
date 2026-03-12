const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch(path, { method = 'GET', body, headers, ...rest } = {}) {
  const opts = {
    method,
    credentials: 'include',
    headers: { ...(headers ?? {}) },
    ...rest
  };

  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 204) {
    if (!res.ok) throw new ApiError(res.statusText, { status: res.status });
    return null;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.error || data.message)) || res.statusText;
    throw new ApiError(message || 'Request failed', { status: res.status, data });
  }

  return data;
}

