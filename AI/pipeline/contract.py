"""
AgroRotate - Single source of truth for the 40-dimensional model contract.

Every trainer and every runtime must use THIS file.  The contract is the one the
physics simulator wrote into AI/data/trajectories/*.parquet:

    f0..f31 = continuous soil / hydrology / pathogen / climate state
    c0..c7  = explicit crop identity and physiology

Any deviation (different divisor, different index, constant proxy) is a bug,
because the model only ever saw this exact normalisation during training.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path
from typing import Any, Dict, Iterable

import numpy as np

AI_DIR = Path(__file__).resolve().parent.parent
if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))

from physics_simulator import CROP_SPECS, saxton_rawls_hydraulics  # noqa: E402

CONTRACT_VERSION = "agrorotate.model_contract/v3"
FEATURE_COUNT = 40

# ---------------------------------------------------------------------------
# Feature specification: index, canonical name, unit, normalisation, and
# whether the field exists in the new real global dataset.
#   measured  -> present as a physical value in the real dataset
#   derived   -> computed from measured values (Saxton-Rawls, Hargreaves)
#   imputed   -> NOT available; a documented constant is used
# ---------------------------------------------------------------------------
FEATURE_SPEC: list[dict[str, Any]] = [
    {"idx": 0, "name": "sand_fraction", "unit": "frac", "norm": "sand_pct/100", "real": "measured"},
    {"idx": 1, "name": "silt_fraction", "unit": "frac", "norm": "silt_pct/100", "real": "measured"},
    {"idx": 2, "name": "clay_fraction", "unit": "frac", "norm": "clay_pct/100", "real": "measured"},
    {"idx": 3, "name": "coarse_fragment", "unit": "frac", "norm": "frac", "real": "imputed"},
    {"idx": 4, "name": "bulk_density_norm", "unit": "g/cm3", "norm": "(bd-0.85)/1.10", "real": "measured"},
    {"idx": 5, "name": "field_capacity", "unit": "vol frac", "norm": "frac (0..0.55)", "real": "derived"},
    {"idx": 6, "name": "wilting_point", "unit": "vol frac", "norm": "frac (0..0.38)", "real": "derived"},
    {"idx": 7, "name": "awc_norm", "unit": "vol frac", "norm": "awc/0.30", "real": "derived"},
    {"idx": 8, "name": "ksat_norm", "unit": "mm/hr", "norm": "ksat/150", "real": "derived"},
    {"idx": 9, "name": "drainage_index", "unit": "0..1", "norm": "index", "real": "derived"},
    {"idx": 10, "name": "water_table_norm", "unit": "0..1", "norm": "index", "real": "imputed"},
    {"idx": 11, "name": "root_depth_norm", "unit": "cm", "norm": "root_cm/150", "real": "measured"},
    {"idx": 12, "name": "aeration_stress", "unit": "0..1", "norm": "index", "real": "derived"},
    {"idx": 13, "name": "ph_norm", "unit": "pH", "norm": "(pH-3.5)/7.0", "real": "measured"},
    {"idx": 14, "name": "ece_norm", "unit": "dS/m", "norm": "ece/20.0", "real": "imputed"},
    {"idx": 15, "name": "esp_norm", "unit": "%", "norm": "esp/30.0", "real": "imputed"},
    {"idx": 16, "name": "caco3", "unit": "frac", "norm": "frac", "real": "imputed"},
    {"idx": 17, "name": "som_norm", "unit": "%", "norm": "som/8.0", "real": "derived"},
    {"idx": 18, "name": "cec_norm", "unit": "cmol/kg", "norm": "cec/60.0", "real": "measured"},
    {"idx": 19, "name": "nitrogen_stock_norm", "unit": "kg/ha", "norm": "n_stock/200.0", "real": "imputed"},
    {"idx": 20, "name": "phosphorus_norm", "unit": "ppm", "norm": "frac", "real": "imputed"},
    {"idx": 21, "name": "potassium_norm", "unit": "ppm", "norm": "frac", "real": "imputed"},
    {"idx": 22, "name": "root_knot_nematode", "unit": "0..1", "norm": "pressure", "real": "imputed"},
    {"idx": 23, "name": "fusarium_wilt", "unit": "0..1", "norm": "pressure", "real": "imputed"},
    {"idx": 24, "name": "allium_white_rot", "unit": "0..1", "norm": "pressure", "real": "imputed"},
    {"idx": 25, "name": "orobanche", "unit": "0..1", "norm": "pressure", "real": "imputed"},
    {"idx": 26, "name": "cyst_nematode", "unit": "0..1", "norm": "pressure", "real": "imputed"},
    {"idx": 27, "name": "rhizoctonia", "unit": "0..1", "norm": "pressure", "real": "imputed"},
    {"idx": 28, "name": "water_quota_norm", "unit": "m3/ha", "norm": "quota/10000", "real": "imputed"},
    {"idx": 29, "name": "ecw_norm", "unit": "dS/m", "norm": "ecw/5.0", "real": "imputed"},
    {"idx": 30, "name": "annual_eto_norm", "unit": "mm/yr", "norm": "eto/2500", "real": "derived"},
    {"idx": 31, "name": "slope_norm", "unit": "%", "norm": "slope/20.0", "real": "measured"},
    {"idx": 32, "name": "kc", "unit": "-", "norm": "raw Kc", "real": "measured"},
    {"idx": 33, "name": "salinity_threshold", "unit": "dS/m", "norm": "thr/10", "real": "measured"},
    {"idx": 34, "name": "salinity_slope", "unit": "%/dS/m", "norm": "slope/20", "real": "measured"},
    {"idx": 35, "name": "nitrogen_fixation", "unit": "kg/ha", "norm": "nfix/200", "real": "measured"},
    {"idx": 36, "name": "crop_root_depth", "unit": "cm", "norm": "root/200", "real": "measured"},
    {"idx": 37, "name": "base_yield", "unit": "t/ha", "norm": "yield/100", "real": "measured"},
    {"idx": 38, "name": "crop_index", "unit": "0..1", "norm": "idx/29", "real": "measured"},
    {"idx": 39, "name": "season_is_warm", "unit": "0/1", "norm": "binary", "real": "measured"},
]

FEATURE_NAMES = [f"f{i}" for i in range(32)] + [f"c{i}" for i in range(8)]
CROP_ORDER = list(CROP_SPECS.keys())
CROP_INDEX = {cid: i for i, cid in enumerate(CROP_ORDER)}
assert len(CROP_ORDER) == 30, "Crop registry must contain exactly 30 crops"

# Documented constants for dimensions the real dataset cannot supply.
IMPUTED_DEFAULTS: Dict[int, float] = {
    3: 0.04,     # coarse fragments
    10: 0.60,    # water table
    14: 0.50 / 20.0,  # ECe = 0.5 dS/m (non-saline baseline)
    15: 0.8 / 30.0,   # ESP = 0.8 %
    16: 0.15,    # CaCO3 15 %
    19: 0.25,    # nitrogen stock proxy
    20: 0.35,    # phosphorus
    21: 0.50,    # potassium
    22: 0.02, 23: 0.02, 24: 0.02, 25: 0.02, 26: 0.02, 27: 0.02,
    28: 0.15,    # 1500 m3/ha
    29: 0.10,    # ECw = 0.5 dS/m
}


def clamp01(x: float) -> float:
    if not math.isfinite(x):
        return 0.0
    return max(0.0, min(1.0, x))


def crop_traits(crop_id: str, is_warm: bool) -> Dict[int, float]:
    """c0..c7 exactly as physics_simulator writes them."""
    spec = CROP_SPECS[crop_id]
    return {
        32: float(spec["kc"]),
        33: float(spec["sal_thresh"]) / 10.0,
        34: float(spec["sal_slope"]) / 20.0,
        35: float(spec["n_fix"]) / 200.0,
        36: float(spec["root_depth"]) / 200.0,
        37: float(spec["base_yield"]) / 100.0,
        38: float(spec["idx"]) / 29.0,
        39: 1.0 if is_warm else 0.0,
    }


def saxton_rawls_from_texture(sand_pct: float, clay_pct: float, som_pct: float) -> Dict[str, float]:
    return saxton_rawls_hydraulics(sand_pct, clay_pct, som_pct)


def build_vector40(
    *,
    sand_pct: float,
    silt_pct: float,
    clay_pct: float,
    bulk_density: float,
    ph_h2o: float,
    som_pct: float,
    cec_cmol_kg: float,
    annual_eto_mm: float,
    slope_pct: float,
    crop_id: str,
    is_warm: bool,
    ece_dsm: float | None = None,
    esp_pct: float | None = None,
    nitrogen_stock_kg_ha: float | None = None,
    water_quota_m3_ha: float | None = None,
    ecw_dsm: float | None = None,
    pathogen_pressures: Iterable[float] | None = None,
) -> np.ndarray:
    """Builds the 40-dim vector from physical values, applying the contract.

    Missing inputs fall back to the documented constants in IMPUTED_DEFAULTS.
    """
    ptf = saxton_rawls_from_texture(sand_pct, clay_pct, som_pct)
    sand = clamp01(sand_pct / 100.0)
    silt = clamp01(silt_pct / 100.0)
    clay = clamp01(clay_pct / 100.0)
    silt = min(silt, max(0.0, 1.0 - sand - clay))

    v = np.zeros(FEATURE_COUNT, dtype=np.float32)
    v[0], v[1], v[2] = sand, silt, clay
    v[3] = IMPUTED_DEFAULTS[3]
    v[4] = clamp01((bulk_density - 0.85) / 1.10)
    v[5] = clamp01(ptf["fc"])
    v[6] = clamp01(ptf["wp"])
    v[7] = clamp01(ptf["awc"] / 0.30)
    v[8] = clamp01(ptf["ksat"] / 150.0)
    v[9] = 0.40 if ptf["ksat"] < 15.0 else 0.65
    v[10] = IMPUTED_DEFAULTS[10]
    v[11] = clamp01(float(CROP_SPECS[crop_id]["root_depth"]) / 150.0)
    v[12] = 0.80
    v[13] = clamp01((ph_h2o - 3.5) / 7.0)
    v[14] = clamp01((ece_dsm if ece_dsm is not None else IMPUTED_DEFAULTS[14] * 20.0) / 20.0)
    v[15] = clamp01((esp_pct if esp_pct is not None else IMPUTED_DEFAULTS[15] * 30.0) / 30.0)
    v[16] = IMPUTED_DEFAULTS[16]
    v[17] = clamp01(som_pct / 8.0)
    v[18] = clamp01(cec_cmol_kg / 60.0)
    v[19] = clamp01((nitrogen_stock_kg_ha if nitrogen_stock_kg_ha is not None else 50.0) / 200.0)
    v[20] = IMPUTED_DEFAULTS[20]
    v[21] = IMPUTED_DEFAULTS[21]
    if pathogen_pressures is not None:
        pressures = list(pathogen_pressures)[:6]
        for k, p in enumerate(pressures):
            v[22 + k] = clamp01(p)
    else:
        for k in range(6):
            v[22 + k] = IMPUTED_DEFAULTS[22 + k]
    v[28] = clamp01((water_quota_m3_ha if water_quota_m3_ha is not None else 1500.0) / 10000.0)
    v[29] = clamp01((ecw_dsm if ecw_dsm is not None else 0.5) / 5.0)
    v[30] = clamp01(annual_eto_mm / 2500.0)
    v[31] = clamp01(slope_pct / 20.0)
    for idx, value in crop_traits(crop_id, is_warm).items():
        v[idx] = value
    return v


def contract_rows() -> list[dict[str, Any]]:
    return [dict(spec) for spec in FEATURE_SPEC]
