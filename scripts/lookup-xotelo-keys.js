#!/usr/bin/env node
/**
 * lookup-xotelo-keys.js
 *
 * Queries the Xotelo search API to find real hotel_key values for each hotel
 * in ITALY_HOTELS, then patches italyHotels.ts replacing all "demo_*" keys.
 *
 * Run with: node scripts/lookup-xotelo-keys.js
 * Output:   scripts/xotelo_keys.json   (raw results for review)
 *           patches italyHotels.ts in place
 *
 * Review xotelo_keys.json for NOT_FOUND entries and fill them manually.
 */

const https = require("https");
const fs    = require("fs");
const path  = require("path");

const HOTELS = [
  { id: "bo01", name: "I Portici Hotel Bologna",       city: "Bologna" },
  { id: "bo02", name: "Grand Hotel Majestic",           city: "Bologna" },
  { id: "bo03", name: "Hotel Commercianti",             city: "Bologna" },
  { id: "bo04", name: "Hotel Corona d'Oro",             city: "Bologna" },
  { id: "bo05", name: "NH Bologna de la Gare",          city: "Bologna" },
  { id: "bo06", name: "Hotel Metropolitan Bologna",     city: "Bologna" },
  { id: "bo07", name: "Hotel Baglioni Bologna",         city: "Bologna" },
  { id: "bo08", name: "Starhotels Excelsior",           city: "Bologna" },
  { id: "bo09", name: "Hotel Amadeus Bologna",          city: "Bologna" },
  { id: "bo10", name: "Hotel Touring Bologna",          city: "Bologna" },
  { id: "bo11", name: "Hotel Porta San Mamolo",         city: "Bologna" },
  { id: "bo12", name: "Albergo delle Drapperie",        city: "Bologna" },
  { id: "bo13", name: "Hotel Re Enzo",                  city: "Bologna" },
  { id: "bo14", name: "Hotel Aemilia Bologna",          city: "Bologna" },
  { id: "bo15", name: "Hotel Roma Bologna",             city: "Bologna" },
  { id: "bo16", name: "Il Convento dei Fiori di Seta",  city: "Bologna" },
  { id: "bo17", name: "NH Bologna Villanova",           city: "Bologna" },
  { id: "bo18", name: "Unaway Hotel Bologna Fiera",     city: "Bologna" },
  { id: "bo19", name: "Bologna Airport Hotel",          city: "Bologna" },
  { id: "bo20", name: "Mercure Bologna Airport",        city: "Calderara di Reno" },
  { id: "bo21", name: "Novotel Bologna Aeroporto",      city: "Calderara di Reno" },
  { id: "bo22", name: "Holiday Inn Bologna Aeroporto",  city: "Calderara di Reno" },
  { id: "bo23", name: "Hotel Calderara",                city: "Calderara di Reno" },
  { id: "bo24", name: "Hotel Granarolo",                city: "Granarolo dell'Emilia" },
  { id: "bo25", name: "Albergo La Pineta Granarolo",    city: "Granarolo dell'Emilia" },
  { id: "bo26", name: "Hotel Villa Granarolo",          city: "Granarolo dell'Emilia" },
  { id: "bo40", name: "Emma Hotel Bologna Fiera",       city: "Granarolo dell'Emilia" },
  { id: "bo27", name: "Hotel San Lazzaro",              city: "San Lazzaro di Savena" },
  { id: "bo28", name: "Villa Azzurra San Lazzaro",      city: "San Lazzaro di Savena" },
  { id: "bo29", name: "Hotel Torre Casalecchio",        city: "Casalecchio di Reno" },
  { id: "bo30", name: "Hotel Savoia Casalecchio",       city: "Casalecchio di Reno" },
  { id: "bo31", name: "Hotel Villa Rossi Sasso",        city: "Sasso Marconi" },
  { id: "bo32", name: "Hotel Autogrillo Sasso",         city: "Sasso Marconi" },
  { id: "bo33", name: "Hotel Pianoro",                  city: "Pianoro" },
  { id: "bo34", name: "Hotel Terme San Pietro",         city: "Castel San Pietro Terme" },
  { id: "bo35", name: "Hotel Castello San Pietro",      city: "Castel San Pietro Terme" },
  { id: "bo36", name: "Centrale Park Hotel Imola",      city: "Imola" },
  { id: "bo37", name: "Hotel Olimpo Imola",             city: "Imola" },
  { id: "bo38", name: "Hotel Donatello Imola",          city: "Imola" },
  { id: "bo39", name: "Hotel Molino Rosso",             city: "Imola" },
  { id: "mo1",  name: "Canalgrande Hotel",              city: "Modena" },
  { id: "mo2",  name: "Real Fini Hotel",                city: "Modena" },
  { id: "mo3",  name: "Hotel Raffaello Modena",         city: "Modena" },
  { id: "mo4",  name: "Rua Frati 48 Boutique",          city: "Modena" },
  { id: "mo5",  name: "Rechigi Park Hotel",             city: "Modena" },
  { id: "mo6",  name: "Hotel Centrale Modena",          city: "Modena" },
  { id: "fe1",  name: "Hotel Annunziata",               city: "Ferrara" },
  { id: "fe2",  name: "Duchessa Isabella Hotel",        city: "Ferrara" },
  { id: "fe3",  name: "Hotel Carlton Ferrara",          city: "Ferrara" },
  { id: "fe4",  name: "Hotel Europa Ferrara",           city: "Ferrara" },
  { id: "fe5",  name: "Hotel Ripagrande",               city: "Ferrara" },
  { id: "ra1",  name: "Hotel Palazzo Bezzi",            city: "Ravenna" },
  { id: "ra2",  name: "Hotel Bisanzio",                 city: "Ravenna" },
  { id: "ra3",  name: "Sant'Andrea Hotel",              city: "Ravenna" },
  { id: "ra4",  name: "Hotel Federici",                 city: "Ravenna" },
  { id: "ra5",  name: "Hotel Diana Ravenna",            city: "Ravenna" },
  { id: "ra6",  name: "Grand Hotel Mattei",             city: "Ravenna" },
];

