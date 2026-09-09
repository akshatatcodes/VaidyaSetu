/**
 * Offline-first cache for kiosk — survives ~2 min Wi-Fi blip.
 * IndexedDB when available; localStorage fallback.
 */
const DB_NAME = 'medisahayak-kiosk';
const STORE = 'intake_drafts';
const SYNC_KEY = 'medisahayak_pending_sync';

function openDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function saveKioskDraft(id, draft) {
  const payload = { id, draft, updatedAt: Date.now() };
  const db = await openDb();
  if (db) {
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(payload);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  } else {
    localStorage.setItem(`kiosk_draft_${id}`, JSON.stringify(payload));
  }
}

export async function loadKioskDraft(id) {
  const db = await openDb();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result?.draft || null);
      req.onerror = () => resolve(null);
    });
  }
  try {
    const raw = localStorage.getItem(`kiosk_draft_${id}`);
    return raw ? JSON.parse(raw).draft : null;
  } catch {
    return null;
  }
}

export function queueOfflineRequest(request) {
  const list = JSON.parse(localStorage.getItem(SYNC_KEY) || '[]');
  list.push({ ...request, queuedAt: Date.now() });
  localStorage.setItem(SYNC_KEY, JSON.stringify(list));
}

export async function flushOfflineQueue(axiosInstance) {
  const list = JSON.parse(localStorage.getItem(SYNC_KEY) || '[]');
  if (!list.length || !navigator.onLine) return { flushed: 0 };
  const remaining = [];
  let flushed = 0;
  for (const item of list) {
    try {
      await axiosInstance({
        method: item.method || 'post',
        url: item.url,
        data: item.data,
        headers: item.headers
      });
      flushed += 1;
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem(SYNC_KEY, JSON.stringify(remaining));
  return { flushed, remaining: remaining.length };
}

export function installOnlineFlush(axiosInstance) {
  const handler = () => flushOfflineQueue(axiosInstance);
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
