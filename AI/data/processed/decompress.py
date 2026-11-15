"""Helper script to decompress .csv.gz datasets in this directory."""
import gzip
import shutil
from pathlib import Path

DIR = Path(__file__).resolve().parent

def decompress_all():
    for gz_path in DIR.glob("*.csv.gz"):
        csv_path = gz_path.with_suffix("")
        if not csv_path.exists():
            print(f"Decompressing {gz_path.name} -> {csv_path.name}...")
            with gzip.open(gz_path, "rb") as f_in, open(csv_path, "wb") as f_out:
                shutil.copyfileobj(f_in, f_out)
            print(f"  [+] Ready: {csv_path.name} ({csv_path.stat().st_size} bytes)")
        else:
            print(f"  [=] Already exists: {csv_path.name}")

if __name__ == "__main__":
    decompress_all()
