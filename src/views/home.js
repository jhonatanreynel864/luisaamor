import { kittySVG, icons, bowSVG } from '../art.js';
import { state, saveSettings } from '../state.js';
import { pickMessage, KIND_LABEL } from '../messages.js';
import { todayISO, daysBetween, parseISODate, toISODate, nextOccurrence, relativeWhen, partOfDay } from '../dates.js';
import { esc, toast, heartBurst } from '../ui.js';
import { copyText, openWhatsApp, shareText, photoURL } from '../media.js';
import { CATS } from './notes.js';

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
  if (p === 'morning') return 'Buenos días ☀️';
  if (p === 'afternoon') return 'Buenas tardes 🌷';
  return 'Buenas noches 🌙';
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

function togetherText() {
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

export function renderHome(view, ctx) {
  if (!msgKind) {
    msgKind = defaultKind();
    msgText = pickMessage(msgKind);
  }
  const today = todayISO();
  const doneToday = (state.settings.gmLog || []).includes(today);
  const s = streak();
  const t = togetherText();

  const upcoming = state.reminders
    .filter((r) => r.enabled)
    .map((r) => ({ r, at: nextOccurrence(r) }))
    .filter((x) => x.at)
    .sort((a, b) => a.at - b.at)
    .slice(0, 3);

  const pinned = state.notes.filter((n) => n.pinned || n.cat === 'datos').slice(0, 3);
  let photo = state.photos.find((p) => p.id === memoryId);
  if (!photo && state.photos.length) {
    photo = state.photos[Math.floor(Math.random() * state.photos.length)];
    memoryId = photo.id;
  }

  view.innerHTML = `
    <section class="hero">
      <div class="dots"></div>
      <div class="hero-top">
        <span class="hero-hello">${greeting()}</span>
        <button class="round-btn glass" data-act="settings" aria-label="Ajustes">${icons.gear}</button>
      </div>
      <div class="hero-kitty">${kittySVG({ size: 140, wink: true })}</div>
      <h1 class="luisa"><span class="luisa-word"><span class="luisa-bow">${bowSVG({ size: 46 })}</span>Luisa</span></h1>
      <p class="hero-sub">el amor de mi vida</p>
      ${
        t
          ? `<button class="together" data-act="settings"><b>${t.days.toLocaleString('es')}</b> días juntos 💞${t.extra ? `<small>${t.extra}</small>` : ''}</button>`
          : `<button class="together empty" data-act="settings">💞 Agrega la fecha en que empezaron</button>`
      }
      <span class="fh fh1">💗</span><span class="fh fh2">💕</span><span class="fh fh3">✨</span><span class="fh fh4">🌸</span><span class="fh fh5">💖</span>
    </section>

    <section class="card gm-card ${doneToday ? 'done' : ''}">
      <div class="gm-row">
        <div class="gm-icon">${doneToday ? '💖' : '☀️'}</div>
        <div class="gm-text">
          <h3>${doneToday ? '¡Ya le diste los buenos días!' : '¿Ya le diste los buenos días a Luisa?'}</h3>
          <p>${s > 1 ? `🔥 Racha de <b>${s}</b> días seguidos` : s === 1 ? '🔥 ¡Primer día de tu racha!' : 'Empieza tu racha de buenos días 🔥'}</p>
        </div>
      </div>
      ${
        doneToday
          ? `<button class="btn soft small" data-act="gm-undo">Deshacer</button>`
          : `<button class="btn block" data-act="gm-done">¡Sí, ya le escribí! 💌</button>`
      }
    </section>

    <section class="card msg-card" id="msg-card">
      <div class="card-title"><h3>💌 Mensajito para Luisa</h3></div>
      <div class="chips" role="tablist">
        ${['morning', 'sweet', 'night']
          .map((k) => `<button class="chip ${k === msgKind ? 'on' : ''}" data-act="kind" data-kind="${k}">${KIND_LABEL[k]}</button>`)
          .join('')}
      </div>
      <blockquote class="msg-text">${esc(msgText)}</blockquote>
      <div class="msg-actions">
        <button class="btn wa" data-act="wa">${icons.whatsapp} WhatsApp</button>
        <button class="round-btn" data-act="copy" aria-label="Copiar">${icons.copy}</button>
        <button class="round-btn" data-act="share" aria-label="Compartir">${icons.share}</button>
        <button class="round-btn" data-act="another" aria-label="Otro mensaje">${icons.refresh}</button>
      </div>
    </section>

    <section class="card">
      <div class="card-title"><h3>⏰ Próximos recordatorios</h3><button class="link" data-act="go" data-tab="reminders">Ver todos</button></div>
      ${
        upcoming.length
          ? `<ul class="next-list">${upcoming
              .map(
                ({ r, at }) => `
            <li>
              <span class="next-when">${relativeWhen(at)}</span>
              <span class="next-title">${esc(r.title)}</span>
            </li>`,
              )
              .join('')}</ul>`
          : `<p class="muted">No hay recordatorios activos.</p>`
      }
    </section>

    <section class="card">
      <div class="card-title"><h3>⭐ Lo que no debo olvidar</h3><button class="link" data-act="go" data-tab="notes">Mis notas</button></div>
      ${
        pinned.length
          ? `<div class="mini-notes">${pinned
              .map(
                (n) => `
            <button class="mini-note cat-${n.cat}" data-act="open-note" data-id="${n.id}">
              <span class="mini-note-cat">${CATS[n.cat]?.emoji || '📝'}</span>
              <b>${esc(n.title || 'Sin título')}</b>
              <span>${esc((n.body || '').slice(0, 90))}</span>
            </button>`,
              )
              .join('')}</div>`
          : `<p class="muted">Fija notas importantes con 📌 y aparecerán aquí.</p>`
      }
    </section>

    <section class="card memory">
      <div class="card-title"><h3>📸 Un recuerdo bonito</h3><button class="link" data-act="go" data-tab="photos">Ver fotos</button></div>
      ${
        photo
          ? `<button class="polaroid big" data-act="go" data-tab="photos">
               <img src="${photoURL(photo)}" alt="">
               <span>${esc(photo.caption || 'Nuestro momento 💕')}</span>
             </button>`
          : `<button class="empty-photo" data-act="go" data-tab="photos">
               <span>📷</span>Guarda tu primera foto con Luisa
             </button>`
      }
    </section>

    <p class="footer-love">Hecho con mucho amor para Luisa ${'💗'}</p>
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
      renderHome(view, ctx);
    } else if (act === 'another') {
      msgText = pickMessage(msgKind, msgText);
      const q = view.querySelector('.msg-text');
      q.classList.remove('pop');
      void q.offsetWidth;
      q.textContent = msgText;
      q.classList.add('pop');
    } else if (act === 'copy') {
      (await copyText(msgText)) ? toast('Mensaje copiado 💗') : toast('No se pudo copiar');
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
      toast('¡Eres un amor! 💖');
      renderHome(view, ctx);
    } else if (act === 'gm-undo') {
      state.settings.gmLog = (state.settings.gmLog || []).filter((d) => d !== today);
      await saveSettings();
      renderHome(view, ctx);
    }
  };
}

export function highlightMessageCard() {
  const card = document.getElementById('msg-card');
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('pulse');
  setTimeout(() => card.classList.remove('pulse'), 1600);
}
