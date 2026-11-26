import { icons, iconTile, kittySVG, mascotHTML } from '../art.js';
import { state, saveNotes, uid } from '../state.js';
import { esc, openSheet, confirmDialog, toast, autoGrow } from '../ui.js';
import { fmtShort } from '../dates.js';

export const CATS = {
  datos: { icon: 'star', tone: 'sun', label: 'Datos importantes' },
  gustos: { icon: 'heart', tone: 'pink', label: 'Le encanta' },
  nogusta: { icon: 'ban', tone: 'night', label: 'No le gusta' },
  regalos: { icon: 'gift', tone: 'mint', label: 'Ideas de regalo' },
  planes: { icon: 'calendar', tone: 'sky', label: 'Planes juntos' },
  recuerdos: { icon: 'flower', tone: 'lilac', label: 'Recuerdos' },
  otros: { icon: 'note', tone: 'gray', label: 'Otros' },
};

let filter = 'all';
let query = '';

function matches(n) {
  if (filter !== 'all' && n.cat !== filter) return false;
  if (!query) return true;
  const q = query.toLowerCase();
  return (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q);
}

function sorted() {
  return [...state.notes].filter(matches).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updated - a.updated);
}

function listHTML() {
  const notes = sorted();
  if (!notes.length) {
    return `
      <div class="empty">
        ${kittySVG({ size: 104, paws: false })}
        <b>${state.notes.length ? 'Nada por aquí' : 'Aún no hay notas'}</b>
        Toca el botón + para escribir algo sobre Luisa.
      </div>`;
  }
  return `<div class="notes-grid">${notes
    .map((n) => {
      const c = CATS[n.cat] || CATS.otros;
      return `
      <button class="note cat-${n.cat}" data-act="open" data-id="${n.id}">
        <span class="note-top">
          <span class="note-cat"><span class="dot"></span>${c.label}</span>
          ${n.pinned ? `<span class="pin" aria-label="Fijada">${icons.pin}</span>` : ''}
        </span>
        <b class="note-title">${esc(n.title || 'Sin título')}</b>
        ${n.body ? `<span class="note-body">${esc(n.body)}</span>` : ''}
        <span class="note-date">${fmtShort(new Date(n.updated))}</span>
      </button>`;
    })
    .join('')}</div>`;
}

export function renderNotes(view, ctx, opts = {}) {
  view.innerHTML = `
    <header class="page-head">
      <div>
        <p class="page-kicker">Todo sobre</p>
        <h2 class="page-title"><span class="script">Luisa</span></h2>
      </div>
      <div class="page-mascot">${mascotHTML({ size: 84, wink: false })}</div>
    </header>
    <div class="page-body">
      <label class="search">
        ${icons.search}
        <input type="search" placeholder="Buscar en mis notas" value="${esc(query)}" />
      </label>
      <div class="chips scroll">
        <button class="chip ${filter === 'all' ? 'on' : ''}" data-act="filter" data-cat="all">Todas</button>
        ${Object.entries(CATS)
          .map(
            ([k, c]) =>
              `<button class="chip cat-${k} ${filter === k ? 'on' : ''}" data-act="filter" data-cat="${k}"><span class="dot"></span>${c.label}</button>`,
          )
          .join('')}
      </div>
      <div id="notes-list">${listHTML()}</div>
    </div>
    <button class="fab" data-act="new" aria-label="Nueva nota">${icons.plus}</button>
  `;

  const input = view.querySelector('.search input');
  input.addEventListener('input', () => {
    query = input.value.trim();
    view.querySelector('#notes-list').innerHTML = listHTML();
  });

  view.onclick = (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'filter') {
      filter = el.dataset.cat;
      view.querySelectorAll('[data-act="filter"]').forEach((c) => c.classList.toggle('on', c === el));
      view.querySelector('#notes-list').innerHTML = listHTML();
    } else if (act === 'new') {
      editNote(null, () => renderNotes(view, ctx));
    } else if (act === 'open') {
      editNote(state.notes.find((n) => n.id === el.dataset.id), () => renderNotes(view, ctx));
    }
  };

  if (opts.openNote) {
    const n = state.notes.find((x) => x.id === opts.openNote);
    if (n) editNote(n, () => renderNotes(view, ctx));
  }
}

function editNote(note, onSaved) {
  const isNew = !note;
  const n = note ? { ...note } : { id: uid(), title: '', body: '', cat: filter !== 'all' ? filter : 'gustos', pinned: false };
  const sheet = openSheet({
    title: isNew ? 'Nueva nota' : 'Editar nota',
    html: `
      <label class="field">
        <span>Título</span>
        <input name="title" maxlength="80" placeholder="Ej: Su comida favorita" value="${esc(n.title)}" />
      </label>
      <label class="field">
        <span>Nota</span>
        <textarea name="body" rows="4" placeholder="Escribe aquí lo que quieras recordar">${esc(n.body)}</textarea>
      </label>
      <div class="field">
        <span>Categoría</span>
        <div class="chips">
          ${Object.entries(CATS)
            .map(
              ([k, c]) =>
                `<button type="button" class="chip cat-${k} ${n.cat === k ? 'on' : ''}" data-cat="${k}"><span class="dot"></span>${c.label}</button>`,
            )
            .join('')}
        </div>
      </div>
      <label class="toggle-row">
        <span>${icons.pin} Fijar en Inicio</span>
        <input type="checkbox" class="switch" name="pinned" ${n.pinned ? 'checked' : ''} />
      </label>
      <div class="sheet-actions">
        ${isNew ? '' : `<button class="btn danger-soft" data-del aria-label="Borrar">${icons.trash}</button>`}
        <button class="btn grow" data-save>Guardar</button>
      </div>`,
  });
  const b = sheet.body;
  autoGrow(b.querySelector('textarea'));
  if (isNew) setTimeout(() => b.querySelector('input[name=title]').focus(), 300);

  b.querySelectorAll('[data-cat]').forEach((chip) =>
    chip.addEventListener('click', () => {
      n.cat = chip.dataset.cat;
      b.querySelectorAll('[data-cat]').forEach((c) => c.classList.toggle('on', c === chip));
    }),
  );

  b.querySelector('[data-save]').addEventListener('click', async () => {
    n.title = b.querySelector('[name=title]').value.trim();
    n.body = b.querySelector('[name=body]').value.trim();
    n.pinned = b.querySelector('[name=pinned]').checked;
    if (!n.title && !n.body) {
      toast('Escribe algo primero');
      return;
    }
    n.updated = Date.now();
    if (isNew) {
      n.created = n.updated;
      state.notes.push(n);
    } else {
      const i = state.notes.findIndex((x) => x.id === n.id);
      state.notes[i] = n;
    }
    await saveNotes();
    sheet.close();
    toast(isNew ? 'Nota guardada' : 'Nota actualizada');
    onSaved();
  });

  b.querySelector('[data-del]')?.addEventListener('click', async () => {
    if (!(await confirmDialog({ title: '¿Borrar esta nota?', text: 'No se podrá recuperar.', ok: 'Borrar', danger: true }))) return;
    state.notes = state.notes.filter((x) => x.id !== n.id);
    await saveNotes();
    sheet.close();
    toast('Nota borrada');
    onSaved();
  });
}
