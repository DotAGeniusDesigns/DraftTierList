"""Age curves and boom/bust base rates for the metrics that survived selection."""
import numpy as np
from collections import defaultdict
from metrics import pairs
import incremental  # adds td_oe_pg / xtd_pg to DERIVED

def bucket_age(pos):
    pr = pairs(pos)
    b = defaultdict(list)
    for a, nxt in pr:
        if a["age"] is None:
            continue
        # change in PPG, and whether they held value
        b[int(a["age"])].append((nxt["ppg_half"] - a["ppg_half"], a["ppg_half"], nxt["ppg_half"]))
    print(f"\n{pos}: age -> median change in PPG the following season")
    print(f"  {'age':<6}{'n':>5}{'med dPPG':>11}{'% who improved':>16}")
    for age in sorted(b):
        v = b[age]
        if len(v) < 15:
            continue
        d = np.array([x[0] for x in v])
        print(f"  {age:<6}{len(v):>5}{np.median(d):>11.2f}{100*np.mean(d > 0):>15.0f}%")

for pos in ("RB", "WR", "TE"):
    bucket_age(pos)

print("\n\nBOOM / BUST base rates among established starters (prior PPG >= 10)")
print("Boom = next-season PPG at least 20% higher; Bust = at least 20% lower.")
for pos in ("WR", "RB", "TE"):
    pr = [(a, b) for a, b in pairs(pos) if a["ppg_half"] >= 10]
    def rates(sub):
        if len(sub) < 25:
            return None
        boom = np.mean([b["ppg_half"] >= a["ppg_half"] * 1.2 for a, b in sub]) * 100
        bust = np.mean([b["ppg_half"] <= a["ppg_half"] * 0.8 for a, b in sub]) * 100
        return len(sub), boom, bust
    base = rates(pr)
    print(f"\n{pos} (n={base[0]}): baseline boom {base[1]:.0f}%  bust {base[2]:.0f}%")
    # split by TD luck
    lucky = [(a, b) for a, b in pr if (a.get("td_oe_pg") or 0) > 0.10]
    unlucky = [(a, b) for a, b in pr if (a.get("td_oe_pg") or 0) < -0.05]
    for label, sub in (("TD-lucky prior yr", lucky), ("TD-unlucky prior yr", unlucky)):
        r = rates(sub)
        if r:
            print(f"  {label:<22} n={r[0]:<4} boom {r[1]:.0f}%  bust {r[2]:.0f}%")
    # split by age
    cut = {"RB": 26, "WR": 28, "TE": 29}[pos]
    for label, sub in ((f"age < {cut}", [(a, b) for a, b in pr if a["age"] and a["age"] < cut]),
                       (f"age >= {cut}", [(a, b) for a, b in pr if a["age"] and a["age"] >= cut])):
        r = rates(sub)
        if r:
            print(f"  {label:<22} n={r[0]:<4} boom {r[1]:.0f}%  bust {r[2]:.0f}%")
    # split by whether opportunity backed the production (target share high vs low)
    key = "opportunity_pg" if pos == "RB" else "target_share"
    vals = [a.get(key) or 0 for a, _ in pr]
    hi = np.percentile(vals, 66)
    lo = np.percentile(vals, 33)
    for label, sub in ((f"{key} top third", [(a, b) for a, b in pr if (a.get(key) or 0) >= hi]),
                       (f"{key} bottom third", [(a, b) for a, b in pr if (a.get(key) or 0) <= lo])):
        r = rates(sub)
        if r:
            print(f"  {label:<22} n={r[0]:<4} boom {r[1]:.0f}%  bust {r[2]:.0f}%")
