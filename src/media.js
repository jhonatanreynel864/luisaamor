// Fotos, compartir, copiar y copias de seguridad.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { state, saveSettings, saveNotes, saveReminders, putPhoto, clearPhotos, getAllPhotos, uid } from './state.js';

const isNative = Capacitor.isNativePlatform();

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

function resizeTo(img, max, quality) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality));
}

/** Reduce la foto para que no ocupe tanto espacio y crea una miniatura. */
export async function processPhoto(file) {
  const { img, url } = await loadImage(file);
  try {
    const [blob, thumb] = await Promise.all([resizeTo(img, 1800, 0.86), resizeTo(img, 520, 0.8)]);
    return { blob, thumb, w: img.naturalWidth, h: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const urlCache = new Map();
export function photoURL(photo, kind = 'thumb') {
  const key = `${photo.id}:${kind}:${photo.v || 0}`;
  if (!urlCache.has(key)) urlCache.set(key, URL.createObjectURL(kind === 'thumb' ? photo.thumb : photo.blob));
  return urlCache.get(key);
}

export function forgetPhotoURLs(id) {
  for (const [k, u] of urlCache) {
    if (k.startsWith(`${id}:`)) {
      URL.revokeObjectURL(u);
      urlCache.delete(k);
    }
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function base64ToBlob(b64, type = 'image/jpeg') {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

// ---------------------------------------------------------------------------

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export async function shareText(text) {
  try {
    if (isNative || navigator.share) {
      await Share.share({ text, dialogTitle: 'Enviar a Luisa' });
      return true;
    }
  } catch (e) {
    if (String(e?.message || e).toLowerCase().includes('cancel')) return true;
  }
  return copyText(text);
}

export function openWhatsApp(text) {
  const digits = (state.settings.phone || '').replace(/\D/g, '');
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  if (isNative) window.location.href = url;
  else window.open(url, '_blank', 'noopener');
}

export async function sharePhoto(photo) {
  const name = `luisa-${photo.date || 'foto'}-${photo.id}.jpg`;
  if (isNative) {
    const data = await blobToBase64(photo.blob);
    const res = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache });
    await Share.share({ files: [res.uri], text: photo.caption || '', dialogTitle: 'Compartir recuerdo' });
    return;
  }
  const file = new File([photo.blob], name, { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: photo.caption || '' });
  else downloadBlob(photo.blob, name);
}

// ---------------------------------------------------------------------------
// Copia de seguridad: un archivo .json con notas, recordatorios y fotos.

export async function exportBackup(onProgress) {
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `luisa-copia-${stamp}.json`;
  const head = JSON.stringify({
    app: 'luisa-amor',
    version: 1,
    exported: new Date().toISOString(),
    settings: state.settings,
    notes: state.notes,
    reminders: state.reminders,
  });
  const photos = await getAllPhotos();
  const open = `${head.slice(0, -1)},"photos":[`;

  if (isNative) {
    await Filesystem.writeFile({ path: name, data: open, directory: Directory.Cache, encoding: Encoding.UTF8 });
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const item = JSON.stringify({
        id: p.id,
        caption: p.caption,
        date: p.date,
        created: p.created,
        w: p.w,
        h: p.h,
        data: await blobToBase64(p.blob),
      });
      await Filesystem.appendFile({
        path: name,
        data: (i ? ',' : '') + item,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      onProgress?.(i + 1, photos.length);
    }
    await Filesystem.appendFile({ path: name, data: ']}', directory: Directory.Cache, encoding: Encoding.UTF8 });
    const { uri } = await Filesystem.getUri({ path: name, directory: Directory.Cache });
    await Share.share({ files: [uri], title: name, dialogTitle: 'Guardar copia de seguridad' });
    return;
  }

  const parts = [open];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    parts.push(
      (i ? ',' : '') +
        JSON.stringify({ id: p.id, caption: p.caption, date: p.date, created: p.created, w: p.w, h: p.h, data: await blobToBase64(p.blob) }),
    );
    onProgress?.(i + 1, photos.length);
  }
  parts.push(']}');
  downloadBlob(new Blob(parts, { type: 'application/json' }), name);
}

export async function importBackup(file, onProgress) {
  const data = JSON.parse(await file.text());
  if (data?.app !== 'luisa-amor') throw new Error('Este archivo no es una copia de la app de Luisa');
  state.settings = { ...state.settings, ...(data.settings || {}) };
  state.notes = Array.isArray(data.notes) ? data.notes : state.notes;
  state.reminders = Array.isArray(data.reminders) ? data.reminders : state.reminders;
  await Promise.all([saveSettings(), saveNotes(), saveReminders()]);
  const photos = Array.isArray(data.photos) ? data.photos : [];
  await clearPhotos();
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const blob = base64ToBlob(p.data);
    const processed = await processPhoto(blob);
    await putPhoto({
      id: p.id || uid(),
      caption: p.caption || '',
      date: p.date || '',
      created: p.created || Date.now(),
      w: p.w,
      h: p.h,
      blob,
      thumb: processed.thumb,
    });
    onProgress?.(i + 1, photos.length);
  }
  state.photos = await getAllPhotos();
}
