// Ilustraciones originales en SVG: la gatita Mimi (asomada con sus patitas),
// destellos, huellitas e íconos de la app.

const O = '#6E3756';

/** Mimi: gatita original color crema, mancha rosada, flor lila y nariz de corazón. */
export function kittySVG({ size = 160, cls = '', wink = false, paws = true } = {}) {
  const eyeR = wink
    ? `<path d="M117 108 q13 -13 26 0" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`
    : `<circle cx="130" cy="106" r="13" fill="#4B2140"/><circle cx="135" cy="100" r="4.6" fill="#fff"/><circle cx="125" cy="112" r="2.2" fill="#fff"/>`;
  const petals = [0, 72, 144, 216, 288]
    .map((a) => `<ellipse cx="0" cy="-10" rx="7.5" ry="10" transform="rotate(${a})" fill="#B996FF" stroke="${O}" stroke-width="3"/>`)
    .join('');
  const pawsSVG = paws
    ? `
    <g stroke="${O}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M36 199 C33 177 46 164 61 164 C76 164 89 177 86 199 Z" fill="#FFF8F2"/>
      <path d="M114 199 C111 177 124 164 139 164 C154 164 167 177 164 199 Z" fill="#FFF8F2"/>
      <path d="M54 186 v9 M68 186 v9 M132 186 v9 M146 186 v9" fill="none" stroke-width="3.5"/>
    </g>
    <ellipse cx="61" cy="172" rx="9" ry="4" fill="#FFE1EC"/>
    <ellipse cx="139" cy="172" rx="9" ry="4" fill="#FFE1EC"/>`
    : '';
  const h = paws ? 200 : 172;
  return `
  <svg class="kitty ${cls}" width="${size}" height="${(size * h) / 200}" viewBox="0 0 200 ${h}" aria-hidden="true">
    <g stroke="${O}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M40 74 C30 46 34 22 45 16 C55 12 73 28 87 48 Z" fill="#FFF8F2"/>
      <path d="M160 74 C170 46 166 22 155 16 C145 12 127 28 113 48 Z" fill="#FFF8F2"/>
    </g>
    <path d="M47 27 C53 25 64 35 72 45 L51 59 C45 47 43 33 47 27 Z" fill="#FFB8D0"/>
    <path d="M153 27 C147 25 136 35 128 45 L149 59 C155 47 157 33 153 27 Z" fill="#FFB8D0"/>
    <ellipse cx="100" cy="104" rx="78" ry="63" fill="#FFF8F2" stroke="${O}" stroke-width="4.5"/>
    <path d="M30 92 C33 66 57 48 84 50 C93 62 89 80 76 88 C62 97 42 101 30 92 Z" fill="#FFD3E2"/>
    <path d="M88 44 q6 -11 12 -1 q6 -10 12 1" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <g stroke="#E58AAE" stroke-width="3.5" stroke-linecap="round">
      <path d="M20 112 L40 116"/><path d="M21 127 L40 124"/>
      <path d="M180 112 L160 116"/><path d="M179 127 L160 124"/>
    </g>
    <ellipse cx="50" cy="130" rx="13" ry="7.5" fill="#FF9EC4" opacity=".7"/>
    <ellipse cx="150" cy="130" rx="13" ry="7.5" fill="#FF9EC4" opacity=".7"/>
    <circle cx="70" cy="106" r="13" fill="#4B2140"/><circle cx="75" cy="100" r="4.6" fill="#fff"/><circle cx="65" cy="112" r="2.2" fill="#fff"/>
    ${eyeR}
    <path d="M100 128 c-6 -4 -9.5 -7 -9.5 -10.5 c0 -3.5 4.5 -5.5 9.5 -1.5 c5 -4 9.5 -2 9.5 1.5 c0 3.5 -3.5 6.5 -9.5 10.5z" fill="#FF6FA5" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M96 135 q4 8 8 0 z" fill="#FF8FB6"/>
    <path d="M89 132 q5.5 6 11 0 q5.5 6 11 0" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round"/>
    <g transform="translate(148 34)">${petals}<circle r="6.5" fill="#FFD34D" stroke="${O}" stroke-width="3"/></g>
    ${pawsSVG}
  </svg>`;
}

export function sparkleSVG({ size = 18, color = '#fff', cls = '' } = {}) {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -11 C1.2 -3.5 3.5 -1.2 11 0 C3.5 1.2 1.2 3.5 0 11 C-1.2 3.5 -3.5 1.2 -11 0 C-3.5 -1.2 -1.2 -3.5 0 -11Z" fill="${color}"/></svg>`;
}

export function pawSVG({ size = 28, color = 'currentColor', cls = '' } = {}) {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="${color}"><ellipse cx="12" cy="15.5" rx="5.2" ry="4.6"/><ellipse cx="5.6" cy="10.2" rx="2.2" ry="2.8" transform="rotate(-20 5.6 10.2)"/><ellipse cx="9.4" cy="6.2" rx="2.2" ry="2.9" transform="rotate(-8 9.4 6.2)"/><ellipse cx="14.6" cy="6.2" rx="2.2" ry="2.9" transform="rotate(8 14.6 6.2)"/><ellipse cx="18.4" cy="10.2" rx="2.2" ry="2.8" transform="rotate(20 18.4 10.2)"/></svg>`;
}

/** Mascota con brillo, destellos y huellitas alrededor. */
export function mascotHTML({ size = 150, wink = true, cls = '' } = {}) {
  return `
  <div class="mascot ${cls}" style="--m:${size}px">
    <div class="mascot-glow"></div>
    ${sparkleSVG({ size: 20, cls: 'spk spk1' })}
    ${sparkleSVG({ size: 13, cls: 'spk spk2' })}
    ${sparkleSVG({ size: 16, cls: 'spk spk3' })}
    ${pawSVG({ size: 26, color: 'rgba(255,255,255,.35)', cls: 'paw paw1' })}
    ${pawSVG({ size: 20, color: 'rgba(255,255,255,.3)', cls: 'paw paw2' })}
    <div class="mascot-kitty">${kittySVG({ size, wink })}</div>
  </div>`;
}

export function heartSVG({ size = 18, color = '#F0508E', cls = '' } = {}) {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.2 0 3.6 1.3 5.2 3.1 1.6-1.8 3-3.1 5.2-3.1 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" fill="${color}"/></svg>`;
}

