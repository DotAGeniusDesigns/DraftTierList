"""Forward stepwise selection on out-of-sample R2, plus head-to-head tests of
the central analyst claim: does opportunity predict better than production?"""
import numpy as np
from metrics import pairs
from univariate import SETS
from incremental import loso_r2, BASE, EXTRA

def stepwise(pos, pool, start=(), max_k=8, min_gain=0.002):
    chosen = list(start)
    cur = loso_r2(pos, chosen) if chosen else -1e9
    trail = []
    while len(chosen) < max_k:
        best, best_r2 = None, cur
        for m in pool:
            if m in chosen:
                continue
            r2 = loso_r2(pos, chosen + [m])
            if r2 > best_r2:
                best, best_r2 = m, r2
        if best is None or best_r2 - cur < min_gain:
            break
        trail.append((best, best_r2, best_r2 - cur))
        chosen.append(best)
        cur = best_r2
    return chosen, cur, trail

print("FORWARD STEPWISE  (target: next-season half-PPR PPG, leave-one-season-out CV)")
for pos in ("WR", "RB", "TE", "QB"):
    pool = [m for m in dict.fromkeys(SETS[pos] + EXTRA[pos])]
    chosen, r2, trail = stepwise(pos, pool)
    print(f"\n{pos}  (n={len(pairs(pos))})")
    for i, (m, tot, gain) in enumerate(trail, 1):
        print(f"  {i}. {m:<20} R2={tot:.4f}  (+{gain:.4f})")
    print(f"  final out-of-sample R2 = {r2:.4f}")

print("\n\nHEAD-TO-HEAD: production vs opportunity as the sole basis")
OPP = {
    "WR": ["target_share", "air_yards_share", "wopr", "tgt_pg", "rz_tgt_pg", "snap_pct"],
    "TE": ["target_share", "air_yards_share", "wopr", "tgt_pg", "rz_tgt_pg", "snap_pct"],
    "RB": ["opportunity_pg", "weighted_opp_pg", "rush_share", "target_share",
           "rz_att_pg", "rz_tgt_pg", "snap_pct"],
    "QB": ["pass_att_pg", "pass_rz_att_pg", "rush_att_pg"],
}
for pos in ("WR", "RB", "TE", "QB"):
    prod = loso_r2(pos, ["ppg_half"])
    opp = loso_r2(pos, OPP[pos])
    both = loso_r2(pos, ["ppg_half"] + OPP[pos])
    bothage = loso_r2(pos, ["ppg_half", "age"] + OPP[pos])
    print(f"{pos:>4}  prior PPG only {prod:.3f} | opportunity only {opp:.3f} | "
          f"both {both:.3f} | both+age {bothage:.3f}")

print("\n\nTOUCHDOWN LUCK: is TD-over-expected a bust signal?")
print("(coefficient on td_oe_pg when predicting next-season PPG, controlling for prior PPG)")
for pos in ("WR", "RB", "TE"):
    pr = pairs(pos)
    A = [a for a, _ in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    X = np.array([[a["ppg_half"], a.get("td_oe_pg") or 0.0] for a in A], float)
    mu, sd = X.mean(0), X.std(0)
    Z = np.c_[np.ones(len(X)), (X - mu) / sd]
    beta, *_ = np.linalg.lstsq(Z, y, rcond=None)
    print(f"  {pos}: prior PPG {beta[1]:+.3f} | td_oe_pg {beta[2]:+.3f}  "
          f"(negative = TD luck regresses)")
