// Minimal Neptun API client (Node 18+, no dependencies).
//
//   export NEPTUN_KEY=mapi_...
//   node neptun.mjs
//
// Docs: https://neptun.marine-api.com/docs/

const BASE = "https://neptun.marine-api.com/v1";

export class Neptun {
  constructor(key = process.env.NEPTUN_KEY, base = BASE) {
    if (!key) throw new Error("Set NEPTUN_KEY (get one at https://neptun.marine-api.com/pricing/)");
    this.key = key;
    this.base = base;
  }

  async #get(path, params = {}) {
    const url = new URL(`${this.base}/${path}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    }
    const r = await fetch(url, { headers: { Authorization: `Bearer ${this.key}` } });
    // 429 = monthly quota exhausted OR the per-minute limit; Retry-After tells you how long.
    if (r.status === 429) throw new Error(`rate limited, retry after ${r.headers.get("retry-after") ?? "?"}s`);
    if (r.status === 403) throw new Error("your key has no scope for this endpoint");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  // Tides and currents work worldwide (model-based); the rest is measured/official data.
  tides(lat, lon, days = 2) { return this.#get("tides", { lat, lon, days }); }
  currents(lat, lon, hours = 12) { return this.#get("currents", { lat, lon, hours }); }
  levels(lat, lon, radius = 25) { return this.#get("levels", { lat, lon, radius }); }
  warnings(lat, lon, radius = 50, lang = "en") { return this.#get("warnings", { lat, lon, radius, lang }); }
  locks(lat, lon, radius = 25) { return this.#get("locks", { lat, lon, radius }); }
  me() { return this.#get("me"); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = new Neptun();
  const [lat, lon] = [54.3233, 10.1394];          // Kiel

  const info = await n.me();
  console.log(`plan ${info.plan} · quota ${info.quota.used}/${info.quota.limit}`);

  const t = await n.tides(lat, lon);
  for (const e of (t.extremes ?? []).slice(0, 4)) {
    console.log(`  ${e.typ} ${String(e.hoehe).padStart(5)} m  ts=${e.ts}`);
  }

  // Every response carries `attribution` — the licences require you to carry it through.
  console.log("attribution:", (t.attribution ?? "").slice(0, 80));
}
