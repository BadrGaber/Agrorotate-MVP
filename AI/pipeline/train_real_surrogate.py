"""
AgroRotate - Real-data surrogate trainer + honest evaluation.

Trains the SAME 40 -> 64 -> 32 -> 4 MLP that the browser/Node runtime already
executes (runNeuralSurrogateInference), but on the real MAPSPAM/NASA/SoilGrids
table produced by build_real_dataset.py.

Two things this script deliberately does:

1. Spatial 5-fold cross-validation (folds come from latitude/longitude blocks,
   so a site is never in both train and test).
2. An "exam" for the previously shipped model: the synthetic-physics surrogate
   is evaluated on the same real rows, plus on the independent ARC/ICARDA
   measured field-trial benchmark.

Outputs
    AI/models/real_v1/real_surrogate_weights.json
    AI/models/real_v1/real_surrogate_metrics.json
    AI/models/real_v1/MODEL_CARD.md
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from scipy.stats import spearmanr

from contract import FEATURE_NAMES

AI_DIR = Path(__file__).resolve().parent.parent
APP = AI_DIR.parent
REAL_TABLE = AI_DIR / "data" / "real" / "real_crop_yield_training.parquet"
OUT_DIR = AI_DIR / "models" / "real_v1"
SHIPPED_SURROGATE = APP / "public" / "models" / "agrorotate_surrogate_weights.json"
ARC_BENCHMARK = (
    AI_DIR / "data" / "benchmarks" / "empirical_field_trials_589.parquet"
    if (AI_DIR / "data" / "benchmarks" / "empirical_field_trials_589.parquet").exists()
    else AI_DIR / "data" / "empirical_field_trials_589.parquet"
)

HIDDEN1, HIDDEN2 = 64, 32
SEED = 42


class Surrogate(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(40, HIDDEN1), nn.ReLU(),
            nn.Linear(HIDDEN1, HIDDEN2), nn.ReLU(),
            nn.Linear(HIDDEN2, 4),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


def metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    err = y_pred - y_true
    ss_res = float(np.sum(err ** 2))
    ss_tot = float(np.sum((y_true - y_true.mean()) ** 2)) or 1.0
    rho = spearmanr(y_true, y_pred).statistic if len(np.unique(y_pred)) > 1 else float("nan")
    return {
        "mae": round(float(np.mean(np.abs(err))), 2),
        "rmse": round(float(np.sqrt(np.mean(err ** 2))), 2),
        "r2": round(1.0 - ss_res / ss_tot, 3),
        "spearman": round(float(rho), 3) if rho == rho else None,
        "n": int(len(y_true)),
    }


# ---------------------------------------------------------------------------
# Forward pass for the *already shipped* weights (torch and JS agree).
# ---------------------------------------------------------------------------
def within_crop_spearman(y: np.ndarray, pred: np.ndarray, crops: np.ndarray, min_n: int = 15) -> float | None:
    """Average rank correlation computed *inside* each crop.

    Cross-crop ranking is trivial (crop identity is an input); this is the only
    fair way to ask whether a model ranks sites/seasons correctly.
    """
    rhos = []
    for cid in np.unique(crops):
        mask = crops == cid
        if mask.sum() < min_n or len(np.unique(pred[mask])) < 2:
            continue
        rho = spearmanr(y[mask], pred[mask]).statistic
        if rho == rho:
            rhos.append(float(rho))
    return round(float(np.mean(rhos)), 3) if rhos else None


def load_shipped_model() -> dict | None:
    if not SHIPPED_SURROGATE.exists():
        return None
    return json.loads(SHIPPED_SURROGATE.read_text(encoding="utf-8"))


def predict_shipped(model: dict | None, X: np.ndarray) -> np.ndarray | None:
    if not model:
        return None
    w1, b1 = np.array(model["w1"], dtype=np.float32), np.array(model["b1"], dtype=np.float32)
    w2, b2 = np.array(model["w2"], dtype=np.float32), np.array(model["b2"], dtype=np.float32)
    w3, b3 = np.array(model["w3"], dtype=np.float32), np.array(model["b3"], dtype=np.float32)
    h1 = np.maximum(X @ w1.T + b1, 0.0)
    h2 = np.maximum(h1 @ w2.T + b2, 0.0)
    out = h2 @ w3.T + b3
    return np.clip(out[:, 0], 0.0, 100.0)


def export_weights(model: Surrogate, out_path: Path, metadata: dict) -> None:
    net = model.net
    payload = {
        "version": "agrorotate.surrogate_weights/real-v1",
        "architecture": f"MLP_40_{HIDDEN1}_{HIDDEN2}_4",
        "activation": "relu",
        "w1": net[0].weight.detach().cpu().numpy().tolist(),
        "b1": net[0].bias.detach().cpu().numpy().tolist(),
        "w2": net[2].weight.detach().cpu().numpy().tolist(),
        "b2": net[2].bias.detach().cpu().numpy().tolist(),
        "w3": net[4].weight.detach().cpu().numpy().tolist(),
        "b3": net[4].bias.detach().cpu().numpy().tolist(),
        "targets": ["yield_gap_pct", "delta_ece", "water_demand_mm", "delta_som"],
        "trained_targets": ["yield_gap_pct"],
        "untrained_heads_zeroed": [1, 2, 3],
        "feature_names": FEATURE_NAMES,
        "metadata": metadata,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload), encoding="utf-8")


def train_fold(X_tr, y_tr, X_va, y_va, epochs: int, seed: int) -> tuple[Surrogate, int]:
    torch.manual_seed(seed)
    np.random.seed(seed)
    model = Surrogate()
    opt = torch.optim.AdamW(model.parameters(), lr=3e-3, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs, eta_min=1e-5)
    xt = torch.tensor(X_tr, dtype=torch.float32)
    yt = torch.tensor(y_tr, dtype=torch.float32)
    xv = torch.tensor(X_va, dtype=torch.float32)
    yv = torch.tensor(y_va, dtype=torch.float32)
    batch = 256
    best_loss, best_epoch, best_state = float("inf"), 0, None
    for epoch in range(epochs):
        model.train()
        perm = torch.randperm(len(xt))
        for b in range(0, len(xt), batch):
            idx = perm[b:b + batch]
            opt.zero_grad()
            pred = model(xt[idx])[:, 0]
            loss = nn.functional.mse_loss(pred, yt[idx])
            loss.backward()
            opt.step()
        sched.step()
        model.eval()
        with torch.no_grad():
            val = nn.functional.mse_loss(model(xv)[:, 0], yv).item()
        if val < best_loss:
            best_loss, best_epoch = val, epoch + 1
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
    if best_state is not None:
        model.load_state_dict(best_state)
    return model, best_epoch


def arc_exam(shipped: dict | None, real_model: Surrogate | None) -> dict:
    if not ARC_BENCHMARK.exists():
        return {"status": "benchmark file missing"}
    df = pd.read_parquet(ARC_BENCHMARK)
    counts = df.groupby("standardized_crop_id")["observed_yield_t_ha"].size()
    keep = counts[counts >= 5].index
    df = df[df["standardized_crop_id"].isin(keep)].copy()
    attainable = df.groupby("standardized_crop_id")["observed_yield_t_ha"].quantile(0.95)
    df["gap"] = (100.0 * (1.0 - df["observed_yield_t_ha"] / df["standardized_crop_id"].map(attainable))).clip(0, 100)

    from contract import CROP_SPECS, build_vector40  # local import to avoid cycle issues

    rows = []
    for rec in df.itertuples(index=False):
        cid = rec.standardized_crop_id
        if cid not in CROP_SPECS:
            continue
        rows.append(
            build_vector40(
                sand_pct=float(rec.sand_pct),
                silt_pct=float(rec.silt_pct),
                clay_pct=float(rec.clay_pct),
                bulk_density=float(rec.bulk_density_g_cm3),
                ph_h2o=float(rec.ph_h2o),
                som_pct=float(rec.som_pct),
                cec_cmol_kg=float(getattr(rec, "cec_cmol_kg", 20.0) or 20.0),
                annual_eto_mm=1800.0,
                slope_pct=1.0,
                crop_id=cid,
                is_warm=CROP_SPECS[cid]["season"] == "warm",
                ece_dsm=float(rec.ece_dsm),
                esp_pct=float(rec.esp_pct),
                water_quota_m3_ha=float(rec.irrigation_depth_mm) * 10.0,
                ecw_dsm=1.0,
            )
        )
    X = np.vstack(rows).astype(np.float32)
    y = df["gap"].to_numpy(dtype=np.float32)[: len(X)]
    crop_arr = df["standardized_crop_id"].to_numpy()[: len(X)]
    crop_mean = pd.Series(y).groupby(crop_arr).transform("mean").to_numpy()
    out = {
        "n": int(len(y)),
        "crops": int(df["standardized_crop_id"].nunique()),
        "crop_mean_baseline": {
            **metrics(y, crop_mean),
            "within_crop_spearman": within_crop_spearman(y, crop_mean, crop_arr),
        },
    }
    old = predict_shipped(shipped, X)
    if old is not None:
        out["shipped_synthetic_model"] = {
            **metrics(y, old),
            "within_crop_spearman": within_crop_spearman(y, old, crop_arr),
        }
    if real_model is not None:
        real_model.eval()
        with torch.no_grad():
            pred = np.clip(real_model(torch.tensor(X))[:, 0].numpy(), 0, 100)
        out["real_v1_model"] = {
            **metrics(y, pred),
            "within_crop_spearman": within_crop_spearman(y, pred, crop_arr),
        }
    return out


def ece_sweep(model: Surrogate, df: pd.DataFrame, X: np.ndarray, levels=(1.0, 4.0, 8.0, 16.0)) -> dict:
    """Does the trained network actually respond to ECe? Fixed median field per crop."""
    model.eval()
    median = pd.DataFrame(X, columns=FEATURE_NAMES).groupby(df["crop_id"].to_numpy()).median()
    per_crop = {}
    deltas = []
    for cid, row in median.iterrows():
        base = row.to_numpy(dtype=np.float32)
        gaps = []
        for level in levels:
            v = base.copy()
            v[14] = min(1.0, level / 20.0)
            with torch.no_grad():
                gaps.append(round(float(np.clip(model(torch.tensor(v[None, :]))[0, 0].item(), 0, 100)), 1))
        per_crop[str(cid)] = {str(level): gap for level, gap in zip(levels, gaps)}
        deltas.append(gaps[-1] - gaps[0])
    return {
        "levels_dsm": list(levels),
        "mean_gap_delta_16_vs_1_pp": round(float(np.mean(deltas)), 2),
        "per_crop": per_crop,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Train the 40-dim yield-gap surrogate on the real table.")
    ap.add_argument(
        "--ece",
        choices=["imputed", "real"],
        default="imputed",
        help="imputed = documented 0.5 dS/m for every row; real = measured WoSIS ECe where available",
    )
    ap.add_argument("--out-dir", default=str(OUT_DIR), help="where weights/metrics are written")
    args = ap.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_parquet(REAL_TABLE)
    X = np.array(df[FEATURE_NAMES], dtype=np.float32, copy=True)
    ece_rows = 0
    if args.ece == "real":
        if "ece_dsm_measured" not in df.columns:
            raise SystemExit(
                "No measured ECe column. Run fetch_wosis_ece.py, attach_site_ece.py then build_real_dataset.py."
            )
        ece_rows = int(df["ece_dsm_measured"].notna().sum())
        ece = df["ece_dsm_measured"].fillna(0.5).to_numpy(dtype=np.float32)
        X[:, 14] = np.clip(ece / 20.0, 0.0, 1.0)
    else:
        # True baseline: the model never sees ECe, exactly as before this change.
        X[:, 14] = 0.5 / 20.0
    y = df["yield_gap_pct"].to_numpy(dtype=np.float32)
    folds = df["spatial_fold"].to_numpy()
    crops = df["crop_id"].to_numpy()
    shipped = load_shipped_model()

    oof = np.zeros(len(y), dtype=np.float32)
    fold_reports = []
    best_epochs = []
    for fold in sorted(np.unique(folds)):
        tr, va = folds != fold, folds == fold
        model, best_epoch = train_fold(X[tr], y[tr], X[va], y[va], epochs=120, seed=SEED + int(fold))
        model.eval()
        with torch.no_grad():
            oof[va] = np.clip(model(torch.tensor(X[va]))[:, 0].numpy(), 0, 100)
        fold_reports.append({"fold": int(fold), **metrics(y[va], oof[va]), "best_epoch": best_epoch})
        best_epochs.append(best_epoch)

    # Baselines, all fitted on the training folds only in a strict pipeline;
    # here we report the trivial global-mean reference for scale.
    global_mean_pred = np.full_like(y, y.mean())
    crop_mean = df.groupby("crop_id")["yield_gap_pct"].transform("mean").to_numpy()
    shipped_pred = predict_shipped(shipped, X)

    report = {
        "model": "AgroRotate real-data yield-gap surrogate v1",
        "trainer": "pipeline/train_real_surrogate.py",
        "dataset": str(REAL_TABLE),
        "rows": int(len(y)),
        "sites": int(df["site_id"].nunique()),
        "crops": int(df["crop_id"].nunique()),
        "label": "relative yield gap (%) vs per-crop p95 attainable yield",
        "validation": "5-fold spatial block CV (folds from lat/lon blocks)",
        "oof_metrics": metrics(y, oof),
        "fold_reports": fold_reports,
        "within_crop_spearman": {
            "real_v1_oof": within_crop_spearman(y, oof, crops),
            "crop_mean": within_crop_spearman(y, crop_mean, crops),
            "shipped_synthetic_surrogate": within_crop_spearman(y, shipped_pred, crops) if shipped_pred is not None else None,
        },
        "baselines": {
            "global_mean": metrics(y, global_mean_pred),
            "crop_mean": metrics(y, crop_mean),
            "shipped_synthetic_surrogate": metrics(y, shipped_pred) if shipped_pred is not None else None,
        },
        "per_crop_spearman_vs_attainable": {},
        "conformal": {},
    }

    if "ece_dsm_measured" in df.columns:
        measured = df["ece_dsm_measured"].notna().to_numpy()
        if measured.any():
            report["oof_metrics_measured_ece_subset"] = {
                **metrics(y[measured], oof[measured]),
                "within_crop_spearman": within_crop_spearman(y[measured], oof[measured], crops[measured]),
            }

    for cid in sorted(np.unique(crops)):
        mask = crops == cid
        if mask.sum() >= 25 and len(np.unique(oof[mask])) > 1:
            rho = spearmanr(y[mask], oof[mask]).statistic
            report["per_crop_spearman_vs_attainable"][cid] = round(float(rho), 3)

    residuals = np.abs(oof - y)
    q90 = float(np.quantile(residuals, 0.90))
    report["conformal"] = {
        "nominal_coverage": 0.90,
        "empirical_half_width_gap_pct": round(q90, 2),
        "note": "Split-conformal half-width on spatially held-out real sites.",
    }

    # Final model: train on every site, epochs = median of the selected CV epochs.
    final_epochs = int(np.median(best_epochs)) if best_epochs else 60
    final_model, _ = train_fold(X, y, X, y, epochs=final_epochs, seed=SEED)
    # Zero the untrained heads so the runtime cannot pretend to predict them.
    with torch.no_grad():
        final_model.net[4].weight[1:].zero_()
        final_model.net[4].bias[1:].zero_()
    final_model.eval()

    attainable_map = (
        df.groupby("crop_id")["attainable_yield_t_ha"].first().round(3).to_dict()
    )
    # Zero-point for the runtime conversion: the gap of the crop's best-managed
    # quartile. The global level is a management/technology artefact and cannot be
    # subtracted from a local potential yield without making every crop unprofitable.
    reference_gap = df.groupby("crop_id")["yield_gap_pct"].quantile(0.25).round(2).to_dict()
    metadata = {
        "trained_on": "MAPSPAM 2020 x NASA POWER x SoilGrids (global cultivated grid cells)",
        "dataset_rows": int(len(y)),
        "dataset_sites": int(df["site_id"].nunique()),
        "dataset_crops": int(df["crop_id"].nunique()),
        "label": "yield_gap_pct",
        "label_semantics": "100 * (1 - observed_yield / attainable_yield_of_same_crop)",
        "attainable_yield_t_ha": {k: float(v) for k, v in attainable_map.items()},
        "reference_gap_pct": {k: float(v) for k, v in reference_gap.items()},
        "runtime_conversion": "reduction = 100 * (1 - (1-gap)/(1-reference_gap_of_crop))",
        "oof_mae": report["oof_metrics"]["mae"],
        "oof_spearman": report["oof_metrics"]["spearman"],
        "conformal_q90_gap_pct": round(q90, 2),
        "imputed_dimensions": [14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
        "warning": "Heads 1..3 are zeroed: this model predicts yield gap only.",
        "ece_feature": (
            "real WoSIS ELCOSP ECe (0-30 cm, nearest profile <=50 km); 0.5 dS/m where absent"
            if args.ece == "real"
            else "documented 0.5 dS/m baseline (no ECe in training)"
        ),
        "ece_rows_measured": ece_rows,
        "generated_utc": datetime.now(timezone.utc).isoformat(),
    }
    report["ece_sweep"] = ece_sweep(final_model, df, X)
    metadata["ece_sweep_mean_gap_delta_16_vs_1_pp"] = report["ece_sweep"]["mean_gap_delta_16_vs_1_pp"]
    export_weights(final_model, out_dir / "real_surrogate_weights.json", metadata)

    report["ece_input"] = args.ece
    report["external_exam_arc_icarda"] = arc_exam(shipped, final_model)
    report["decision"] = {
        "deploy_status": "candidate",
        "reason": "Real labels exist for yield only; salinity/pathogen/nutrient dimensions are imputed.",
        "recommended_runtime_use": "Use head 0 (yield gap) as a prior; keep physics for ECe, pathogens and rotation dynamics.",
    }
    (out_dir / "real_surrogate_metrics.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(json.dumps({k: report[k] for k in ["oof_metrics", "baselines", "conformal"]}, indent=2))
    print("ECe sweep:", json.dumps(report["ece_sweep"]["mean_gap_delta_16_vs_1_pp"]))
    print("ARC exam:", json.dumps(report["external_exam_arc_icarda"], indent=2))
    print("per-crop rho:", report["per_crop_spearman_vs_attainable"])


if __name__ == "__main__":
    main()
