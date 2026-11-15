"""
Installs the trained real-v1 model into the two runtime folders the app reads.

    Agrorotate_Front-end_MVP/public/models   <- browser / Web Worker
    Agrorotate_Front-end_MVP/server/models   <- local Node API

It also retires the artefacts of the old synthetic pipeline (ONNX + GRU +
pred-contribution weights) by moving them out of the runtime folders, so nothing
can silently fall back to them.  The previous active weights are backed up under
AI/models/legacy_v3/runtime_backup_<timestamp>/.
"""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
APP = AI_DIR.parent
RUNTIME_DIRS = [APP / "public" / "models", APP / "server" / "models"]
REAL_DIR = AI_DIR / "models" / "real_v1"
BACKUP_ROOT = AI_DIR / "models" / "legacy_v3"
RETIRED = AI_DIR / "models" / "retired_runtime"


OBSOLETE = [
    "agrorotate_fp16.onnx",
    "agrorotate_gru_fp16.onnx",
    "agrorotate_gru_weights.json",
    "ai_pred_contrib_weights.json",
]

DEPLOY_FILES = {
    "real_surrogate_weights.json": "agrorotate_surrogate_weights.json",
    "conformal_calibration.json": "conformal_calibration.json",
}


def deploy() -> dict:
    weights_src = REAL_DIR / "real_surrogate_weights.json"
    if not weights_src.exists():
        raise FileNotFoundError(f"Train the model first: {weights_src} is missing")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_dir = BACKUP_ROOT / f"runtime_backup_{stamp}"
    manifest = {
        "deployed_utc": datetime.now(timezone.utc).isoformat(),
        "model": "agrorotate real-v1 (MAPSPAM/NASA/SoilGrids)",
        "source": str(weights_src),
        "targets": [str(d) for d in RUNTIME_DIRS],
        "backup": str(backup_dir),
        "retired": [],
    }

    for runtime_dir in RUNTIME_DIRS:
        runtime_dir.mkdir(parents=True, exist_ok=True)


        active = runtime_dir / "agrorotate_surrogate_weights.json"
        if active.exists():
            backup_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(active, backup_dir / f"{runtime_dir.parent.name}_surrogate_weights.json")


        for name in OBSOLETE:
            path = runtime_dir / name
            if path.exists():
                RETIRED.mkdir(parents=True, exist_ok=True)
                target = RETIRED / f"{runtime_dir.parent.name}__{name}"
                if target.exists():
                    target.unlink()
                shutil.move(str(path), str(target))
                manifest["retired"].append(str(path))


        for src_name, dst_name in DEPLOY_FILES.items():
            src = REAL_DIR / src_name
            if src.exists():
                shutil.copy2(src, runtime_dir / dst_name)


    weights = json.loads(weights_src.read_text(encoding="utf-8"))
    meta = weights.get("metadata", {})
    marker = {
        "model_version": weights.get("version"),
        "trained_targets": weights.get("trained_targets"),
        "rows": meta.get("dataset_rows"),
        "sites": meta.get("dataset_sites"),
        "crops": meta.get("dataset_crops"),
        "oof_mae": meta.get("oof_mae"),
        "oof_spearman": meta.get("oof_spearman"),
        "deployed_utc": manifest["deployed_utc"],
    }
    for runtime_dir in RUNTIME_DIRS:
        (runtime_dir / "model_manifest.json").write_text(
            json.dumps(marker, indent=2), encoding="utf-8"
        )
    AI_DIR.joinpath("models", "real_v1", "deploy_manifest.json").write_text(
        json.dumps({**manifest, **marker}, indent=2), encoding="utf-8"
    )

    print(f"[+] deployed real-v1 to {len(RUNTIME_DIRS)} runtime folders")
    print(f"    version={marker['model_version']} rows={marker['rows']} crops={marker['crops']}")
    if manifest["retired"]:
        print(f"    retired {len(manifest['retired'])} legacy artefact(s)")
    return manifest


if __name__ == "__main__":
    deploy()
