// Recordatorios para iPhone (y cualquier celular) usando el Calendario del teléfono:
// se genera un archivo .ics con alarmas que el Calendario hace sonar a la hora exacta.
import { nextOccurrence, parseISODate } from './dates.js';
import { pickMessage } from './messages.js';

const pad = (n) => String(n).padStart(2, '0');
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function localStamp(d) {
  // Hora "flotante": el teléfono la interpreta en su propia zona horaria.
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function utcStamp(d) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(s = '') {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function fold(line) {
  // Corta líneas largas (máx. ~72 bytes) sin partir letras ni emojis.
  const enc = new TextEncoder();
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > 72) {
      out.push(cur);
      cur = ' ';
      bytes = 1;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n');
}

function rrule(r) {
  switch (r.freq) {
    case 'daily':
      return 'FREQ=DAILY';
    case 'weekly':
      return `FREQ=WEEKLY;BYDAY=${DAYS[(r.weekday || 1) - 1]}`;
    case 'monthly':
      return `FREQ=MONTHLY;BYMONTHDAY=${r.day || 1}`;
    case 'yearly': {
      const d = parseISODate(r.date);
      return d ? `FREQ=YEARLY;BYMONTH=${d.getMonth() + 1};BYMONTHDAY=${d.getDate()}` : 'FREQ=YEARLY';
    }
    default:
      return null;
  }
}

function description(r) {
  if (r.body) return r.body;
  if (r.kind === 'morning') return `Escríbele: «${pickMessage('morning')}»`;
  if (r.kind === 'night') return `Escríbele: «${pickMessage('night')}»`;
  if (r.kind === 'sweet') return `Idea: «${pickMessage('sweet')}»`;
  return 'Abre la app de Luisa.';
}

export function buildICS(reminders) {
  const now = new Date();
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Luisa//App//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Luisa'];
  let count = 0;
  for (const r of reminders) {
    const start = nextOccurrence(r, now);
    if (!start) continue;
    const rule = rrule(r);
    lines.push(
      'BEGIN:VEVENT',
      `UID:luisa-${r.id}@luisa-app`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART:${localStamp(start)}`,
      'DURATION:PT10M',
      ...(rule ? [`RRULE:${rule}`] : []),
      `SUMMARY:${escapeText(r.title)}`,
      `DESCRIPTION:${escapeText(description(r))}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(r.title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
    count++;
  }
  lines.push('END:VCALENDAR');
  return { text: lines.map(fold).join('\r\n') + '\r\n', count };
}

/** Abre el archivo para que el teléfono ofrezca "Agregar al calendario". */
export async function addToCalendar(reminders, name = 'luisa-recordatorios') {
  const { text, count } = buildICS(reminders);
  if (!count) return 0;
  const file = new File([text], `${name}.ics`, { type: 'text/calendar' });
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    // Safari muestra la ventana de "Agregar al Calendario" al abrir un .ics.
    window.location.href = URL.createObjectURL(file);
    return count;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 2000);
  return count;
}
