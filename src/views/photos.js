import { icons, iconTile, kittySVG, mascotHTML } from '../art.js';
import { state, putPhoto, deletePhoto, getAllPhotos, uid } from '../state.js';
import { esc, openSheet, openOverlay, confirmDialog, toast, heartBurst } from '../ui.js';
import { processPhoto, photoURL, forgetPhotoURLs, sharePhoto } from '../media.js';
import { fmtDate, todayISO, toISODate } from '../dates.js';

function gridHTML() {
  if (!state.photos.length) {
    return `
      <div class="empty">
        ${kittySVG({ size: 104, wink: true, paws: false })}
        <b>Sus momentos más lindos</b>
        Toca el botón + para guardar la primera foto.
      </div>`;
  }
  return `<div class="photo-grid">${state.photos
    .map(
      (p, i) => `
      <button class="photo" data-act="view" data-i="${i}">
        <img src="${photoURL(p)}" alt="${esc(p.caption || 'Foto')}" loading="lazy" ${p.w && p.h ? `style="aspect-ratio:${p.w}/${p.h}"` : ''} />
        <span class="photo-info">
          ${p.caption ? `<b>${esc(p.caption)}</b>` : ''}
          <span>${p.date ? fmtDate(p.date) : ''}</span>
        </span>
      </button>`,
    )
    .join('')}</div>`;
}

export function renderPhotos(view, ctx) {
  view.innerHTML = `
    <header class="page-head">
      <div>
        <p class="page-kicker">Momentos lindos con</p>
        <h2 class="page-title"><span class="script">Luisa</span></h2>
      </div>
      <div class="page-mascot">${mascotHTML({ size: 84 })}</div>
    </header>
    <div class="page-body">
      ${state.photos.length ? `<div class="photos-meta"><span>${state.photos.length} ${state.photos.length === 1 ? 'recuerdo' : 'recuerdos'}</span></div>` : ''}
      <div id="grid">${gridHTML()}</div>
    </div>
    <button class="fab" data-act="add" aria-label="Agregar foto">${icons.plus}</button>
    <input type="file" accept="image/*" capture="environment" id="cam-input" hidden />
    <input type="file" accept="image/*" multiple id="gal-input" hidden />
  `;

  const rerender = () => renderPhotos(view, ctx);
  const cam = view.querySelector('#cam-input');
  const gal = view.querySelector('#gal-input');
  const onFiles = async (input) => {
    const files = [...(input.files || [])];
    input.value = '';
    if (!files.length) return;
    if (files.length === 1) return captionNewPhoto(files[0], rerender);
    toast(`Guardando ${files.length} fotos…`);
    let ok = 0;
    for (const f of files) {
      try {
        const pr = await processPhoto(f);
        await putPhoto({
          id: uid(),
          caption: '',
          date: toISODate(new Date(f.lastModified || Date.now())),
          created: Date.now(),
          ...pr,
        });
        ok++;
      } catch (e) {
        console.warn(e);
      }
    }
    state.photos = await getAllPhotos();
    toast(`${ok} fotos guardadas`);
    rerender();
  };
  cam.addEventListener('change', () => onFiles(cam));
  gal.addEventListener('change', () => onFiles(gal));

  view.onclick = (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'add') {
      const s = openSheet({
        title: 'Agregar un recuerdo',
        html: `
          <div class="pick-grid">
            <button class="pick" data-pick="cam">${iconTile('camera', 'pink', 'lg')}Tomar foto</button>
            <button class="pick" data-pick="gal">${iconTile('image', 'lilac', 'lg')}Galería</button>
          </div>`,
      });
      s.body.querySelector('[data-pick=cam]').onclick = () => {
        s.close();
        cam.click();
      };
      s.body.querySelector('[data-pick=gal]').onclick = () => {
        s.close();
        gal.click();
      };
    } else if (el.dataset.act === 'view') {
      openViewer(Number(el.dataset.i), rerender);
    }
  };
}

