// Mensajitos sugeridos para enviarle a Luisa.

export const MESSAGES = {
  morning: [
    '¡Buenos días, mi amor! ☀️ Que tengas un día tan bonito como tu sonrisa.',
    'Buenos días, Luisa hermosa 🌸 Desperté pensando en ti, como siempre.',
    'Buen día, mi vida 💕 Ojalá hoy todo te salga increíble.',
    '¡Buenos días, princesa! Te mando un abrazo gigante y un besito 😘',
    'Buenos días, mi niña linda ☀️ Eres lo primero en lo que pienso al despertar.',
    'Buen día, amor 💖 Hoy también te quiero más que ayer.',
    '¡Arriba, dormilona! 🐱 Hay un día lleno de cosas bonitas esperándote.',
    'Buenos días, Luisa 💗 Que tu café esté rico y el día sea suave contigo.',
    'Buenos días, mi cielo 🌷 Gracias por existir y hacer mis días más bonitos.',
    'Buen día, preciosa ✨ Recuerda que alguien aquí te ama muchísimo.',
    '¡Buenos días, mi amor! Que hoy sonrías mucho, aunque sea pensando en mí 😊',
    'Buenos días, corazón 💞 Te deseo un día lleno de paz, risas y amor.',
  ],
  sweet: [
    'Solo pasaba a recordarte lo mucho que te quiero 💕',
    '¿Ya te dije hoy que eres lo más bonito de mi vida? 🌷',
    'Te extraño. Así, sin más 💗',
    '¿Cómo va tu día, mi amor? Cuéntame todo 🐱',
    'Pensé en ti y sonreí como bobo 😊',
    'Eres mi persona favorita en todo el mundo, Luisa 💖',
    'Me haces muy feliz, ¿sabías? 🌸',
    'Ya quiero verte y darte un abrazo enorme 🤗',
    'Si hoy tienes un mal momento, recuerda que aquí estoy para ti 💞',
    'Tengo muchas ganas de escuchar tu voz 📞',
    'Nada más quería decirte que eres hermosa ✨',
    'Gracias por ser como eres. Te amo 💕',
  ],
  night: [
    'Buenas noches, mi amor 🌙 Sueña bonito.',
    'Que descanses, Luisa hermosa ✨ Mañana te pienso desde temprano.',
    'Buenas noches, mi vida 💤 Gracias por un día más a tu lado.',
    'Dulces sueños, princesa 🌟 Te mando un beso de buenas noches.',
    'Buenas noches, corazón 💗 Ojalá sueñes conmigo.',
    'A descansar, mi niña linda 🌙 Te quiero muchísimo.',
    'Buenas noches, amor 💞 Eres lo último en lo que pienso antes de dormir.',
  ],
};

export const KIND_LABEL = {
  morning: 'Buenos días ☀️',
  sweet: 'Algo bonito 💌',
  night: 'Buenas noches 🌙',
};

export function pickMessage(kind = 'sweet', avoid) {
  const list = MESSAGES[kind] || MESSAGES.sweet;
  if (list.length === 1) return list[0];
  let m;
  do {
    m = list[Math.floor(Math.random() * list.length)];
  } while (m === avoid);
  return m;
}
