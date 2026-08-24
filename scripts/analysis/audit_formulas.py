"""The pieces either side of the projection: blend weights and the expected-TD fit."""
import json
import numpy as np
from metrics import pairs, DERIVED, SEASONS
from test_levers import blended
from wide_model import fit_signed
from audit_candidates import MODEL

ALPHAS = [1, 5, 15, 40, 100]
CANDIDATE_BLENDS = {
    "last season only": [1.0],
    "0.7 / 0.3": [0.7, 0.3],
    "0.6 / 0.3 / 0.1": [0.6, 0.3, 0.1],
    "0.5 / 0.3 / 0.2": [0.5, 0.3, 0.2],
    "0.8 / 0.2": [0.8, 0.2],
    "0.5 / 0.5": [0.5, 0.5],
}

def loso_blend(pos, feats, blend, alpha):
    pr = pairs(pos)
    A = [a for a, _ in pr]
    from test_levers import enrich
    EX = [enrich(a, b) for a, b in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    seas = np.array([a["season"] for a in A])
    cols, names = [], []
    for f in feats:
        if f in ("team_change", "durability", "draft_pick_log"):
            v = np.array([e.get(f) if e.get(f) is not None else np.nan for e in EX], float)
        else:
            v = np.array([blended(a, f, blend) for a in A], float)
        v[~np.isfinite(v)] = np.nan
        if np.all(np.isnan(v)):
            continue
        v = np.where(np.isnan(v), np.nanmedian(v), v)
        if v.std() == 0:
            continue
        cols.append(v); names.append(f)
    X = np.column_stack(cols)
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], y[~te], names, alpha)
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

SHIPPED = {"WR": "0.7 / 0.3", "TE": "0.7 / 0.3", "RB": "0.6 / 0.3 / 0.1", "QB": "0.6 / 0.3 / 0.1"}
print("How many past seasons should an input average over?\n")
for pos in ("QB", "RB", "WR", "TE"):
    feats, alpha = MODEL[pos]["features"], MODEL[pos]["alpha"]
    scores = {k: max(loso_blend(pos, feats, b, a) for a in ALPHAS) for k, b in CANDIDATE_BLENDS.items()}
    best = max(scores, key=scores.get)
    print(f"  {pos}  shipped: {SHIPPED[pos]} = {scores[SHIPPED[pos]]:.4f}"
          f"   best: {best} = {scores[best]:.4f}   ({scores[best]-scores[SHIPPED[pos]]:+.4f})")
    print("       " + "  ".join(f"{k}:{v:.4f}" for k, v in scores.items()))
    print()

print("Expected-touchdown model (drives td_oe_pg)\n")
rows = [r for s in SEASONS for r in DERIVED[s].values() if r["pos"] in ("RB", "WR", "TE")]
X = np.array([[r["rz_att"], r["rz_tgt"], max(r["rush_att"] - r["rz_att"], 0),
               max(r["tgt"] - r["rz_tgt"], 0)] for r in rows], float)
y = np.array([r["rush_td"] + r["rec_td"] for r in rows], float)
A = np.c_[np.ones(len(X)), X]
beta, *_ = np.linalg.lstsq(A, y, rcond=None)
pred = A @ beta
r2 = 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()
print(f"  n={len(y)}  R2={r2:.3f}  resid sd={np.std(y-pred):.2f} TDs")
print(f"  share of players it puts on a NEGATIVE expected TD count: {100*np.mean(pred<0):.1f}%")
for pos in ("RB", "WR", "TE"):
    m = np.array([r["pos"] == pos for r in rows])
    print(f"    {pos}: mean actual {y[m].mean():.2f}  mean expected {pred[m].mean():.2f}"
          f"  bias {pred[m].mean()-y[m].mean():+.2f}")