async function captionNewPhoto(file, onSaved) {
  let processed;
  try {
    processed = await processPhoto(file);
  } catch {
    toast('No se pudo abrir esa imagen');
    return;
  }
  const preview = URL.createObjectURL(processed.thumb);
  const sheet = openSheet({
    title: 'Nuevo recuerdo',
    onClose: () => setTimeout(() => URL.revokeObjectURL(preview), 400),
    html: `
      <div class="preview-photo"><img src="${preview}" alt="" /></div>
      <label class="field">
        <span>¿Qué momento fue?</span>
        <input name="caption" maxlength="90" placeholder="Ej: Nuestra primera cita" />
      </label>
      <label class="field">
        <span>Fecha</span>
        <input type="date" name="date" value="${toISODate(new Date(file.lastModified || Date.now()))}" max="${todayISO()}" />
      </label>
      <div class="sheet-actions"><button class="btn grow" data-save>Guardar recuerdo</button></div>`,
  });
  sheet.body.querySelector('[data-save]').addEventListener('click', async (e) => {
    const photo = {
      id: uid(),
      caption: sheet.body.querySelector('[name=caption]').value.trim(),
      date: sheet.body.querySelector('[name=date]').value || todayISO(),
      created: Date.now(),
      ...processed,
    };
    try {
      await putPhoto(photo);
    } catch {
      toast('No hay espacio para guardar la foto');
      return;
    }
    state.photos = await getAllPhotos();
    const r = e.target.getBoundingClientRect();
    heartBurst(r.left + r.width / 2, r.top);
    sheet.close();
    toast('Recuerdo guardado');
    onSaved();
  });
}

function openViewer(index, onChange) {
  let i = index;
  const ov = openOverlay({
    cls: 'viewer',
    html: `
      <div class="viewer-top">
        <button class="icon-btn glass" data-v="close" aria-label="Cerrar">${icons.close}</button>
        <span class="viewer-count"></span>
        <span style="width:44px"></span>
      </div>
      <div class="viewer-stage">
        <button class="viewer-nav prev" data-v="prev" aria-label="Anterior">${icons.chevronL}</button>
        <img class="viewer-img" alt="" />
        <button class="viewer-nav next" data-v="next" aria-label="Siguiente">${icons.chevronR}</button>
      </div>
      <div class="viewer-card">
        <b class="viewer-cap"></b>
        <span class="viewer-date"></span>
        <div class="viewer-actions">
          <button class="btn secondary small" data-v="share">${icons.share} Compartir</button>
          <button class="btn secondary small" data-v="edit">${icons.edit} Editar</button>
          <button class="btn danger-soft small" data-v="del">${icons.trash} Borrar</button>
        </div>
      </div>`,
  });
  const el = ov.el;
  const show = () => {
    const p = state.photos[i];
    if (!p) return ov.close();
    el.querySelector('.viewer-img').src = photoURL(p, 'full');
    el.querySelector('.viewer-cap').textContent = p.caption || 'Nuestro momento';
    el.querySelector('.viewer-date').textContent = p.date ? fmtDate(p.date) : '';
    el.querySelector('.viewer-count').textContent = `${i + 1} / ${state.photos.length}`;
    el.querySelector('.prev').style.visibility = i > 0 ? 'visible' : 'hidden';
    el.querySelector('.next').style.visibility = i < state.photos.length - 1 ? 'visible' : 'hidden';
  };
  show();

  let sx = null;
  const stage = el.querySelector('.viewer-stage');
  stage.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    sx = null;
    if (dx < -50 && i < state.photos.length - 1) (i++, show());
    else if (dx > 50 && i > 0) (i--, show());
  });

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    const v = b.dataset.v;
    const p = state.photos[i];
    if (v === 'close') ov.close();
    else if (v === 'prev' && i > 0) (i--, show());
    else if (v === 'next' && i < state.photos.length - 1) (i++, show());
    else if (v === 'share') {
      try {
        await sharePhoto(p);
      } catch (err) {
        if (!String(err?.message || err).toLowerCase().includes('cancel')) toast('No se pudo compartir');
      }
    } else if (v === 'edit') {
      const s = openSheet({
        title: 'Editar recuerdo',
        html: `
          <label class="field"><span>Descripción</span><input name="caption" maxlength="90" value="${esc(p.caption || '')}" /></label>
          <label class="field"><span>Fecha</span><input type="date" name="date" value="${p.date || todayISO()}" /></label>
          <div class="sheet-actions"><button class="btn grow" data-save>Guardar</button></div>`,
      });
      s.body.querySelector('[data-save]').onclick = async () => {
        p.caption = s.body.querySelector('[name=caption]').value.trim();
        p.date = s.body.querySelector('[name=date]').value || p.date;
        await putPhoto(p);
        state.photos = await getAllPhotos();
        i = Math.max(0, state.photos.findIndex((x) => x.id === p.id));
        s.close();
        show();
        onChange();
        toast('Recuerdo actualizado');
      };
    } else if (v === 'del') {
      if (!(await confirmDialog({ title: '¿Borrar esta foto?', text: 'Se borrará de la app para siempre.', ok: 'Borrar', danger: true }))) return;
      await deletePhoto(p.id);
      forgetPhotoURLs(p.id);
      state.photos = await getAllPhotos();
      onChange();
      if (!state.photos.length) return ov.close();
      i = Math.min(i, state.photos.length - 1);
      show();
      toast('Foto borrada');
    }
  });
}
