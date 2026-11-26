import { icons, iconTile, mascotHTML } from '../art.js';
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
  { icon: 'chat', label: 'Escribirle', title: 'Escríbele algo bonito a Luisa', kind: 'sweet' },
  { icon: 'phone', label: 'Llamarla', title: 'Llama a Luisa', kind: 'custom' },
  { icon: 'flower', label: 'Un detalle', title: 'Dale un detalle a Luisa', kind: 'custom' },
  { icon: 'calendar', label: 'Una cita', title: 'Planea una cita con Luisa', kind: 'custom' },
  { icon: 'gift', label: 'Un regalo', title: 'Compra el regalo de Luisa', kind: 'custom' },
];

const KIND_ICON = {
  morning: ['sun', 'sun'],
  sweet: ['chat', 'pink'],
  night: ['moon', 'night'],
  birthday: ['cake', 'peach'],
  'birthday-eve': ['gift', 'mint'],
  anniversary: ['heart', 'pink'],
  custom: ['bell', 'lilac'],
};

export function reminderIcon(r, size = 'md') {
  const [icon, tone] = r.icon ? [r.icon, r.tone || 'lilac'] : KIND_ICON[r.kind] || KIND_ICON.custom;
  return iconTile(icon, tone, size);
}

const BUILTIN_NOTE = {
  birthday: 'Este recordatorio viene de su cumpleaños (en Ajustes).',
  'birthday-eve': 'Este recordatorio viene de su cumpleaños (en Ajustes).',
  anniversary: 'Este recordatorio viene de su aniversario (en Ajustes).',
};

function itemHTML(r) {
  return `
    <div class="rem ${r.enabled ? '' : 'off'}" data-act="edit" data-id="${r.id}">
      ${reminderIcon(r)}
      <div class="row-main">
        <b>${esc(r.title)}</b>
        <span>${esc(describeSchedule(r))}</span>
      </div>
      <input type="checkbox" class="switch" data-act="toggle" data-id="${r.id}" ${r.enabled ? 'checked' : ''} aria-label="Activar" />
    </div>`;
}

