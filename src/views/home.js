import { mascotHTML, icons, iconTile, bowSVG } from '../art.js';
import { state, saveSettings } from '../state.js';
import { pickMessage, KIND_LABEL } from '../messages.js';
import { todayISO, daysBetween, parseISODate, toISODate, nextOccurrence, relativeWhen, partOfDay, fmtDate } from '../dates.js';
import { esc, toast, heartBurst } from '../ui.js';
import { copyText, openWhatsApp, shareText, photoURL } from '../media.js';
import { CATS } from './notes.js';
import { reminderIcon } from './reminders.js';

let msgKind = null;
let msgText = '';
let memoryId = null;

export function setMessageKind(kind) {
  if (['morning', 'sweet', 'night'].includes(kind)) {
    msgKind = kind;
    msgText = pickMessage(kind);
  }
}

function defaultKind() {
  const p = partOfDay();
  return p === 'morning' ? 'morning' : p === 'night' ? 'night' : 'sweet';
}

function greeting() {
  const p = partOfDay();
  if (p === 'morning') return 'Buenos días';
  if (p === 'afternoon') return 'Buenas tardes';
  return 'Buenas noches';
}

function streak() {
  const set = new Set(state.settings.gmLog || []);
  const d = new Date();
  if (!set.has(toISODate(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(toISODate(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function together() {
  const a = state.settings.anniversary;
  if (!a) return null;
  const days = daysBetween(a);
  if (days === null || days < 0) return null;
  const start = parseISODate(a);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months--;
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} ${y === 1 ? 'año' : 'años'}`);
  if (m) parts.push(`${m} ${m === 1 ? 'mes' : 'meses'}`);
  return { days, extra: parts.join(' y ') };
}

const todayLabel = () => new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

export function renderHome(view, ctx) {
  if (!msgKind) {
    msgKind = defaultKind();
    msgText = pickMessage(msgKind);
  }
  const today = todayISO();
  const doneToday = (state.settings.gmLog || []).includes(today);
  const s = streak();
  const t = together();

  const upcoming = state.reminders
    .filter((r) => r.enabled)
    .map((r) => ({ r, at: nextOccurrence(r) }))
    .filter((x) => x.at)
    .sort((a, b) => a.at - b.at)
    .slice(0, 3);

  const pinned = state.notes.filter((n) => n.pinned).slice(0, 3);

  let photo = state.photos.find((p) => p.id === memoryId);
  if (!photo && state.photos.length) {
    photo = state.photos[Math.floor(Math.random() * state.photos.length)];
    memoryId = photo.id;
  }

  view.innerHTML = `
    <section class="hero">
      <div class="hero-top">
        <div>
          <p class="hero-hello">${greeting()}</p>
          <p class="hero-date">${todayLabel()}</p>
        </div>
        <button class="icon-btn glass" data-act="settings" aria-label="Ajustes">${icons.gear}</button>
      </div>
      ${mascotHTML({ size: 132 })}
      <h1 class="luisa"><span class="luisa-word"><span class="luisa-bow">${bowSVG({ size: 42 })}</span>Luisa</span></h1>
      <p class="hero-sub">el amor de mi vida</p>
      <div class="hero-stats">
        ${
          t
            ? `<button class="stat" data-act="settings"><b>${t.days.toLocaleString('es')}</b><span>días juntos</span>${t.extra ? `<small>${t.extra}</small>` : ''}</button>`
            : `<button class="stat add" data-act="settings"><b>Agregar fecha</b><span>desde cuándo están juntos</span></button>`
        }
        <div class="stat"><b>${s}</b><span>${s === 1 ? 'día seguido' : 'días seguidos'}</span><small>dándole los buenos días</small></div>
      </div>
    </section>

    <section class="card">
      <div class="gm">
        ${iconTile(doneToday ? 'check' : 'sun', doneToday ? 'mint' : 'sun', 'lg')}
        <div class="gm-text">
          <h3>${doneToday ? 'Ya le diste los buenos días' : 'Buenos días para Luisa'}</h3>
          <p>${doneToday ? '¡Bien hecho! Mañana a las 6:00 te recuerdo otra vez.' : '¿Ya le escribiste hoy? Márcalo para seguir tu racha.'}</p>
        </div>
      </div>
      ${
        doneToday
          ? `<div class="gm-done"><span>${icons.check} Enviado hoy</span><button data-act="gm-undo">Deshacer</button></div>`
          : `<div class="gm-actions"><button class="btn block" data-act="gm-done">${icons.check} Ya le escribí</button></div>`
      }
    </section>

    <section class="card" id="msg-card">
      <div class="card-head"><h3>Mensaje para Luisa</h3><button class="link" data-act="another" aria-label="Otro mensaje">${icons.refresh}</button></div>
      <div class="seg" role="tablist">
        ${['morning', 'sweet', 'night']
          .map((k) => `<button class="${k === msgKind ? 'on' : ''}" data-act="kind" data-kind="${k}">${KIND_LABEL[k]}</button>`)
          .join('')}
      </div>
      <p class="bubble">${esc(msgText)}</p>
      <div class="msg-actions">
        <button class="btn wa" data-act="wa">${icons.whatsapp} Enviar por WhatsApp</button>
        <button class="icon-btn" data-act="copy" aria-label="Copiar">${icons.copy}</button>
        <button class="icon-btn" data-act="share" aria-label="Compartir">${icons.share}</button>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h3>Próximos recordatorios</h3><button class="link" data-act="go" data-tab="reminders">Ver todos</button></div>
      ${
        upcoming.length
          ? `<div class="list">${upcoming
              .map(
                ({ r, at }) => `
            <button class="row" data-act="go" data-tab="reminders">
              ${reminderIcon(r, 'sm')}
              <span class="row-main"><b>${esc(r.title)}</b><span class="when">${relativeWhen(at)}</span></span>
            </button>`,
              )
              .join('')}</div>`
          : `<p class="muted">No hay recordatorios activos.</p>`
      }
    </section>

    <section class="card">
      <div class="card-head"><h3>Lo que no debo olvidar</h3><button class="link" data-act="go" data-tab="notes">Notas</button></div>
      ${
        pinned.length
          ? `<div class="list">${pinned
              .map((n) => {
                const c = CATS[n.cat] || CATS.otros;
                return `
            <button class="row" data-act="open-note" data-id="${n.id}">
              ${iconTile(c.icon, c.tone, 'sm')}
              <span class="row-main"><b>${esc(n.title || 'Sin título')}</b><span>${esc((n.body || '').replace(/\n/g, ' · ').slice(0, 80))}</span></span>
              <span class="chev">${icons.chevron}</span>
            </button>`;
              })
              .join('')}</div>`
          : `<p class="muted">Fija tus notas importantes y aparecerán aquí.</p>`
      }
    </section>

    <section class="card">
      <div class="card-head"><h3>Un recuerdo bonito</h3><button class="link" data-act="go" data-tab="photos">Fotos</button></div>
      ${
        photo
          ? `<button class="memory-photo" data-act="go" data-tab="photos">
               <img src="${photoURL(photo)}" alt="">
               <figcaption>${esc(photo.caption || 'Nuestro momento')}${photo.date ? `<small>${fmtDate(photo.date)}</small>` : ''}</figcaption>
             </button>`
          : `<button class="empty-photo" data-act="go" data-tab="photos">
               ${iconTile('camera', 'lilac', 'md')}
               <span>Guarda tu primera foto con Luisa</span>
             </button>`
      }
    </section>

    <p class="footer-love">Hecha con amor para Luisa</p>
  `;

  view.onclick = async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'settings') ctx.go('settings');
    else if (act === 'go') ctx.go(el.dataset.tab);
    else if (act === 'open-note') ctx.go('notes', { openNote: el.dataset.id });
    else if (act === 'kind') {
      msgKind = el.dataset.kind;
      msgText = pickMessage(msgKind);
      view.querySelectorAll('[data-act="kind"]').forEach((b) => b.classList.toggle('on', b === el));
      swapMessage(view);
    } else if (act === 'another') {
      msgText = pickMessage(msgKind, msgText);
      swapMessage(view);
    } else if (act === 'copy') {
      toast((await copyText(msgText)) ? 'Mensaje copiado' : 'No se pudo copiar');
    } else if (act === 'share') {
      await shareText(msgText);
    } else if (act === 'wa') {
      openWhatsApp(msgText);
    } else if (act === 'gm-done') {
      const log = new Set(state.settings.gmLog || []);
      log.add(today);
      state.settings.gmLog = [...log].sort().slice(-400);
      await saveSettings();
      const r = el.getBoundingClientRect();
      heartBurst(r.left + r.width / 2, r.top + r.height / 2);
      toast('¡Eres un amor!');
      renderHome(view, ctx);
    } else if (act === 'gm-undo') {
      state.settings.gmLog = (state.settings.gmLog || []).filter((d) => d !== today);
      await saveSettings();
      renderHome(view, ctx);
    }
  };
}

function swapMessage(view) {
  const q = view.querySelector('.bubble');
  q.classList.remove('pop');
  void q.offsetWidth;
  q.textContent = msgText;
  q.classList.add('pop');
}

export function highlightMessageCard() {
  const card = document.getElementById('msg-card');
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('pulse');
  setTimeout(() => card.classList.remove('pulse'), 1600);
}
