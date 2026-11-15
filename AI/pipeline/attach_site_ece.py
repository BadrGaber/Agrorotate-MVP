"""Attach a REAL measured ECe to each MAPSPAM training site.

Nearest WoSIS ELCOSP profile within ``MAX_KM`` (great-circle). Sites without a
profile inside that radius keep the documented 0.5 dS/m baseline and are flagged,
so the trainer can tell measured from imputed rows.

Output
    AI/data/real/site_ece_links.csv
        site_id, ece_dsm, ece_km, ece_profile_id, ece_source
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree

AI_DIR = Path(__file__).resolve().parent.parent
REAL_DIR = AI_DIR / "data" / "real"
ECE = REAL_DIR / "wosis_ece_topsoil.parquet"
SITES = AI_DIR / "data" / "processed" / "global_agricultural_sites.csv"
OUT = REAL_DIR / "site_ece_links.csv"
META = REAL_DIR / "site_ece_links_meta.json"
MAX_KM = 50.0
EARTH_R_KM = 6371.0


def main() -> None:
    ece = pd.read_parquet(ECE)
    sites = pd.read_csv(SITES)
    tree = BallTree(np.radians(ece[["lat", "lon"]].to_numpy()), metric="haversine")
    dist, idx = tree.query(np.radians(sites[["latitude", "longitude"]].to_numpy()), k=1)
    km = dist[:, 0] * EARTH_R_KM

    out = pd.DataFrame(
        {
            "site_id": sites["site_id"],
            "ece_dsm": np.where(km <= MAX_KM, ece.ece_dsm.to_numpy()[idx[:, 0]], np.nan),
            "ece_km": np.round(km, 2),
            "ece_profile_id": np.where(km <= MAX_KM, ece.profile_id.to_numpy()[idx[:, 0]], np.nan),
        }
    )
    out["ece_source"] = np.where(out.ece_dsm.notna(), f"WOSIS_ELCOSP_le_{int(MAX_KM)}km", "imputed_0.5")
    out.to_csv(OUT, index=False)

    measured = out.ece_dsm.notna()
    meta = {
        "radius_km": MAX_KM,
        "sites": int(len(out)),
        "sites_with_measured_ece": int(measured.sum()),
        "coverage_pct": round(100 * float(measured.mean()), 1),
        "ece_p50_measured": round(float(out.loc[measured, "ece_dsm"].median()), 3),
        "ece_p90_measured": round(float(out.loc[measured, "ece_dsm"].quantile(0.9)), 3),
        "ece_max_measured": round(float(out.loc[measured, "ece_dsm"].max()), 3),
        "rule": "nearest WoSIS 0-30cm ECe profile inside the radius; otherwise 0.5 dS/m documented baseline",
    }
    META.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
