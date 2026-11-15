"""Runs the real-data AI pipeline end to end.

    python AI/pipeline/run_all.py            # build + train + calibrate
    python AI/pipeline/run_all.py --deploy   # ...and install into the app

Steps
    0. fetch_wosis_ece.py            -> AI/data/real/wosis_ece_topsoil.parquet (real measured ECe)
    0b. attach_site_ece.py           -> AI/data/real/site_ece_links.csv
    1. build_real_dataset.py         -> AI/data/real/*
    2. train_real_surrogate.py       -> AI/models/real_v1/real_surrogate_weights.json
    3. build_conformal_calibration.py-> AI/models/real_v1/conformal_calibration.json
    4. deploy_model.py               -> app public/models + server/models (with --deploy)

Step 0 needs the network once (2 MB from ISRIC) and then uses the cached zip.
If it is unavailable the pipeline continues with the documented 0.5 dS/m ECe.

The deployed model keeps ECe out of the predictors: the A/B run in
AI/models/real_v1/ece_ab_experiment.json shows that feeding the measured ECe of
the 16% covered sites teaches the network the wrong salinity sign and destroys
the ARC/ICARDA external exam. Use `train_real_surrogate.py --ece real` to
reproduce that experiment without touching the deployed model.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PRE_STEPS = [
    "fetch_wosis_ece.py",
    "attach_site_ece.py",
]
STEPS = [
    "build_real_dataset.py",
    "train_real_surrogate.py",
    "build_conformal_calibration.py",
]


def run(step: str) -> int:
    print(f"\n=== {step} ===")
    result = subprocess.run([sys.executable, str(HERE / step)], cwd=HERE)
    return result.returncode


def main() -> int:
    deploy = "--deploy" in sys.argv[1:]
    for step in PRE_STEPS:
        code = run(step)
        if code != 0:
            print(f"[!] {step} skipped; ECe falls back to the documented 0.5 dS/m baseline")

    for step in STEPS:
        code = run(step)
        if code != 0:
            print(f"[!] {step} failed with exit code {code}")
            return code

    if deploy:
        print("\n=== deploy_model.py ===")
        sys.path.insert(0, str(HERE))
        from deploy_model import deploy as deploy_model

        deploy_model()
    else:
        print("\n[i] Model trained but not deployed. Re-run with --deploy to install it.")

    print("\n[+] Pipeline finished.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
