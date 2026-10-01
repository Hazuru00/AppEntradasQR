// src/config/event.ts
// CONFIGURACIÓN MAESTRA DEL EVENTO
// La configuración real del evento se hace por VARIABLES DE ENTORNO (env vars).
// Variables soportadas:
//   NEXT_PUBLIC_EVENT_NAME / _SUBTITLE / _DATE / _TIME / _VENUE / _CITY / _DRESS_CODE
//   NEXT_PUBLIC_PAGO_MOVIL_BANCO / _TELEFONO / _CEDULA / _TITULAR
//   NEXT_PUBLIC_WHATSAPP / NEXT_PUBLIC_INSTAGRAM
//   NEXT_PUBLIC_PRICE_SINGLE_BS / _PAIR_BS   (y los equivalentes _USD)
//
// ============================================================================
// ⚠️⚠️  FALLBACKS PROVISIONALES — ELIMINAR  ⚠️⚠️
// Los valores fijos de EVENT_DATA solo se usan cuando la env var NO está definida.
// Es un parche temporal para que la app no se vea vacía sin envs. Cuando TODO el
// evento se configure por env (nombre, fecha, sede, pago móvil y precios),
// ESTOS FALLBACKS DEBEN BORRARSE y dejar solo lo que venga de process.env.
// ============================================================================

const envName = process.env.NEXT_PUBLIC_EVENT_NAME?.trim();
const envSubtitle = process.env.NEXT_PUBLIC_EVENT_SUBTITLE?.trim();
const envBank = process.env.NEXT_PUBLIC_PAGO_MOVIL_BANCO?.trim();
const envPhone = process.env.NEXT_PUBLIC_PAGO_MOVIL_TELEFONO?.trim();
const envCedula = process.env.NEXT_PUBLIC_PAGO_MOVIL_CEDULA?.trim();
const envHolder = process.env.NEXT_PUBLIC_PAGO_MOVIL_TITULAR?.trim();
const envWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP?.trim();
const envInstagram = process.env.NEXT_PUBLIC_INSTAGRAM?.trim();
const envDate = process.env.NEXT_PUBLIC_EVENT_DATE?.trim();
const envTime = process.env.NEXT_PUBLIC_EVENT_TIME?.trim();
const envVenue = process.env.NEXT_PUBLIC_EVENT_VENUE?.trim();
const envCity = process.env.NEXT_PUBLIC_EVENT_CITY?.trim();
const envDressCode = process.env.NEXT_PUBLIC_EVENT_DRESS_CODE?.trim();

// Precios configurables. La promo trata CADA PAR de entradas al precio de pareja
// (2 entradas = 5000 Bs) y cada entrada suelta al precio individual (1 = 3000 Bs).
// ⚠️ 3000/5000 son los FALLBACKS PROVISIONALES: configurar por env y quitarlos.
const envSinglePriceBs = numEnv(process.env.NEXT_PUBLIC_PRICE_SINGLE_BS, 3000);
const envSinglePriceUsd = numEnv(process.env.NEXT_PUBLIC_PRICE_SINGLE_USD, 3);
const envPairPriceBs = numEnv(process.env.NEXT_PUBLIC_PRICE_PAIR_BS, 5000);
const envPairPriceUsd = numEnv(process.env.NEXT_PUBLIC_PRICE_PAIR_USD, 5);

function numEnv(raw: string | undefined, fallback: number): number {
  const n = Number(raw?.trim());
  return raw && raw.trim() !== '' && Number.isFinite(n) && n > 0 ? n : fallback;
}

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
    priceUSD: number; // $3 (1 entrada)
    priceBs: number;  // 3000 Bs (1 entrada)
    pairPriceUSD: number; // $5 (promo 2 entradas)
    pairPriceBs: number;  // 5000 Bs (promo 2 entradas)
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
  // ⚠️ FALLBACKS PROVISIONALES (ver aviso al inicio del archivo) — deben borrarse
  //    cuando todo el evento se configure por variables de entorno.
  id: "retro-night-party-80-90",
  title: envName || "Retro night party 80/90",
  subtitle: envSubtitle || "Trae tu mejor pinta 80 o 90",
  date: envDate || "Viernes 2 de octubre 2026",
  time: envTime || "7pm a 12 am",
  venue: envVenue || "Salón parroquial",
  city: envCity || "Vzla",
  dressCode: envDressCode || "Outfit 80/90",

  // Configuración de taquilla: ENTRADA 3000 Bs / 3.000 Bs con promo 2x1
  hasMultipleTiers: false,
  singleTicket: {
    name: "Entrada General",
    priceUSD: envSinglePriceUsd,
    priceBs: envSinglePriceBs,
    pairPriceUSD: envPairPriceUsd,
    pairPriceBs: envPairPriceBs,
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

  // ⚠️ FALLBACKS PROVISIONALES (ver aviso al inicio del archivo).
  pagoMovil: {
    bank: envBank || "Vzla",
    phone: envPhone || "04129896888",
    idNumber: envCedula || "14.501.780",
    accountHolder: envHolder || "Luis Alberto Silva Perdomo"
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

// Total de una orden con promo 2x1: cada PAR de entradas se cobra al precio de
// pareja (2 = 5000 Bs) y cada entrada impar suelta al individual (1 = 3000 Bs).
// Ej.: 1 -> 3000, 2 -> 5000, 3 -> 8000, 4 -> 10000, 5 -> 13000.
export function calcTotals(
  event: EventConfig,
  quantity: number
): { totalUSD: number; totalBs: number } {
  const qty = Math.max(1, Math.floor(quantity));
  const st = event.singleTicket;
  const pairs = Math.floor(qty / 2);
  const singles = qty % 2;
  return {
    totalUSD: pairs * st.pairPriceUSD + singles * st.priceUSD,
    totalBs: pairs * st.pairPriceBs + singles * st.priceBs,
  };
}
