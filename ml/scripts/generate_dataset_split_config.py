import json
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent / "processed"
OUTPUT = Path(__file__).resolve().parent.parent / "reports" / "dataset_split_config.json"

users = ["amal", "vyas", "dristi", "manasa"]
splits = {}

print("=" * 80)
print(f"{'User':<10} | {'Train (Gen/Imp)':<18} | {'Val (Gen/Imp)':<18} | {'Test (Gen/Imp)':<18} | {'Total':<6}")
print("-" * 80)

total_train = 0
total_val = 0
total_test = 0
total_all = 0

for u in users:
    tr = pd.read_csv(ROOT / u / "train.csv")
    va = pd.read_csv(ROOT / u / "val.csv")
    te = pd.read_csv(ROOT / u / "test.csv")
    
    tr_gen = int((tr["label"] == 1).sum())
    tr_imp = int((tr["label"] == 0).sum())
    va_gen = int((va["label"] == 1).sum())
    va_imp = int((va["label"] == 0).sum())
    te_gen = int((te["label"] == 1).sum())
    te_imp = int((te["label"] == 0).sum())
    
    total_u = len(tr) + len(va) + len(te)
    total_train += len(tr)
    total_val += len(va)
    total_test += len(te)
    total_all += total_u
    
    splits[u.capitalize()] = {
        "train": {"total": len(tr), "genuine": tr_gen, "impostor": tr_imp, "pct": round(len(tr)/total_u*100, 1)},
        "val": {"total": len(va), "genuine": va_gen, "impostor": va_imp, "pct": round(len(va)/total_u*100, 1)},
        "test": {"total": len(te), "genuine": te_gen, "impostor": te_imp, "pct": round(len(te)/total_u*100, 1)},
        "total_samples": total_u,
        "genuine_total": tr_gen + va_gen + te_gen,
        "impostor_total": tr_imp + va_imp + te_imp
    }
    
    print(f"{u.capitalize():<10} | {len(tr)} ({tr_gen}/{tr_imp}){'':<6} | {len(va)} ({va_gen}/{va_imp}){'':<6} | {len(te)} ({te_gen}/{te_imp}){'':<6} | {total_u}")

print("-" * 80)
print(f"{'Total':<10} | {total_train:<18} | {total_val:<18} | {total_test:<18} | {total_all}")
print("=" * 80)

splits["Summary"] = {
    "total_train": total_train,
    "total_val": total_val,
    "total_test": total_test,
    "grand_total": total_all,
    "split_policy": "70% Train / 15% Validation / 15% Test (Stratified by genuine/impostor labels)"
}

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(splits, f, indent=2)

print(f"\nSaved split configuration to {OUTPUT}")
