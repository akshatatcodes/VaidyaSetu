const isLocalDev =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const rawUrl = import.meta.env.VITE_API_URL || (
  isLocalDev
    ? 'http://localhost:5000/api'
    : 'https://vaidyasetu-eyg9.onrender.com/api'
);

// Normalize to ensure we always end up with `${backendRoot}/api`
// This prevents a common deploy mistake where VITE_API_URL is set to the Render root
// (e.g. https://vaidyasetu-eyg9.onrender.com) instead of including `/api`.
const trimmed = rawUrl.replace(/\/+$/, '');
export const API_URL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

console.log('[API_CONFIG] Active Backend URL:', API_URL);
