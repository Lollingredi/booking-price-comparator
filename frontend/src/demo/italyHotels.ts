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
  // ─── MODENA ───
  { id: "mo1", name: "Canalgrande Hotel", city: "Modena", region: "Modena", lat: 44.6458, lng: 10.9311, stars: 4, basePrice: 175, xoteloKey: "demo_mo1" },
  { id: "mo2", name: "Real Fini Hotel", city: "Modena", region: "Modena", lat: 44.6392, lng: 10.9253, stars: 4, basePrice: 155, xoteloKey: "demo_mo2" },
  { id: "mo3", name: "Hotel Raffaello Modena", city: "Modena", region: "Modena", lat: 44.6487, lng: 10.9264, stars: 4, basePrice: 140, xoteloKey: "demo_mo3" },
  { id: "mo4", name: "Rua Frati 48 Boutique", city: "Modena", region: "Modena", lat: 44.6450, lng: 10.9185, stars: 3, basePrice: 100, xoteloKey: "demo_mo4" },
  { id: "mo5", name: "Rechigi Park Hotel", city: "Modena", region: "Modena", lat: 44.6520, lng: 10.9380, stars: 4, basePrice: 130, xoteloKey: "demo_mo5" },
  { id: "mo6", name: "Hotel Centrale Modena", city: "Modena", region: "Modena", lat: 44.6431, lng: 10.9275, stars: 3, basePrice: 90, xoteloKey: "demo_mo6" },

  // ─── BOLOGNA ───
  { id: "bo1", name: "I Portici Hotel Bologna", city: "Bologna", region: "Bologna", lat: 44.4939, lng: 11.3399, stars: 5, basePrice: 350, xoteloKey: "demo_bo1" },
  { id: "bo2", name: "Grand Hotel Majestic", city: "Bologna", region: "Bologna", lat: 44.4979, lng: 11.3411, stars: 5, basePrice: 290, xoteloKey: "demo_bo2" },
  { id: "bo3", name: "Hotel Commercianti", city: "Bologna", region: "Bologna", lat: 44.4936, lng: 11.3414, stars: 4, basePrice: 210, xoteloKey: "demo_bo3" },
  { id: "bo4", name: "Hotel Corona d'Oro", city: "Bologna", region: "Bologna", lat: 44.4953, lng: 11.3425, stars: 4, basePrice: 195, xoteloKey: "demo_bo4" },
  { id: "bo5", name: "NH Bologna de la Gare", city: "Bologna", region: "Bologna", lat: 44.5013, lng: 11.3421, stars: 4, basePrice: 165, xoteloKey: "demo_bo5" },
  { id: "bo6", name: "Hotel Metropolitan Bologna", city: "Bologna", region: "Bologna", lat: 44.4896, lng: 11.3380, stars: 4, basePrice: 180, xoteloKey: "demo_bo6" },

  // ─── FERRARA ───
  { id: "fe1", name: "Hotel Annunziata", city: "Ferrara", region: "Ferrara", lat: 44.8358, lng: 11.6195, stars: 4, basePrice: 160, xoteloKey: "demo_fe1" },
  { id: "fe2", name: "Duchessa Isabella Hotel", city: "Ferrara", region: "Ferrara", lat: 44.8348, lng: 11.6183, stars: 5, basePrice: 240, xoteloKey: "demo_fe2" },
  { id: "fe3", name: "Hotel Carlton Ferrara", city: "Ferrara", region: "Ferrara", lat: 44.8389, lng: 11.6176, stars: 4, basePrice: 145, xoteloKey: "demo_fe3" },
  { id: "fe4", name: "Hotel Europa Ferrara", city: "Ferrara", region: "Ferrara", lat: 44.8375, lng: 11.6210, stars: 3, basePrice: 95, xoteloKey: "demo_fe4" },
  { id: "fe5", name: "Hotel Ripagrande", city: "Ferrara", region: "Ferrara", lat: 44.8340, lng: 11.6220, stars: 4, basePrice: 135, xoteloKey: "demo_fe5" },

  // ─── RAVENNA ───
  { id: "ra1", name: "Hotel Palazzo Bezzi", city: "Ravenna", region: "Ravenna", lat: 44.4176, lng: 12.2035, stars: 4, basePrice: 150, xoteloKey: "demo_ra1" },
  { id: "ra2", name: "Hotel Bisanzio", city: "Ravenna", region: "Ravenna", lat: 44.4153, lng: 12.2011, stars: 4, basePrice: 130, xoteloKey: "demo_ra2" },
  { id: "ra3", name: "Sant'Andrea Hotel", city: "Ravenna", region: "Ravenna", lat: 44.4166, lng: 12.1991, stars: 3, basePrice: 85, xoteloKey: "demo_ra3" },
  { id: "ra4", name: "Hotel Federici", city: "Ravenna", region: "Ravenna", lat: 44.4198, lng: 12.2058, stars: 3, basePrice: 80, xoteloKey: "demo_ra4" },
  { id: "ra5", name: "Hotel Diana Ravenna", city: "Ravenna", region: "Ravenna", lat: 44.4185, lng: 12.1970, stars: 3, basePrice: 90, xoteloKey: "demo_ra5" },
  { id: "ra6", name: "Grand Hotel Mattei", city: "Ravenna", region: "Ravenna", lat: 44.4210, lng: 12.2080, stars: 4, basePrice: 145, xoteloKey: "demo_ra6" },
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
