"""Does a wider model beat the four-driver one out of sample?

The card shows four drivers; that is a display constraint, not a modelling one.
Here the four stay as the headline inputs and a tail of secondary features is
added behind them, with ridge shrinking the weak ones toward zero. The question
is whether the wider model actually predicts better on held-out seasons, or just
looks more thorough.
"""
import numpy as np
from metrics import pairs
from test_levers import DRIVERS, BLEND, enrich, blended

SECONDARY = {
    "WR": ["target_share", "wopr", "air_yards_share", "rz_tgt_pg", "td_oe_pg",
           "snap_pct", "rec_td_pg", "ypt", "gp"],
    "TE": ["tgt_pg", "target_share", "wopr", "rz_tgt_pg", "snap_pct", "rec_td_pg", "gp"],
    "RB": ["opportunity_pg", "rz_att_pg", "td_oe_pg", "rush_share", "weighted_opp_pg",
           "snap_pct", "target_share", "total_td_pg", "gp"],
    "QB": ["pass_td_pg", "rush_yd_pg", "pass_rz_att_pg", "age", "cmp_pct", "gp"],
}
CONTEXT = {
    "WR": ["team_change"],
    "TE": ["team_change"],
    "RB": ["team_change", "draft_pick_log"],
    "QB": ["team_change", "durability"],
}

def design(pos, feats, ctx_feats):
    pr = pairs(pos)
    A = [a for a, _ in pr]
    EX = [enrich(a, b) for a, b in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    seas = np.array([a["season"] for a in A])
    cols, names = [], []
    for f in feats:
        v = np.array([blended(a, f, BLEND[pos]) for a in A], float)
        if np.all(np.isnan(v)):
            continue
        v = np.where(np.isnan(v), np.nanmedian(v), v)
        if v.std() == 0:
            continue
        cols.append(v); names.append(f)
    for f in ctx_feats:
        v = np.array([e.get(f) if e.get(f) is not None else np.nan for e in EX], float)
        if np.all(np.isnan(v)):
            continue
        v = np.where(np.isnan(v), np.nanmedian(v), v)
        if v.std() == 0:
            continue
        cols.append(v); names.append(f)
    return np.column_stack(cols), y, seas, names

def fit(Xtr, ytr, Xte, alpha):
    mu, sd = Xtr.mean(0), Xtr.std(0); sd[sd == 0] = 1
    Ztr = np.c_[np.ones(len(Xtr)), (Xtr - mu) / sd]
    Zte = np.c_[np.ones(len(Xte)), (Xte - mu) / sd]
    P = np.eye(Ztr.shape[1]) * alpha; P[0, 0] = 0
    beta = np.linalg.solve(Ztr.T @ Ztr + P, Ztr.T @ ytr)
    return Zte @ beta

def loso(pos, feats, ctx, alpha):
    X, y, seas, _ = design(pos, feats, ctx)
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        pred[te] = fit(X[~te], y[~te], X[te], alpha)
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

ALPHAS = [1, 5, 15, 40, 100, 250]
print("Four drivers alone vs. the wider model (leave-one-season-out R2)\n")
print(f"{'pos':<5}{'4 drivers':>11}{'wide, best alpha':>19}{'gain':>9}   features")
best_cfg = {}
for pos in ("WR", "RB", "TE", "QB"):
    base = loso(pos, DRIVERS[pos], [], 1.0)
    wide = [(a, loso(pos, DRIVERS[pos] + SECONDARY[pos], CONTEXT[pos], a)) for a in ALPHAS]
    a_best, r_best = max(wide, key=lambda t: t[1])
    _, _, _, names = design(pos, DRIVERS[pos] + SECONDARY[pos], CONTEXT[pos])
    best_cfg[pos] = (a_best, r_best, names)
    print(f"{pos:<5}{base:>11.4f}{r_best:>13.4f} (a={a_best:<3}){r_best-base:>+9.4f}   {len(names)} inputs")
    print(f"      alphas: " + "  ".join(f"{a}:{r:.4f}" for a, r in wide))

print("\nFinal weights in the wide model (standardised; the four headline drivers first)")
for pos in ("WR", "RB", "TE", "QB"):
    alpha, r2, names = best_cfg[pos]
    X, y, _, _ = design(pos, DRIVERS[pos] + SECONDARY[pos], CONTEXT[pos])
    mu, sd = X.mean(0), X.std(0); sd[sd == 0] = 1
    Z = np.c_[np.ones(len(X)), (X - mu) / sd]
    P = np.eye(Z.shape[1]) * alpha; P[0, 0] = 0
    beta = np.linalg.solve(Z.T @ Z + P, Z.T @ y)
    print(f"\n  {pos}  (alpha={alpha}, R2={r2:.4f})")
    for n, c in sorted(zip(names, beta[1:]), key=lambda t: -abs(t[1])):
        tag = "  [shown]" if n in DRIVERS[pos] else ""
        print(f"      {n:<20}{c:+.4f}{tag}")
