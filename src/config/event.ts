// src/config/event.ts
// CONFIGURACIÓN MAESTRA DEL EVENTO (Estructura tipo JSON)
// Modifica fácilmente los valores aquí para adaptar la app a cualquier evento

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
    instagram: string;
  };
}

export const EVENT_DATA: EventConfig = {
  id: "y2k-party-2000s",
  title: "Y2K PARTY",
  subtitle: "Nostalgia 2000s • Pop, Hip-Hop & Reggaetón Clásico",
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
    bank: "Banesco (0134)",
    phone: "0412-5551234",
    idNumber: "V-26888999",
    accountHolder: "Y2K Eventos C.A."
  },

  contact: {
    whatsapp: "584125551234",
    instagram: "@y2kparty.ve"
  }
};

export function getActiveEvent(): EventConfig {
  return EVENT_DATA;
}
