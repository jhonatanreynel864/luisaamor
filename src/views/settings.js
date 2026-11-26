import { icons, iconTile, kittySVG } from '../art.js';
import { state, saveSettings } from '../state.js';
import { esc, toast, confirmDialog } from '../ui.js';
import { syncSpecialDates, permissionStatus, requestPermission, openExactAlarmSettings, isNative } from '../notify.js';
import { exportBackup, importBackup } from '../media.js';
import { addToCalendar } from '../calendar.js';

export function renderSettings(view, ctx) {
  const s = state.settings;
  view.innerHTML = `
    <header class="page-head compact">
      <button class="icon-btn glass" data-act="back" aria-label="Volver">${icons.back}</button>
      <h2 class="page-title">Ajustes</h2>
      <div>${kittySVG({ size: 58, paws: false })}</div>
    </header>
    <div class="page-body">
      <section class="card">
        <div class="settings-head">
          ${iconTile('heart', 'pink', 'md')}
          <div><h3 class="card-h">Fechas especiales</h3><p class="muted">Te aviso en su cumpleaños, un día antes y en su aniversario.</p></div>
        </div>
        <label class="field">
          <span>¿Desde cuándo están juntos?</span>
          <input type="date" name="anniversary" value="${esc(s.anniversary)}" />
        </label>
        <label class="field">
          <span>Cumpleaños de Luisa</span>
          <input type="date" name="birthday" value="${esc(s.birthday)}" />
        </label>
      </section>

      <section class="card">
        <div class="settings-head">
          ${iconTile('chat', 'mint', 'md')}
          <div><h3 class="card-h">WhatsApp de Luisa</h3><p class="muted">El botón de WhatsApp abrirá su chat con el mensaje listo.</p></div>
        </div>
        <label class="field">
          <span>Número con código de país (opcional)</span>
          <input type="tel" name="phone" inputmode="tel" placeholder="Ej: +57 300 123 4567" value="${esc(s.phone)}" />
        </label>
      </section>

      ${
        isNative
          ? ''
          : `<section class="card">
        <div class="settings-head">
          ${iconTile('calendar', 'sun', 'md')}
          <div><h3 class="card-h">Avisos en el Calendario</h3><p class="muted">En iPhone, los avisos (como el de las 6:00) suenan desde tu Calendario.</p></div>
        </div>
        <button class="btn small block" data-act="calendar">${icons.calendar} Agregar recordatorios al Calendario</button>
      </section>`
      }
      <section class="card" ${isNative ? '' : 'hidden'}>
        <div class="settings-head">
          ${iconTile('bell', 'sun', 'md')}
          <div><h3 class="card-h">Notificaciones</h3><p class="muted">Necesarias para el aviso diario de las 6:00.</p></div>
        </div>
        <div id="notif-status" class="status-list"></div>
        <div class="row-actions">
          <button class="btn small" data-act="perm">Activar</button>
          <button class="btn secondary small" data-act="exact">Alarmas exactas</button>
        </div>
        <div class="tip">
          ${icons.battery}
          <span>Si no llegan a tiempo: Ajustes del teléfono → Apps → Luisa → Batería → <b>Sin restricciones</b>.</span>
        </div>
      </section>

      <section class="card">
        <div class="settings-head">
          ${iconTile('download', 'lilac', 'md')}
          <div><h3 class="card-h">Copia de seguridad</h3><p class="muted">Guarda notas, recordatorios y fotos en un archivo (por ejemplo en Google Drive).</p></div>
        </div>
        <div class="row-actions">
          <button class="btn small" data-act="export">${icons.download} Guardar copia</button>
          <button class="btn secondary small" data-act="import">${icons.upload} Restaurar</button>
        </div>
        <input type="file" id="import-input" accept="application/json,.json,*/*" hidden />
      </section>

      <p class="footer-love">Versión 1.1 · Hecha con amor para Luisa</p>
    </div>
  `;

  const save = async () => {
    const prevDates = `${s.anniversary}|${s.birthday}`;
    s.anniversary = view.querySelector('[name=anniversary]').value;
    s.birthday = view.querySelector('[name=birthday]').value;
    s.phone = view.querySelector('[name=phone]').value.trim();
    await saveSettings();
    if (prevDates !== `${s.anniversary}|${s.birthday}`) {
      await syncSpecialDates();
      toast('Fechas guardadas');
    }
  };
  view.querySelectorAll('input[name]').forEach((inp) => inp.addEventListener('change', save));

  const statusBox = view.querySelector('#notif-status');
  const badge = (ok, yes, no) => `<span class="badge ${ok ? 'ok' : 'warn'}">${ok ? yes : no}</span>`;
  const refresh = async () => {
    const st = await permissionStatus().catch(() => ({ display: 'web' }));
    if (st.display === 'web') {
      statusBox.innerHTML = `<div class="status-item"><span>Estado</span><span class="badge neutral">Solo en la app instalada</span></div>`;
      return;
    }
    statusBox.innerHTML = `
      <div class="status-item"><span>Notificaciones</span>${badge(st.display === 'granted', 'Activadas', 'Desactivadas')}</div>
      <div class="status-item"><span>Alarmas exactas</span>${badge(st.exact === 'granted', 'Permitidas', 'No permitidas')}</div>`;
  };
  refresh();

  const importInput = view.querySelector('#import-input');
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (!file) return;
    if (
      !(await confirmDialog({
        title: '¿Restaurar esta copia?',
        text: 'Se reemplazarán las notas, recordatorios y fotos actuales.',
        ok: 'Restaurar',
        danger: true,
      }))
    )
      return;
    try {
      toast('Restaurando…');
      await importBackup(file, (n, t) => toast(`Restaurando fotos ${n}/${t}…`));
      await syncSpecialDates();
      toast('Copia restaurada');
      renderSettings(view, ctx);
    } catch (e) {
      toast(e.message || 'No se pudo restaurar');
    }
  });

  view.onclick = async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'back') ctx.back();
    else if (act === 'calendar') {
      const n = await addToCalendar(state.reminders.filter((r) => r.enabled));
      toast(n ? 'Toca “Agregar todo” en tu Calendario' : 'No hay recordatorios activos');
    }
    else if (act === 'perm') {
      if (!isNative) return toast('Disponible en la app instalada');
      await requestPermission();
      refresh();
    } else if (act === 'exact') {
      if (!isNative) return toast('Disponible en la app instalada');
      await openExactAlarmSettings();
      refresh();
    } else if (act === 'export') {
      el.disabled = true;
      try {
        toast('Preparando tu copia…');
        await exportBackup((n, t) => toast(`Guardando fotos ${n}/${t}…`));
      } catch (err) {
        if (!String(err?.message || err).toLowerCase().includes('cancel')) toast('No se pudo crear la copia');
      } finally {
        el.disabled = false;
      }
    } else if (act === 'import') {
      importInput.click();
    }
  };
}