export function bowSVG({ size = 48, cls = '' } = {}) {
  return `
  <svg class="${cls}" width="${size}" height="${size * 0.7}" viewBox="0 0 100 70" aria-hidden="true">
    <path d="M50 35 C34 6 6 12 10 34 C13 52 34 54 50 35 Z" fill="#FF7FB0" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M50 35 C66 6 94 12 90 34 C87 52 66 54 50 35 Z" fill="#FF7FB0" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M22 28 C26 22 32 22 36 26" fill="none" stroke="#FFD0E2" stroke-width="4" stroke-linecap="round"/>
    <path d="M64 26 C68 22 74 22 78 28" fill="none" stroke="#FFD0E2" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="50" cy="36" rx="12" ry="11" fill="#F0508E" stroke="${O}" stroke-width="5"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Íconos de línea (24×24)

const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const svg = (body, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" ${S} aria-hidden="true">${body}</svg>`;

export const icons = {
  home: svg('<path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9v11h13V9"/><path d="M12 17s-2.8-1.7-2.8-3.6a1.6 1.6 0 0 1 2.8-1 1.6 1.6 0 0 1 2.8 1C14.8 15.3 12 17 12 17z"/>', 24),
  notes: svg('<rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>', 24),
  bell: svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>', 24),
  camera: svg('<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/>', 24),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>', 24),
  chevron: svg('<path d="m9 6 6 6-6 6"/>', 18),
  plus: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', 20),
  copy: svg('<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>', 20),
  share: svg('<path d="M12 15V4M8 7.5 12 4l4 3.5"/><path d="M6 11v7.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V11"/>', 20),
  refresh: svg('<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/>', 20),
  trash: svg('<path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 13h9l1-13"/>', 18),
  edit: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', 18),
  chevronL: svg('<path d="M15 5l-7 7 7 7"/>', 26),
  chevronR: svg('<path d="m9 5 7 7-7 7"/>', 26),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  chat: svg('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12z"/><path d="M12 14.6s-2.6-1.6-2.6-3.3a1.4 1.4 0 0 1 2.6-.8 1.4 1.4 0 0 1 2.6.8c0 1.7-2.6 3.3-2.6 3.3z"/>'),
  heart: svg('<path d="M12 20s-7.5-4.6-9.2-9.2C1.6 7.4 3.7 4.5 7 4.5c2 0 3.3 1.2 5 3 1.7-1.8 3-3 5-3 3.3 0 5.4 2.9 4.2 6.3C19.5 15.4 12 20 12 20z"/>'),
  star: svg('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'),
  gift: svg('<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5S10.8 4 8.4 4a2.2 2.2 0 0 0 0 4.5H12zM12 8.5S13.2 4 15.6 4a2.2 2.2 0 0 1 0 4.5H12z"/>'),
  calendar: svg('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  ban: svg('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>'),
  flower: svg('<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C10 6 10.5 3.5 12 3.5s2 2.5 0 6zM14.5 12c3.5-2 6-1.5 6 0s-2.5 2-6 0zM12 14.5c2 3.5 1.5 6 0 6s-2-2.5 0-6zM9.5 12c-3.5 2-6 1.5-6 0s2.5-2 6 0z"/>'),
  note: svg('<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8h5M9 12.5h6M9 16h4"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  cake: svg('<path d="M4 20.5h16M5 20.5v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"/><path d="M5 15.5c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 5 0M12 11.5V8M12 4.5c.8 1 .8 2 0 2.5-.8-.5-.8-1.5 0-2.5z"/>'),
  phone: svg('<path d="M5 4.5h3.5l1.5 4-2 1.2a10 10 0 0 0 6.3 6.3l1.2-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z"/>'),
  image: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4.5 18 5-5 3.5 3.5 2.5-2.5 4 4"/>'),
  download: svg('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19.5h14"/>', 20),
  upload: svg('<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M5 19.5h14"/>', 20),
  battery: svg('<rect x="3" y="7.5" width="16" height="9" rx="2.5"/><path d="M21 11v2M6.5 10.5v3M9.5 10.5v3"/>'),
  pin: svg('<path d="M14.5 4.5 19.5 9.5l-3 1-3.5 3.5.5 4-1.5 1.5-3-3L5 20.5M8.5 13l-3-3L7 8.5l4 .5L14.5 5.5z"/>', 16),
  sparkle: svg('<path d="M12 3.5c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7z"/>'),
  paw: svg('<ellipse cx="12" cy="15.5" rx="4.6" ry="4"/><circle cx="6" cy="10" r="1.9"/><circle cx="9.5" cy="6.5" r="1.9"/><circle cx="14.5" cy="6.5" r="1.9"/><circle cx="18" cy="10" r="1.9"/>'),
  whatsapp: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.4 1 2.5.1.2 1.7 2.6 4.2 3.7 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.4z"/></svg>`,
};

/** Ícono dentro de un cuadrito de color suave. */
export function iconTile(name, tone = 'pink', size = 'md') {
  return `<span class="tile tile-${tone} tile-${size}">${icons[name] || icons.heart}</span>`;
}
