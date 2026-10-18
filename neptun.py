"""Minimal Neptun API client — tides, currents, gauges, notices and locks.

    pip install requests
    export NEPTUN_KEY=mapi_...
    python neptun.py

Docs: https://neptun.marine-api.com/docs/
"""
import os
import sys

import requests

BASE = "https://neptun.marine-api.com/v1"


class Neptun:
    def __init__(self, key=None, base=BASE, timeout=20):
        self.key = key or os.environ.get("NEPTUN_KEY", "")
        if not self.key:
            raise SystemExit("Set NEPTUN_KEY (get one at https://neptun.marine-api.com/pricing/)")
        self.base, self.timeout = base, timeout
        self.session = requests.Session()
        self.session.headers["Authorization"] = f"Bearer {self.key}"

    def _get(self, pfad, **params):
        r = self.session.get(f"{self.base}/{pfad}", params=params, timeout=self.timeout)
        if r.status_code == 429:
            # Monthly quota or the per-minute rate limit. Retry-After says how long to wait.
            raise RuntimeError(f"rate limited, retry after {r.headers.get('Retry-After', '?')}s")
        if r.status_code == 403:
            raise RuntimeError("your key has no scope for this endpoint")
        r.raise_for_status()
        return r.json()

    # Tides and currents work worldwide (model-based), the rest is measured/official data.
    def tides(self, lat, lon, days=2):
        return self._get("tides", lat=lat, lon=lon, days=days)

    def currents(self, lat, lon, hours=12):
        return self._get("currents", lat=lat, lon=lon, hours=hours)

    def levels(self, lat, lon, radius=25):
        return self._get("levels", lat=lat, lon=lon, radius=radius)

    def warnings(self, lat, lon, radius=50, lang="en"):
        return self._get("warnings", lat=lat, lon=lon, radius=radius, lang=lang)

    def locks(self, lat, lon, radius=25):
        return self._get("locks", lat=lat, lon=lon, radius=radius)

    def me(self):
        return self._get("me")


if __name__ == "__main__":
    n = Neptun()
    lat, lon = 54.3233, 10.1394          # Kiel

    info = n.me()
    print(f"plan {info.get('plan')} · quota {info['quota']['used']}/{info['quota']['limit']}")

    t = n.tides(lat, lon)
    for e in (t.get("extremes") or [])[:4]:
        print(f"  {e['typ']} {e['hoehe']:>5} m  ts={e['ts']}")

    # Every response carries `attribution` — the licences require you to carry it through.
    print("attribution:", t.get("attribution", "")[:80])
