import { icons, iconTile, heartSVG, sparkleSVG } from './art.js';

export function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Pila de ventanas abiertas (para el botón "atrás" de Android).
const stack = [];

export function closeTopOverlay() {
  const top = stack[stack.length - 1];
  if (top) {
    top.close();
    return true;
  }
  return false;
}

function root() {
  let r = document.getElementById('overlay-root');
  if (!r) {
    r = document.createElement('div');
    r.id = 'overlay-root';
    document.body.appendChild(r);
  }
  return r;
}

/**
 * Ventana que sube desde abajo.
 * @returns {{ el: HTMLElement, body: HTMLElement, close: () => void }}
 */
export function openSheet({ title = '', html = '', onClose, cls = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `
    <div class="sheet-backdrop"></div>
    <section class="sheet ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-handle"></div>
      <header class="sheet-head">
        <h3>${title}</h3>
        <button class="icon-btn plain" data-close aria-label="Cerrar">${icons.close}</button>
      </header>
      <div class="sheet-body">${html}</div>
    </section>`;
  root().appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));

  let closed = false;
  const entry = {
    close() {
      if (closed) return;
      closed = true;
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      wrap.classList.remove('open');
      wrap.classList.add('closing');
      setTimeout(() => wrap.remove(), 260);
      onClose?.();
    },
  };
  stack.push(entry);
  wrap.querySelector('.sheet-backdrop').addEventListener('click', entry.close);
  wrap.querySelector('[data-close]').addEventListener('click', entry.close);
  return { el: wrap, body: wrap.querySelector('.sheet-body'), close: entry.close };
}

/** Pantalla completa (visor de fotos). */
export function openOverlay({ html = '', cls = '', onClose } = {}) {
  const wrap = document.createElement('div');
  wrap.className = `overlay ${cls}`;
  wrap.innerHTML = html;
  root().appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  let closed = false;
  const entry = {
    close() {
      if (closed) return;
      closed = true;
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      wrap.classList.remove('open');
      setTimeout(() => wrap.remove(), 250);
      onClose?.();
    },
  };
  stack.push(entry);
  return { el: wrap, close: entry.close };
}

export function confirmDialog({ title = '¿Seguro?', text = '', ok = 'Sí', cancel = 'Cancelar', danger = false } = {}) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'dialog-wrap';
    wrap.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog" role="alertdialog" aria-modal="true">
        ${danger ? iconTile('trash', 'pink', 'lg') : iconTile('heart', 'pink', 'lg')}
        <h3>${esc(title)}</h3>
        ${text ? `<p>${esc(text)}</p>` : ''}
        <div class="dialog-actions">
          <button class="btn secondary" data-no>${esc(cancel)}</button>
          <button class="btn ${danger ? 'danger' : ''}" data-yes>${esc(ok)}</button>
        </div>
      </div>`;
    root().appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('open'));
    let done = false;
    const entry = {
      close(v = false) {
        if (done) return;
        done = true;
        const i = stack.indexOf(entry);
        if (i >= 0) stack.splice(i, 1);
        wrap.classList.remove('open');
        setTimeout(() => wrap.remove(), 200);
        resolve(v);
      },
    };
    stack.push(entry);
    wrap.querySelector('[data-no]').onclick = () => entry.close(false);
    wrap.querySelector('.dialog-backdrop').onclick = () => entry.close(false);
    wrap.querySelector('[data-yes]').onclick = () => entry.close(true);
  });
}

let toastTimer;
export function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/** Lluvia de corazoncitos para celebrar. */
export function heartBurst(x = window.innerWidth / 2, y = window.innerHeight / 2) {
  const colors = ['#F0508E', '#FF8FBB', '#A07CF0', '#FFC2DA'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.className = 'burst';
    s.innerHTML = i % 3 === 0 ? sparkleSVG({ size: 16, color: '#FFC94D' }) : heartSVG({ size: 16 + (i % 3) * 3, color: colors[i % colors.length] });
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const dist = 70 + Math.random() * 70;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    s.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
}

export function autoGrow(textarea) {
  const fit = () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight + 2, window.innerHeight * 0.45)}px`;
  };
  textarea.addEventListener('input', fit);
  requestAnimationFrame(fit);
}