export function renderReminders(view, ctx) {
  const morning = state.reminders.find((r) => r.builtin === 'morning');
  const others = state.reminders.filter((r) => r !== morning).sort((a, b) => a.time.localeCompare(b.time));
  const [mTime, mAmPm] = morning ? [fmtTime(morning.time).split(' ')[0], fmtTime(morning.time).split(' ').slice(1).join(' ')] : [];

  view.innerHTML = `
    <header class="page-head">
      <div>
        <p class="page-kicker">Para no olvidar a</p>
        <h2 class="page-title"><span class="script">Luisa</span></h2>
      </div>
      <div class="page-mascot">${mascotHTML({ size: 84 })}</div>
    </header>
    <div class="page-body">
      <div id="perm-banner"></div>

      ${
        morning
          ? `
      <div class="alarm ${morning.enabled ? '' : 'off'}" data-act="edit" data-id="${morning.id}">
        <div class="alarm-text">
          <span class="alarm-label">${icons.sun} Buenos días para Luisa</span>
          <span class="alarm-time">${mTime}<small>${mAmPm}</small></span>
          <span class="alarm-desc">Todos los días te recuerdo darle los buenos días</span>
        </div>
        <input type="checkbox" class="switch" data-act="toggle" data-id="${morning.id}" ${morning.enabled ? 'checked' : ''} aria-label="Activar" />
      </div>`
          : ''
      }

      <h3 class="section-label">Mis recordatorios</h3>
      ${
        others.length
          ? `<div class="card rem-card">${others.map(itemHTML).join('')}</div>`
          : '<p class="muted center">Toca el botón + para crear uno nuevo.</p>'
      }

      <button class="btn secondary block" data-act="test">${icons.bell} Probar una notificación</button>
      <div class="tip">
        ${icons.battery}
        <span>Si no te llegan los avisos: Ajustes del teléfono → Apps → Luisa → Batería → <b>Sin restricciones</b>.</span>
      </div>
    </div>
    <button class="fab" data-act="new" aria-label="Nuevo recordatorio">${icons.plus}</button>
  `;

  refreshBanner(view);

  view.onchange = async (e) => {
    const el = e.target.closest('[data-act="toggle"]');
    if (!el) return;
    const r = state.reminders.find((x) => String(x.id) === el.dataset.id);
    r.enabled = el.checked;
    el.closest('.rem, .alarm')?.classList.toggle('off', !r.enabled);
    await saveReminders();
    await syncNotifications();
    toast(r.enabled ? 'Recordatorio activado' : 'Recordatorio apagado');
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
      toast(res === 'granted' ? '¡Listo! Te avisaré a tiempo' : 'Activa las notificaciones en los ajustes del teléfono');
      refreshBanner(view);
    } else if (act === 'exact') {
      await openExactAlarmSettings();
      refreshBanner(view);
      syncNotifications();
    } else if (act === 'test') {
      if (!isNative) {
        toast('Las notificaciones funcionan en la app instalada');
        return;
      }
      const st = await permissionStatus();
      if (st.display !== 'granted') {
        const res = await requestPermission();
        if (res !== 'granted') {
          toast('Primero activa las notificaciones');
          refreshBanner(view);
          return;
        }
      }
      await sendTestNotification();
      toast('En 5 segundos te llega una notificación');
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
    box.innerHTML = `<div class="banner info">${iconTile('bell', 'gray', 'sm')}<span>Las notificaciones funcionan cuando la app está instalada en tu celular.</span></div>`;
  } else if (st.display !== 'granted') {
    box.innerHTML = `
      <div class="banner">
        ${iconTile('bell', 'sun', 'sm')}
        <span>Activa las notificaciones para que te recuerde escribirle a Luisa.</span>
        <button class="btn small" data-act="perm">Activar</button>
      </div>`;
  } else if (st.exact !== 'granted') {
    box.innerHTML = `
      <div class="banner">
        ${iconTile('clock', 'sun', 'sm')}
        <span>Permite “alarmas exactas” para que el aviso de las 6:00 llegue puntual.</span>
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
    : {
        id: notifId(),
        kind: 'custom',
        title: '',
        body: '',
        time: '09:00',
        freq: 'daily',
        weekday: new Date().getDay() + 1,
        day: new Date().getDate(),
        date: todayISO(),
        enabled: true,
      };
  r.weekday ||= new Date().getDay() + 1;
  r.day ||= new Date().getDate();
  r.date ||= todayISO();
  const lockedFreq = r.builtin && r.builtin !== 'morning';

  const sheet = openSheet({
    title: isNew ? 'Nuevo recordatorio' : 'Editar recordatorio',
    html: `
      ${
        isNew
          ? `<div class="chips scroll templates">${TEMPLATES.map(
              (t, i) => `<button type="button" class="chip" data-tpl="${i}">${icons[t.icon]}${t.label}</button>`,
            ).join('')}</div>`
          : ''
      }
      ${r.builtin && BUILTIN_NOTE[r.builtin] ? `<p class="hint" style="margin:0 0 14px">${BUILTIN_NOTE[r.builtin]}</p>` : ''}
      <label class="field">
        <span>¿Qué te recuerdo?</span>
        <input name="title" maxlength="80" placeholder="Ej: Escríbele a Luisa" value="${esc(r.title)}" />
      </label>
      <label class="field">
        <span>Mensaje de la notificación (opcional)</span>
        <textarea name="body" rows="2" placeholder="Si lo dejas vacío, te sugiero un mensaje bonito">${esc(r.body || '')}</textarea>
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
        <div class="seg">
          ${FREQS.map(([k, l]) => `<button type="button" class="${r.freq === k ? 'on' : ''}" data-freq="${k}">${l}</button>`).join('')}
        </div>
      </div>
      <label class="field freq-extra" data-for="once yearly">
        <span>Fecha</span>
        <input type="date" name="date" value="${r.date}" />
      </label>
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
        ${isNew || r.builtin ? '' : `<button class="btn danger-soft" data-del aria-label="Borrar">${icons.trash}</button>`}
        <button class="btn grow" data-save>Guardar</button>
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
      b.querySelector('[name=title]').value = t.title;
      r.kind = t.kind;
      r.icon = t.icon;
      r.tone = t.kind === 'sweet' ? 'pink' : 'lilac';
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
      toast('Escribe qué te recuerdo');
      return;
    }
    if (r.freq === 'once') {
      const [h, m] = r.time.split(':').map(Number);
      const [y, mo, d] = r.date.split('-').map(Number);
      if (new Date(y, mo - 1, d, h, m) <= new Date()) {
        toast('Esa fecha y hora ya pasaron');
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
    toast(isNew ? 'Recordatorio creado' : 'Recordatorio guardado');
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
