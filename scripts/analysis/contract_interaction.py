"""Is the contract-year effect real but CONCENTRATED among low-production /
low-usage players?

Motivation: contract_year's flat effect is worth nothing in the joint fit
(test_contractyear.py), but the way it failed is suggestive. Its Spearman
partial was strongly positive (+0.13 to +0.20) while its Pearson partial was
~zero. Spearman is dominated by rank movement, and rank movement lives among
the hundreds of fringe players packed into 0-5 PPG. That is exactly the
signature of "this matters for small-role players and not for starters" -- so
it is worth testing directly rather than reading off a rank statistic.

Tested in PPG units, within production/usage buckets, so regression to the mean
(low producers drift up regardless) is held constant by comparing contract-year
against non-contract-year players INSIDE the same bucket.

The confound to beat: contract years cluster by career stage. A rookie deal
expires in year 4, when a low-producing 25-year-old may simply be ascending.
That is career stage, not motivation, so the age split at the end matters as
much as the headline.
"""
import io, sys
import numpy as np
from scipy import stats

_buf = sys.stdout
sys.stdout = io.StringIO()
sys.path.insert(0, "/home/dotagenius/DraftList/scripts/analysis")
from metrics import DERIVED, SEASONS
from contractyear import CONTRACT_YEARS, is_contract_year
sys.stdout = _buf

def collect(pos):
    out = []
    for s in SEASONS[:-1]:
        nxt = DERIVED.get(s + 1)
        if not nxt:
            continue
        for key, rec in DERIVED[s].items():
            if rec["pos"] != pos or rec["gp"] < 8:
                continue
            t = nxt.get(key)
            if not t or t["gp"] < 6:
                continue
            if key not in CONTRACT_YEARS:
                continue
            out.append((rec, t, 1 if is_contract_year(key, s + 1) else 0))
    return out

def bucket_report(pos, rows, keyfn, label, n_buckets=3):
    vals = np.array([keyfn(a) for a, _, _ in rows], float)
    ok = ~np.isnan(vals)
    rows = [r for r, k in zip(rows, ok) if k]
    vals = vals[ok]
    if len(rows) < 60:
        print(f"  {pos} by {label}: n={len(rows)}, too few")
        return
    edges = [np.percentile(vals, 100 * i / n_buckets) for i in range(1, n_buckets)]
    names = ["bottom third", "middle third", "top third"][:n_buckets]
    print(f"\n  {pos} split by {label}")
    print(f"    {'bucket':<15}{'n(cy)':>7}{'n(no)':>7}{'nextPPG cy':>12}{'nextPPG no':>12}{'diff':>8}{'p':>9}")
    for i, name in enumerate(names):
        lo = -np.inf if i == 0 else edges[i - 1]
        hi = np.inf if i == n_buckets - 1 else edges[i]
        sel = [(a, b, c) for (a, b, c), v in zip(rows, vals) if lo <= v < hi]
        cy = np.array([b["ppg_half"] for a, b, c in sel if c == 1])
        no = np.array([b["ppg_half"] for a, b, c in sel if c == 0])
        if len(cy) < 10 or len(no) < 10:
            continue
        d = cy.mean() - no.mean()
        p = stats.ttest_ind(cy, no, equal_var=False)[1]
        star = " *" if p < 0.05 else ""
        print(f"    {name:<15}{len(cy):>7}{len(no):>7}{cy.mean():>12.2f}{no.mean():>12.2f}"
              f"{d:>+8.2f}{p:>9.3f}{star}")

print("=" * 84)
print("Contract year, in PPG units, within production and usage buckets")
print("(cy = contract year; diff = contract-year mean minus everyone else, same bucket)")
print("=" * 84)
for pos in ("WR", "RB", "TE"):
    rows = collect(pos)
    bucket_report(pos, rows, lambda a: a["ppg_half"], "prior PPG")
    bucket_report(pos, rows, lambda a: a.get("snap_pct") if a.get("snap_pct") is not None else np.nan,
                  "prior snap share")

# ---- the career-stage confound ------------------------------------------
# If the effect is really "ascending young player on an expiring rookie deal",
# it should vanish once age is held inside the low-production bucket.
print("\n" + "=" * 84)
print("Low-production bucket only, split by age -- is it motivation or career stage?")
print("=" * 84)
for pos in ("WR", "RB", "TE"):
    rows = collect(pos)
    ppg = np.array([a["ppg_half"] for a, _, _ in rows])
    cut = np.percentile(ppg, 33)
    low = [(a, b, c) for (a, b, c) in rows if a["ppg_half"] <= cut and a["age"] is not None]
    print(f"\n  {pos} (prior PPG <= {cut:.1f}, n={len(low)})")
    print(f"    {'age band':<15}{'n(cy)':>7}{'n(no)':>7}{'nextPPG cy':>12}{'nextPPG no':>12}{'diff':>8}{'p':>9}")
    for label, lo, hi in (("<= 25", 0, 25.999), ("26-28", 26, 28.999), ("29+", 29, 99)):
        sel = [(a, b, c) for a, b, c in low if lo <= a["age"] <= hi]
        cy = np.array([b["ppg_half"] for a, b, c in sel if c == 1])
        no = np.array([b["ppg_half"] for a, b, c in sel if c == 0])
        if len(cy) < 10 or len(no) < 10:
            print(f"    {label:<15}{len(cy):>7}{len(no):>7}      (too few)")
            continue
        d = cy.mean() - no.mean()
        p = stats.ttest_ind(cy, no, equal_var=False)[1]
        star = " *" if p < 0.05 else ""
        print(f"    {label:<15}{len(cy):>7}{len(no):>7}{cy.mean():>12.2f}{no.mean():>12.2f}"
              f"{d:>+8.2f}{p:>9.3f}{star}")
