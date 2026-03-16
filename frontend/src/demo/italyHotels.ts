export interface ItalyHotel {
  id: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  stars: number;
  basePrice: number; // prezzo notte in EUR
  xoteloKey: string;
}

export const ITALY_HOTELS: ItalyHotel[] = [
  // ─── ROMA ───
  { id: "rm1", name: "Hotel de Russie", city: "Roma", region: "Lazio", lat: 41.9066, lng: 12.4766, stars: 5, basePrice: 520, xoteloKey: "demo_rm1" },
  { id: "rm2", name: "Rome Cavalieri Waldorf", city: "Roma", region: "Lazio", lat: 41.9089, lng: 12.4327, stars: 5, basePrice: 480, xoteloKey: "demo_rm2" },
  { id: "rm3", name: "Palazzo Borghese Hotel", city: "Roma", region: "Lazio", lat: 41.9147, lng: 12.498, stars: 4, basePrice: 280, xoteloKey: "demo_rm3" },
  { id: "rm4", name: "Hotel Quirinale Roma", city: "Roma", region: "Lazio", lat: 41.9003, lng: 12.4913, stars: 4, basePrice: 220, xoteloKey: "demo_rm4" },
  { id: "rm5", name: "Hotel Artemide", city: "Roma", region: "Lazio", lat: 41.897, lng: 12.4959, stars: 4, basePrice: 195, xoteloKey: "demo_rm5" },
  { id: "rm6", name: "Relais Le Clarisse", city: "Roma", region: "Lazio", lat: 41.89, lng: 12.4673, stars: 3, basePrice: 120, xoteloKey: "demo_rm6" },

  // ─── MILANO ───
  { id: "mi1", name: "Park Hyatt Milan", city: "Milano", region: "Lombardia", lat: 45.4669, lng: 9.1865, stars: 5, basePrice: 550, xoteloKey: "demo_mi1" },
  { id: "mi2", name: "Bulgari Hotel Milano", city: "Milano", region: "Lombardia", lat: 45.472, lng: 9.1815, stars: 5, basePrice: 620, xoteloKey: "demo_mi2" },
  { id: "mi3", name: "Principe di Savoia", city: "Milano", region: "Lombardia", lat: 45.4757, lng: 9.194, stars: 5, basePrice: 490, xoteloKey: "demo_mi3" },
  { id: "mi4", name: "Starhotels Rosa Grand", city: "Milano", region: "Lombardia", lat: 45.4641, lng: 9.1899, stars: 4, basePrice: 260, xoteloKey: "demo_mi4" },
  { id: "mi5", name: "Hotel Manzoni Milano", city: "Milano", region: "Lombardia", lat: 45.468, lng: 9.195, stars: 4, basePrice: 230, xoteloKey: "demo_mi5" },

  // ─── FIRENZE ───
  { id: "fi1", name: "Hotel Savoy Firenze", city: "Firenze", region: "Toscana", lat: 43.7706, lng: 11.2541, stars: 5, basePrice: 440, xoteloKey: "demo_fi1" },
  { id: "fi2", name: "Four Seasons Firenze", city: "Firenze", region: "Toscana", lat: 43.7725, lng: 11.2651, stars: 5, basePrice: 680, xoteloKey: "demo_fi2" },
  { id: "fi3", name: "Hotel Helvetia & Bristol", city: "Firenze", region: "Toscana", lat: 43.7717, lng: 11.2527, stars: 4, basePrice: 310, xoteloKey: "demo_fi3" },
  { id: "fi4", name: "Relais Santa Croce", city: "Firenze", region: "Toscana", lat: 43.7688, lng: 11.2618, stars: 4, basePrice: 295, xoteloKey: "demo_fi4" },

  // ─── VENEZIA ───
  { id: "ve1", name: "Hotel Danieli Venezia", city: "Venezia", region: "Veneto", lat: 45.4337, lng: 12.3416, stars: 5, basePrice: 590, xoteloKey: "demo_ve1" },
  { id: "ve2", name: "Gritti Palace Venezia", city: "Venezia", region: "Veneto", lat: 45.432, lng: 12.334, stars: 5, basePrice: 650, xoteloKey: "demo_ve2" },
  { id: "ve3", name: "Hotel Metropole Venezia", city: "Venezia", region: "Veneto", lat: 45.434, lng: 12.3425, stars: 4, basePrice: 340, xoteloKey: "demo_ve3" },
  { id: "ve4", name: "Ca' Sagredo Hotel", city: "Venezia", region: "Veneto", lat: 45.4386, lng: 12.3319, stars: 4, basePrice: 320, xoteloKey: "demo_ve4" },

  // ─── NAPOLI ───
  { id: "na1", name: "Grand Hotel Vesuvio", city: "Napoli", region: "Campania", lat: 40.8376, lng: 14.25, stars: 5, basePrice: 380, xoteloKey: "demo_na1" },
  { id: "na2", name: "Hotel Excelsior Napoli", city: "Napoli", region: "Campania", lat: 40.8366, lng: 14.2485, stars: 5, basePrice: 360, xoteloKey: "demo_na2" },
  { id: "na3", name: "Romeo Hotel Napoli", city: "Napoli", region: "Campania", lat: 40.8391, lng: 14.2557, stars: 4, basePrice: 245, xoteloKey: "demo_na3" },

  // ─── COSTA AMALFITANA ───
  { id: "am1", name: "Hotel Santa Caterina", city: "Amalfi", region: "Campania", lat: 40.6331, lng: 14.5975, stars: 5, basePrice: 520, xoteloKey: "demo_am1" },
  { id: "am2", name: "Le Sirenuse Positano", city: "Positano", region: "Campania", lat: 40.6278, lng: 14.4836, stars: 5, basePrice: 700, xoteloKey: "demo_am2" },
  { id: "am3", name: "Hotel Palazzo Murat", city: "Positano", region: "Campania", lat: 40.6286, lng: 14.4824, stars: 4, basePrice: 320, xoteloKey: "demo_am3" },
  { id: "am4", name: "Palazzo Avino Ravello", city: "Ravello", region: "Campania", lat: 40.6461, lng: 14.6117, stars: 5, basePrice: 580, xoteloKey: "demo_am4" },

  // ─── SIENA / TOSCANA ───
  { id: "si1", name: "Grand Hotel Continental", city: "Siena", region: "Toscana", lat: 43.3177, lng: 11.3319, stars: 5, basePrice: 420, xoteloKey: "demo_si1" },
  { id: "si2", name: "Certosa di Maggiano", city: "Siena", region: "Toscana", lat: 43.3091, lng: 11.3484, stars: 5, basePrice: 460, xoteloKey: "demo_si2" },
  { id: "si3", name: "Palazzo Ravizza Siena", city: "Siena", region: "Toscana", lat: 43.3163, lng: 11.3276, stars: 4, basePrice: 195, xoteloKey: "demo_si3" },

  // ─── LAGO DI COMO ───
  { id: "co1", name: "Villa d'Este Cernobbio", city: "Cernobbio", region: "Lombardia", lat: 45.875, lng: 9.115, stars: 5, basePrice: 750, xoteloKey: "demo_co1" },
  { id: "co2", name: "Grand Hotel Tremezzo", city: "Tremezzo", region: "Lombardia", lat: 45.9804, lng: 9.2156, stars: 5, basePrice: 680, xoteloKey: "demo_co2" },
  { id: "co3", name: "Hotel Filario Lezzeno", city: "Lezzeno", region: "Lombardia", lat: 45.948, lng: 9.206, stars: 4, basePrice: 290, xoteloKey: "demo_co3" },

  // ─── BOLOGNA ───
  { id: "bo1", name: "I Portici Hotel Bologna", city: "Bologna", region: "Emilia-Romagna", lat: 44.4939, lng: 11.3399, stars: 5, basePrice: 350, xoteloKey: "demo_bo1" },
  { id: "bo2", name: "Grand Hotel Majestic", city: "Bologna", region: "Emilia-Romagna", lat: 44.4979, lng: 11.3411, stars: 4, basePrice: 240, xoteloKey: "demo_bo2" },
  { id: "bo3", name: "Hotel Commercianti", city: "Bologna", region: "Emilia-Romagna", lat: 44.4936, lng: 11.3414, stars: 4, basePrice: 210, xoteloKey: "demo_bo3" },

  // ─── VERONA ───
  { id: "vr1", name: "Due Torri Hotel Verona", city: "Verona", region: "Veneto", lat: 45.4423, lng: 10.9978, stars: 5, basePrice: 390, xoteloKey: "demo_vr1" },
  { id: "vr2", name: "Hotel Gabbia d'Oro", city: "Verona", region: "Veneto", lat: 45.4432, lng: 10.9967, stars: 4, basePrice: 220, xoteloKey: "demo_vr2" },
  { id: "vr3", name: "Hotel Accademia Verona", city: "Verona", region: "Veneto", lat: 45.4401, lng: 10.9897, stars: 4, basePrice: 195, xoteloKey: "demo_vr3" },

  // ─── PORTOFINO / SANTA MARGHERITA ───
  { id: "po1", name: "Belmond Hotel Splendido", city: "Portofino", region: "Liguria", lat: 44.3027, lng: 9.2085, stars: 5, basePrice: 820, xoteloKey: "demo_po1" },
  { id: "po2", name: "Hotel Imperiale S. Margherita", city: "Santa Margherita Ligure", region: "Liguria", lat: 44.3317, lng: 9.2136, stars: 5, basePrice: 480, xoteloKey: "demo_po2" },
  { id: "po3", name: "Hotel Continental S. Margherita", city: "Santa Margherita Ligure", region: "Liguria", lat: 44.332, lng: 9.213, stars: 4, basePrice: 230, xoteloKey: "demo_po3" },

  // ─── COSTA SMERALDA / SARDEGNA ───
  { id: "sa1", name: "Hotel Cala di Volpe", city: "Porto Cervo", region: "Sardegna", lat: 41.0829, lng: 9.543, stars: 5, basePrice: 780, xoteloKey: "demo_sa1" },
  { id: "sa2", name: "Romazzino Hotel", city: "Porto Cervo", region: "Sardegna", lat: 41.065, lng: 9.527, stars: 5, basePrice: 690, xoteloKey: "demo_sa2" },
  { id: "sa3", name: "Hotel Pitrizza", city: "Porto Cervo", region: "Sardegna", lat: 41.078, lng: 9.518, stars: 5, basePrice: 620, xoteloKey: "demo_sa3" },

  // ─── TAORMINA / SICILIA ───
  { id: "sc1", name: "San Domenico Palace", city: "Taormina", region: "Sicilia", lat: 37.851, lng: 15.2866, stars: 5, basePrice: 520, xoteloKey: "demo_sc1" },
  { id: "sc2", name: "Grand Hotel Timeo", city: "Taormina", region: "Sicilia", lat: 37.8528, lng: 15.2878, stars: 5, basePrice: 480, xoteloKey: "demo_sc2" },
  { id: "sc3", name: "Hotel Villa Ducale", city: "Taormina", region: "Sicilia", lat: 37.8523, lng: 15.2858, stars: 4, basePrice: 220, xoteloKey: "demo_sc3" },

  // ─── DOLOMITI ───
  { id: "do1", name: "Hotel Rosa Alpina", city: "San Cassiano", region: "Trentino-Alto Adige", lat: 46.5942, lng: 11.9375, stars: 5, basePrice: 550, xoteloKey: "demo_do1" },
  { id: "do2", name: "Cristallo Resort Cortina", city: "Cortina d'Ampezzo", region: "Veneto", lat: 46.545, lng: 12.095, stars: 5, basePrice: 480, xoteloKey: "demo_do2" },
  { id: "do3", name: "Hotel Posta Zirm Corvara", city: "Corvara", region: "Trentino-Alto Adige", lat: 46.5494, lng: 11.8743, stars: 4, basePrice: 280, xoteloKey: "demo_do3" },
];

/** Haversine distance in km */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCompetitorsWithin20km(hotel: ItalyHotel): ItalyHotel[] {
  return ITALY_HOTELS.filter(
    (h) => h.id !== hotel.id && distanceKm(hotel.lat, hotel.lng, h.lat, h.lng) <= 20
  );
}
