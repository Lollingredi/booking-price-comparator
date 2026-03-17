import { subDays, format } from "date-fns";
import type {
  AlertLog,
  AlertRule,
  ComparisonRow,
  HistoryPoint,
  Hotel,
  User,
} from "../types";
import type { ItalyHotel } from "./italyHotels";

/** Deterministic pseudo-random in [0,1) seeded by a string */
function seededRand(seed: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  return (h >>> 0) / 0xffffffff;
}

export function generateDemoComparisonForHotel(
  hotel: ItalyHotel,
  competitors: ItalyHotel[]
): ComparisonRow[] {
  const otas = ["booking", "expedia", "hotels_com", "agoda"];
  const allHotels = [
    { h: hotel, isOwn: true },
    ...competitors.map((c) => ({ h: c, isOwn: false })),
  ];

  const rows = allHotels.map(({ h, isOwn }) => {
    // price variation ±8% around base price, deterministic per hotel
    const variation = 0.92 + seededRand(h.id, 1) * 0.16;
    const base = Math.round(h.basePrice * variation);

    const otaPrices: Record<string, number | null> = {};
    otas.forEach((ota, i) => {
      // booking cheapest, then escalates slightly per OTA
      const otaMult = 1 + i * 0.025 + (seededRand(h.id + ota, 2) - 0.5) * 0.04;
      otaPrices[ota] = Math.round(base * otaMult);
    });

    const validPrices = Object.values(otaPrices).filter((v) => v != null) as number[];
    const min_price = Math.min(...validPrices);

    return { hotel_key: h.bookingKey, hotel_name: h.name, is_own_hotel: isOwn, ota_prices: otaPrices, min_price, rank: 0 };
  });

  // assign rank by min_price ascending
  const sorted = [...rows].sort((a, b) => a.min_price - b.min_price);
  sorted.forEach((r, i) => { r.rank = i + 1; });

  return rows as ComparisonRow[];
}

export function buildDemoHotelFromItaly(
  hotel: ItalyHotel,
  competitors: ItalyHotel[]
): Hotel {
  return {
    id: "demo-hotel-id",
    user_id: "demo-user-id",
    name: hotel.name,
    booking_key: hotel.bookingKey,
    city: hotel.city,
    stars: hotel.stars,
    created_at: subDays(new Date(), 30).toISOString(),
    competitors: competitors.map((c, i) => ({
      id: `comp-demo-${i}`,
      hotel_id: "demo-hotel-id",
      competitor_name: c.name,
      competitor_booking_key: c.bookingKey,
      competitor_stars: c.stars,
      is_active: true,
      created_at: subDays(new Date(), 28 - i).toISOString(),
    })),
  };
}

export const DEMO_USER: User = {
  id: "demo-user-id",
  email: "demo@ratescope.it",
  full_name: "Marco Demo",
  is_active: true,
  plan: "pro",
  created_at: subDays(new Date(), 30).toISOString(),
};

export const DEMO_HOTEL: Hotel = {
  id: "demo-hotel-id",
  user_id: "demo-user-id",
  name: "Hotel Bellavista Roma",
  booking_key: "demo-key-own",
  city: "Roma",
  stars: 4,
  created_at: subDays(new Date(), 30).toISOString(),
  competitors: [
    {
      id: "comp-1",
      hotel_id: "demo-hotel-id",
      competitor_name: "Grand Hotel Ritz",
      competitor_booking_key: "demo-key-comp1",
      competitor_stars: 4,
      is_active: true,
      created_at: subDays(new Date(), 28).toISOString(),
    },
    {
      id: "comp-2",
      hotel_id: "demo-hotel-id",
      competitor_name: "Roma Central Suites",
      competitor_booking_key: "demo-key-comp2",
      competitor_stars: 3,
      is_active: true,
      created_at: subDays(new Date(), 25).toISOString(),
    },
    {
      id: "comp-3",
      hotel_id: "demo-hotel-id",
      competitor_name: "Palazzo Colosseo Hotel",
      competitor_booking_key: "demo-key-comp3",
      competitor_stars: 5,
      is_active: true,
      created_at: subDays(new Date(), 20).toISOString(),
    },
  ],
};

