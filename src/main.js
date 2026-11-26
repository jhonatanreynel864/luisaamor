import '@fontsource/pacifico/400.css';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './style.css';

import { App } from '@capacitor/app';
import { icons, kittySVG } from './art.js';
import { state, loadState, saveSettings } from './state.js';
import { closeTopOverlay, openSheet, toast } from './ui.js';
import { isNative, syncNotifications, onNotificationTap, requestPermission } from './notify.js';
import { renderHome, setMessageKind, highlightMessageCard } from './views/home.js';
import { renderNotes } from './views/notes.js';
import { renderReminders } from './views/reminders.js';
import { renderPhotos } from './views/photos.js';
import { renderSettings } from './views/settings.js';

const TABS = [
  { id: 'home', label: 'Inicio', icon: icons.home, render: renderHome },
  { id: 'notes', label: 'Notas', icon: icons.notes, render: renderNotes },
  { id: 'reminders', label: 'Recordatorios', icon: icons.bell, render: renderReminders },
  { id: 'photos', label: 'Fotos', icon: icons.camera, render: renderPhotos },
];
const PAGES = { settings: renderSettings };

let current = 'home';
let previous = 'home';

const app = document.getElementById('app');
app.innerHTML = `
  <main id="view" class="view"></main>
  <nav class="tabbar" aria-label="Secciones">
    ${TABS.map(
      (t) => `<button class="tab" data-tab="${t.id}" aria-label="${t.label}">${t.icon}<span>${t.label}</span></button>`,
    ).join('')}
  </nav>`;
const view = document.getElementById('view');
const tabbar = app.querySelector('.tabbar');

const ctx = {
  go(tab, opts = {}) {
    if (tab !== current) previous = current;
    current = tab;
    render(opts);
    view.scrollTop = 0;
    window.scrollTo(0, 0);
  },
  back() {
    ctx.go(PAGES[current] ? previous || 'home' : 'home');
  },
};

function render(opts = {}) {
  const tab = TABS.find((t) => t.id === current);
  const fn = tab ? tab.render : PAGES[current];
  view.className = `view view-${current}`;
  view.onclick = null;
  view.onchange = null;
  fn(view, ctx, opts);
  tabbar.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === current));
  tabbar.hidden = !tab;
}

tabbar.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  if (b.dataset.tab === current) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  ctx.go(b.dataset.tab);
});

function showWelcome() {
  const sheet = openSheet({
    title: '¡Hola! 💗',
    cls: 'welcome',
    html: `
      <div class="welcome-art">${kittySVG({ size: 130, wink: true })}</div>
      <p class="welcome-text">Esta es tu app para cuidar y consentir a <span class="script">Luisa</span>.</p>
      <ul class="welcome-list">
        <li>☀️ Todos los días a las <b>6:00 a. m.</b> te recordaré darle los buenos días.</li>
        <li>💌 Te avisaré para escribirle algo bonito y darle las buenas noches.</li>
        <li>📝 Guarda lo que le gusta, ideas de regalo y datos importantes.</li>
        <li>📸 Guarda las fotos de sus momentos más lindos.</li>
      </ul>
      <button class="btn block" data-ok>Activar notificaciones 🔔</button>`,
    onClose: async () => {
      state.settings.welcomed = true;
      await saveSettings();
    },
  });
  sheet.body.querySelector('[data-ok]').addEventListener('click', async () => {
    const res = await requestPermission();
    sheet.close();
    if (res === 'granted') toast('¡Listo! Mañana a las 6:00 te aviso ☀️');
    else if (res === 'web') toast('Instala la app en tu celular para recibir avisos 📱');
    else toast('Puedes activarlas luego en Recordatorios 🔔');
  });
}

async function start() {
  try {
    await loadState();
  } catch (e) {
    console.error(e);
    toast('No se pudieron cargar tus datos 😿');
  }
  render();
  if (!state.settings.welcomed) setTimeout(showWelcome, 500);
  syncNotifications();

  onNotificationTap((extra) => {
    setMessageKind(extra.kind);
    closeTopOverlay();
    ctx.go('home');
    setTimeout(highlightMessageCard, 350);
  });

  if (isNative) {
    App.addListener('backButton', () => {
      if (closeTopOverlay()) return;
      if (current !== 'home') ctx.back();
      else App.minimizeApp();
    });
    let lastDay = new Date().toDateString();
    App.addListener('resume', () => {
      // Cambia el mensaje de las notificaciones y refresca "hoy".
      syncNotifications();
      const today = new Date().toDateString();
      if (today !== lastDay && current === 'home') render();
      lastDay = today;
    });
  }
}

start();
