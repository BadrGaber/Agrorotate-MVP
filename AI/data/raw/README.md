# Raw Datasets Directory

This folder holds raw downloaded files from external providers (MAPSPAM, WoSIS, NASA POWER, NASA SRTM, FAOSTAT, GRACE).

To populate or refresh this directory, run:
```bash
python AI/download_real_datasets.py
```

The processed training tables and real-world evaluation benchmarks are stored in `AI/data/processed/` and `AI/data/real/`.
