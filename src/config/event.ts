// src/config/event.ts
// CONFIGURACIÓN MAESTRA DEL EVENTO
// Los valores de marca (nombre, subtítulo) se pueden sobreescribir con env vars:
//   NEXT_PUBLIC_EVENT_NAME / NEXT_PUBLIC_EVENT_SUBTITLE
// Si no se definen, se usan los valores por defecto de abajo.

const envName = process.env.NEXT_PUBLIC_EVENT_NAME?.trim();
const envSubtitle = process.env.NEXT_PUBLIC_EVENT_SUBTITLE?.trim();
const envBank = process.env.NEXT_PUBLIC_PAGO_MOVIL_BANCO?.trim();
const envPhone = process.env.NEXT_PUBLIC_PAGO_MOVIL_TELEFONO?.trim();
const envCedula = process.env.NEXT_PUBLIC_PAGO_MOVIL_CEDULA?.trim();
const envHolder = process.env.NEXT_PUBLIC_PAGO_MOVIL_TITULAR?.trim();
const envWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP?.trim();
const envInstagram = process.env.NEXT_PUBLIC_INSTAGRAM?.trim();

export interface TicketTier {
  id: string;
  name: string;
  priceUSD: number;
  priceBs: number;
  description: string;
}

export interface EventConfig {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  dressCode?: string;
  
  // MODO DE ENTRADAS:
  // Si hasMultipleTiers es false, la taquilla es directa y simple (1 solo precio).
  // Si es true, el comprador elige entre los niveles definidos en 'tiers'.
  hasMultipleTiers: boolean;
  
  // Precio de la entrada única (cuando hasMultipleTiers = false)
  singleTicket: {
    name: string;
    priceUSD: number; // $3
    priceBs: number;  // 3000 Bs
    description: string;
  };

  // Lista de niveles (para eventos futuros con múltiples tipos de entrada)
  tiers: TicketTier[];

  // Datos para Pago Móvil venezolano
  pagoMovil: {
    bank: string;
    phone: string;
    idNumber: string;
    accountHolder: string;
  };

  // Enlaces de contacto y redes
  contact: {
    whatsapp: string; // ej: 584121234567
    instagram?: string; // opcional: si no se define, no se muestra
  };
}

export const EVENT_DATA: EventConfig = {
  id: "y2k-party-2000s",
  title: envName || "2000s Party",
  subtitle: envSubtitle || "La fiesta con lo mejor de los 2000s • Pop, Hip-Hop, Rock y Reggaetón",
  date: "Viernes 11 de Septiembre, 2026",
  time: "7:00 PM a 12:00 AM",
  venue: "Salón Parroquial de la Parroquia San Juan Evangelista",
  city: "Campo Rico",
  dressCode: "Outfit Años 2000s (Denim, glitter, retro chic)",

  // Configuración de taquilla actual: ENTRADA ÚNICA $3 / 3.000 Bs
  hasMultipleTiers: false,
  singleTicket: {
    name: "Entrada General",
    priceUSD: 3,
    priceBs: 3000,
    description: "Acceso completo al evento durante toda la noche"
  },

  // Plantilla JSON para cuando quieras habilitar múltiples tipos de entradas:
  tiers: [
    {
      id: "general",
      name: "Entrada General",
      priceUSD: 3,
      priceBs: 3000,
      description: "Acceso regular al evento"
    },
    {
      id: "vip",
      name: "Pase VIP",
      priceUSD: 10,
      priceBs: 10000,
      description: "Acceso preferencial + barra exclusiva"
    }
  ],

  pagoMovil: {
    bank: envBank || "",
    phone: envPhone || "",
    idNumber: envCedula || "",
    accountHolder: envHolder || ""
  },

  // Enlaces de contacto y redes
  contact: {
    whatsapp: envWhatsapp || "", // ej: 584121234567
    instagram: envInstagram || undefined // opcional: si no se define, no se muestra
  }
};

export function getActiveEvent(): EventConfig {
  return EVENT_DATA;
}
