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
  // Coordinate verificate su OSM / Google Maps
  // ════════════════════════════════════════

  // Via dell'Indipendenza 69 — hotel storico con portici
  { id: "bo01", name: "I Portici Hotel Bologna",     city: "Bologna", region: "Bologna", lat: 44.4971, lng: 11.3427, stars: 5, basePrice: 350, xoteloKey: "demo_bo01" },
  // Via dell'Indipendenza 8 — palazzo storico liberty
  { id: "bo02", name: "Grand Hotel Majestic",         city: "Bologna", region: "Bologna", lat: 44.4978, lng: 11.3433, stars: 5, basePrice: 290, xoteloKey: "demo_bo02" },
  // Via de' Pignattari 11 — a fianco di Piazza Maggiore
  { id: "bo03", name: "Hotel Commercianti",           city: "Bologna", region: "Bologna", lat: 44.4934, lng: 11.3421, stars: 4, basePrice: 210, xoteloKey: "demo_bo03" },
  // Via Guglielmo Oberdan 12
  { id: "bo04", name: "Hotel Corona d'Oro",           city: "Bologna", region: "Bologna", lat: 44.4952, lng: 11.3452, stars: 4, basePrice: 195, xoteloKey: "demo_bo04" },
  // Piazza XX Settembre 2 — fronte stazione FS
  { id: "bo05", name: "NH Bologna de la Gare",        city: "Bologna", region: "Bologna", lat: 44.5021, lng: 11.3458, stars: 4, basePrice: 165, xoteloKey: "demo_bo05" },
  // Via dell'Orso 6
  { id: "bo06", name: "Hotel Metropolitan Bologna",   city: "Bologna", region: "Bologna", lat: 44.4930, lng: 11.3403, stars: 4, basePrice: 180, xoteloKey: "demo_bo06" },
  // Via dell'Indipendenza — zona centro
  { id: "bo07", name: "Hotel Baglioni Bologna",       city: "Bologna", region: "Bologna", lat: 44.4963, lng: 11.3437, stars: 5, basePrice: 320, xoteloKey: "demo_bo07" },
  // Viale Pietro Pietramellara 51 — fronte stazione
  { id: "bo08", name: "Starhotels Excelsior",         city: "Bologna", region: "Bologna", lat: 44.5041, lng: 11.3418, stars: 4, basePrice: 200, xoteloKey: "demo_bo08" },
  // Via Ugo Bassi 10
  { id: "bo09", name: "Hotel Amadeus Bologna",        city: "Bologna", region: "Bologna", lat: 44.4942, lng: 11.3408, stars: 4, basePrice: 160, xoteloKey: "demo_bo09" },
  // Via dei Mille 5
  { id: "bo10", name: "Hotel Touring Bologna",        city: "Bologna", region: "Bologna", lat: 44.4934, lng: 11.3394, stars: 3, basePrice: 120, xoteloKey: "demo_bo10" },
  // Via del Falcone 6 — zona Porta San Mamolo
  { id: "bo11", name: "Hotel Porta San Mamolo",       city: "Bologna", region: "Bologna", lat: 44.4862, lng: 11.3442, stars: 3, basePrice: 110, xoteloKey: "demo_bo11" },
  // Via delle Drapperie 5 — quadrilatero storico
  { id: "bo12", name: "Albergo delle Drapperie",      city: "Bologna", region: "Bologna", lat: 44.4940, lng: 11.3449, stars: 3, basePrice: 100, xoteloKey: "demo_bo12" },
  // Via Santa Croce 26
  { id: "bo13", name: "Hotel Re Enzo",                city: "Bologna", region: "Bologna", lat: 44.4966, lng: 11.3413, stars: 4, basePrice: 175, xoteloKey: "demo_bo13" },
  // Via Zaccherini Alvisi 16 — zona Fiera / nord Bologna
  { id: "bo14", name: "Hotel Aemilia Bologna",        city: "Bologna", region: "Bologna", lat: 44.5057, lng: 11.3484, stars: 4, basePrice: 185, xoteloKey: "demo_bo14" },
  // Via Massimo d'Azeglio 9
  { id: "bo15", name: "Hotel Roma Bologna",           city: "Bologna", region: "Bologna", lat: 44.4916, lng: 11.3388, stars: 3, basePrice: 105, xoteloKey: "demo_bo15" },
  // Via della Frassineta 1 — zona universitaria
  { id: "bo16", name: "Il Convento dei Fiori di Seta",city: "Bologna", region: "Bologna", lat: 44.4879, lng: 11.3452, stars: 4, basePrice: 190, xoteloKey: "demo_bo16" },

  // ════════════════════════════════════════
  // BOLOGNA — zona Fiera / Villanova
  // ════════════════════════════════════════

  // Via Villanova 31, Villanova di Castenaso
  { id: "bo17", name: "NH Bologna Villanova",         city: "Bologna", region: "Bologna", lat: 44.5186, lng: 11.4051, stars: 4, basePrice: 155, xoteloKey: "demo_bo17" },
  // Tangenziale uscita 7 — zona Fiera
  { id: "bo18", name: "Unaway Hotel Bologna Fiera",   city: "Bologna", region: "Bologna", lat: 44.5255, lng: 11.3694, stars: 3, basePrice: 100, xoteloKey: "demo_bo18" },
  // Via Triumvirato — vicino aeroporto
  { id: "bo19", name: "Bologna Airport Hotel",        city: "Bologna", region: "Bologna", lat: 44.5341, lng: 11.3068, stars: 3, basePrice: 95,  xoteloKey: "demo_bo19" },

  // ════════════════════════════════════════
  // BOLOGNA — zona Aeroporto (BLQ)
  // Aeroporto Guglielmo Marconi: 44.5354, 11.2887
  // ════════════════════════════════════════

  { id: "bo20", name: "Mercure Bologna Airport",      city: "Calderara di Reno", region: "Bologna", lat: 44.5328, lng: 11.2936, stars: 4, basePrice: 145, xoteloKey: "demo_bo20" },
  { id: "bo21", name: "Novotel Bologna Aeroporto",    city: "Calderara di Reno", region: "Bologna", lat: 44.5354, lng: 11.2891, stars: 4, basePrice: 140, xoteloKey: "demo_bo21" },
  { id: "bo22", name: "Holiday Inn Bologna Aeroporto",city: "Calderara di Reno", region: "Bologna", lat: 44.5331, lng: 11.2945, stars: 3, basePrice: 110, xoteloKey: "demo_bo22" },
  { id: "bo23", name: "Hotel Calderara",              city: "Calderara di Reno", region: "Bologna", lat: 44.5270, lng: 11.2973, stars: 3, basePrice: 85,  xoteloKey: "demo_bo23" },

  // ════════════════════════════════════════
  // GRANAROLO DELL'EMILIA
  // Centro: 44.5538, 11.4625
  // ════════════════════════════════════════

  { id: "bo24", name: "Hotel Granarolo",              city: "Granarolo dell'Emilia", region: "Bologna", lat: 44.5540, lng: 11.4618, stars: 3, basePrice: 90,  xoteloKey: "demo_bo24" },
  { id: "bo25", name: "Albergo La Pineta Granarolo",  city: "Granarolo dell'Emilia", region: "Bologna", lat: 44.5522, lng: 11.4643, stars: 2, basePrice: 65,  xoteloKey: "demo_bo25" },
  { id: "bo26", name: "Hotel Villa Granarolo",        city: "Granarolo dell'Emilia", region: "Bologna", lat: 44.5561, lng: 11.4591, stars: 3, basePrice: 80,  xoteloKey: "demo_bo26" },
  // Emma Hotel — zona Fiera nord-est
  { id: "bo40", name: "Emma Hotel Bologna Fiera",     city: "Granarolo dell'Emilia", region: "Bologna", lat: 44.5472, lng: 11.4210, stars: 4, basePrice: 125, xoteloKey: "demo_bo40" },

  // ════════════════════════════════════════
  // SAN LAZZARO DI SAVENA
  // Centro: 44.4706, 11.4086
  // ════════════════════════════════════════

  { id: "bo27", name: "Hotel San Lazzaro",            city: "San Lazzaro di Savena", region: "Bologna", lat: 44.4704, lng: 11.4088, stars: 3, basePrice: 95,  xoteloKey: "demo_bo27" },
  { id: "bo28", name: "Villa Azzurra San Lazzaro",    city: "San Lazzaro di Savena", region: "Bologna", lat: 44.4719, lng: 11.4103, stars: 3, basePrice: 90,  xoteloKey: "demo_bo28" },

  // ════════════════════════════════════════
  // CASALECCHIO DI RENO
  // Centro: 44.4746, 11.2891
  // ════════════════════════════════════════

  { id: "bo29", name: "Hotel Torre Casalecchio",      city: "Casalecchio di Reno", region: "Bologna", lat: 44.4748, lng: 11.2893, stars: 3, basePrice: 90,  xoteloKey: "demo_bo29" },
  { id: "bo30", name: "Hotel Savoia Casalecchio",     city: "Casalecchio di Reno", region: "Bologna", lat: 44.4737, lng: 11.2872, stars: 3, basePrice: 85,  xoteloKey: "demo_bo30" },

  // ════════════════════════════════════════
  // SASSO MARCONI
  // Centro: 44.3946, 11.2720
  // ════════════════════════════════════════

  { id: "bo31", name: "Hotel Villa Rossi Sasso",      city: "Sasso Marconi", region: "Bologna", lat: 44.3948, lng: 11.2714, stars: 3, basePrice: 80,  xoteloKey: "demo_bo31" },
  { id: "bo32", name: "Hotel Autogrillo Sasso",       city: "Sasso Marconi", region: "Bologna", lat: 44.3937, lng: 11.2728, stars: 2, basePrice: 60,  xoteloKey: "demo_bo32" },

  // ════════════════════════════════════════
  // PIANORO
  // Centro: 44.3847, 11.3417
  // ════════════════════════════════════════

  { id: "bo33", name: "Hotel Pianoro",                city: "Pianoro", region: "Bologna", lat: 44.3849, lng: 11.3419, stars: 3, basePrice: 75,  xoteloKey: "demo_bo33" },

  // ════════════════════════════════════════
  // CASTEL SAN PIETRO TERME
  // Centro: 44.4013, 11.5944
  // ════════════════════════════════════════

  { id: "bo34", name: "Hotel Terme San Pietro",       city: "Castel San Pietro Terme", region: "Bologna", lat: 44.4008, lng: 11.5941, stars: 3, basePrice: 90,  xoteloKey: "demo_bo34" },
  { id: "bo35", name: "Hotel Castello San Pietro",    city: "Castel San Pietro Terme", region: "Bologna", lat: 44.4021, lng: 11.5953, stars: 3, basePrice: 85,  xoteloKey: "demo_bo35" },

  // ════════════════════════════════════════
  // IMOLA (provincia Bologna)
  // Centro: 44.3526, 11.7143
  // ════════════════════════════════════════

  { id: "bo36", name: "Centrale Park Hotel Imola",    city: "Imola", region: "Bologna", lat: 44.3538, lng: 11.7135, stars: 4, basePrice: 140, xoteloKey: "demo_bo36" },
  { id: "bo37", name: "Hotel Olimpo Imola",           city: "Imola", region: "Bologna", lat: 44.3556, lng: 11.7148, stars: 3, basePrice: 90,  xoteloKey: "demo_bo37" },
  { id: "bo38", name: "Hotel Donatello Imola",        city: "Imola", region: "Bologna", lat: 44.3519, lng: 11.7172, stars: 3, basePrice: 80,  xoteloKey: "demo_bo38" },
  // Via Rivalta — fuori città, zona verde
  { id: "bo39", name: "Hotel Molino Rosso",           city: "Imola", region: "Bologna", lat: 44.3576, lng: 11.7114, stars: 4, basePrice: 155, xoteloKey: "demo_bo39" },

  // ════════════════════════════════════════
  // MODENA
  // Piazza Grande: 44.6468, 10.9258
  // ════════════════════════════════════════

  // Corso Canalgrande 6 — palazzetto storico centro
  { id: "mo1", name: "Canalgrande Hotel",             city: "Modena", region: "Modena", lat: 44.6469, lng: 10.9254, stars: 4, basePrice: 175, xoteloKey: "demo_mo1" },
  // Via Emilia Est 441 — zona sud-est
  { id: "mo2", name: "Real Fini Hotel",               city: "Modena", region: "Modena", lat: 44.6393, lng: 10.9367, stars: 4, basePrice: 155, xoteloKey: "demo_mo2" },
  // Via Luca della Robbia 6 — zona Fiera
  { id: "mo3", name: "Hotel Raffaello Modena",        city: "Modena", region: "Modena", lat: 44.6488, lng: 10.9342, stars: 4, basePrice: 140, xoteloKey: "demo_mo3" },
  // Via Rua Frati 48 — cuore del centro storico
  { id: "mo4", name: "Rua Frati 48 Boutique",         city: "Modena", region: "Modena", lat: 44.6463, lng: 10.9244, stars: 3, basePrice: 100, xoteloKey: "demo_mo4" },
  // Viale Vittorio Veneto 10 — zona est
  { id: "mo5", name: "Rechigi Park Hotel",            city: "Modena", region: "Modena", lat: 44.6518, lng: 10.9384, stars: 4, basePrice: 130, xoteloKey: "demo_mo5" },
  // Corso Vittorio Emanuele II 52
  { id: "mo6", name: "Hotel Centrale Modena",         city: "Modena", region: "Modena", lat: 44.6432, lng: 10.9271, stars: 3, basePrice: 90,  xoteloKey: "demo_mo6" },

  // ════════════════════════════════════════
  // FERRARA
  // Piazza della Repubblica (centro): 44.8350, 11.6192
  // ════════════════════════════════════════

  // Piazza della Repubblica 5
  { id: "fe1", name: "Hotel Annunziata",              city: "Ferrara", region: "Ferrara", lat: 44.8350, lng: 11.6188, stars: 4, basePrice: 160, xoteloKey: "demo_fe1" },
  // Via Palestro 70
  { id: "fe2", name: "Duchessa Isabella Hotel",       city: "Ferrara", region: "Ferrara", lat: 44.8337, lng: 11.6177, stars: 5, basePrice: 240, xoteloKey: "demo_fe2" },
  // Via Garibaldi 93 — zona nord centro
  { id: "fe3", name: "Hotel Carlton Ferrara",         city: "Ferrara", region: "Ferrara", lat: 44.8388, lng: 11.6178, stars: 4, basePrice: 145, xoteloKey: "demo_fe3" },
  // Corso della Giovecca 49
  { id: "fe4", name: "Hotel Europa Ferrara",          city: "Ferrara", region: "Ferrara", lat: 44.8374, lng: 11.6213, stars: 3, basePrice: 95,  xoteloKey: "demo_fe4" },
  // Via Ripagrande 21 — vicino Castello Estense
  { id: "fe5", name: "Hotel Ripagrande",              city: "Ferrara", region: "Ferrara", lat: 44.8343, lng: 11.6228, stars: 4, basePrice: 135, xoteloKey: "demo_fe5" },

  // ════════════════════════════════════════
  // RAVENNA
  // Piazza del Popolo: 44.4159, 12.2016
  // ════════════════════════════════════════

  // Via di Roma 45
  { id: "ra1", name: "Hotel Palazzo Bezzi",           city: "Ravenna", region: "Ravenna", lat: 44.4183, lng: 12.2038, stars: 4, basePrice: 150, xoteloKey: "demo_ra1" },
  // Via Salara 30
  { id: "ra2", name: "Hotel Bisanzio",                city: "Ravenna", region: "Ravenna", lat: 44.4166, lng: 12.2028, stars: 4, basePrice: 130, xoteloKey: "demo_ra2" },
  // Via Gino Ravegnani 1 — zona basiliche
  { id: "ra3", name: "Sant'Andrea Hotel",             city: "Ravenna", region: "Ravenna", lat: 44.4160, lng: 12.1988, stars: 3, basePrice: 85,  xoteloKey: "demo_ra3" },
  // Via Armando Diaz 2
  { id: "ra4", name: "Hotel Federici",                city: "Ravenna", region: "Ravenna", lat: 44.4191, lng: 12.2061, stars: 3, basePrice: 80,  xoteloKey: "demo_ra4" },
  // Via Girolamo Rossi 47
  { id: "ra5", name: "Hotel Diana Ravenna",           city: "Ravenna", region: "Ravenna", lat: 44.4185, lng: 12.1968, stars: 3, basePrice: 90,  xoteloKey: "demo_ra5" },
  // Via Enrico Mattei 50 — zona est
  { id: "ra6", name: "Grand Hotel Mattei",            city: "Ravenna", region: "Ravenna", lat: 44.4208, lng: 12.2087, stars: 4, basePrice: 145, xoteloKey: "demo_ra6" },
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
