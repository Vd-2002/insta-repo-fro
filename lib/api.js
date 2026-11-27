function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || '/api';
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('leadflow_token');
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('leadflow_token', token);
  } else {
    localStorage.removeItem('leadflow_token');
  }
}

export async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const json = await res.json().catch(() => ({
    success: false,
    message: 'Unexpected server response',
  }));

  if (!res.ok || json.success === false) {
    const err = new Error(json.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return json.data !== undefined ? json.data : json;
}

