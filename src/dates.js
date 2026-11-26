const pad = (n) => String(n).padStart(2, '0');

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function daysBetween(fromISO, to = new Date()) {
  const a = parseISODate(fromISO);
  if (!a) return null;
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}

const monthFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
const dayMonthFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' });
const weekdayFmt = new Intl.DateTimeFormat('es', { weekday: 'long' });

export function fmtDate(iso) {
  const d = parseISODate(iso);
  return d ? monthFmt.format(d) : '';
}

export function fmtShort(d) {
  return shortFmt.format(d).replace('.', '');
}

export function fmtDayMonth(iso) {
  const d = parseISODate(iso);
  return d ? dayMonthFmt.format(d) : '';
}

export function fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const WEEKDAYS_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export function weekdayName(d) {
  return weekdayFmt.format(d);
}

/** Próxima vez que sonará un recordatorio (o null si ya pasó). */
export function nextOccurrence(r, from = new Date()) {
  const [hh, mm] = (r.time || '00:00').split(':').map(Number);
  switch (r.freq) {
    case 'once': {
      const d = parseISODate(r.date);
      if (!d) return null;
      d.setHours(hh, mm, 0, 0);
      return d > from ? d : null;
    }
    case 'daily': {
      const d = new Date(from);
      d.setHours(hh, mm, 0, 0);
      if (d <= from) d.setDate(d.getDate() + 1);
      return d;
    }
    case 'weekly': {
      const d = new Date(from);
      d.setHours(hh, mm, 0, 0);
      const target = (r.weekday || 1) - 1; // 0 = domingo
      d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7));
      if (d <= from) d.setDate(d.getDate() + 7);
      return d;
    }
    case 'monthly': {
      const day = r.day || 1;
      for (let i = 0; i < 14; i++) {
        const c = new Date(from.getFullYear(), from.getMonth() + i, day, hh, mm);
        if (c.getDate() === day && c > from) return c;
      }
      return null;
    }
    case 'yearly': {
      const base = parseISODate(r.date);
      if (!base) return null;
      for (let i = 0; i < 6; i++) {
        const c = new Date(from.getFullYear() + i, base.getMonth(), base.getDate(), hh, mm);
        if (c.getMonth() === base.getMonth() && c > from) return c;
      }
      return null;
    }
    default:
      return null;
  }
}

export function describeSchedule(r) {
  const t = fmtTime(r.time);
  switch (r.freq) {
    case 'once':
      return `${fmtDate(r.date)} · ${t}`;
    case 'daily':
      return `Todos los días · ${t}`;
    case 'weekly':
      return `Cada ${WEEKDAYS[(r.weekday || 1) - 1]} · ${t}`;
    case 'monthly':
      return `Cada día ${r.day} del mes · ${t}`;
    case 'yearly':
      return `Cada ${fmtDayMonth(r.date)} · ${t}`;
    default:
      return t;
  }
}

export function relativeWhen(d, now = new Date()) {
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((startThat - startToday) / 86400000);
  const t = fmtTime(`${d.getHours()}:${d.getMinutes()}`);
  if (diff === 0) return `Hoy · ${t}`;
  if (diff === 1) return `Mañana · ${t}`;
  if (diff < 7) return `${weekdayName(d)} · ${t}`;
  return `${fmtShort(d)} · ${t}`;
}

export function partOfDay(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return 'morning';
  if (h < 19) return 'afternoon';
  return 'night';
}
