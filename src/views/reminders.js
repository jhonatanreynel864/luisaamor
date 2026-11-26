import { icons, kittySVG } from '../art.js';
import { state, saveReminders, notifId } from '../state.js';
import { esc, openSheet, confirmDialog, toast, autoGrow } from '../ui.js';
import { describeSchedule, fmtTime, todayISO, WEEKDAYS, WEEKDAYS_SHORT } from '../dates.js';
import {
  isNative,
  permissionStatus,
  requestPermission,
  openExactAlarmSettings,
  syncNotifications,
  sendTestNotification,
} from '../notify.js';

const FREQS = [
  ['once', 'Una vez'],
  ['daily', 'Diario'],
  ['weekly', 'Semanal'],
  ['monthly', 'Mensual'],
  ['yearly', 'Anual'],
];

const TEMPLATES = [
  { emoji: '💌', title: 'Escríbele algo bonito a Luisa', kind: 'sweet' },
  { emoji: '📞', title: 'Llama a Luisa', kind: 'custom' },
  { emoji: '🌹', title: 'Dale un detalle a Luisa', kind: 'custom' },
  { emoji: '🍿', title: 'Planea una cita con Luisa', kind: 'custom' },
  { emoji: '🎁', title: 'Compra el regalo de Luisa', kind: 'custom' },
];

const BUILTIN_NOTE = {
  birthday: 'Este recordatorio sale de su cumpleaños (en Ajustes ⚙️).',
  'birthday-eve': 'Este recordatorio sale de su cumpleaños (en Ajustes ⚙️).',
  anniversary: 'Este recordatorio sale de su aniversario (en Ajustes ⚙️).',
};

function itemHTML(r) {
  return `
    <div class="rem ${r.enabled ? '' : 'off'}" data-act="edit" data-id="${r.id}">
      <div class="rem-time">${fmtTime(r.time).replace(' ', '<small>')}</small></div>
      <div class="rem-info">
        <b>${esc(r.title)}</b>
        <span>${esc(describeSchedule(r))}</span>
      </div>
      <input type="checkbox" class="switch" data-act="toggle" data-id="${r.id}" ${r.enabled ? 'checked' : ''} aria-label="Activar" />
    </div>`;
}

export function renderReminders(view, ctx) {
  const morning = state.reminders.find((r) => r.builtin === 'morning');
  const others = state.reminders.filter((r) => r !== morning).sort((a, b) => a.time.localeCompare(b.time));

  view.innerHTML = `
    <header class="page-head">
      <div class="dots"></div>
      <div>
        <p class="page-kicker">Para no olvidar a</p>
        <h2 class="page-title"><span class="script">Luisa</span> ⏰</h2>
      </div>
      <div class="page-kitty">${kittySVG({ size: 84, wink: true })}</div>
    </header>
    <div class="page-body">
      <div id="perm-banner"></div>

      ${
        morning
          ? `
      <div class="sunrise ${morning.enabled ? '' : 'off'}" data-act="edit" data-id="${morning.id}">
        <div class="sun"></div>
        <div class="sunrise-text">
          <span class="sunrise-label">Buenos días para Luisa</span>
          <span class="sunrise-time">${fmtTime(morning.time)}</span>
          <span class="sunrise-desc">Todos los días te recordaré darle los buenos días ☀️</span>
        </div>
        <input type="checkbox" class="switch" data-act="toggle" data-id="${morning.id}" ${morning.enabled ? 'checked' : ''} aria-label="Activar" />
      </div>`
          : ''
      }

      <h3 class="section-label">Mis recordatorios</h3>
      <div class="rem-list">
        ${others.length ? others.map(itemHTML).join('') : '<p class="muted center">Toca el ➕ para crear uno nuevo.</p>'}
      </div>

      <button class="btn soft block" data-act="test">🔔 Probar una notificación</button>
      <p class="hint">Consejo: si en tu celular no llegan los avisos, entra a Ajustes del teléfono → Apps → Luisa → Batería y elige <b>“Sin restricciones”</b>.</p>
    </div>
    <button class="fab" data-act="new" aria-label="Nuevo recordatorio">${icons.plus}</button>
  `;

  refreshBanner(view);

  view.onchange = async (e) => {
    const el = e.target.closest('[data-act="toggle"]');
    if (!el) return;
    const r = state.reminders.find((x) => String(x.id) === el.dataset.id);
    r.enabled = el.checked;
    el.closest('.rem, .sunrise')?.classList.toggle('off', !r.enabled);
    await saveReminders();
    await syncNotifications();
    toast(r.enabled ? 'Recordatorio activado 🔔' : 'Recordatorio apagado');
  };

  view.onclick = async (e) => {
    if (e.target.closest('[data-act="toggle"]')) return;
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'new') editReminder(null, () => renderReminders(view, ctx));
    else if (act === 'edit') {
      const r = state.reminders.find((x) => String(x.id) === el.dataset.id);
      if (r) editReminder(r, () => renderReminders(view, ctx));
    } else if (act === 'perm') {
      const res = await requestPermission();
      if (res === 'granted') toast('¡Listo! Te avisaré a tiempo 💗');
      else toast('Activa las notificaciones en los ajustes del teléfono');
      refreshBanner(view);
    } else if (act === 'exact') {
      await openExactAlarmSettings();
      refreshBanner(view);
      syncNotifications();
    } else if (act === 'test') {
      if (!isNative) {
        toast('Las notificaciones funcionan en la app instalada 📱');
        return;
      }
      const st = await permissionStatus();
      if (st.display !== 'granted') {
        const res = await requestPermission();
        if (res !== 'granted') {
          toast('Primero activa las notificaciones 🔔');
          refreshBanner(view);
          return;
        }
      }
      await sendTestNotification();
      toast('En 5 segundos te llega una notificación 💌');
    }
  };
}