export const DEMO_COMPARISON: ComparisonRow[] = [
  {
    hotel_key: "demo-key-own",
    hotel_name: "Hotel Bellavista Roma",
    is_own_hotel: true,
    ota_prices: { booking: 142, expedia: 148, hotels_com: 145 },
    min_price: 142,
    rank: 2,
  },
  {
    hotel_key: "demo-key-comp1",
    hotel_name: "Grand Hotel Ritz",
    is_own_hotel: false,
    ota_prices: { booking: 138, expedia: 141, hotels_com: 139 },
    min_price: 138,
    rank: 1,
  },
  {
    hotel_key: "demo-key-comp2",
    hotel_name: "Roma Central Suites",
    is_own_hotel: false,
    ota_prices: { booking: 189, expedia: 192, hotels_com: null },
    min_price: 189,
    rank: 3,
  },
  {
    hotel_key: "demo-key-comp3",
    hotel_name: "Palazzo Colosseo Hotel",
    is_own_hotel: false,
    ota_prices: { booking: 210, expedia: 215, hotels_com: 212 },
    min_price: 210,
    rank: 4,
  },
];

export function generateDemoHistoryAll(): HistoryPoint[] {
  const today = new Date();
  const points: HistoryPoint[] = [];
  const hotels = [
    { code: "Hotel Bellavista Roma", base: 140 },
    { code: "Grand Hotel Ritz", base: 136 },
    { code: "Roma Central Suites", base: 185 },
    { code: "Palazzo Colosseo Hotel", base: 207 },
  ];

  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const weekly = Math.sin((i / 7) * 2 * Math.PI) * 8;
    const trend = (29 - i) * 0.3;

    for (const h of hotels) {
      const noise = (Math.random() - 0.5) * 6;
      points.push({
        date,
        ota_code: h.code,
        ota_name: h.code,
        min_price: Math.round(h.base + trend + weekly + noise),
      });
    }
  }
  return points;
}

export function generateDemoHistory(): HistoryPoint[] {
  const today = new Date();
  const points: HistoryPoint[] = [];
  const otas = [
    { code: "booking", name: "Booking.com" },
    { code: "expedia", name: "Expedia" },
    { code: "hotels_com", name: "Hotels.com" },
  ];

  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    // Simulate realistic weekly seasonality + gentle trend
    const trend = (29 - i) * 0.3;
    const weekly = Math.sin((i / 7) * 2 * Math.PI) * 8;
    const base = 140 + trend + weekly;

    const offsets: Record<string, number> = {
      booking: 0,
      expedia: 4,
      hotels_com: 2,
    };

    for (const ota of otas) {
      const noise = (Math.random() - 0.5) * 6;
      points.push({
        date,
        ota_code: ota.code,
        ota_name: ota.name,
        min_price: Math.round(base + offsets[ota.code] + noise),
      });
    }
  }

  return points;
}

export const DEMO_ALERT_RULES: AlertRule[] = [
  {
    id: "rule-1",
    user_id: "demo-user-id",
    rule_type: "undercut",
    threshold_value: 10,
    is_active: true,
    notify_email: true,
    notify_whatsapp: false,
    created_at: subDays(new Date(), 10).toISOString(),
  },
  {
    id: "rule-2",
    user_id: "demo-user-id",
    rule_type: "parity_issue",
    threshold_value: 5,
    is_active: true,
    notify_email: true,
    notify_whatsapp: false,
    created_at: subDays(new Date(), 8).toISOString(),
  },
];

export const DEMO_ALERT_LOGS: AlertLog[] = [
  {
    id: "log-1",
    user_id: "demo-user-id",
    alert_rule_id: "rule-1",
    message:
      "Grand Hotel Ritz ha un prezzo di €138, €4 sotto il tuo minimo (€142) su Booking.com",
    severity: "warning",
    is_read: false,
    created_at: subDays(new Date(), 0).toISOString(),
  },
  {
    id: "log-2",
    user_id: "demo-user-id",
    alert_rule_id: "rule-2",
    message:
      "Parità violata: Expedia mostra €148 vs Booking.com €142 per le stesse date",
    severity: "danger",
    is_read: false,
    created_at: subDays(new Date(), 1).toISOString(),
  },
  {
    id: "log-3",
    user_id: "demo-user-id",
    alert_rule_id: "rule-1",
    message: "Grand Hotel Ritz ha abbassato il prezzo dell'8% su Expedia",
    severity: "info",
    is_read: true,
    created_at: subDays(new Date(), 3).toISOString(),
  },
  {
    id: "log-4",
    user_id: "demo-user-id",
    alert_rule_id: "rule-2",
    message:
      "Palazzo Colosseo Hotel ha aumentato il prezzo del 12% su Hotels.com",
    severity: "info",
    is_read: true,
    created_at: subDays(new Date(), 5).toISOString(),
  },
];
