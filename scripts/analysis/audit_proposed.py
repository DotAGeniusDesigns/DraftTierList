"""Do the individual findings survive being put together?

Builds a proposed input set per position from the drop-one audit (remove what
costs nothing or hurts) and the candidate audit (add what beat +0.003), then
scores it leave-one-season-out against what ships today.
"""
import json
import numpy as np
from metrics import pairs
from test_levers import BLEND, blended, enrich
from wide_model import design, fit_signed, SIGN, loso
from audit_candidates import extras, MODEL

ALPHAS = [1, 5, 15, 40, 100]
SIGN.update({"ppg_reliable": +1, "ppg_trend": +1, "ypr": +1, "age_sq": -1,
             "rec_td_pg": -1, "vacated_ahead": +1})

PROPOSED = {
    # drop pass_td_pg / rush_yd_pg / int_pg: each cost nothing or actively hurt
    "QB": ["ppg_half", "pass_yd_pg", "rush_att_pg", "team_change", "durability"],
    # prior PPG shrunk by games played replaces the raw pair (ppg_half + gp);
    # target_share hurt; direction of travel added
    "RB": ["ppg_reliable", "scrim_yd_pg", "age", "team_change", "ppg_trend"],
    # only target_share hurt; nothing new cleared the bar
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change", "gp"],
    # same reliability swap, td_oe_pg hurt, ypr and TD regression added
    "TE": ["ppg_reliable", "rec_yd_pg", "age", "team_change", "ypr", "rec_td_pg"],
}

def build(pos, feats):
    pr = pairs(pos)
    A = [a for a, _ in pr]
    EX = [enrich(a, b) for a, b in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    seas = np.array([a["season"] for a in A])
    ex = extras(pos)
    cols, names = [], []
    for f in feats:
        if f in ex:
            v = np.array(ex[f], float)
        elif f in ("team_change", "durability", "draft_pick_log"):
            v = np.array([e.get(f) if e.get(f) is not None else np.nan for e in EX], float)
        else:
            v = np.array([blended(a, f, BLEND[pos]) for a in A], float)
        v[~np.isfinite(v)] = np.nan
        if np.all(np.isnan(v)):
            continue
        v = np.where(np.isnan(v), np.nanmedian(v), v)
        if v.std() == 0:
            continue
        cols.append(v); names.append(f)
    return np.column_stack(cols), y, seas, names

def loso_spec(pos, feats, alpha):
    X, y, seas, names = build(pos, feats)
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], y[~te], names, alpha)
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

print(f"{'pos':<5}{'shipped':>10}{'inputs':>8}   {'proposed':>10}{'inputs':>8}{'gain':>10}{'alpha':>7}")
tot_old = tot_new = 0
for pos in ("QB", "RB", "WR", "TE"):
    base, a0 = MODEL[pos]["features"], MODEL[pos]["alpha"]
    old = loso(pos, a0, base)
    feats = PROPOSED[pos]
    a1, new = max(((a, loso_spec(pos, feats, a)) for a in ALPHAS), key=lambda t: t[1])
    n = len(pairs(pos))
    tot_old += old * n; tot_new += new * n
    print(f"{pos:<5}{old:>10.4f}{len(base):>8}   {new:>10.4f}{len(feats):>8}{new-old:>+10.4f}{a1:>7}")
    X, y, seas, names = build(pos, feats)
    beta, mu, sd = fit_signed(X, y, names, a1)
    for f, c in sorted(zip(names, beta[1:]), key=lambda t: -abs(t[1])):
        print(f"        {f:<18}{c:+.4f}")

print("\nHold-out sanity check: fit on 2015-2021 only, score 2022-2025")
print(f"{'pos':<5}{'shipped':>10}{'proposed':>11}{'gain':>10}")
for pos in ("QB", "RB", "WR", "TE"):
    out = {}
    for label, feats, alpha in (("old", MODEL[pos]["features"], MODEL[pos]["alpha"]),
                                ("new", PROPOSED[pos], MODEL[pos]["alpha"])):
        X, y, seas, names = build(pos, feats)
        tr, te = seas <= 2021, seas >= 2022
        beta, mu, sd = fit_signed(X[tr], y[tr], names, alpha)
        p = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
        out[label] = 1 - ((y[te] - p) ** 2).sum() / ((y[te] - y[te].mean()) ** 2).sum()
    print(f"{pos:<5}{out['old']:>10.4f}{out['new']:>11.4f}{out['new']-out['old']:>+10.4f}")
