import { icons, kittySVG } from '../art.js';
import { state, saveSettings } from '../state.js';
import { esc, toast, confirmDialog } from '../ui.js';
import { syncSpecialDates, permissionStatus, requestPermission, openExactAlarmSettings, isNative } from '../notify.js';
import { exportBackup, importBackup } from '../media.js';

export function renderSettings(view, ctx) {
  const s = state.settings;
  view.innerHTML = `
    <header class="page-head compact">
      <div class="dots"></div>
      <button class="round-btn glass" data-act="back" aria-label="Volver">${icons.back}</button>
      <h2 class="page-title small">Ajustes ⚙️</h2>
      <div class="page-kitty">${kittySVG({ size: 64 })}</div>
    </header>
    <div class="page-body">
      <section class="card">
        <h3 class="card-h">💞 Fechas especiales</h3>
        <label class="field">
          <span>¿Desde cuándo están juntos?</span>
          <input type="date" name="anniversary" value="${esc(s.anniversary)}" />
        </label>
        <label class="field">
          <span>🎂 Cumpleaños de Luisa</span>
          <input type="date" name="birthday" value="${esc(s.birthday)}" />
        </label>
        <p class="hint">Te avisaré el día de su cumpleaños, un día antes (para el regalo 🎁) y en cada aniversario.</p>
      </section>

      <section class="card">
        <h3 class="card-h">💬 WhatsApp de Luisa</h3>
        <label class="field">
          <span>Número con código de país (opcional)</span>
          <input type="tel" name="phone" inputmode="tel" placeholder="Ej: +57 300 123 4567" value="${esc(s.phone)}" />
        </label>
        <p class="hint">Así el botón de WhatsApp abre directo su chat con el mensajito listo.</p>
      </section>

      <section class="card">
        <h3 class="card-h">🔔 Notificaciones</h3>
        <div id="notif-status" class="status-line">Revisando…</div>
        <div class="row-actions">
          <button class="btn small" data-act="perm">Activar notificaciones</button>
          <button class="btn soft small" data-act="exact">Alarmas exactas</button>
        </div>
        <p class="hint">Si no te llegan los avisos de las 6:00: Ajustes del teléfono → Apps → Luisa → Batería → <b>Sin restricciones</b>.</p>
      </section>

      <section class="card">
        <h3 class="card-h">💾 Copia de seguridad</h3>
        <p class="hint">Guarda tus notas, recordatorios y fotos en un archivo (por ejemplo en Google Drive) para no perderlos si cambias de celular.</p>
        <div class="row-actions">
          <button class="btn small" data-act="export">Guardar copia</button>
          <button class="btn soft small" data-act="import">Restaurar copia</button>
        </div>
        <input type="file" id="import-input" accept="application/json,.json,*/*" hidden />
      </section>

      <p class="footer-love">Versión 1.0 · Hecha con amor para Luisa 💗</p>
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
      toast('Fechas guardadas 💞');
    }
  };
  view.querySelectorAll('input[name]').forEach((inp) => inp.addEventListener('change', save));

  const statusBox = view.querySelector('#notif-status');
  const refresh = async () => {
    const st = await permissionStatus().catch(() => ({ display: 'web' }));
    if (st.display === 'web') statusBox.innerHTML = '📱 Disponible en la app instalada en el celular.';
    else
      statusBox.innerHTML = `
        <span>${st.display === 'granted' ? '✅' : '⚠️'} Notificaciones: <b>${st.display === 'granted' ? 'activadas' : 'desactivadas'}</b></span>
        <span>${st.exact === 'granted' ? '✅' : '⚠️'} Alarmas exactas: <b>${st.exact === 'granted' ? 'permitidas' : 'no permitidas'}</b></span>`;
  };
  refresh();

  const importInput = view.querySelector('#import-input');
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (!file) return;
    if (!(await confirmDialog({ title: '¿Restaurar esta copia?', text: 'Se reemplazarán las notas, recordatorios y fotos actuales.', ok: 'Restaurar', danger: true })))
      return;
    try {
      toast('Restaurando… 💗');
      await importBackup(file, (n, t) => toast(`Restaurando fotos ${n}/${t}…`));
      await syncSpecialDates();
      toast('¡Copia restaurada! 💕');
      renderSettings(view, ctx);
    } catch (e) {
      toast(e.message || 'No se pudo restaurar 😿');
    }
  });

  view.onclick = async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'back') ctx.back();
    else if (act === 'perm') {
      if (!isNative) return toast('Disponible en la app instalada 📱');
      await requestPermission();
      refresh();
    } else if (act === 'exact') {
      if (!isNative) return toast('Disponible en la app instalada 📱');
      await openExactAlarmSettings();
      refresh();
    } else if (act === 'export') {
      el.disabled = true;
      try {
        toast('Preparando tu copia… 💾');
        await exportBackup((n, t) => toast(`Guardando fotos ${n}/${t}…`));
      } catch (err) {
        if (!String(err?.message || err).toLowerCase().includes('cancel')) toast('No se pudo crear la copia 😿');
      } finally {
        el.disabled = false;
      }
    } else if (act === 'import') {
      importInput.click();
    }
  };
}
