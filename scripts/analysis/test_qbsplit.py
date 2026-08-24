"""Two QB experiments: split the fit, and prune the inputs that fit to zero.

QB fantasy scoring is two nearly independent things bolted together — passing
(high volume, low variance) and rushing (low volume, very sticky, worth six
points a score). They correlate about 0.4 with each other, so one blended linear
fit may be averaging two different processes. This tests fitting them apart.

Also tests whether the inputs that land at exactly zero can simply be dropped:
if they cost nothing, the model should not claim to run on them.
"""
import numpy as np
from metrics import pairs
from test_levers import BLEND, enrich, blended
from wide_model import DRIVERS, SECONDARY, CONTEXT, SIGN, fit_signed
from test_resid import build, loso, live_count

ALPHAS = [1, 5, 15, 40, 100]

# Sleeper default scoring, the same basis the corpus is pre-scored on.
def pass_pts(r):
    return (r.get("pass_yd_pg") or 0) * 0.04 + (r.get("pass_td_pg") or 0) * 4 - (r.get("int_pg") or 0)
def rush_pts(r):
    return (r.get("rush_yd_pg") or 0) * 0.1 + (r.get("rush_td_pg") or 0) * 6

print("=== A. Does pass + rush decompose QB PPG cleanly? ===")
pr = pairs("QB")
tot = np.array([b["ppg_half"] for _, b in pr])
recon = np.array([pass_pts(b) + rush_pts(b) for _, b in pr])
print(f"  corr(actual, pass+rush reconstruction) = {np.corrcoef(tot, recon)[0,1]:.4f}")
print(f"  mean actual {tot.mean():.2f} vs reconstruction {recon.mean():.2f}"
      f"  (gap is fumbles / bonuses)\n")

print("=== B. Split fit vs single fit (leave-one-season-out) ===")
cols, names, y, seas = build("QB")
A = [a for a, _ in pr]
yp = np.array([pass_pts(b) for _, b in pr]); yr = np.array([rush_pts(b) for _, b in pr])
X = np.column_stack([cols[n] for n in names])

def loso_target(target, alpha):
    pred = np.empty_like(target)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], target[~te], names, alpha)
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    return pred

single_a, single = max(((a, loso(cols, names, y, seas, a)) for a in ALPHAS), key=lambda t: t[1])
best = None
for ap in ALPHAS:
    for ar in ALPHAS:
        p = loso_target(yp, ap) + loso_target(yr, ar)
        # rebase onto total PPG: the two parts miss fumbles, so allow one shift
        p = p + (y.mean() - p.mean())
        r2 = 1 - ((y - p) ** 2).sum() / ((y - y.mean()) ** 2).sum()
        if best is None or r2 > best[0]:
            best = (r2, ap, ar)
print(f"  single blended fit : R2 = {single:.4f}  (alpha={single_a})")
print(f"  split pass + rush  : R2 = {best[0]:.4f}  (alpha pass={best[1]}, rush={best[2]})")
print(f"  gain               : {best[0]-single:+.4f}\n")

print("=== C. Can the zero-weight inputs be dropped? ===")
print(f"  {'pos':<5}{'all inputs':>12}{'n':>4}   {'pruned':>10}{'n':>4}{'change':>9}")
for pos in ("WR", "RB", "TE", "QB"):
    c, nm, yy, ss = build(pos)
    a_full, r_full = max(((a, loso(c, nm, yy, ss, a)) for a in ALPHAS), key=lambda t: t[1])
    _, beta = live_count(c, nm, yy, a_full)
    keep = [n for n, b in zip(nm, beta) if abs(b) >= 0.01]
    a_pr, r_pr = max(((a, loso(c, keep, yy, ss, a)) for a in ALPHAS), key=lambda t: t[1])
    print(f"  {pos:<5}{r_full:>12.4f}{len(nm):>4}   {r_pr:>10.4f}{len(keep):>4}{r_pr-r_full:>+9.4f}")
    print(f"        dropped: {', '.join(n for n in nm if n not in keep) or '—'}")
