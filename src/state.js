// Guardado local (IndexedDB): todo queda en el celular, sin internet.

const DB_NAME = 'luisa-amor';
const DB_VERSION = 1;
let dbPromise;

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

const asPromise = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const txDone = (tx) =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

async function kvGet(key) {
  const db = await openDB();
  return asPromise(db.transaction('kv').objectStore('kv').get(key));
}

async function kvSet(key, value) {
  const db = await openDB();
  const tx = db.transaction('kv', 'readwrite');
  tx.objectStore('kv').put(value, key);
  return txDone(tx);
}

export async function getAllPhotos() {
  const db = await openDB();
  const all = await asPromise(db.transaction('photos').objectStore('photos').getAll());
  return all.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.created - a.created);
}

export async function putPhoto(photo) {
  const db = await openDB();
  const tx = db.transaction('photos', 'readwrite');
  tx.objectStore('photos').put(photo);
  return txDone(tx);
}

export async function deletePhoto(id) {
  const db = await openDB();
  const tx = db.transaction('photos', 'readwrite');
  tx.objectStore('photos').delete(id);
  return txDone(tx);
}

export async function clearPhotos() {
  const db = await openDB();
  const tx = db.transaction('photos', 'readwrite');
  tx.objectStore('photos').clear();
  return txDone(tx);
}

// ---------------------------------------------------------------------------

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** IDs de notificación: enteros positivos de 32 bits. */
export const notifId = () => 1000 + Math.floor(Math.random() * 2_000_000_000);

export const DEFAULT_SETTINGS = {
  anniversary: '',
  birthday: '',
  phone: '',
  welcomed: false,
  gmLog: [], // días en que ya le diste los buenos días
};

export function defaultReminders() {
  return [
    {
      id: 600,
      builtin: 'morning',
      kind: 'morning',
      title: 'Dale los buenos días a Luisa',
      body: '',
      time: '06:00',
      freq: 'daily',
      enabled: true,
    },
    {
      id: 1300,
      kind: 'sweet',
      title: 'Escríbele algo bonito a Luisa',
      body: '',
      time: '13:00',
      freq: 'daily',
      enabled: true,
    },
    {
      id: 2130,
      kind: 'night',
      title: 'Dale las buenas noches a Luisa',
      body: '',
      time: '21:30',
      freq: 'daily',
      enabled: true,
    },
  ];
}

function defaultNotes() {
  const now = Date.now();
  return [
    {
      id: uid(),
      title: 'Todo sobre Luisa',
      body:
        'Cumpleaños: \nFlor favorita: \nComida favorita: \nPostre favorito: \nColor favorito: \nCanción favorita: \nPelícula favorita: \nTalla de ropa: \nTalla de zapatos: \nTalla de anillo: ',
      cat: 'datos',
      pinned: true,
      created: now,
      updated: now,
    },
  ];
}

export const state = {
  settings: { ...DEFAULT_SETTINGS },
  notes: [],
  reminders: [],
  photos: [],
};

export async function loadState() {
  const [settings, notes, reminders] = await Promise.all([kvGet('settings'), kvGet('notes'), kvGet('reminders')]);
  state.settings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  state.notes = notes || defaultNotes();
  state.reminders = reminders || defaultReminders();
  state.photos = await getAllPhotos();
  if (!notes) await saveNotes();
  if (!reminders) await saveReminders();
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* no pasa nada */
  }
}

export const saveSettings = () => kvSet('settings', state.settings);
export const saveNotes = () => kvSet('notes', state.notes);
export const saveReminders = () => kvSet('reminders', state.reminders);
