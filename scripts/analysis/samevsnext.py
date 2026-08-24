"""Same-season explanatory power vs next-season predictive power.
Analyst R^2 claims are usually the former; a draft kit needs the latter."""
import numpy as np
from scipy import stats
from metrics import DERIVED, SEASONS, pairs

def r2_same(pos, metric, min_gp=8):
    xs, ys = [], []
    for s in SEASONS:
        for r in DERIVED[s].values():
            if r["pos"] != pos or r["gp"] < min_gp:
                continue
            v = r.get(metric)
            if v is None:
                continue
            xs.append(v); ys.append(r["ppg_half"])
    x, y = np.array(xs), np.array(ys)
    return stats.pearsonr(x, y)[0] ** 2, len(x)

def r2_next(pos, metric):
    pr = pairs(pos)
    xs = [a.get(metric) for a, _ in pr]
    ys = [b["ppg_half"] for _, b in pr]
    keep = [(v, t) for v, t in zip(xs, ys) if v is not None]
    x = np.array([k[0] for k in keep]); y = np.array([k[1] for k in keep])
    return stats.pearsonr(x, y)[0] ** 2, len(x)

print(f"{'pos':<5}{'metric':<20}{'same-season R2':>16}{'next-season R2':>16}{'drop':>9}")
tests = [("RB", "weighted_opp_pg"), ("RB", "opportunity_pg"), ("RB", "touches_pg"),
         ("WR", "target_share"), ("WR", "wopr"), ("WR", "tgt_pg"),
         ("WR", "air_yards_share"), ("TE", "wopr"), ("QB", "pass_att_pg")]
for pos, m in tests:
    a, na = r2_same(pos, m)
    b, nb = r2_next(pos, m)
    print(f"{pos:<5}{m:<20}{a:>16.3f}{b:>16.3f}{a-b:>9.3f}")
