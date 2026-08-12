/**
 * Contenido de la landing en un solo lugar.
 * Cambiar copy, videos o imágenes se hace acá, no dentro de los componentes.
 */

export const site = {
  name: 'Implante Capilar - Clínica Témpora',
  title: 'Implante capilar en Clínica Témpora – Recupera tu confianza',
  description:
    'Recupera tu cabello con implante capilar en Clínica Témpora. Técnica avanzada, resultados naturales en Chile. Agenda tu evaluación',
  url: 'https://implantecapilar.clinicatempora.cl',
  address: {
    street: 'Suecia 0142, oficina 603',
    locality: 'Providencia',
    region: 'Región Metropolitana',
    country: 'CL',
  },
  hours: 'Lunes a viernes 9:00 a 18:00 hrs.',
  branch: 'Sucursal principal',
} as const;

export const nav = [
  { label: 'Testimonios', href: '#testimonios' },
  { label: 'Cómo funciona', href: '#comofunciona' },
  { label: 'Por qué elegirnos', href: '#elegirnos' },
] as const;

export const hero = {
  eyebrow: 'Evaluación capilar personalizada',
  title: 'Implante capilar',
  subtitle: 'Vuelve a tener pelo',
  bullets: [
    'Somos la primera clínica especializada en Chile.',
    'Agenda tu evaluación con médicos especialistas.',
  ],
  privacy: 'Garantizamos la privacidad de tus datos personales.',
} as const;

export const claim = {
  title: 'Recupera tu confianza sin dolor.',
  text: 'El trasplante capilar no es un tratamiento para la alopecia, sino que una solución para toda la vida.',
} as const;

export const testimonials = {
  title: 'Testimonios de nuestros pacientes',
  text: 'Conoce a quienes ya han transformado su vida y su imagen con el implante capilar en Clínica Témpora.',
  /** thumb = miniatura servida en local (tools/optimize-assets.mjs la genera) */
  videos: [
    { name: 'Joaquín', id: 'P7t6AGGPv48', thumb: '/assets/img/v2/JOAQUIN.jpg', alt: 'Joaquín contando su experiencia en Clínica Témpora' },
    { name: 'Pablo', id: 'h08RqUihV1I', thumb: '/assets/img/v2/PABLO.jpg', alt: 'Pablo contando su experiencia en Clínica Témpora' },
    { name: 'Juliano', id: 'gAZ2xNm--Bo', thumb: '/assets/img/v2/JULIANO.jpg', alt: 'Juliano contando su experiencia en Clínica Témpora' },
  ],
} as const;

export const results = {
  titleLine1: '¡Nuestros resultados',
  titleLine2: '100% efectivos!',
  text: 'Un antes y un después que te mostrarán el poder de un implante capilar bien hecho',
  steps: [
    {
      label: '1 mes',
      text: 'El cabello implantado puede caer: la raíz permanece.',
      img: '/assets/img/resultado-1-mes-219.webp',
      alt: 'Resultado del implante capilar al primer mes',
    },
    {
      label: '6 meses',
      text: 'El crecimiento ya es visible y comienza a ganar densidad.',
      img: '/assets/img/resultado-6-meses-219.webp',
      alt: 'Resultado del implante capilar a los 6 meses',
    },
    {
      label: '9 meses',
      text: 'La cobertura y el aspecto natural se consolidan.',
      img: '/assets/img/resultado-9-meses-219.webp',
      alt: 'Resultado del implante capilar a los 9 meses',
    },
    {
      label: '12 meses',
      text: 'Resultado final: cabello natural y permanente.',
      img: '/assets/img/resultado-12-meses-219.webp',
      alt: 'Resultado del implante capilar a los 12 meses',
    },
  ],
} as const;

export const howItWorks = {
  features: [
    'Resultados 100% efectivos',
    'Procedimiento ambulatorio e indoloro.',
    'El procedimiento dura entre 5 y 8 horas.',
    'Resultados visibles desde el 6to mes.',
    'Dirigido a personas con alopecia androgenética o cicatricial, y otra según indicación médica.',
  ],
  videoId: 'BW9bjbc_21U',
  caption: 'Así funciona el implante capilar.',
} as const;

export const whyUs = {
  title: '¿Por qué elegir a Clínica Témpora?',
  gallery: [
    { src: '/assets/img/v2/tempora-galeria2.webp', alt: 'Procedimiento de implante capilar en Clínica Témpora' },
    { src: '/assets/img/v2/tempora-galeria4.webp', alt: 'Especialista realizando un implante capilar en Clínica Témpora' },
    { src: '/assets/img/v2/tempora-galeria6.webp', alt: 'Preparación de paciente en Clínica Témpora' },
  ],
  stats: [
    { kicker: 'Experiencia', title: 'realizando implantes capilares', to: 10, suffix: '+ años' },
    { kicker: 'Pacientes', title: 'cirugías realizadas', to: 2500, suffix: '+' },
  ],
} as const;

export const cta = {
  title: 'Descubre si el implante capilar es para ti',
  button: 'QUIERO AGENDAR',
} as const;

export const installments = {
  title: 'Paga hasta en 12 cuotas sin interés con todas las tarjetas de crédito.*',
  note: '*Con pago sobre 12 cuotas, interés queda sujeto a la entidad bancaria correspondiente.',
} as const;

/** Los 8 campos del formulario, en orden. Cada versión define cómo agruparlos. */
export const formSteps = [
  { name: 'nombre', type: 'text', label: 'Nombre*', placeholder: 'Nombre*', hideLabel: true, autocomplete: 'given-name' },
  { name: 'apellido', type: 'text', label: 'Apellido*', placeholder: 'Apellido*', hideLabel: true, autocomplete: 'family-name' },
  { name: 'email', type: 'email', label: 'Email*', placeholder: 'Email*', hideLabel: true, autocomplete: 'email' },
  {
    name: 'telefono',
    type: 'tel',
    label: 'Ingresar teléfono en formato de 9 dígitos*',
    placeholder: 'Ingresar teléfono en formato de 9 dígitos',
    autocomplete: 'tel-national',
  },
  {
    name: 'urgencia_cirugia',
    type: 'select',
    label: '¿Cuándo quieres realizarte la cirugía?',
    options: ['Lo antes posible', 'Dentro de 6 meses', 'Entre 6 y 12 meses', 'Después de un año', 'Sin fecha aún'],
  },
  {
    name: 'medio_evaluacion',
    type: 'select',
    label: '¿Cuál medio de evaluación prefieres?',
    options: ['Presencial', 'A distancia', 'Busca información'],
  },
  {
    name: 'genero',
    type: 'select',
    label: 'Género',
    options: ['Hombre', 'Mujer', 'Otro'],
  },
  {
    name: 'horario_contacto',
    type: 'select',
    label: '¿A qué hora prefieres que te contactemos?',
    options: ['Entre 9:00 y 14:00 hrs', 'Entre 14:00 y 18:00 hrs'],
  },
] as const;
