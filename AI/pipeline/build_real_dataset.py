"""
AgroRotate - Real global training-table builder.

Turns the preprocessed feature tables in
    AI/data/processed/
into one reproducible, contract-compliant table that the trainer can consume.

Sources actually used (all present on disk, no network):
    processed/AI_TRAINING_CANDIDATES_550_GLOBAL.csv.gz  MAPSPAM 2020 crop yields (labels)
    processed/GLOBAL_SITE_FEATURES_550.csv              SoilGrids + NASA POWER + SRTM
    processed/nasa_power_monthly_550_sites.csv.gz       monthly climate -> Hargreaves ETo
    processed/wosis_nearest_profile_links.csv           WoSIS nearest lab profile (QC only)

What this table is:
    site x crop rows with a measured/modelled yield and a 40-dim contract vector.
What this table is NOT:
    a rotation-trial dataset.  It has no season sequences and no measured soil
    transitions, so it can train the single-step yield model only.

Outputs
    AI/data/real/real_crop_yield_training.parquet
    AI/data/real/real_dataset_report.json
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

from contract import CROP_ORDER, CROP_SPECS, FEATURE_NAMES, build_vector40, clamp01

AI_DIR = Path(__file__).resolve().parent.parent
GLOBAL_DIR = AI_DIR / "data" / "processed"
OUT_DIR = AI_DIR / "data" / "real"
OUT_PARQUET = OUT_DIR / "real_crop_yield_training.parquet"
OUT_REPORT = OUT_DIR / "real_dataset_report.json"


CROP_NAME_MAP = {
    "Wheat": "bread-wheat",
    "Barley": "six-row-barley",
    "Maize": "grain-maize",
    "Sorghum": "grain-sorghum",
    "Pearl Millet": "pearl-millet",
    "Rice": "paddy-rice",
    "Bean": "faba-bean",
    "Chickpea": "chickpea",
    "Lentil": "lentil",
    "Soybean": "soybean",
    "Cowpea": "cowpea",
    "Groundnut": "peanut-groundnut",
    "Sunflower": "sunflower",
    "Rapeseed": "winter-canola-rapeseed",
    "Sesame Seed": "sesame",
    "Potato": "potato",
    "Sweet Potato": "sweet-potato",
    "Cotton": "egyptian-cotton",
    "Sugarbeet": "sugar-beet",
    "Sugarcane": "sugarcane",
    "Tomato": "processing-tomato",
    "Onion": "bulb-onion",
}

WARM = {cid for cid, s in CROP_SPECS.items() if s["season"] == "warm"}





def extraterrestrial_radiation_mj(lat_deg: float, doy: int) -> float:
    phi = np.radians(lat_deg)
    dr = 1.0 + 0.033 * np.cos(2.0 * np.pi * doy / 365.0)
    delta = 0.409 * np.sin(2.0 * np.pi * doy / 365.0 - 1.39)
    x = np.clip(-np.tan(phi) * np.tan(delta), -1.0, 1.0)
    omega = np.arccos(x)
    return float(
        (24.0 * 60.0 / np.pi)
        * 0.0820
        * dr
        * (omega * np.sin(phi) * np.sin(delta) + np.cos(phi) * np.cos(delta) * np.sin(omega))
    )


MONTH_MID_DOY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]


def annual_eto_hargreaves(monthly: pd.DataFrame) -> pd.DataFrame:
    """Annual ETo (mm) per site from NASA POWER monthly Tmax/Tmin + latitude."""
    rows = []
    for site_id, grp in monthly.groupby("site_id", sort=False):
        lat = float(grp["power_grid_lat"].iloc[0])
        total = 0.0
        for rec in grp.itertuples(index=False):
            month = int(rec.month)
            ra = extraterrestrial_radiation_mj(lat, MONTH_MID_DOY[month - 1])
            tmax = float(rec.T2M_MAX)
            tmin = float(rec.T2M_MIN)
            tmean = float(rec.T2M)
            eto_day = 0.0023 * max(0.0, tmean + 17.8) * math_sqrt(max(0.0, tmax - tmin)) * ra
            total += eto_day * int(rec.month_days)
        rows.append(
            {
                "site_id": site_id,
                "annual_eto_hargreaves_mm": round(total / max(1, grp["year"].nunique()), 1),
            }
        )
    return pd.DataFrame(rows)


def math_sqrt(x: float) -> float:
    return float(np.sqrt(x))



def spatial_fold(lat: np.ndarray, lon: np.ndarray) -> np.ndarray:
    """5 deterministic spatial blocks so no site leaks between train and test."""
    lat_bin = np.floor((lat + 90.0) / 18.0).astype(int)
    lon_bin = np.floor((lon + 180.0) / 18.0).astype(int)
    cell = (lat_bin * 7 + lon_bin * 13) % 5
    return cell.astype(int)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    sites = pd.read_csv(GLOBAL_DIR / "GLOBAL_SITE_FEATURES_550.csv", low_memory=False)
    candidates = pd.read_csv(GLOBAL_DIR / "AI_TRAINING_CANDIDATES_550_GLOBAL.csv.gz", low_memory=False)
    monthly = pd.read_csv(GLOBAL_DIR / "nasa_power_monthly_550_sites.csv.gz", low_memory=False)

    eto = annual_eto_hargreaves(monthly)

    keep = [
        "site_id", "latitude", "longitude", "country",
        "soilgrids_phh2o_0_5cm", "soilgrids_clay_0_5cm", "soilgrids_sand_0_5cm",
        "soilgrids_silt_0_5cm", "soilgrids_soc_0_5cm", "soilgrids_bdod_0_5cm",
        "soilgrids_cec_0_5cm", "soilgrids_nitrogen_0_5cm",
        "air_temp_mean_c", "precipitation_annual_mm", "slope_percent_approx",
        "wosis_ph_lab", "wosis_clay_lab", "wosis_distance_km",
    ]
    site_features = sites[keep].copy()
    site_features = site_features.merge(eto, on="site_id", how="left")

    df = candidates.merge(site_features, on="site_id", how="inner", suffixes=("", "_site"))


    ece_links_path = OUT_DIR / "site_ece_links.csv"
    if ece_links_path.exists():
        links = pd.read_csv(ece_links_path)[["site_id", "ece_dsm", "ece_km"]]
        df = df.merge(links, on="site_id", how="left")
    else:
        df["ece_dsm"] = np.nan
        df["ece_km"] = np.nan
    df = df.rename(columns={"ece_dsm": "ece_dsm_measured"})

    df["crop_id"] = df["candidate_crop_name"].map(CROP_NAME_MAP)
    unmapped = sorted(df.loc[df["crop_id"].isna(), "candidate_crop_name"].unique())

    total_rows = len(df)
    df = df[df["crop_id"].notna()].copy()
    after_map = len(df)
    df = df[(df["is_cultivated_in_grid_2020"] == 1) & (df["target_yield_kg_ha"] > 0)].copy()
    after_yield = len(df)


    df["som_pct"] = (df["soilgrids_soc_0_5cm"].astype(float) / 10.0) * 1.724

    tex = df[["soilgrids_sand_0_5cm", "soilgrids_silt_0_5cm", "soilgrids_clay_0_5cm"]].astype(float)
    tex_sum = tex.sum(axis=1).replace(0, np.nan)
    df["sand_pct"] = (tex["soilgrids_sand_0_5cm"] / tex_sum * 100.0).fillna(40.0)
    df["silt_pct"] = (tex["soilgrids_silt_0_5cm"] / tex_sum * 100.0).fillna(35.0)
    df["clay_pct"] = (tex["soilgrids_clay_0_5cm"] / tex_sum * 100.0).fillna(25.0)
    df["bulk_density"] = df["soilgrids_bdod_0_5cm"].astype(float).clip(0.8, 1.9).fillna(1.3)
    df["ph_h2o"] = df["soilgrids_phh2o_0_5cm"].astype(float).clip(3.5, 10.0).fillna(6.5)
    df["cec_cmol_kg"] = df["soilgrids_cec_0_5cm"].astype(float).clip(1.0, 120.0).fillna(18.0)
    df["annual_eto_mm"] = df["annual_eto_hargreaves_mm"].fillna(df["air_temp_mean_c"] * 60.0 + 800.0)
    df["slope_pct"] = df["slope_percent_approx"].astype(float).clip(0.0, 60.0).fillna(3.0)
    df["yield_t_ha"] = df["target_yield_kg_ha"].astype(float) / 1000.0





    attainable = df.groupby("crop_id")["yield_t_ha"].quantile(0.95)
    counts = df.groupby("crop_id")["yield_t_ha"].size()
    valid_crops = sorted(counts[counts >= 20].index)
    attainable = attainable[attainable.index.isin(valid_crops)]
    df = df[df["crop_id"].isin(valid_crops)].copy()
    df["attainable_yield_t_ha"] = df["crop_id"].map(attainable)
    df = df[df["yield_t_ha"] <= df["attainable_yield_t_ha"] * 1.25].copy()
    df["yield_gap_pct"] = (
        100.0 * (1.0 - df["yield_t_ha"] / df["attainable_yield_t_ha"])
    ).clip(0.0, 100.0)


    vectors = []
    for rec in df.itertuples(index=False):
        vectors.append(
            build_vector40(
                sand_pct=float(rec.sand_pct),
                silt_pct=float(rec.silt_pct),
                clay_pct=float(rec.clay_pct),
                bulk_density=float(rec.bulk_density),
                ph_h2o=float(rec.ph_h2o),
                som_pct=float(rec.som_pct),
                cec_cmol_kg=float(rec.cec_cmol_kg),
                annual_eto_mm=float(rec.annual_eto_mm),
                slope_pct=float(rec.slope_pct),
                crop_id=str(rec.crop_id),
                is_warm=str(rec.crop_id) in WARM,
                ece_dsm=None if pd.isna(rec.ece_dsm_measured) else float(rec.ece_dsm_measured),
            )
        )
    vec_df = pd.DataFrame(np.vstack(vectors), columns=FEATURE_NAMES, index=df.index)

    out = pd.concat(
        [
            df[
                [
                    "site_id", "crop_id", "candidate_crop_name", "latitude", "longitude", "country",
                    "yield_t_ha", "attainable_yield_t_ha", "yield_gap_pct",
                    "ph_h2o", "clay_pct", "sand_pct", "silt_pct", "som_pct",
                    "bulk_density", "cec_cmol_kg", "annual_eto_mm", "precipitation_annual_mm",
                    "wosis_ph_lab", "wosis_clay_lab", "wosis_distance_km",
                    "ece_dsm_measured", "ece_km",
                ]
            ],
            vec_df,
        ],
        axis=1,
    )
    out["spatial_fold"] = spatial_fold(out["latitude"].to_numpy(), out["longitude"].to_numpy())
    out = out.reset_index(drop=True)
    out.to_parquet(OUT_PARQUET, compression="snappy", index=False)


    corr = {}
    for name in FEATURE_NAMES:
        col = out[name]
        if col.nunique() <= 1:
            corr[name] = None
            continue
        corr[name] = round(float(col.corr(out["yield_gap_pct"], method="spearman")), 3)

    report = {
        "contract_version": "agrorotate.model_contract/v3",
        "generated_from": str(GLOBAL_DIR),
        "rows": {
            "candidate_rows": total_rows,
            "after_crop_mapping": after_map,
            "after_cultivated_and_positive_yield": after_yield,
            "used_for_training": int(len(out)),
        },
        "sites": int(out["site_id"].nunique()),
        "crops": int(out["crop_id"].nunique()),
        "crop_list": sorted(out["crop_id"].unique()),
        "unmapped_mapspam_crops": unmapped,
        "label_definition": "100 * (1 - MAPSPAM yield_t_ha / p95 yield_t_ha of the same crop); clipped 0..100",
        "label_stats": {
            "mean": round(float(out["yield_gap_pct"].mean()), 2),
            "std": round(float(out["yield_gap_pct"].std()), 2),
            "p10": round(float(out["yield_gap_pct"].quantile(0.10)), 2),
            "p50": round(float(out["yield_gap_pct"].quantile(0.50)), 2),
            "p90": round(float(out["yield_gap_pct"].quantile(0.90)), 2),
        },
        "attainable_yield_t_ha": {k: round(float(v), 2) for k, v in attainable.items()},
        "per_crop_rows": {k: int(v) for k, v in out["crop_id"].value_counts().items()},
        "spatial_fold_rows": {str(k): int(v) for k, v in out["spatial_fold"].value_counts().sort_index().items()},
        "feature_spearman_with_label": corr,
        "imputed_dimensions": {
            "f3": "coarse fragments (0.04)",
            "f10": "water table (0.60)",
            "f14": "real WoSIS ELCOSP ECe where a profile is <=50 km from the site; otherwise 0.5 dS/m baseline",
            "f15": "ESP has NO real value -> 0.8 %",
            "f16": "CaCO3 has NO real value -> 15 %",
            "f19": "nitrogen stock has NO real value -> 0.25",
            "f20": "available P has NO real value -> 0.35",
            "f21": "available K has NO real value -> 0.50",
            "f22-f27": "six pathogen pressures have NO real values -> 0.02",
            "f28": "irrigation quota has NO real value -> 1500 m3/ha",
            "f29": "irrigation ECw has NO real value -> 0.5 dS/m",
        },
        "widely_available_dimensions": ["f0", "f1", "f2", "f4", "f13", "f17", "f18", "f30", "f31"],
        "real_ece": {
            "source": "ISRIC WoSIS_latest ELCOSP (0-30 cm, saturated paste, dS/m)",
            "radius_km": 50,
            "rows_with_measured_ece": int(out["ece_dsm_measured"].notna().sum()),
            "sites_with_measured_ece": int(out.loc[out["ece_dsm_measured"].notna(), "site_id"].nunique()),
            "row_coverage_pct": round(100 * float(out["ece_dsm_measured"].notna().mean()), 1),
            "ece_p50": round(float(out["ece_dsm_measured"].median()), 2),
            "ece_p90": round(float(out["ece_dsm_measured"].quantile(0.9)), 2),
        },
        "scientific_limitations": [
            "MAPSPAM 2020 yields are spatially disaggregated administrative estimates, not plot measurements.",
            "The table has no season sequence, so it cannot train rotation/transition dynamics.",
            "ECe is measured for a minority of sites (nearest WoSIS profile <=50 km); ESP, nutrients and pathogens remain imputed.",
            "Only 25 of the 46 MAPSPAM crops map to the 30-crop registry.",
        ],
    }
    OUT_REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[+] training table : {OUT_PARQUET}  ({len(out):,} rows x {out.shape[1]} cols)")
    print(f"[+] report         : {OUT_REPORT}")
    print(f"[+] sites={report['sites']} crops={report['crops']} gap mean={report['label_stats']['mean']}%")


if __name__ == "__main__":
    main()
