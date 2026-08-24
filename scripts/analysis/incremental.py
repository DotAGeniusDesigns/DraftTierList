"""Out-of-sample incremental value of each metric beyond prior-season PPG.

Leave-one-season-out CV: for each transition season, train on every other
season and predict the held-out one. All held-out predictions are pooled into a
single out-of-sample R^2, so nothing is scored on data it was fit on.
"""
import numpy as np
from metrics import pairs, DERIVED, SEASONS
from univariate import SETS

RIDGE = 1.0

def fit_predict(Xtr, ytr, Xte):
    mu, sd = Xtr.mean(0), Xtr.std(0)
    sd[sd == 0] = 1.0
    Ztr, Zte = (Xtr - mu) / sd, (Xte - mu) / sd
    Ztr = np.c_[np.ones(len(Ztr)), Ztr]
    Zte = np.c_[np.ones(len(Zte)), Zte]
    P = np.eye(Ztr.shape[1]) * RIDGE
    P[0, 0] = 0.0
    beta = np.linalg.solve(Ztr.T @ Ztr + P, Ztr.T @ ytr)
    return Zte @ beta

def build(pos, feats):
    pr = pairs(pos)
    A = [a for a, _ in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    seas = np.array([a["season"] for a in A])
    X = np.empty((len(A), len(feats)))
    for j, f in enumerate(feats):
        v = np.array([a.get(f) if a.get(f) is not None else np.nan for a in A], float)
        med = np.nanmedian(v)
        X[:, j] = np.where(np.isnan(v), med, v)
    return X, y, seas

def loso_r2(pos, feats):
    X, y, seas = build(pos, feats)
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        pred[te] = fit_predict(X[~te], y[~te], X[te])
    ss_res = ((y - pred) ** 2).sum()
    ss_tot = ((y - y.mean()) ** 2).sum()
    return 1 - ss_res / ss_tot

# ---- TD-over-expected ("touchdown luck"), pooled across all player-seasons ----
def add_td_oe():
    rows = [r for s in SEASONS for r in DERIVED[s].values() if r["pos"] in ("RB", "WR", "TE")]
    X = np.array([[r["rz_att"], r["rz_tgt"],
                   max(r["rush_att"] - r["rz_att"], 0),
                   max(r["tgt"] - r["rz_tgt"], 0)] for r in rows], float)
    y = np.array([r["rush_td"] + r["rec_td"] for r in rows], float)
    coef, *_ = np.linalg.lstsq(np.c_[np.ones(len(X)), X], y, rcond=None)
    print("Expected-TD model  TD =", " + ".join(
        f"{c:.4f}*{n}" for c, n in zip(coef[1:], ["rzAtt", "rzTgt", "att", "tgt"])),
        f"(intercept {coef[0]:.3f})")
    for s in SEASONS:
        for r in DERIVED[s].values():
            if r["pos"] not in ("RB", "WR", "TE"):
                continue
            x = np.array([1, r["rz_att"], r["rz_tgt"],
                          max(r["rush_att"] - r["rz_att"], 0),
                          max(r["tgt"] - r["rz_tgt"], 0)], float)
            exp_td = float(x @ coef)
            r["td_oe_pg"] = (r["rush_td"] + r["rec_td"] - exp_td) / r["gp"]
            r["xtd_pg"] = exp_td / r["gp"]

add_td_oe()

BASE = ["ppg_half"]
EXTRA = {"WR": ["td_oe_pg", "xtd_pg"], "TE": ["td_oe_pg", "xtd_pg"],
         "RB": ["td_oe_pg", "xtd_pg"], "QB": []}

for pos in ("WR", "RB", "TE", "QB"):
    base_r2 = loso_r2(pos, BASE)
    cands = [m for m in dict.fromkeys(SETS[pos] + EXTRA[pos]) if m not in BASE]
    scored = []
    for m in cands:
        scored.append((m, loso_r2(pos, BASE + [m]) - base_r2))
    scored.sort(key=lambda t: -t[1])
    n = len(pairs(pos))
    print(f"\n{'='*72}\n{pos}: baseline (prior PPG only) out-of-sample R2 = {base_r2:.3f}   n={n}\n{'='*72}")
    print(f"{'added metric':<20}{'delta R2':>10}   {'new R2':>8}")
    for m, d in scored[:14]:
        print(f"{m:<20}{d:>+10.4f}   {base_r2 + d:>8.3f}")
