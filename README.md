# Neptun — marine data API clients

Two tiny clients for the [Neptun marine data API](https://neptun.marine-api.com/) — tides, tidal
currents, water level gauges, navigational notices and locks, from one key.

No framework, no build step. Copy one into your project and delete what you don't need.

**Free tier:** 1,000 calls/month for development and non-commercial use, all endpoints, no card
required — [get a key](https://neptun.marine-api.com/#pricing).

| File | Runtime |
|---|---|
| [`neptun.py`](neptun.py) | Python 3.9+, `requests` |
| [`neptun.mjs`](neptun.mjs) | Node 18+, no dependencies |

## Quick start

```bash
export NEPTUN_KEY=mapi_...      # free key: https://neptun.marine-api.com/#pricing

python neptun.py
node neptun.mjs
```

```python
from neptun import Neptun

n = Neptun()
tide = n.tides(54.3233, 10.1394)          # Kiel
for e in tide["extremes"][:4]:
    print(e["typ"], e["hoehe"], "m")
```

## Endpoints

| Method | Endpoint | What you get |
|---|---|---|
| `tides(lat, lon)` | `/v1/tides` | Height, high/low water — worldwide, from FES2022b |
| `currents(lat, lon)` | `/v1/currents` | Set & drift — worldwide, from FES2014a |
| `levels(lat, lon)` | `/v1/levels` | Measured water level, waves, sea temperature — 998 stations, 9 official networks |
| `warnings(lat, lon)` | `/v1/warnings` | Navigational warnings from 61 official sources, geolocated, de-duplicated and translated |
| `locks(lat, lon)` | `/v1/locks` | 3,396 European locks with dimensions, VHF channel and live operating hours |
| `me()` | `/v1/me` | Plan, scopes, quota — costs no quota |

Full reference: <https://neptun.marine-api.com/docs/> ·
Coverage and freshness per source: <https://neptun.marine-api.com/coverage/> ·
Machine-readable spec: <https://neptun.marine-api.com/openapi.json>

## Navigational warnings: what each notice tells you

Since 29 October 2026 notices come from a new processing pipeline. Nothing was removed — existing
fields keep their meaning — but three normalised fields are now filled for every source:

| Field | Values | Meaning |
|---|---|---|
| `kind` | `closure`, `works`, `event`, `military_exercise`, `search_and_rescue`, `aids_to_navigation`, `obstruction`, `water_level`, `structure`, `traffic_rule`, `security`, `other` | one classification across all sources |
| `validity` | `fixed`, `indefinite`, `unknown` | has an end date / until further notice |
| `position` | `exact`, `text`, `waterway_km`, `seamark`, `place`, `area`, `water`, `none` | where the coordinate comes from — `exact` is published by the source; `place`, `area` and `water` (moved into the nearest water) are approximations, also flagged by `coarse: true` |

Use `position` to decide how precisely to draw a notice: a point for `exact`/`text`/`waterway_km`/`seamark`,
a wider marker for `place`/`area`. Details: <https://neptun.marine-api.com/docs/warnings/>

## The two responses that matter in practice

Both clients handle these, because you will meet them:

- **`429`** — monthly quota exhausted *or* the per-minute rate limit. The `Retry-After` header says
  how long to wait.
- **`403`** — the key is valid but has no scope for that endpoint. Scopes come with the plan.

## Attribution is required

Every response carries an `attribution` field. The data providers' licences require you to carry it
through wherever you display or process the data — in particular
`FES2022b/FES2014a — © CNES/AVISO/LEGOS` for tides and currents, and the respective national
publishers for gauges, notices and locks.

## Not for navigation

Neptun delivers values derived from models and official sources. They are **not intended for
navigation or safety-critical decisions at sea** and do not replace official charts, tide tables or
warning messages.

## Licence

MIT — see [LICENSE](LICENSE). The licence covers *this client code*, not the data delivered by the
API; for the data see the attribution note above and the
[terms](https://neptun.marine-api.com/terms.html).
