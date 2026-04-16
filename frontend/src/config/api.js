const rawUrl = import.meta.env.VITE_API_URL || 'https://vaidyasetu-eyg9.onrender.com/api';

// Robustly strip any trailing slashes to prevent 404s caused by double slashes (e.g. /api//user)
export const API_URL = rawUrl.replace(/\/+$/, '');

console.log('[API_CONFIG] Active Backend URL:', API_URL);
