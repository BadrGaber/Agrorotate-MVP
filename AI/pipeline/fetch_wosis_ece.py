"""Download the REAL WoSIS electrical-conductivity (saturated paste, ELCOSP) layer.

Source : ISRIC WoSIS_latest, layer ``wosis_latest_elcosp`` served by the
         OGC WFS at https://maps.isric.org/mapserv?map=/map/wosis_latest.map
Units  : dS/m (ECe). Only layers intersecting 0-30 cm are used, combined into a
         thickness-weighted profile mean - the same depth the app's lab ECe
         refers to.

Outputs
    AI/data/real/wosis_ece_raw.zip          cached raw download
    AI/data/real/wosis_ece_topsoil.parquet  profile_id, lon, lat, ece_dsm, n_layers
    AI/data/real/wosis_ece_meta.json        source, counts, units, retrieval date
"""

from __future__ import annotations

import io
import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

import pandas as pd

AI_DIR = Path(__file__).resolve().parent.parent
REAL_DIR = AI_DIR / "data" / "real"
ZIP_PATH = REAL_DIR / "wosis_ece_raw.zip"
PARQUET = REAL_DIR / "wosis_ece_topsoil.parquet"
META = REAL_DIR / "wosis_ece_meta.json"

WFS_URL = (
    "https://maps.isric.org/mapserv?map=/map/wosis_latest.map"
    "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature"
    "&TYPENAMES=wosis_latest_elcosp&OUTPUTFORMAT=csv"
)


def download() -> None:
    REAL_DIR.mkdir(parents=True, exist_ok=True)
    if ZIP_PATH.exists() and ZIP_PATH.stat().st_size > 1_000_000:
        print(f"[=] cached {ZIP_PATH.name} ({ZIP_PATH.stat().st_size/1e6:.1f} MB)")
        return
    print("[+] downloading WoSIS ELCOSP from ISRIC WFS ...")
    with urlopen(WFS_URL, timeout=600) as resp:
        data = resp.read()
    ZIP_PATH.write_bytes(data)
    print(f"[+] saved {ZIP_PATH.name} ({len(data)/1e6:.1f} MB)")


def build() -> dict:
    with zipfile.ZipFile(ZIP_PATH) as zf:
        name = next(n for n in zf.namelist() if n.endswith(".csv"))
        raw = pd.read_csv(io.BytesIO(zf.read(name)), usecols=["X", "Y", "profile_id", "upper_depth", "lower_depth", "value_avg"])
    n_raw = len(raw)
    raw = raw.dropna(subset=["value_avg"])
    raw = raw[raw["value_avg"].between(0, 200)]
    n_invalid = n_raw - len(raw)

    top = raw[(raw.upper_depth < 30) & (raw.lower_depth > 0)].copy()
    top["top"] = top.upper_depth.clip(lower=0)
    top["bottom"] = top.lower_depth.clip(upper=30)
    top["thick"] = (top.bottom - top.top).clip(lower=0)
    top = top[top.thick > 0]
    top["weighted"] = top.value_avg * top.thick
    agg = top.groupby("profile_id").agg(
        weighted=("weighted", "sum"),
        thick=("thick", "sum"),
        lon=("X", "first"),
        lat=("Y", "first"),
        n_layers=("value_avg", "size"),
    )
    agg["ece_dsm"] = (agg.weighted / agg.thick).round(3)
    out = agg[["lon", "lat", "ece_dsm", "n_layers"]].reset_index()
    out.to_parquet(PARQUET, index=False)

    meta = {
        "source": "ISRIC WoSIS_latest - Electrical conductivity, saturated paste (ELCOSP)",
        "service": WFS_URL,
        "doi": "10.5194/essd-16-4735-2024",
        "units": "dS/m (ECe)",
        "depth": "0-30 cm thickness-weighted profile mean",
        "retrieved_utc": datetime.now(timezone.utc).isoformat(),
        "raw_measurements": int(n_raw),
        "dropped_invalid": int(n_invalid),
        "profiles": int(len(out)),
        "ece_p50": round(float(out.ece_dsm.median()), 3),
        "ece_p90": round(float(out.ece_dsm.quantile(0.90)), 3),
        "ece_max": round(float(out.ece_dsm.max()), 3),
    }
    META.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


def main() -> None:
    download()
    meta = build()
    print(json.dumps({k: meta[k] for k in ["raw_measurements", "profiles", "ece_p50", "ece_p90", "ece_max"]}, indent=2))


if __name__ == "__main__":
    main()
