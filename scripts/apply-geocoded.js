#!/usr/bin/env node
/**
 * apply-geocoded.js
 *
 * Reads scripts/geocoded_hotels.json (produced by geocode-hotels.js)
 * and patches the lat/lng values in frontend/src/demo/italyHotels.ts.
 *
 * Run with: node scripts/apply-geocoded.js [--dry-run]
 *
 * Options:
 *   --dry-run   Print changes without writing the file
 */

const fs   = require("fs");
const path = require("path");

const JSON_FILE = path.join(__dirname, "geocoded_hotels.json");
const TS_FILE   = path.join(__dirname, "../frontend/src/demo/italyHotels.ts");
const DRY_RUN   = process.argv.includes("--dry-run");

// ── Load JSON ─────────────────────────────────────────────────────────────────
if (!fs.existsSync(JSON_FILE)) {
  console.error(`✗ Not found: ${JSON_FILE}`);
  console.error("  Run 'node scripts/geocode-hotels.js' first (needs internet).");
  process.exit(1);
}

const hotels = JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
const found  = hotels.filter((h) => h.found);

if (found.length === 0) {
  console.error("✗ No hotels with found=true in geocoded_hotels.json.");
  console.error("  Did geocode-hotels.js succeed? It needs internet access.");
  process.exit(1);
}

// ── Load TS source ─────────────────────────────────────────────────────────────
let src = fs.readFileSync(TS_FILE, "utf8");

let patched = 0;
let skipped = 0;

for (const h of found) {
  // Match the id field on a line and then find the lat/lng on the same logical entry.
  // Each hotel row looks like:
  //   { id: "bo01", name: "...", city: "...", region: "...", lat: 44.XXXX, lng: 11.XXXX, stars: ...
  const idPattern = new RegExp(
    `(\\{\\s*id:\\s*"${h.id}",[^}]+?)lat:\\s*[-\\d.]+,\\s*lng:\\s*[-\\d.]+`,
    "s"
  );

  const newLatLng = `lat: ${h.lat.toFixed(6)}, lng: ${h.lng.toFixed(6)}`;

  if (!idPattern.test(src)) {
    console.warn(`  ⚠ id="${h.id}" not found in TS file — skipped`);
    skipped++;
    continue;
  }

  const before = src;
  src = src.replace(idPattern, `$1${newLatLng}`);

  if (src === before) {
    console.warn(`  ⚠ id="${h.id}" matched but no replacement made — skipped`);
    skipped++;
  } else {
    const oldEntry = hotels.find((x) => x.id === h.id);
    const dLat = Math.abs(h.lat - (oldEntry?.oldLat ?? 0)).toFixed(4);
    const dLng = Math.abs(h.lng - (oldEntry?.oldLng ?? 0)).toFixed(4);
    const flag  = (parseFloat(dLat) > 0.003 || parseFloat(dLng) > 0.003) ? " ⚠ BIG SHIFT" : "";
    console.log(`  ✓ ${h.id.padEnd(5)}  Δlat=${dLat}  Δlng=${dLng}  ${h.name}${flag}`);
    patched++;
  }
}

console.log(`\n──────────────────────────────────`);
console.log(`  Patched : ${patched}`);
console.log(`  Skipped : ${skipped}`);
console.log(`  No data : ${hotels.length - found.length} (found=false)`);

if (DRY_RUN) {
  console.log("\n  [DRY RUN] italyHotels.ts NOT modified.");
} else {
  fs.writeFileSync(TS_FILE, src, "utf8");
  console.log(`\n  ✓ Written: ${TS_FILE}`);
}
