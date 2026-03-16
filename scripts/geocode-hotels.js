#!/usr/bin/env node
/**
 * geocode-hotels.js
 *
 * Queries Nominatim OSM for the real coordinates of each demo hotel.
 * Run with: node scripts/geocode-hotels.js
 * Output:   scripts/geocoded_hotels.json
 *
 * After running, review the output and update italyHotels.ts accordingly.
 * Hotels flagged NOT_FOUND should be looked up manually on nominatim.openstreetmap.org
 */

const https = require("https");
const fs    = require("fs");
const path  = require("path");

// ── Hotel list (id, name, city, current lat/lng for comparison) ────────────
const HOTELS = [
  { id: "bo01", name: "I Portici Hotel Bologna",      city: "Bologna",              lat: 44.4939, lng: 11.3399 },
  { id: "bo02", name: "Grand Hotel Majestic",          city: "Bologna",              lat: 44.4979, lng: 11.3411 },
  { id: "bo03", name: "Hotel Commercianti",            city: "Bologna",              lat: 44.4936, lng: 11.3414 },
  { id: "bo04", name: "Hotel Corona d'Oro",            city: "Bologna",              lat: 44.4953, lng: 11.3425 },
  { id: "bo05", name: "NH Bologna de la Gare",         city: "Bologna",              lat: 44.5013, lng: 11.3421 },
  { id: "bo06", name: "Hotel Metropolitan Bologna",    city: "Bologna",              lat: 44.4896, lng: 11.3380 },
  { id: "bo07", name: "Hotel Baglioni Bologna",        city: "Bologna",              lat: 44.4958, lng: 11.3462 },
  { id: "bo08", name: "Starhotels Excelsior",          city: "Bologna",              lat: 44.5029, lng: 11.3432 },
  { id: "bo09", name: "Hotel Amadeus Bologna",         city: "Bologna",              lat: 44.4893, lng: 11.3352 },
  { id: "bo10", name: "Hotel Touring Bologna",         city: "Bologna",              lat: 44.4934, lng: 11.3358 },
  { id: "bo11", name: "Hotel Porta San Mamolo",        city: "Bologna",              lat: 44.4870, lng: 11.3430 },
  { id: "bo12", name: "Albergo delle Drapperie",       city: "Bologna",              lat: 44.4940, lng: 11.3445 },
  { id: "bo13", name: "Hotel Re Enzo",                 city: "Bologna",              lat: 44.4965, lng: 11.3410 },
  { id: "bo14", name: "Hotel Aemilia Bologna",         city: "Bologna",              lat: 44.5051, lng: 11.3479 },
  { id: "bo15", name: "Hotel Roma Bologna",            city: "Bologna",              lat: 44.4921, lng: 11.3376 },
  { id: "bo16", name: "Il Convento dei Fiori di Seta", city: "Bologna",              lat: 44.4880, lng: 11.3450 },
  { id: "bo17", name: "NH Bologna Villanova",          city: "Bologna",              lat: 44.5200, lng: 11.3650 },
  { id: "bo18", name: "Unaway Hotel Bologna Fiera",    city: "Bologna",              lat: 44.5208, lng: 11.3660 },
  { id: "bo19", name: "Bologna Airport Hotel",         city: "Bologna",              lat: 44.5215, lng: 11.3680 },
  { id: "bo20", name: "Mercure Bologna Airport",       city: "Calderara di Reno",    lat: 44.5338, lng: 11.2960 },
  { id: "bo21", name: "Novotel Bologna Aeroporto",     city: "Calderara di Reno",    lat: 44.5340, lng: 11.2990 },
  { id: "bo22", name: "Holiday Inn Bologna Aeroporto", city: "Calderara di Reno",    lat: 44.5330, lng: 11.2970 },
  { id: "bo23", name: "Hotel Calderara",               city: "Calderara di Reno",    lat: 44.5300, lng: 11.2950 },
  { id: "bo24", name: "Hotel Granarolo",               city: "Granarolo dell'Emilia",lat: 44.5553, lng: 11.4611 },
  { id: "bo25", name: "Albergo La Pineta Granarolo",   city: "Granarolo dell'Emilia",lat: 44.5530, lng: 11.4630 },
  { id: "bo26", name: "Hotel Villa Granarolo",         city: "Granarolo dell'Emilia",lat: 44.5570, lng: 11.4580 },
  { id: "bo40", name: "Emma Hotel Bologna Fiera",      city: "Granarolo dell'Emilia",lat: 44.5477, lng: 11.4198 },
  { id: "bo27", name: "Hotel San Lazzaro",             city: "San Lazzaro di Savena",lat: 44.4706, lng: 11.4086 },
  { id: "bo28", name: "Villa Azzurra San Lazzaro",     city: "San Lazzaro di Savena",lat: 44.4720, lng: 11.4100 },
  { id: "bo29", name: "Hotel Torre Casalecchio",       city: "Casalecchio di Reno",  lat: 44.4750, lng: 11.2890 },
  { id: "bo30", name: "Hotel Savoia Casalecchio",      city: "Casalecchio di Reno",  lat: 44.4740, lng: 11.2869 },
  { id: "bo31", name: "Hotel Villa Rossi Sasso",       city: "Sasso Marconi",        lat: 44.3950, lng: 11.2700 },
  { id: "bo32", name: "Hotel Autogrillo Sasso",        city: "Sasso Marconi",        lat: 44.3940, lng: 11.2720 },
  { id: "bo33", name: "Hotel Pianoro",                 city: "Pianoro",              lat: 44.3900, lng: 11.3400 },
  { id: "bo34", name: "Hotel Terme San Pietro",        city: "Castel San Pietro Terme", lat: 44.4011, lng: 11.5939 },
  { id: "bo35", name: "Hotel Castello San Pietro",     city: "Castel San Pietro Terme", lat: 44.4025, lng: 11.5950 },
  { id: "bo36", name: "Centrale Park Hotel Imola",     city: "Imola",                lat: 44.3541, lng: 11.7139 },
  { id: "bo37", name: "Hotel Olimpo Imola",            city: "Imola",                lat: 44.3560, lng: 11.7150 },
  { id: "bo38", name: "Hotel Donatello Imola",         city: "Imola",                lat: 44.3521, lng: 11.7180 },
  { id: "bo39", name: "Hotel Molino Rosso",            city: "Imola",                lat: 44.3580, lng: 11.7120 },
  { id: "mo1",  name: "Canalgrande Hotel",             city: "Modena",               lat: 44.6458, lng: 10.9311 },
  { id: "mo2",  name: "Real Fini Hotel",               city: "Modena",               lat: 44.6392, lng: 10.9253 },
  { id: "mo3",  name: "Hotel Raffaello Modena",        city: "Modena",               lat: 44.6487, lng: 10.9264 },
  { id: "mo4",  name: "Rua Frati 48 Boutique",         city: "Modena",               lat: 44.6450, lng: 10.9185 },
  { id: "mo5",  name: "Rechigi Park Hotel",            city: "Modena",               lat: 44.6520, lng: 10.9380 },
  { id: "mo6",  name: "Hotel Centrale Modena",         city: "Modena",               lat: 44.6431, lng: 10.9275 },
  { id: "fe1",  name: "Hotel Annunziata",              city: "Ferrara",              lat: 44.8358, lng: 11.6195 },
  { id: "fe2",  name: "Duchessa Isabella Hotel",       city: "Ferrara",              lat: 44.8348, lng: 11.6183 },
  { id: "fe3",  name: "Hotel Carlton Ferrara",         city: "Ferrara",              lat: 44.8389, lng: 11.6176 },
  { id: "fe4",  name: "Hotel Europa Ferrara",          city: "Ferrara",              lat: 44.8375, lng: 11.6210 },
  { id: "fe5",  name: "Hotel Ripagrande",              city: "Ferrara",              lat: 44.8340, lng: 11.6220 },
  { id: "ra1",  name: "Hotel Palazzo Bezzi",           city: "Ravenna",              lat: 44.4176, lng: 12.2035 },
  { id: "ra2",  name: "Hotel Bisanzio",                city: "Ravenna",              lat: 44.4153, lng: 12.2011 },
  { id: "ra3",  name: "Sant'Andrea Hotel",             city: "Ravenna",              lat: 44.4166, lng: 12.1991 },
  { id: "ra4",  name: "Hotel Federici",                city: "Ravenna",              lat: 44.4198, lng: 12.2058 },
  { id: "ra5",  name: "Hotel Diana Ravenna",           city: "Ravenna",              lat: 44.4185, lng: 12.1970 },
  { id: "ra6",  name: "Grand Hotel Mattei",            city: "Ravenna",              lat: 44.4210, lng: 12.2080 },
];

