import os
import re
import json
import time
import math
import zipfile
import io
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
import requests

AI_DIR = Path(__file__).resolve().parent
ROOT_DIR = AI_DIR.parent
BASE_DIR = AI_DIR / "data"
RAW_DIR = BASE_DIR / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)


def load_earthdata_token() -> str:
    for env_file in [
        ROOT_DIR / "Agrorotate_Front-end_MVP" / ".env",
        ROOT_DIR / "Agrorotate_Front-end_MVP" / ".env.local",
        ROOT_DIR / ".env",
    ]:
        if env_file.exists():
            text = env_file.read_text(encoding="utf-8", errors="ignore")
            m = re.search(r'EARTHDATA_TOKEN\s*=\s*["\']?([^\s"\']+)["\']?', text)
            if m:
                return m.group(1).strip()
    return os.environ.get("EARTHDATA_TOKEN", "").strip()


EARTHDATA_TOKEN = load_earthdata_token()
NASA_HEADERS = {"Authorization": f"Bearer {EARTHDATA_TOKEN}"} if EARTHDATA_TOKEN else {}


def _find_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
    lower_map = {c.lower(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in lower_map:
            return lower_map[cand.lower()]
    return None





def fetch_1_isric_wosis_sites(target_sites: int = 550) -> pd.DataFrame:
    out_sites = RAW_DIR / "1a_wosis_authentic_550_sites.parquet"
    out_lab_props = RAW_DIR / "1b_wosis_real_lab_measurements.parquet"
    print("\n[1/7] Downloading Real Laboratory Soil Profiles from ISRIC WoSIS WFS...")


    wfs_profiles = (
        "https://maps.isric.org/mapserv?map=/map/wosis_latest.map"
        "&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature"
        "&TYPENAMES=ms:wosis_latest_profiles&COUNT=15000&OUTPUTFORMAT=csv"
    )
    r = requests.get(wfs_profiles, timeout=120)
    r.raise_for_status()

    raw_csv = RAW_DIR / "1a_wosis_profiles_raw.csv"
    raw_csv.write_bytes(r.content)
    df_raw = pd.read_csv(raw_csv, low_memory=False)

    lat_col = _find_col(df_raw, ["latitude", "lat", "y"])
    lon_col = _find_col(df_raw, ["longitude", "lon", "lng", "x"])
    id_col = _find_col(df_raw, ["profile_id", "id", "fid"])
    country_col = _find_col(df_raw, ["country_name", "country"])
    ds_col = _find_col(df_raw, ["ds_id", "dataset_id", "source"])

    if not lat_col or not lon_col:
        raise RuntimeError(f"Could not locate lat/lon columns in WoSIS response: {df_raw.columns.tolist()}")

    df_clean = pd.DataFrame({
        "profile_id": df_raw[id_col].astype(str) if id_col else df_raw.index.astype(str),
        "country": df_raw[country_col].fillna("Unknown").astype(str) if country_col else "Unknown",
        "dataset_id": df_raw[ds_col].fillna("WoSIS").astype(str) if ds_col else "WoSIS",
        "lat": pd.to_numeric(df_raw[lat_col], errors="coerce"),
        "lon": pd.to_numeric(df_raw[lon_col], errors="coerce"),
    }).dropna(subset=["lat", "lon"])


    df_clean = df_clean[(df_clean["lat"].between(-55.0, 65.0)) & (df_clean["lon"].between(-180.0, 180.0))]
    df_clean = df_clean.drop_duplicates(subset=["lat", "lon"]).copy()


    df_clean["geo_bin"] = (df_clean["lat"] // 5).astype(int).astype(str) + "_" + (df_clean["lon"] // 5).astype(int).astype(str)
    sampled_list = []

    for _, grp in df_clean.groupby("geo_bin"):
        sampled_list.append(grp.sample(n=1, random_state=42))
    df_diverse = pd.concat(sampled_list, ignore_index=True)

    if len(df_diverse) >= target_sites:
        df_550 = df_diverse.sample(n=target_sites, random_state=42).reset_index(drop=True)
    else:
        remaining = df_clean[~df_clean["profile_id"].isin(df_diverse["profile_id"])]
        extra = remaining.sample(n=min(target_sites - len(df_diverse), len(remaining)), random_state=42)
        df_550 = pd.concat([df_diverse, extra], ignore_index=True).reset_index(drop=True)

    df_550["site_id"] = "WOSIS_" + df_550["profile_id"].str.replace(r"[^A-Za-z0-9_-]", "", regex=True)
    df_550["source"] = "ISRIC_WOSIS_AUTHENTIC_PROFILE"
    df_550 = df_550[["site_id", "profile_id", "country", "dataset_id", "lat", "lon", "source"]]
    df_550.to_parquet(out_sites, index=False)
    print(f"  [+] Saved {out_sites.name}: {len(df_550)} real lab sites across {df_550['country'].nunique()} countries.")


    lab_frames = []
    for prop_layer, prop_name in [("ms:wosis_latest_phaq", "ph_h2o_lab"), ("ms:wosis_latest_clay", "clay_pct_lab")]:
        try:
            url_p = (
                f"https://maps.isric.org/mapserv?map=/map/wosis_latest.map"
                f"&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature"
                f"&TYPENAMES={prop_layer}&COUNT=10000&OUTPUTFORMAT=csv"
            )
            rp = requests.get(url_p, timeout=90)
            if rp.status_code == 200 and len(rp.content) > 500:
                df_p = pd.read_csv(io.BytesIO(rp.content), low_memory=False)
                df_p["property_type"] = prop_name
                lab_frames.append(df_p)
                print(f"  [+] Fetched {len(df_p)} real lab layer records for {prop_name}")
        except Exception as e:
            print(f"  [!] Notice fetching {prop_layer}: {e}")

    if lab_frames:
        pd.concat(lab_frames, ignore_index=True).to_parquet(out_lab_props, index=False)
        print(f"  [+] Saved {out_lab_props.name}")

    return df_550





def fetch_2_nasa_power(df_sites: pd.DataFrame):
    out_file = RAW_DIR / "2_nasa_power_550.parquet"
    print("\n[2/7] Downloading NASA POWER Real Climate Data for the 550 WoSIS sites...")
    records = []

    def get_one(row):
        url = (
            "https://power.larc.nasa.gov/api/temporal/climatology/point"
            "?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS2M,RH2M"
            f"&community=AG&longitude={row['lon']}&latitude={row['lat']}&format=JSON"
        )
        r = requests.get(url, timeout=25)
        r.raise_for_status()
        p = r.json()["properties"]["parameter"]
        return {
            "site_id": row["site_id"],
            "lat": row["lat"],
            "lon": row["lon"],
            "nasa_tmax_ann": p["T2M_MAX"]["ANN"],
            "nasa_tmin_ann": p["T2M_MIN"]["ANN"],
            "nasa_precip_ann_mm_yr": round(p["PRECTOTCORR"]["ANN"] * 365.25, 2),
            "nasa_solar_rad_ann": p["ALLSKY_SFC_SW_DWN"]["ANN"],
            "nasa_wind_2m_ann": p["WS2M"]["ANN"],
            "nasa_rh2m_ann": p["RH2M"]["ANN"],
            "source": "NASA_POWER_REAL_API",
        }

    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(get_one, row): row["site_id"] for _, row in df_sites.iterrows()}
        for i, fut in enumerate(as_completed(futures), 1):
            try:
                records.append(fut.result())
            except Exception as e:
                print(f"  [!] POWER failed for {futures[fut]}: {e}")
            if i % 100 == 0:
                print(f"  -> {i}/{len(df_sites)} sites completed...")

    pd.DataFrame(records).to_parquet(out_file, index=False)
    print(f"  [+] Saved {out_file.name} ({len(records)} rows)")





def fetch_3_nasa_srtm30m(df_sites: pd.DataFrame):
    out_file = RAW_DIR / "3_nasa_srtm30m_550.parquet"
    print("\n[3/7] Downloading NASA SRTM 30m Elevation & Slope for the 550 sites...")
    records = []
    batch_size = 30
    delta = 0.0003

    for start in range(0, len(df_sites), batch_size):
        batch = df_sites.iloc[start : start + batch_size]
        locs = []
        for _, r in batch.iterrows():
            lat, lon = r["lat"], r["lon"]
            locs.extend([f"{lat},{lon}", f"{lat + delta},{lon}", f"{lat},{lon + delta}"])

        url = f"https://api.opentopodata.org/v1/srtm30m?locations={'|'.join(locs)}"
        try:
            resp = requests.get(url, timeout=25)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                for idx_in_b, (_, r) in enumerate(batch.iterrows()):
                    base = idx_in_b * 3
                    e0 = results[base]["elevation"] or 0.0
                    en = results[base + 1]["elevation"] or e0
                    ee = results[base + 2]["elevation"] or e0
                    dz_dy = (en - e0) / 33.3
                    dz_dx = (ee - e0) / (33.3 * max(0.2, math.cos(math.radians(r["lat"]))))
                    slope_pct = round(math.sqrt(dz_dx**2 + dz_dy**2) * 100.0, 2)
                    records.append({
                        "site_id": r["site_id"],
                        "srtm_elevation_m": round(float(e0), 1),
                        "srtm_slope_pct": slope_pct,
                        "source": "NASA_SRTM_30M_REAL",
                    })
        except Exception as e:
            print(f"  [!] SRTM batch {start} failed: {e}")
        time.sleep(1.1)

    pd.DataFrame(records).to_parquet(out_file, index=False)
    print(f"  [+] Saved {out_file.name} ({len(records)} rows)")





def fetch_4_isric_soilgrids(df_sites: pd.DataFrame):
    out_file = RAW_DIR / "4_isric_soilgrids_550.parquet"
    print("\n[4/7] Downloading ISRIC SoilGrids 250m v2.0 Priors for the 550 sites...")
    records = []

    def get_sg(row):
        url = (
            "https://rest.isric.org/soilgrids/v2.0/properties/query"
            f"?lon={row['lon']}&lat={row['lat']}"
            "&property=clay&property=sand&property=silt&property=phh2o&property=soc&property=bdod&property=cec"
            "&depth=0-5cm&depth=5-15cm&depth=15-30cm&value=mean"
        )
        r = requests.get(url, timeout=25)
        r.raise_for_status()
        layers = r.json().get("properties", {}).get("layers", [])
        vals = {"site_id": row["site_id"], "source": "ISRIC_SOILGRIDS_V2_REAL"}
        for lyr in layers:
            name = lyr["name"]
            for d in lyr.get("depths", []):
                lbl = d["label"].replace("-", "_")
                vals[f"sg_{name}_{lbl}"] = d["values"].get("mean")
        return vals

    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(get_sg, row): row["site_id"] for _, row in df_sites.iterrows()}
        for i, fut in enumerate(as_completed(futures), 1):
            try:
                records.append(fut.result())
            except Exception:
                pass
            if i % 100 == 0:
                print(f"  -> {i}/{len(df_sites)} SoilGrids sites completed...")

    pd.DataFrame(records).to_parquet(out_file, index=False)
    print(f"  [+] Saved {out_file.name} ({len(records)} rows)")





def fetch_5_fao_and_eppo():
    print("\n[5/7] Downloading FAOSTAT Producer Prices & EPPO Pathogen Records...")
    fao_zip_url = "https://fenixservices.fao.org/faostat/static/bulkdownloads/Prices_E_All_Data_(Normalized).zip"
    try:
        r = requests.get(fao_zip_url, timeout=60)
        if r.status_code == 200:
            with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
                csv_name = [n for n in zf.namelist() if n.endswith(".csv") and "Flags" not in n][0]
                with zf.open(csv_name) as f:
                    df_fao = pd.read_csv(f, usecols=["Area", "Item", "Element", "Year", "Unit", "Value"], low_memory=False)
                    df_usd = df_fao[(df_fao["Element"] == "Producer Price (USD/tonne)") & (df_fao["Year"] >= 2020)]
                    out_fao = RAW_DIR / "5a_faostat_producer_prices.parquet"
                    df_usd.to_parquet(out_fao, index=False)
                    print(f"  [+] Saved {out_fao.name} ({len(df_usd)} real price rows)")
    except Exception as e:
        print(f"  [!] FAOSTAT download notice: {e}")

    eppo_codes = {
        "rootKnotNematode": "MELGIN",
        "fusariumWilt": "FUSAOX",
        "alliumWhiteRot": "SCLOCE",
        "orobancheBroomrape": "ORACR",
        "cystNematode": "HETDSC",
        "rhizoctoniaRootRot": "RHIZSO",
    }
    eppo_dump = {}
    for name, code in eppo_codes.items():
        try:
            r = requests.get(f"https://data.eppo.int/api/rest/1.0/taxon/{code}", timeout=15)
            if r.status_code == 200:
                eppo_dump[name] = r.json()
        except Exception:
            pass
    out_eppo = RAW_DIR / "5b_eppo_pathogens_taxonomy.json"
    out_eppo.write_text(json.dumps(eppo_dump, indent=2), encoding="utf-8")
    print(f"  [+] Saved {out_eppo.name} ({len(eppo_dump)}/6 EPPO records)")





def fetch_6_nasa_grace():
    out_nc = RAW_DIR / "6_nasa_grace_mascon_rl06.nc"
    print("\n[6/7] Downloading NASA GRACE/GRACE-FO Mascon Groundwater NetCDF...")
    cmr_url = (
        "https://cmr.earthdata.nasa.gov/search/granules.json"
        "?short_name=TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.1_V3&page_size=1&sort_key=-start_date"
    )
    try:
        r = requests.get(cmr_url, timeout=20).json()
        entries = r.get("feed", {}).get("entry", [])
        nc_links = [
            lnk["href"]
            for e in entries
            for lnk in e.get("links", [])
            if lnk.get("href", "").endswith(".nc") and lnk["href"].startswith("https://")
        ]
        if not nc_links:
            print("  [!] No direct .nc link found via CMR.")
            return

        with requests.get(nc_links[0], headers=NASA_HEADERS, stream=True, timeout=60) as resp:
            resp.raise_for_status()
            with open(out_nc, "wb") as f:
                for chunk in resp.iter_content(chunk_size=1024 * 256):
                    f.write(chunk)
        print(f"  [+] Saved {out_nc.name} ({out_nc.stat().st_size / (1024*1024):.1f} MB)")
    except Exception as e:
        print(f"  [!] GRACE download failed: {e}")


if __name__ == "__main__":
    print("=" * 72)
    print("AgroRotate — 100% Authentic WoSIS-Anchored 6-Source Downloader")
    print("=" * 72)
    df_real_sites = fetch_1_isric_wosis_sites(target_sites=550)
    fetch_2_nasa_power(df_real_sites)
    fetch_3_nasa_srtm30m(df_real_sites)
    fetch_4_isric_soilgrids(df_real_sites)
    fetch_5_fao_and_eppo()
    fetch_6_nasa_grace()
    print("\nALL 6 REAL SOURCES FINISHED! Check AI/data/raw/")