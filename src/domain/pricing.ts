/**
 * P5-L9 · Condiciones comerciales para el cierre Eclipse. Son las del tarifario aprobado del 16/10/2026 (las mismas de
 * #/comercial); no se revalidaron contra la fuente en esta construcción, así que la vigencia queda "a confirmar".
 * Lo que el tarifario no dice (tiempos, link de contacto) se muestra como "a confirmar": nunca se completa a ojo.
 */
export const TARIFF = {
  source: 'Tarifario aprobado del 16/10/2026',
  validity: 'a confirmar (no revalidado contra la fuente en esta construcción)',
  package: {
    name: 'Adaptación de la demo a tu negocio',
    price: 'desde USD 500',
    payment: '50 % de anticipo y 50 % al aprobar la entrega',
    pack: 'Pack USD 700: adaptación + landing adicional + ambas asesorías puntuales, sujeto a compatibilidad y capacidad real',
  },
  included: [
    'Tu marca aplicada y la gamificación estándar',
    'Recorte comercial propuesto: una sede y hasta 25 ítems de carta',
    'Landing adicional compatible por USD 200, sin cobrarla dos veces',
  ],
  excluded: [
    'Integraciones con sistemas de gestión, reservas o pagos: ninguna se incluye por mostrar un simulador',
    'Campañas, premios, identidad completa y growth recurrente: aparte o a cotizar',
    'Dominio y su renovación, salvo inclusión expresa',
    'Desarrollo ilimitado: no se promete',
  ],
  extras: [
    'Módulo operativo desde USD 750; fase ampliada desde USD 1.000 (dos módulos relacionados y una integración compatible)',
    'WhatsApp estándar sin IA: complemento compatible USD 100',
    'Chatbot IA y voz productiva: desde USD 750 independientes o USD 250 como complemento, con proveedor y costos validados',
    'Migración desde Excel o PDF: USD 100–300, una vez, tras una muestra',
  ],
  monthly: [
    { name: 'Esencial', price: 'USD 30/mes', includes: 'hasta USD 5 de consumos de terceros' },
    { name: 'Conectado', price: 'USD 75/mes', includes: 'hasta USD 15 de consumos y una integración estándar' },
    { name: 'Automatización/IA', price: 'USD 150/mes', includes: 'hasta USD 40 de consumos y dos flujos estándar (uno puede usar IA)' },
  ],
  monthlyNote: 'Todos incluyen hasta dos horas mensuales, no acumulables. Aviso al 80 % de los consumos, sin sobrecargo automático; al agotarse se pausa el flujo acordado y quedan el acceso, los datos y la vía manual.',
  /** El tarifario no fija plazos de entrega. */
  times: 'a confirmar',
  /** No hay un enlace de Eclipse verificado en este proyecto: no se inventa uno. */
  eclipseUrl: null as string | null,
} as const