const ACCOMMODATION_TYPES = new Set(["hotel", "hostel", "motel", "guest_house", "apartment"]);
const OUTPUT_FILE = path.join(__dirname, "geocoded_hotels.json");
const BIG_SHIFT_THRESHOLD = 0.003; // ~300m

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent": "RateScope-Demo-Geocoder/1.0 (contact: demo@ratescope.it)",
        "Accept-Language": "it,en",
      },
    };
    https.get(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    }).on("error", reject);
  });
}

function pickBestResult(results, hotelName) {
  if (!results || results.length === 0) return null;
  // Prefer results whose display_name contains the hotel name (partial, case-insensitive)
  const nameLower = hotelName.toLowerCase().split(" ").slice(0, 3).join(" ");
  const nameMatch = results.find((r) =>
    r.display_name.toLowerCase().includes(nameLower.split(" ")[0])
  );
  // Prefer accommodation type
  const accommodationType = results.find((r) =>
    r.class === "tourism" && ACCOMMODATION_TYPES.has(r.type)
  );
  return accommodationType || nameMatch || results[0];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const results = [];
  let found = 0, notFound = 0, bigShift = 0;

  console.log(`\nGeocoding ${HOTELS.length} hotels via Nominatim OSM...\n`);
  console.log("ID       | Status     | Shift    | Name");
  console.log("-".repeat(75));

  for (const hotel of HOTELS) {
    const query  = encodeURIComponent(`${hotel.name}, ${hotel.city}, Italy`);
    const url    = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&addressdetails=1&accept-language=it`;

    let newLat = hotel.lat;
    let newLng = hotel.lng;
    let status = "NOT_FOUND";

    try {
      const data = await httpsGet(url);
      const best = pickBestResult(data, hotel.name);

      if (best) {
        newLat = parseFloat(best.lat);
        newLng = parseFloat(best.lon);
        status = `${best.class}/${best.type}`;
        found++;
      } else {
        notFound++;
      }
    } catch (err) {
      console.error(`  ERROR for ${hotel.id}: ${err.message}`);
      notFound++;
      status = "ERROR";
    }

    const dLat = Math.abs(newLat - hotel.lat);
    const dLng = Math.abs(newLng - hotel.lng);
    const isLarge = dLat > BIG_SHIFT_THRESHOLD || dLng > BIG_SHIFT_THRESHOLD;
    if (isLarge && status !== "NOT_FOUND") bigShift++;

    const shiftStr = status !== "NOT_FOUND"
      ? `Δ${dLat.toFixed(4)},${dLng.toFixed(4)}`
      : "  —  ";
    const flag = isLarge ? " ⚠" : "";

    console.log(
      `${hotel.id.padEnd(8)} | ${status.substring(0,10).padEnd(10)} | ${shiftStr.padEnd(8)} | ${hotel.name}${flag}`
    );

    results.push({
      id:      hotel.id,
      name:    hotel.name,
      city:    hotel.city,
      oldLat:  hotel.lat,
      oldLng:  hotel.lng,
      lat:     newLat,
      lng:     newLng,
      found:   status !== "NOT_FOUND" && status !== "ERROR",
      status,
      bigShift: isLarge,
    });

    // Respect Nominatim usage policy: max 1 req/second
    await sleep(1100);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  console.log("\n" + "=".repeat(75));
  console.log(`✓ Found:     ${found}`);
  console.log(`✗ Not found: ${notFound}`);
  console.log(`⚠ Big shift: ${bigShift} (>300m change)`);
  console.log(`\nOutput written to: ${OUTPUT_FILE}`);
  console.log("\nNext step: review the output, then update italyHotels.ts");
  console.log("Hotels with bigShift=true need manual verification on nominatim.openstreetmap.org\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
