# -*- coding: utf-8 -*-
"""Generate server/ai/crops.json from src/data/evidence/crops.generated.ts.

Run after regenerating the evidence dataset:
    python scripts/export-crops-json.py
"""
import io, json, os, re

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(base, "src", "data", "evidence", "crops.generated.ts")
dst = os.path.join(base, "server", "ai", "crops.json")

text = io.open(src, encoding="utf-8").read()
start = text.index("export const EVIDENCE_CROPS: EvidenceCrop[] = [") + len(
    "export const EVIDENCE_CROPS: EvidenceCrop[] = "
)
end = text.index("];", start) + 1
array_text = text[start:end].strip().rstrip(",")
crops = json.loads(array_text)


def slugify(value):
    s = value.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


out = []
for crop in crops:
    sal = crop.get("salinity") or {}
    out.append({
        "id": slugify(crop["name"]),
        "name": crop["name"],
        "scientificName": crop["scientificName"],
        "family": crop["family"],
        "season": crop["season"],
        "seasonRaw": crop["seasonRaw"],
        "salinityLimitDsm": sal.get("limitDsm"),
        "salinitySlopePercentPerDsm": sal.get("slopePercentPerDsm"),
        "salinitySourceUrl": sal.get("sourceUrl"),
        "salinityStatus": sal.get("status"),
        "claimsTotal": crop["claimsTotal"],
        "supportedClaims": crop["supportedClaims"],
    })

with io.open(dst, "w", encoding="utf-8", newline="\n") as fh:
    json.dump({"source": "src/data/evidence/crops.generated.ts", "crops": out}, fh,
              ensure_ascii=False, indent=2)
    fh.write("\n")

print("wrote", dst, "with", len(out), "crops,",
      sum(1 for c in out if c["salinityLimitDsm"] is not None), "salinity pairs")
