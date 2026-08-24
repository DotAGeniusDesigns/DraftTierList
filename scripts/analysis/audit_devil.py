"""Adversarial check on the proposed inputs.

Three specific worries:
  1. The hold-out was reused to CHOOSE between variants, which is the same sin
     the QB drop-one test was caught for. Re-score on rolling origins instead.
  2. career_best / gap_below_peak / prior PPG are near-linearly dependent by
     construction (gap = best - current). Ridge will happily fit unstable weights.
  3. QB has 281 rows and would carry 10 inputs.
"""
import numpy as np
from metrics import pairs
from wide_model import fit_signed, SIGN
from audit_candidates import MODEL
from audit_final2 import build, ALPHAS
from audit_deep import RECOMMENDED

FINAL = {
    "QB": MODEL["QB"]["features"] + ["career_best_ppg", "gap_below_peak"],
    "RB": RECOMMENDED["RB"],
    "WR": RECOMMENDED["WR"] + ["target_competition"],
    "TE": RECOMMENDED["TE"] + ["career_best_ppg"],
}

print("=" * 78)
print("1. ROLLING ORIGIN: fit on <= cutoff, score every season after it")
print("=" * 78)
for pos in ("QB", "RB", "WR", "TE"):
    alpha = MODEL[pos]["alpha"]
    print(f"\n{pos}   (alpha {alpha})")
    print(f"  {'fit through':<13}{'test n':>8}{'shipped':>10}{'proposed':>11}{'gain':>10}")
    gains = []
    for cut in (2019, 2020, 2021, 2022, 2023):
        row = {}
        for label, feats in (("old", MODEL[pos]["features"]), ("new", FINAL[pos])):
            X, y, seas, names = build(pos, feats)
            tr, te = seas <= cut, seas > cut
            if te.sum() < 30:
                row = None; break
            b, m, sd = fit_signed(X[tr], y[tr], names, alpha)
            p = np.c_[np.ones(te.sum()), (X[te] - m) / sd] @ b
            row[label] = 1 - ((y[te] - p) ** 2).sum() / ((y[te] - y[te].mean()) ** 2).sum()
            n_te = te.sum()
        if not row:
            continue
        g = row["new"] - row["old"]
        gains.append(g)
        print(f"  {cut:<13}{n_te:>8}{row['old']:>10.4f}{row['new']:>11.4f}{g:>+10.4f}")
    if gains:
        print(f"  {'mean':<13}{'':>8}{'':>10}{'':>11}{np.mean(gains):>+10.4f}"
              f"   (wins {sum(1 for g in gains if g > 0)}/{len(gains)})")

print("\n" + "=" * 78)
print("2. ARE THE NEW CAREER FEATURES JUST PRIOR PPG WEARING A HAT?")
print("=" * 78)
for pos in ("QB", "TE"):
    X, y, seas, names = build(pos, FINAL[pos])
    idx = {n: i for i, n in enumerate(names)}
    for a, b in (("ppg_half", "career_best_ppg"), ("ppg_reliable", "career_best_ppg"),
                 ("career_best_ppg", "gap_below_peak"), ("ppg_half", "gap_below_peak")):
        if a in idx and b in idx:
            r = np.corrcoef(X[:, idx[a]], X[:, idx[b]])[0, 1]
            flag = "  <- collinear" if abs(r) > 0.9 else ""
            print(f"  {pos}  corr({a}, {b}) = {r:+.3f}{flag}")
    # how often IS career best simply last season?
    print()

print("=" * 78)
print("3. IS A QB GAIN OF THIS SIZE EVEN DISTINGUISHABLE FROM NOISE?")
print("=" * 78)
rng = np.random.default_rng(0)
for pos in ("QB", "WR"):
    X, y, seas, names = build(pos, FINAL[pos])
    alpha = MODEL[pos]["alpha"]
    Xo, yo, so, no_ = build(pos, MODEL[pos]["features"])
    tr, te = seas <= 2021, seas >= 2022
    def r2(Xs, ns):
        b, m, sd = fit_signed(Xs[tr], y[tr], ns, alpha)
        p = np.c_[np.ones(te.sum()), (Xs[te] - m) / sd] @ b
        return 1 - ((y[te] - p) ** 2).sum() / ((y[te] - y[te].mean()) ** 2).sum()
    real = r2(X, names) - r2(Xo, no_)
    # Replace the two new columns with noise and see how big a "gain" that buys.
    fake = []
    new_cols = [i for i, n in enumerate(names) if n not in MODEL[pos]["features"]]
    for _ in range(200):
        Xf = X.copy()
        for i in new_cols:
            Xf[:, i] = rng.permutation(X[:, i])
        fake.append(r2(Xf, names) - r2(Xo, no_))
    fake = np.array(fake)
    print(f"  {pos}: real gain {real:+.4f}   shuffled-column gain: "
          f"mean {fake.mean():+.4f}, 95th pct {np.percentile(fake,95):+.4f}, "
          f"max {fake.max():+.4f}")
    print(f"      -> real gain beats {100*np.mean(real > fake):.0f}% of shuffles")