const OUTPUT_JSON = path.join(__dirname, "xotelo_keys.json");
const ITALY_HOTELS_TS = path.join(__dirname, "../frontend/src/demo/italyHotels.ts");
const XOTELO_BASE = "data.xotelo.com";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function httpsGet(host, pathUrl) {
  return new Promise((resolve, reject) => {
    https.get({ host, path: pathUrl, headers: { "User-Agent": "RateScope/1.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message} — body: ${data.slice(0, 200)}`)); }
      });
    }).on("error", reject);
  });
}

function pickBestResult(results, hotelName) {
  if (!results || results.length === 0) return null;
  const nameLower = hotelName.toLowerCase();
  // Try exact name match first
  const exact = results.find((r) => r.name && r.name.toLowerCase() === nameLower);
  if (exact) return exact;
  // Try partial match (all words in hotel name appear in result)
  const words = nameLower.split(/\s+/).filter((w) => w.length > 3);
  const partial = results.find((r) =>
    r.name && words.every((w) => r.name.toLowerCase().includes(w))
  );
  if (partial) return partial;
  // Fallback: first result
  return results[0];
}

async function main() {
  const results = [];
  let found = 0, notFound = 0;

  console.log(`\nSearching Xotelo keys for ${HOTELS.length} hotels...\n`);
  console.log("ID       | Status     | Xotelo Key              | Name");
  console.log("-".repeat(80));

  for (const hotel of HOTELS) {
    const query = encodeURIComponent(`${hotel.name} ${hotel.city}`);
    const pathUrl = `/api/search?query=${query}`;

    let xoteloKey = null;
    let matchedName = null;
    let status = "NOT_FOUND";

    try {
      const data = await httpsGet(XOTELO_BASE, pathUrl);
      const raw = data.result || [];
      const best = pickBestResult(raw, hotel.name);
      if (best && best.key) {
        xoteloKey = best.key;
        matchedName = best.name;
        status = "FOUND";
        found++;
      } else {
        notFound++;
      }
    } catch (err) {
      status = "ERROR";
      notFound++;
      console.error(`  ERROR for ${hotel.id}: ${err.message}`);
    }

    console.log(
      `${hotel.id.padEnd(8)} | ${status.padEnd(10)} | ${(xoteloKey || "—").padEnd(23)} | ${hotel.name}` +
      (matchedName && matchedName !== hotel.name ? `  (→ "${matchedName}")` : "")
    );

    results.push({ id: hotel.id, name: hotel.name, city: hotel.city, xoteloKey, matchedName, status });

    await sleep(300); // gentle rate limiting
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));

  console.log("\n" + "=".repeat(80));
  console.log(`✓ Found:     ${found}`);
  console.log(`✗ Not found: ${notFound}`);
  console.log(`\nResults saved to: ${OUTPUT_JSON}`);

  // Patch italyHotels.ts
  const foundResults = results.filter((r) => r.xoteloKey);
  if (foundResults.length === 0) {
    console.log("\nNo keys found — italyHotels.ts NOT modified.");
    return;
  }

  console.log(`\nPatching italyHotels.ts with ${foundResults.length} real keys...`);
  let ts = fs.readFileSync(ITALY_HOTELS_TS, "utf8");
  let patched = 0;

  for (const r of foundResults) {
    const demoKey = `demo_${r.id}`;
    if (ts.includes(`"${demoKey}"`)) {
      ts = ts.replace(`"${demoKey}"`, `"${r.xoteloKey}"`);
      patched++;
    }
  }

  fs.writeFileSync(ITALY_HOTELS_TS, ts);
  console.log(`✓ Patched ${patched} keys in italyHotels.ts`);

  if (notFound > 0) {
    console.log(`\n⚠ ${notFound} hotels NOT found — their keys remain "demo_*".`);
    console.log("  Search for them manually on https://data.xotelo.com/api/search?query=...");
    console.log("  Then update italyHotels.ts with the real key.");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
