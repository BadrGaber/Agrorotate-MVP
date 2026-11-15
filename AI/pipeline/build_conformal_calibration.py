"""
Rebuilds the measurement-uncertainty calibration from REAL paired WoSIS values.

The old file was derived from 20,000 rows generated with `np.random`, which made
the "96.14 % coverage" claim meaningless.  This script uses the 181 pH and 185
clay pairs that actually exist in the new global package (WoSIS laboratory value
vs SoilGrids prediction at the same site).

ECe has no measured values anywhere in the package, so its half-widths stay a
documented assumption and are labelled as such.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

AI_DIR = Path(__file__).resolve().parent.parent
SITES = AI_DIR / "data" / "processed" / "GLOBAL_SITE_FEATURES_550.csv"
OUT = AI_DIR / "models" / "real_v1" / "conformal_calibration.json"

ASSUMED_ECE = {"MEAS": 0.868, "EST": 1.426, "EO_PRIOR": 2.046}


def tier_bands(residuals: np.ndarray) -> dict:
    """MEAS = real q90; the other tiers are the documented modality inflation."""
    residual_abs = np.abs(residuals)
    meas = float(np.quantile(residual_abs, 0.90))
    return {
        "MEAS": round(meas, 3),
        "EST": round(meas * 1.15, 3),
        "EO_PRIOR": round(meas * 1.65, 3),
    }


def main() -> None:
    df = pd.read_csv(SITES, low_memory=False)

    ph_pairs = df[["wosis_ph_lab", "soilgrids_phh2o_0_5cm"]].dropna()
    clay_pairs = df[["wosis_clay_lab", "soilgrids_clay_0_5cm"]].dropna()

    ph_res = (ph_pairs["wosis_ph_lab"] - ph_pairs["soilgrids_phh2o_0_5cm"]).to_numpy()
    clay_res = (clay_pairs["wosis_clay_lab"] - clay_pairs["soilgrids_clay_0_5cm"]).to_numpy()

    ph_bands = tier_bands(ph_res)
    clay_bands = tier_bands(clay_res)

    coverage_ph = float(np.mean(np.abs(ph_res) <= ph_bands["MEAS"]))
    coverage_clay = float(np.mean(np.abs(clay_res) <= clay_bands["MEAS"]))

    payload = {
        "dataset": "ISRIC WoSIS laboratory profiles vs ISRIC SoilGrids 250m v2.0 (paired at site)",
        "sample_points": {
            "ph": int(len(ph_res)),
            "clay": int(len(clay_res)),
            "ece": 0,
        },
        "nominal_coverage": 0.90,
        "empirical_coverage": {
            "ph": round(coverage_ph, 4),
            "clay": round(coverage_clay, 4),
            "ece": None,
        },
        "conformal_half_widths": ASSUMED_ECE,
        "conformal_ph_bounds": ph_bands,
        "conformal_clay_pct_bounds": clay_bands,
        "provenance": {
            "ph": "real paired WoSIS/SoilGrids values",
            "clay": "real paired WoSIS/SoilGrids values",
            "ece": "assumed: no measured ECe exists in the dataset",
        },
        "note": "EST = MEAS x 1.15 and EO_PRIOR = MEAS x 1.65 are documented modality penalties, not measured.",
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"[+] conformal calibration -> {OUT}")
    print(
        f"    pH n={len(ph_res)} band={ph_bands['MEAS']} | "
        f"clay n={len(clay_res)} band={clay_bands['MEAS']}"
    )


if __name__ == "__main__":
    main()
