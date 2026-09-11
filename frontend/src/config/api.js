// Resolves which backend this frontend talks to.
//
// The important case for demos: when you open the app from a PHONE on the same
// WiFi, the hostname is the laptop's LAN IP (e.g. 192.168.1.7), not "localhost".
// Previously that fell through to the remote Render backend, so the phone silently
// talked to production while the laptop talked to local — the demo appeared to
// "work" but showed different data on each device. We now detect LAN hosts and
// point them at the same machine's backend port.

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

const isLoopback = ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname);

// Private address ranges (RFC1918) + .local mDNS names.
// 10.x.x.x | 192.168.x.x | 172.16–31.x.x
const isPrivateLan =
  /^10\./.test(hostname) ||
  /^192\.168\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
  /\.local$/.test(hostname);

const isLocalDev = isLoopback || isPrivateLan;

// Port the Express backend listens on. Override with VITE_BACKEND_PORT if changed.
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '5000';

// To intentionally force a remote backend while on a local network, set:
// - VITE_FORCE_REMOTE_API=true
// - VITE_API_URL=https://<remote>/api   (or without /api; we normalize below)
const forceRemote =
  String(import.meta.env.VITE_FORCE_REMOTE_API || '').toLowerCase() === 'true';

const envUrl = import.meta.env.VITE_API_URL;

let rawUrl;
if (isLocalDev && !forceRemote) {
  // Use whatever host the browser used to reach this page, so a phone hitting
  // 192.168.1.7:5173 gets 192.168.1.7:5000 and the laptop still gets localhost.
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  rawUrl = `${protocol}//${hostname || 'localhost'}:${BACKEND_PORT}/api`;
} else {
  rawUrl = envUrl || 'https://vaidyasetu-eyg9.onrender.com/api';
}

// Normalize to ensure we always end up with `${backendRoot}/api`
// This prevents a common deploy mistake where VITE_API_URL is set to the Render root
// (e.g. https://vaidyasetu-eyg9.onrender.com) instead of including `/api`.
const trimmed = rawUrl.replace(/\/+$/, '');
export const API_URL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

console.log(
  `[API_CONFIG] host=${hostname || 'ssr'} localDev=${isLocalDev} → ${API_URL}`
);
