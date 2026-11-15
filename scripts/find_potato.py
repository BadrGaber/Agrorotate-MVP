import os

root_dir = r"c:\Users\badrg\Desktop\Nasa App\Agrorotate_Front-end_MVP"

for dirpath, dirnames, filenames in os.walk(root_dir):
    if any(x in dirpath for x in ["node_modules", ".git", "dist", ".cache"]):
        continue
    for f in filenames:
        if f.endswith((".ts", ".tsx", ".mjs", ".js", ".json", ".py")):
            fp = os.path.join(dirpath, f)
            txt = open(fp, encoding="utf-8", errors="ignore").read()
            for idx, line in enumerate(txt.splitlines()):
                if '"potato"' in line or "'potato'" in line:
                    rel = os.path.relpath(fp, root_dir)
                    print(f"{rel}:{idx+1}: {line.strip()[:100]}")