async function refreshBanner(view) {
  const box = view.querySelector('#perm-banner');
  if (!box) return;
  let st;
  try {
    st = await permissionStatus();
  } catch {
    return;
  }
  if (st.display === 'web') {
    box.innerHTML = `<div class="banner info">📱 Las notificaciones funcionan cuando la app está instalada en tu celular.</div>`;
  } else if (st.display !== 'granted') {
    box.innerHTML = `
      <div class="banner">
        <span>🔔 Activa las notificaciones para que te recuerde escribirle a Luisa.</span>
        <button class="btn small" data-act="perm">Activar</button>
      </div>`;
  } else if (st.exact !== 'granted') {
    box.innerHTML = `
      <div class="banner">
        <span>⏰ Permite “alarmas exactas” para que el aviso de las 6:00 llegue puntual.</span>
        <button class="btn small" data-act="exact">Permitir</button>
      </div>`;
  } else {
    box.innerHTML = '';
  }
}

function editReminder(rem, onSaved) {
  const isNew = !rem;
  const r = rem
    ? { ...rem }
    : { id: notifId(), kind: 'custom', title: '', body: '', time: '09:00', freq: 'daily', weekday: new Date().getDay() + 1, day: new Date().getDate(), date: todayISO(), enabled: true };
  r.weekday ||= new Date().getDay() + 1;
  r.day ||= new Date().getDate();
  r.date ||= todayISO();
  const lockedFreq = r.builtin && r.builtin !== 'morning';

  const sheet = openSheet({
    title: isNew ? 'Nuevo recordatorio 🔔' : 'Editar recordatorio',
    html: `
      ${
        isNew
          ? `<div class="chips scroll templates">${TEMPLATES.map(
              (t, i) => `<button type="button" class="chip" data-tpl="${i}">${t.emoji} ${t.title.replace(' a Luisa', '').replace(' de Luisa', '')}</button>`,
            ).join('')}</div>`
          : ''
      }
      ${r.builtin && BUILTIN_NOTE[r.builtin] ? `<p class="hint">${BUILTIN_NOTE[r.builtin]}</p>` : ''}
      <label class="field">
        <span>¿Qué te recuerdo?</span>
        <input name="title" maxlength="80" placeholder="Ej: Escríbele a Luisa 💌" value="${esc(r.title)}" />
      </label>
      <label class="field">
        <span>Mensaje de la notificación (opcional)</span>
        <textarea name="body" rows="2" placeholder="Si lo dejas vacío, te sugiero un mensajito bonito 💕">${esc(r.body || '')}</textarea>
      </label>
      <label class="field">
        <span>Hora</span>
        <input type="time" name="time" value="${r.time}" required />
      </label>
      ${
        lockedFreq
          ? ''
          : `
      <div class="field">
        <span>Repetir</span>
        <div class="segmented">
          ${FREQS.map(([k, l]) => `<button type="button" class="${r.freq === k ? 'on' : ''}" data-freq="${k}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="field freq-extra" data-for="once yearly">
        <span>Fecha</span>
        <input type="date" name="date" value="${r.date}" />
      </div>
      <div class="field freq-extra" data-for="weekly">
        <span>Día de la semana</span>
        <div class="weekdays">
          ${WEEKDAYS_SHORT.map((d, i) => `<button type="button" class="${r.weekday === i + 1 ? 'on' : ''}" data-wd="${i + 1}" aria-label="${WEEKDAYS[i]}">${d}</button>`).join('')}
        </div>
      </div>
      <label class="field freq-extra" data-for="monthly">
        <span>Día del mes</span>
        <select name="day">${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${r.day === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select>
      </label>`
      }
      <div class="sheet-actions">
        ${isNew || r.builtin ? '' : `<button class="btn soft danger-text" data-del>${icons.trash} Borrar</button>`}
        <button class="btn grow" data-save>Guardar 🔔</button>
      </div>`,
  });
  const b = sheet.body;
  autoGrow(b.querySelector('textarea'));

  const showExtras = () => {
    b.querySelectorAll('.freq-extra').forEach((x) => {
      x.hidden = !x.dataset.for.split(' ').includes(r.freq);
    });
  };
  showExtras();

  b.querySelectorAll('[data-freq]').forEach((btn) =>
    btn.addEventListener('click', () => {
      r.freq = btn.dataset.freq;
      b.querySelectorAll('[data-freq]').forEach((x) => x.classList.toggle('on', x === btn));
      showExtras();
    }),
  );
  b.querySelectorAll('[data-wd]').forEach((btn) =>
    btn.addEventListener('click', () => {
      r.weekday = Number(btn.dataset.wd);
      b.querySelectorAll('[data-wd]').forEach((x) => x.classList.toggle('on', x === btn));
    }),
  );
  b.querySelectorAll('[data-tpl]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const t = TEMPLATES[Number(btn.dataset.tpl)];
      b.querySelector('[name=title]').value = `${t.emoji} ${t.title}`;
      r.kind = t.kind;
      b.querySelectorAll('[data-tpl]').forEach((x) => x.classList.toggle('on', x === btn));
    }),
  );

  b.querySelector('[data-save]').addEventListener('click', async () => {
    r.title = b.querySelector('[name=title]').value.trim();
    r.body = b.querySelector('[name=body]').value.trim();
    r.time = b.querySelector('[name=time]').value || r.time;
    if (!lockedFreq) {
      r.date = b.querySelector('[name=date]').value || r.date;
      r.day = Number(b.querySelector('[name=day]').value) || r.day;
    }
    if (!r.title) {
      toast('Escribe qué te recuerdo 🐱');
      return;
    }
    if (r.freq === 'once') {
      const [h, m] = r.time.split(':').map(Number);
      const [y, mo, d] = r.date.split('-').map(Number);
      if (new Date(y, mo - 1, d, h, m) <= new Date()) {
        toast('Esa fecha y hora ya pasaron ⏳');
        return;
      }
    }
    if (isNew) state.reminders.push(r);
    else state.reminders[state.reminders.findIndex((x) => x.id === r.id)] = r;
    await saveReminders();
    sheet.close();

    const st = await permissionStatus().catch(() => ({ display: 'web' }));
    if (st.display === 'prompt' || st.display === 'prompt-with-rationale') await requestPermission();
    await syncNotifications();
    toast(isNew ? 'Recordatorio creado 🔔' : 'Recordatorio guardado 🔔');
    onSaved();
  });

  b.querySelector('[data-del]')?.addEventListener('click', async () => {
    if (!(await confirmDialog({ title: '¿Borrar este recordatorio?', ok: 'Borrar', danger: true }))) return;
    state.reminders = state.reminders.filter((x) => x.id !== r.id);
    await saveReminders();
    await syncNotifications();
    sheet.close();
    toast('Recordatorio borrado');
    onSaved();
  });
}
