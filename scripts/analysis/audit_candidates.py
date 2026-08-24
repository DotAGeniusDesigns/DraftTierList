"""Candidate inputs the model has never tested, measured the same way as the rest.

Each is scored as leave-one-season-out R2 added on top of the SHIPPED input set
for that position, so a lever has to beat what is already there rather than beat
prior PPG alone. The convention from the earlier research holds: under +0.003 is
noise at these sample sizes.
"""
import json, math
import numpy as np
from metrics import DERIVED, SEASONS, pairs
from corpus import norm
from test_levers import BLEND, blended
from wide_model import design, fit_signed, SIGN, loso

MODEL = json.loads(
    open("/home/dotagenius/DraftList/src/utils/projectionModel.js").read()
    .split("PROJECTION_MODEL = ")[1].split("export const ROOKIE_MODEL")[0].rstrip().rstrip(";")
)
ALIAS = {"LAR": "LA", "LVR": "LV", "JAC": "JAX", "WSH": "WAS", "ARZ": "ARI",
         "OAK": "LV", "SD": "LAC", "STL": "LA"}
tm = lambda t: ALIAS.get((t or "").upper(), (t or "").upper())

TSP = {}
for yr, recs in DERIVED.items():
    for r in recs.values():
        if not r.get("team") or r["pos"] not in ("RB", "WR", "TE"):
            continue
        TSP.setdefault((yr, tm(r["team"]), r["pos"]), {})[r["name"]] = (r["rush_att"] or 0) + (r["tgt"] or 0)

POS_MEAN = {(p, s): float(np.mean([r["ppg_half"] for r in DERIVED[s].values() if r["pos"] == p]))
            for p in ("QB", "RB", "WR", "TE") for s in SEASONS}

def extras(pos):
    pr = pairs(pos)
    out = {}
    vac = []
    for a, b in pr:
        team, yr = tm(b.get("team")), a["season"]
        prev, cur = TSP.get((yr, team, pos)), TSP.get((yr + 1, team, pos))
        if pos == "QB" or not prev:
            vac.append(np.nan); continue
        others = {k: v for k, v in prev.items() if k != a["name"]}
        total = sum(others.values())
        if total < 20:
            vac.append(np.nan); continue
        returning = set(cur or {})
        vac.append(100 * sum(v for k, v in others.items() if k not in returning) / total)
    out["vacated_ahead"] = np.array(vac, float)

    trend = []
    for a, _ in pr:
        prev = DERIVED.get(a["season"] - 1, {}).get(f'{norm(a["name"])}|{pos}')
        trend.append(a["ppg_half"] - prev["ppg_half"] if prev else np.nan)
    out["ppg_trend"] = np.array(trend, float)

    out["ppg_reliable"] = np.array([
        (min(a["gp"], 17) / 17) * a["ppg_half"]
        + (1 - min(a["gp"], 17) / 17) * POS_MEAN[(pos, a["season"])]
        for a, _ in pr], float)

    out["age_sq"] = np.array([a["age"] ** 2 if a.get("age") else np.nan for a, _ in pr], float)

    for f in ("total_td_pg", "rec_td_pg", "rush_td_pg", "td_per_att", "td_per_tgt",
              "ypr", "adot", "rec_epa_pg", "racr", "rec_pg", "touches_pg", "pass_att_pg"):
        v = np.array([blended(a, f, BLEND[pos]) for a, _ in pr], float)
        v[~np.isfinite(v)] = np.nan
        if np.isfinite(v).mean() > 0.5 and np.nanstd(v) > 0:
            out[f] = v
    return out

def loso_with(pos, base, name, col, sign, alpha):
    X, y, seas, names, _ = design(pos, base)
    v = np.array(col, float)
    v[~np.isfinite(v)] = np.nan
    if np.all(np.isnan(v)):
        return None
    v = np.where(np.isnan(v), np.nanmedian(v), v)
    if v.std() == 0:
        return None
    X = np.c_[X, v]; names = names + [name]
    SIGN[name] = sign
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], y[~te], names, alpha)
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

if __name__ == "__main__":
    print("Value ADDED on top of the SHIPPED inputs (leave-one-season-out R2)")
    print("Both signs are tried; the better one is reported.\n")
    for pos in ("QB", "RB", "WR", "TE"):
        base, alpha = MODEL[pos]["features"], MODEL[pos]["alpha"]
        full = loso(pos, alpha, base)
        print(f"{pos}  shipped R2 = {full:.4f}")
        rows = []
        for name, col in extras(pos).items():
            best = None
            for sign in (+1, -1):
                r2 = loso_with(pos, base, name, col, sign, alpha)
                if r2 is not None and (best is None or r2 > best[0]):
                    best = (r2, sign)
            if best:
                rows.append((name, best[0] - full, best[1]))
        for name, gain, sign in sorted(rows, key=lambda r: -r[1]):
            mark = "  <-- HELPS" if gain > 0.003 else ""
            print(f"    {name:<18}{gain:+.5f}   sign {sign:+d}{mark}")
        print()
