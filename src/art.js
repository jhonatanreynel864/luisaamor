// Ilustraciones originales dibujadas en SVG: la gatita Mimi, moños y corazones.

const INK = '#4A2C3A';

export function bowSVG({ size = 48, cls = '' } = {}) {
  return `
  <svg class="${cls}" width="${size}" height="${size * 0.7}" viewBox="0 0 100 70" aria-hidden="true">
    <path d="M50 35 C34 6 6 12 10 34 C13 52 34 54 50 35 Z" fill="#FF5C9A" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M50 35 C66 6 94 12 90 34 C87 52 66 54 50 35 Z" fill="#FF5C9A" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M22 28 C26 22 32 22 36 26" fill="none" stroke="#FFC1DA" stroke-width="4" stroke-linecap="round"/>
    <path d="M64 26 C68 22 74 22 78 28" fill="none" stroke="#FFC1DA" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="50" cy="36" rx="12" ry="11" fill="#FF2E74" stroke="${INK}" stroke-width="5"/>
    <path d="M46 34 c0-2 3-3 4-1 c1-2 4-1 4 1 c0 2-4 4-4 4 s-4-2-4-4z" fill="#fff" opacity=".9"/>
  </svg>`;
}

export function kittySVG({ size = 160, cls = '', wink = false } = {}) {
  // "Mimi": gatita original color crema, con mancha rosada, flor y nariz de corazón.
  const O = '#7A3E5C';
  const eyeR = wink
    ? `<path d="M117 114 q13 -13 26 0" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`
    : `<circle cx="130" cy="112" r="13" fill="#5B2A45"/><circle cx="135" cy="106" r="4.6" fill="#fff"/><circle cx="125" cy="118" r="2.2" fill="#fff"/>`;
  const petals = [0, 72, 144, 216, 288]
    .map((a) => `<ellipse cx="0" cy="-10" rx="7.5" ry="10" transform="rotate(${a})" fill="#FF7FB0" stroke="${O}" stroke-width="3"/>`)
    .join('');
  return `
  <svg class="kitty ${cls}" width="${size}" height="${size * 0.9}" viewBox="0 0 200 180" aria-hidden="true">
    <g stroke="${O}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M40 80 C30 52 34 28 45 22 C55 18 73 34 87 54 Z" fill="#FFF8F2"/>
      <path d="M160 80 C170 52 166 28 155 22 C145 18 127 34 113 54 Z" fill="#FFF8F2"/>
    </g>
    <path d="M47 33 C53 31 64 41 72 51 L51 65 C45 53 43 39 47 33 Z" fill="#FFB8D0"/>
    <path d="M153 33 C147 31 136 41 128 51 L149 65 C155 53 157 39 153 33 Z" fill="#FFB8D0"/>
    <ellipse cx="100" cy="110" rx="78" ry="63" fill="#FFF8F2" stroke="${O}" stroke-width="4.5"/>
    <path d="M30 98 C33 72 57 54 84 56 C93 68 89 86 76 94 C62 103 42 107 30 98 Z" fill="#FFD3E2"/>
    <path d="M88 50 q6 -11 12 -1 q6 -10 12 1" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <g stroke="#E58AAE" stroke-width="3.5" stroke-linecap="round">
      <path d="M20 118 L40 122"/><path d="M21 133 L40 130"/>
      <path d="M180 118 L160 122"/><path d="M179 133 L160 130"/>
    </g>
    <ellipse cx="50" cy="136" rx="13" ry="7.5" fill="#FF9EC4" opacity=".75"/>
    <ellipse cx="150" cy="136" rx="13" ry="7.5" fill="#FF9EC4" opacity=".75"/>
    <circle cx="70" cy="112" r="13" fill="#5B2A45"/><circle cx="75" cy="106" r="4.6" fill="#fff"/><circle cx="65" cy="118" r="2.2" fill="#fff"/>
    ${eyeR}
    <path d="M100 134 c-6 -4 -9.5 -7 -9.5 -10.5 c0 -3.5 4.5 -5.5 9.5 -1.5 c5 -4 9.5 -2 9.5 1.5 c0 3.5 -3.5 6.5 -9.5 10.5z" fill="#FF6FA5" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M96 141 q4 8 8 0 z" fill="#FF8FB6"/>
    <path d="M89 138 q5.5 6 11 0 q5.5 6 11 0" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round"/>
    <g transform="translate(148 40)">${petals}<circle r="6.5" fill="#FFD34D" stroke="${O}" stroke-width="3"/></g>
  </svg>`;
}

export function heartSVG({ size = 18, color = '#FF5C9A', cls = '' } = {}) {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.2 0 3.6 1.3 5.2 3.1 1.6-1.8 3-3.1 5.2-3.1 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" fill="${color}"/></svg>`;
}

const S = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  home: `<svg viewBox="0 0 24 24" width="24" height="24" ${S}><path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M12 17.2s-3-1.8-3-3.8c0-1 .8-1.8 1.7-1.8.6 0 1 .3 1.3.7.3-.4.7-.7 1.3-.7.9 0 1.7.8 1.7 1.8 0 2-3 3.8-3 3.8z"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" width="24" height="24" ${S}><rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" width="24" height="24" ${S}><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" width="24" height="24" ${S}><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" width="22" height="22" ${S}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  back: `<svg viewBox="0 0 24 24" width="24" height="24" ${S}><path d="M15 5l-7 7 7 7"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="20" height="20" ${S}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" width="18" height="18" ${S}><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></svg>`,
  share: `<svg viewBox="0 0 24 24" width="18" height="18" ${S}><path d="M12 15V4M8 7.5 12 4l4 3.5"/><path d="M6 11v7.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V11"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" width="18" height="18" ${S}><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="18" height="18" ${S}><path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 13h9l1-13"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" width="18" height="18" ${S}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>`,
  chevronL: `<svg viewBox="0 0 24 24" width="28" height="28" ${S}><path d="M15 5l-7 7 7 7"/></svg>`,
  chevronR: `<svg viewBox="0 0 24 24" width="28" height="28" ${S}><path d="m9 5 7 7-7 7"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.4 1 2.5.1.2 1.7 2.6 4.2 3.7 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.4z"/></svg>`,
};
