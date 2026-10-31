import { supabase } from './supabaseClient.js';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

async function getAuthHeader() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (err) {
    console.warn('[API_CLIENT] Could not retrieve session access token:', err);
  }
  return {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Check for missing Render URL configuration when running in production
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    url.includes('localhost')
  ) {
    throw new Error(
      'VITE_API_BASE_URL is missing in your Vercel Environment Variables. Please set VITE_API_BASE_URL to your live Render backend URL.'
    );
  }

  const authHeaders = await getAuthHeader();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (typeof data === 'object' && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),
  put: (endpoint, body, options) =>
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }),
  delete: (endpoint, options) =>
    request(endpoint, { method: 'DELETE', ...options }),
};

