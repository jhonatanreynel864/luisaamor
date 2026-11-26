// Notificaciones locales: se programan en el celular y suenan aunque la app esté cerrada.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { pickMessage } from './messages.js';
import { state, saveReminders } from './state.js';
import { parseISODate, toISODate } from './dates.js';

export const isNative = Capacitor.isNativePlatform();
const CHANNEL = 'luisa';
const TEST_ID = 99;

let channelReady = false;
async function ensureChannel() {
  if (!isNative || channelReady) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL,
      name: 'Recordatorios de Luisa',
      description: 'Buenos días, mensajes bonitos y fechas especiales',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#FF4F96',
    });
    channelReady = true;
  } catch (e) {
    console.warn('channel', e);
  }
}

export async function permissionStatus() {
  if (!isNative) {
    return { display: 'web', exact: 'web' };
  }
  const { display } = await LocalNotifications.checkPermissions();
  let exact = 'granted';
  try {
    exact = (await LocalNotifications.checkExactNotificationSetting()).exact_alarm;
  } catch {
    /* Android < 12 */
  }
  return { display, exact };
}

export async function requestPermission() {
  if (!isNative) return 'web';
  const { display } = await LocalNotifications.requestPermissions();
  if (display === 'granted') await syncNotifications();
  return display;
}

export async function openExactAlarmSettings() {
  if (!isNative) return;
  try {
    await LocalNotifications.changeExactNotificationSetting();
  } catch (e) {
    console.warn(e);
  }
}

function bodyFor(r) {
  if (r.body) return r.body;
  if (r.kind === 'morning') return `Escríbele: «${pickMessage('morning')}»`;
  if (r.kind === 'night') return `Escríbele: «${pickMessage('night')}»`;
  if (r.kind === 'sweet') return `Idea: «${pickMessage('sweet')}»`;
  if (r.kind === 'birthday') return 'Felicítala con todo tu amor.';
  if (r.kind === 'birthday-eve') return 'Prepara su regalo y una sorpresa bonita.';
  if (r.kind === 'anniversary') return 'Celebra su historia de amor.';
  return 'Toca para abrir la app de Luisa.';
}

export function buildSchedule(r, now = new Date()) {
  const [hour, minute] = r.time.split(':').map(Number);
  const base = { allowWhileIdle: true };
  switch (r.freq) {
    case 'once': {
      const at = parseISODate(r.date);
      if (!at) return null;
      at.setHours(hour, minute, 0, 0);
      return at > now ? { ...base, at } : null;
    }
    case 'daily':
      return { ...base, on: { hour, minute, second: 0 } };
    case 'weekly':
      return { ...base, on: { weekday: r.weekday || 1, hour, minute, second: 0 } };
    case 'monthly':
      return { ...base, on: { day: r.day || 1, hour, minute, second: 0 } };
    case 'yearly': {
      const d = parseISODate(r.date);
      if (!d) return null;
      // En Android el mes empieza en 0 (enero = 0).
      return { ...base, on: { month: d.getMonth(), day: d.getDate(), hour, minute, second: 0 } };
    }
    default:
      return null;
  }
}

let syncing = Promise.resolve();

/** Vuelve a programar todas las notificaciones según los recordatorios guardados. */
export function syncNotifications() {
  syncing = syncing.then(doSync, doSync);
  return syncing;
}

async function doSync() {
  if (!isNative) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return;
    await ensureChannel();
    const pending = await LocalNotifications.getPending();
    const old = pending.notifications.filter((n) => n.id !== TEST_ID).map((n) => ({ id: n.id }));
    if (old.length) await LocalNotifications.cancel({ notifications: old });

    const list = [];
    for (const r of state.reminders) {
      if (!r.enabled) continue;
      const schedule = buildSchedule(r);
      if (!schedule) continue;
      const body = bodyFor(r);
      list.push({
        id: r.id,
        title: r.title,
        body,
        largeBody: body,
        schedule,
        channelId: CHANNEL,
        smallIcon: 'ic_stat_kitty',
        iconColor: '#FF4F96',
        autoCancel: true,
        extra: { kind: r.kind || 'custom', rid: r.id },
      });
    }
    if (list.length) await LocalNotifications.schedule({ notifications: list });
  } catch (e) {
    console.warn('No se pudieron programar las notificaciones', e);
  }
}

export async function sendTestNotification() {
  if (!isNative) return false;
  await ensureChannel();
  const body = `Idea: «${pickMessage('sweet')}»`;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_ID,
        title: 'Así te llegarán los recordatorios',
        body,
        largeBody: body,
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
        channelId: CHANNEL,
        smallIcon: 'ic_stat_kitty',
        iconColor: '#FF4F96',
        extra: { kind: 'sweet' },
      },
    ],
  });
  return true;
}

export function onNotificationTap(handler) {
  if (!isNative) return;
  LocalNotifications.addListener('localNotificationActionPerformed', (ev) => {
    handler(ev.notification?.extra || {});
  });
}

// ---------------------------------------------------------------------------
// Fechas especiales: cumpleaños y aniversario crean recordatorios anuales solos.

function upsertBuiltin(key, data) {
  const i = state.reminders.findIndex((r) => r.builtin === key);
  if (!data) {
    if (i >= 0) state.reminders.splice(i, 1);
    return;
  }
  const { time, ...rest } = data;
  if (i >= 0) {
    // Respeta la hora y el encendido/apagado que haya elegido el usuario.
    state.reminders[i] = { ...state.reminders[i], ...rest, builtin: key };
  } else {
    const ids = { birthday: 700, 'birthday-eve': 701, anniversary: 702 };
    state.reminders.push({ id: ids[key], builtin: key, enabled: true, body: '', freq: 'yearly', time, ...rest });
  }
}

export async function syncSpecialDates() {
  const { birthday, anniversary } = state.settings;
  if (birthday) {
    const d = parseISODate(birthday);
    const eve = new Date(d);
    eve.setDate(eve.getDate() - 1);
    upsertBuiltin('birthday', { kind: 'birthday', title: 'Hoy es el cumpleaños de Luisa', date: birthday, time: '07:00' });
    upsertBuiltin('birthday-eve', {
      kind: 'birthday-eve',
      title: 'Mañana es el cumpleaños de Luisa',
      date: toISODate(eve),
      time: '18:00',
    });
  } else {
    upsertBuiltin('birthday', null);
    upsertBuiltin('birthday-eve', null);
  }
  if (anniversary) {
    upsertBuiltin('anniversary', { kind: 'anniversary', title: 'Hoy es su aniversario', date: anniversary, time: '07:00' });
  } else {
    upsertBuiltin('anniversary', null);
  }
  await saveReminders();
  await syncNotifications();
}
