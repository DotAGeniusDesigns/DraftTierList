"""Replacements for the levers pulled out after the adversarial pass.

The bar here is deliberately different from the earlier audits. A stat does not
have to be orthogonal or to move the score much; it has to be a real, readable
football fact, and it has to not make the model worse. Correlated-but-meaningful
at a small weight is an acceptable trade for a card someone has to read.

Scored as the MEAN gain across five rolling origins rather than one hold-out, so
nothing is picked by staring at a single split.
"""
import numpy as np
from wide_model import fit_signed, SIGN
from audit_candidates import MODEL
from audit_final2 import build, ALPHAS

BASE = {
    "QB": MODEL["QB"]["features"],
    "RB": ["ppg_half", "scrim_yd_pg", "age", "team_change"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "team_change", "ypr"],
}
CANDIDATES = {
    "QB": ["rush_td_pg", "pass_rz_att_pg", "cmp_pct", "pass_att_pg", "rush_yd_pg"],
    "RB": ["rz_att_pg", "tgt_pg", "rec_pg", "rush_share", "weighted_opp_pg",
           "snap_pct", "opportunity_pg", "ypc"],
    "WR": ["rz_tgt_pg", "air_yards_share", "adot", "target_share", "snap_pct",
           "wopr", "ypr", "rec_pg"],
    "TE": ["rz_tgt_pg", "tgt_pg", "target_share", "snap_pct", "adot", "wopr", "rec_pg"],
}
SIGN.update({"ypr": +1, "adot": +1, "cmp_pct": +1, "rec_pg": +1, "ypc": +1,
             "pass_att_pg": +1, "rush_td_pg": +1})
CUTS = (2019, 2020, 2021, 2022, 2023)

def rolling(pos, feats, alpha):
    gains = []
    X, y, seas, names = build(pos, feats)
    for cut in CUTS:
        tr, te = seas <= cut, seas > cut
        b, m, sd = fit_signed(X[tr], y[tr], names, alpha)
        p = np.c_[np.ones(te.sum()), (X[te] - m) / sd] @ b
        gains.append(1 - ((y[te] - p) ** 2).sum() / ((y[te] - y[te].mean()) ** 2).sum())
    return np.array(gains)

for pos in ("QB", "RB", "WR", "TE"):
    alpha = MODEL[pos]["alpha"]
    base = BASE[pos]
    b0 = rolling(pos, base, alpha)
    ship = rolling(pos, MODEL[pos]["features"], alpha)
    print(f"\n{'='*76}")
    print(f"{pos}   shipped {ship.mean():.4f}  ->  base after removals {b0.mean():.4f} "
          f"({b0.mean()-ship.mean():+.4f})   {len(base)} inputs")
    print(f"{'='*76}")
    print(f"  {'candidate':<20}{'mean gain':>11}{'wins':>7}{'weight':>9}")
    rows = []
    for f in CANDIDATES[pos]:
        if f in base:
            continue
        feats = base + [f]
        g = rolling(pos, feats, alpha)
        X, y, seas, names = build(pos, feats)
        if f not in names:
            continue
        beta, mu, sd = fit_signed(X, y, names, alpha)
        w = beta[1 + names.index(f)]
        rows.append((f, (g - b0).mean(), int(np.sum(g > b0)), w))
    for f, gain, wins, w in sorted(rows, key=lambda r: -r[1]):
        mark = ""
        if gain > 0 and wins >= 4:
            mark = "   <-- SAFE"
        elif gain < -0.001:
            mark = "   hurts"
        print(f"  {f:<20}{gain:>+11.5f}{wins:>5}/5{w:>+9.3f}{mark}")
