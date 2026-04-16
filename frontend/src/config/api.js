const isLocalDev =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Local dev safety:
// If you're running the frontend on localhost, default to the local backend
// to avoid confusing "blank screen" failures caused by accidentally pointing
// dev UI at the remote Render API.
//
// To intentionally force a remote backend while on localhost, set:
// - VITE_FORCE_REMOTE_API=true
// - VITE_API_URL=https://<remote>/api   (or without /api; we normalize below)
const forceRemote =
  String(import.meta.env.VITE_FORCE_REMOTE_API || '').toLowerCase() === 'true';

const envUrl = import.meta.env.VITE_API_URL;
const rawUrl = (isLocalDev && !forceRemote)
  ? 'http://localhost:5000/api'
  : (envUrl || 'https://vaidyasetu-eyg9.onrender.com/api');

// Normalize to ensure we always end up with `${backendRoot}/api`
// This prevents a common deploy mistake where VITE_API_URL is set to the Render root
// (e.g. https://vaidyasetu-eyg9.onrender.com) instead of including `/api`.
const trimmed = rawUrl.replace(/\/+$/, '');
export const API_URL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

console.log('[API_CONFIG] Active Backend URL:', API_URL);
