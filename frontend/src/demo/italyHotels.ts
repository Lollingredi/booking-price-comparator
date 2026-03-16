export interface ItalyHotel {
  id: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  stars: number;
  basePrice: number;
  xoteloKey: string;
}

export const ITALY_HOTELS: ItalyHotel[] = [

  // ════════════════════════════════════════
  // BOLOGNA — città
  // ════════════════════════════════════════
  { id: "bo01", name: "I Portici Hotel Bologna",     city: "Bologna", region: "Bologna", lat: 44.4939, lng: 11.3399, stars: 5, basePrice: 350, xoteloKey: "demo_bo01" },
  { id: "bo02", name: "Grand Hotel Majestic",         city: "Bologna", region: "Bologna", lat: 44.4979, lng: 11.3411, stars: 5, basePrice: 290, xoteloKey: "demo_bo02" },
  { id: "bo03", name: "Hotel Commercianti",           city: "Bologna", region: "Bologna", lat: 44.4936, lng: 11.3414, stars: 4, basePrice: 210, xoteloKey: "demo_bo03" },
  { id: "bo04", name: "Hotel Corona d'Oro",           city: "Bologna", region: "Bologna", lat: 44.4953, lng: 11.3425, stars: 4, basePrice: 195, xoteloKey: "demo_bo04" },
  { id: "bo05", name: "NH Bologna de la Gare",        city: "Bologna", region: "Bologna", lat: 44.5013, lng: 11.3421, stars: 4, basePrice: 165, xoteloKey: "demo_bo05" },
  { id: "bo06", name: "Hotel Metropolitan Bologna",   city: "Bologna", region: "Bologna", lat: 44.4896, lng: 11.3380, stars: 4, basePrice: 180, xoteloKey: "demo_bo06" },
  { id: "bo07", name: "Hotel Baglioni Bologna",       city: "Bologna", region: "Bologna", lat: 44.4958, lng: 11.3462, stars: 5, basePrice: 320, xoteloKey: "demo_bo07" },
  { id: "bo08", name: "Starhotels Excelsior",         city: "Bologna", region: "Bologna", lat: 44.5029, lng: 11.3432, stars: 4, basePrice: 200, xoteloKey: "demo_bo08" },
  { id: "bo09", name: "Hotel Amadeus Bologna",        city: "Bologna", region: "Bologna", lat: 44.4893, lng: 11.3352, stars: 4, basePrice: 160, xoteloKey: "demo_bo09" },
  { id: "bo10", name: "Hotel Touring Bologna",        city: "Bologna", region: "Bologna", lat: 44.4934, lng: 11.3358, stars: 3, basePrice: 120, xoteloKey: "demo_bo10" },
  { id: "bo11", name: "Hotel Porta San Mamolo",       city: "Bologna", region: "Bologna", lat: 44.4870, lng: 11.3430, stars: 3, basePrice: 110, xoteloKey: "demo_bo11" },
  { id: "bo12", name: "Albergo delle Drapperie",      city: "Bologna", region: "Bologna", lat: 44.4940, lng: 11.3445, stars: 3, basePrice: 100, xoteloKey: "demo_bo12" },
  { id: "bo13", name: "Hotel Re Enzo",                city: "Bologna", region: "Bologna", lat: 44.4965, lng: 11.3410, stars: 4, basePrice: 175, xoteloKey: "demo_bo13" },
  { id: "bo14", name: "Hotel Aemilia Bologna",        city: "Bologna", region: "Bologna", lat: 44.5051, lng: 11.3479, stars: 4, basePrice: 185, xoteloKey: "demo_bo14" },
  { id: "bo15", name: "Hotel Roma Bologna",           city: "Bologna", region: "Bologna", lat: 44.4921, lng: 11.3376, stars: 3, basePrice: 105, xoteloKey: "demo_bo15" },
  { id: "bo16", name: "Il Convento dei Fiori di Seta",city: "Bologna", region: "Bologna", lat: 44.4880, lng: 11.3450, stars: 4, basePrice: 190, xoteloKey: "demo_bo16" },

  // ════════════════════════════════════════
  // BOLOGNA — zona Fiera / Villanova
  // ════════════════════════════════════════
  { id: "bo17", name: "NH Bologna Villanova",         city: "Bologna", region: "Bologna", lat: 44.5200, lng: 11.3650, stars: 4, basePrice: 155, xoteloKey: "demo_bo17" },
  { id: "bo18", name: "Unaway Hotel Bologna Fiera",   city: "Bologna", region: "Bologna", lat: 44.5208, lng: 11.3660, stars: 3, basePrice: 100, xoteloKey: "demo_bo18" },
  { id: "bo19", name: "Bologna Airport Hotel",        city: "Bologna", region: "Bologna", lat: 44.5215, lng: 11.3680, stars: 3, basePrice: 95,  xoteloKey: "demo_bo19" },

  // ════════════════════════════════════════
  // BOLOGNA — zona Aeroporto
  // ════════════════════════════════════════
  { id: "bo20", name: "Mercure Bologna Airport",      city: "Calderara di Reno", region: "Bologna", lat: 44.5338, lng: 11.2960, stars: 4, basePrice: 145, xoteloKey: "demo_bo20" },
  { id: "bo21", name: "Novotel Bologna Aeroporto",    city: "Calderara di Reno", region: "Bologna", lat: 44.5340, lng: 11.2990, stars: 4, basePrice: 140, xoteloKey: "demo_bo21" },
  { id: "bo22", name: "Holiday Inn Bologna Aeroporto",city: "Calderara di Reno", region: "Bologna", lat: 44.5330, lng: 11.2970, stars: 3, basePrice: 110, xoteloKey: "demo_bo22" },
  { id: "bo23", name: "Hotel Calderara",              city: "Calderara di Reno", region: "Bologna", lat: 44.5300, lng: 11.2950, stars: 3, basePrice: 85,  xoteloKey: "demo_bo23" },

  // ════════════════════════════════════════
  // GRANAROLO DELL'EMILIA
  // ════════════════════════════════════════
  { id: "bo24", name: "Hotel Granarolo",              city: "Granarolo dell'Emilia", region: "Bologna", lat: 44.5553, lng: 11.4611, stars: 3, basePrice: 90,  xoteloKey: "demo_bo24" },
  { id: "bo25", name: "Albergo La Pineta Granarolo",  city: "Granarolo dell'Emilia", region: "Bologna", lat: 44.5530, lng: 11.4630, stars: 2, basePrice: 65,  xoteloKey: "demo_bo25" },
  { id: "bo26", name: "Hotel Villa Granarolo",        city: "Granarolo dell'Emilia", region: "Bologna", lat: 44.5570, lng: 11.4580, stars: 3, basePrice: 80,  xoteloKey: "demo_bo26" },

  // ════════════════════════════════════════
  // SAN LAZZARO DI SAVENA
  // ════════════════════════════════════════
  { id: "bo27", name: "Hotel San Lazzaro",            city: "San Lazzaro di Savena", region: "Bologna", lat: 44.4706, lng: 11.4086, stars: 3, basePrice: 95,  xoteloKey: "demo_bo27" },
  { id: "bo28", name: "Villa Azzurra San Lazzaro",    city: "San Lazzaro di Savena", region: "Bologna", lat: 44.4720, lng: 11.4100, stars: 3, basePrice: 90,  xoteloKey: "demo_bo28" },

  // ════════════════════════════════════════
  // CASALECCHIO DI RENO
  // ════════════════════════════════════════
  { id: "bo29", name: "Hotel Torre Casalecchio",      city: "Casalecchio di Reno", region: "Bologna", lat: 44.4750, lng: 11.2890, stars: 3, basePrice: 90,  xoteloKey: "demo_bo29" },
  { id: "bo30", name: "Hotel Savoia Casalecchio",     city: "Casalecchio di Reno", region: "Bologna", lat: 44.4740, lng: 11.2869, stars: 3, basePrice: 85,  xoteloKey: "demo_bo30" },

  // ════════════════════════════════════════
  // SASSO MARCONI
  // ════════════════════════════════════════
  { id: "bo31", name: "Hotel Villa Rossi Sasso",      city: "Sasso Marconi", region: "Bologna", lat: 44.3950, lng: 11.2700, stars: 3, basePrice: 80,  xoteloKey: "demo_bo31" },
  { id: "bo32", name: "Hotel Autogrillo Sasso",       city: "Sasso Marconi", region: "Bologna", lat: 44.3940, lng: 11.2720, stars: 2, basePrice: 60,  xoteloKey: "demo_bo32" },

  // ════════════════════════════════════════
  // PIANORO
  // ════════════════════════════════════════
  { id: "bo33", name: "Hotel Pianoro",                city: "Pianoro", region: "Bologna", lat: 44.3900, lng: 11.3400, stars: 3, basePrice: 75,  xoteloKey: "demo_bo33" },

  // ════════════════════════════════════════
  // CASTEL SAN PIETRO TERME
  // ════════════════════════════════════════
  { id: "bo34", name: "Hotel Terme San Pietro",       city: "Castel San Pietro Terme", region: "Bologna", lat: 44.4011, lng: 11.5939, stars: 3, basePrice: 90,  xoteloKey: "demo_bo34" },
  { id: "bo35", name: "Hotel Castello San Pietro",    city: "Castel San Pietro Terme", region: "Bologna", lat: 44.4025, lng: 11.5950, stars: 3, basePrice: 85,  xoteloKey: "demo_bo35" },

  // ════════════════════════════════════════
  // IMOLA (provincia Bologna)
  // ════════════════════════════════════════
  { id: "bo36", name: "Centrale Park Hotel Imola",    city: "Imola", region: "Bologna", lat: 44.3541, lng: 11.7139, stars: 4, basePrice: 140, xoteloKey: "demo_bo36" },
  { id: "bo37", name: "Hotel Olimpo Imola",           city: "Imola", region: "Bologna", lat: 44.3560, lng: 11.7150, stars: 3, basePrice: 90,  xoteloKey: "demo_bo37" },
  { id: "bo38", name: "Hotel Donatello Imola",        city: "Imola", region: "Bologna", lat: 44.3521, lng: 11.7180, stars: 3, basePrice: 80,  xoteloKey: "demo_bo38" },
  { id: "bo39", name: "Hotel Molino Rosso",           city: "Imola", region: "Bologna", lat: 44.3580, lng: 11.7120, stars: 4, basePrice: 155, xoteloKey: "demo_bo39" },

  // ════════════════════════════════════════
  // MODENA
  // ════════════════════════════════════════
  { id: "mo1", name: "Canalgrande Hotel",             city: "Modena", region: "Modena", lat: 44.6458, lng: 10.9311, stars: 4, basePrice: 175, xoteloKey: "demo_mo1" },
  { id: "mo2", name: "Real Fini Hotel",               city: "Modena", region: "Modena", lat: 44.6392, lng: 10.9253, stars: 4, basePrice: 155, xoteloKey: "demo_mo2" },
  { id: "mo3", name: "Hotel Raffaello Modena",        city: "Modena", region: "Modena", lat: 44.6487, lng: 10.9264, stars: 4, basePrice: 140, xoteloKey: "demo_mo3" },
  { id: "mo4", name: "Rua Frati 48 Boutique",         city: "Modena", region: "Modena", lat: 44.6450, lng: 10.9185, stars: 3, basePrice: 100, xoteloKey: "demo_mo4" },
  { id: "mo5", name: "Rechigi Park Hotel",            city: "Modena", region: "Modena", lat: 44.6520, lng: 10.9380, stars: 4, basePrice: 130, xoteloKey: "demo_mo5" },
  { id: "mo6", name: "Hotel Centrale Modena",         city: "Modena", region: "Modena", lat: 44.6431, lng: 10.9275, stars: 3, basePrice: 90,  xoteloKey: "demo_mo6" },

  // ════════════════════════════════════════
  // FERRARA
  // ════════════════════════════════════════
  { id: "fe1", name: "Hotel Annunziata",              city: "Ferrara", region: "Ferrara", lat: 44.8358, lng: 11.6195, stars: 4, basePrice: 160, xoteloKey: "demo_fe1" },
  { id: "fe2", name: "Duchessa Isabella Hotel",       city: "Ferrara", region: "Ferrara", lat: 44.8348, lng: 11.6183, stars: 5, basePrice: 240, xoteloKey: "demo_fe2" },
  { id: "fe3", name: "Hotel Carlton Ferrara",         city: "Ferrara", region: "Ferrara", lat: 44.8389, lng: 11.6176, stars: 4, basePrice: 145, xoteloKey: "demo_fe3" },
  { id: "fe4", name: "Hotel Europa Ferrara",          city: "Ferrara", region: "Ferrara", lat: 44.8375, lng: 11.6210, stars: 3, basePrice: 95,  xoteloKey: "demo_fe4" },
  { id: "fe5", name: "Hotel Ripagrande",              city: "Ferrara", region: "Ferrara", lat: 44.8340, lng: 11.6220, stars: 4, basePrice: 135, xoteloKey: "demo_fe5" },

  // ════════════════════════════════════════
  // RAVENNA
  // ════════════════════════════════════════
  { id: "ra1", name: "Hotel Palazzo Bezzi",           city: "Ravenna", region: "Ravenna", lat: 44.4176, lng: 12.2035, stars: 4, basePrice: 150, xoteloKey: "demo_ra1" },
  { id: "ra2", name: "Hotel Bisanzio",                city: "Ravenna", region: "Ravenna", lat: 44.4153, lng: 12.2011, stars: 4, basePrice: 130, xoteloKey: "demo_ra2" },
  { id: "ra3", name: "Sant'Andrea Hotel",             city: "Ravenna", region: "Ravenna", lat: 44.4166, lng: 12.1991, stars: 3, basePrice: 85,  xoteloKey: "demo_ra3" },
  { id: "ra4", name: "Hotel Federici",                city: "Ravenna", region: "Ravenna", lat: 44.4198, lng: 12.2058, stars: 3, basePrice: 80,  xoteloKey: "demo_ra4" },
  { id: "ra5", name: "Hotel Diana Ravenna",           city: "Ravenna", region: "Ravenna", lat: 44.4185, lng: 12.1970, stars: 3, basePrice: 90,  xoteloKey: "demo_ra5" },
  { id: "ra6", name: "Grand Hotel Mattei",            city: "Ravenna", region: "Ravenna", lat: 44.4210, lng: 12.2080, stars: 4, basePrice: 145, xoteloKey: "demo_ra6" },
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
