"""Screens the compound metrics in composites.py, then escalates whatever
survives to the real bar.

Pipeline, in the order the project learned it should be:
  1. Pearson against the shipped model's OUT-OF-SAMPLE residual. Pearson, not
     Spearman -- the rank statistic disagrees in SIGN on skewed inputs and
     produced both a false positive and a false negative in one earlier round
     (see test_rescreen.py).
  2. Holm correction across the whole family of 21.
  3. Survivors go to leave-one-season-out AND the five-origin rolling audit.
     LOSO alone is not sufficient: it trains on future seasons to predict past
     ones, and it rewarded an RB input (+0.0033) that the rolling origin then
     showed was negative going forward.

One or two metrics per concept, chosen before running anything, rather than
every variant -- late_tgt_pg, late_touch_pg and role_trend all measure the same
idea, and stuffing all of them in inflates the family and buys nothing. Note
the tests are correlated (role trend and late PPG especially), which makes Holm
conservative here rather than lenient.
"""
import io, sys
import numpy as np
from scipy import stats

_buf = sys.stdout
sys.stdout = io.StringIO()
sys.path.insert(0, "/home/dotagenius/DraftList/scripts/analysis")
import wide_model
from wide_model import SECONDARY, CONTEXT, SIGN, design, fit_signed, loso as loso_signed
from metrics import pairs
from composites import attach_composites
from ngsrecv import attach_ngs_recv_features
sys.stdout = _buf

attach_composites()
attach_ngs_recv_features()

FEATURES = {
    "QB": ["ppg_half", "pass_yd_pg", "rush_att_pg", "int_pg",
           "pass_td_pg", "rush_yd_pg", "team_change", "durability"],
    "RB": ["ppg_half", "scrim_yd_pg", "age", "tgt_pg", "team_change"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "ypr", "target_share", "team_change",
           "avg_yac_above_expectation"],
}
ALPHAS = [1, 5, 15, 40, 100]
ALPHA_SHIPPED = {"QB": 15, "RB": 15, "WR": 40, "TE": 15}

def team_change(a, b):
    return 0.0 if (a.get("team") and b.get("team") == a.get("team")) else 1.0

def plain(feat):
    return lambda a, b: (np.nan if a.get(feat) is None else float(a[feat]))

# team_change costs less for a back whose yards came after contact -- that part
# of his production is his own and travels with him. Centred so the term carries
# only the interaction, and signed +1 because it OFFSETS a negative penalty.
def tc_x_portable(a, b):
    ps = a.get("portable_share")
    if ps is None:
        return np.nan
    return team_change(a, b) * (float(ps) - 35.0)

CANDIDATES = {
    "WR": [("role_trend_tgt", +1, plain("role_trend_tgt")),
           ("late_ppg", +1, plain("late_ppg")),
           ("tgt_share_cv", -1, plain("tgt_share_cv")),
           ("fp_over_xfp", -1, plain("fp_over_xfp")),
           ("sep_oe", +1, plain("sep_oe")),
           ("air_yd_pg", +1, plain("air_yd_pg"))],
    "TE": [("role_trend_tgt", +1, plain("role_trend_tgt")),
           ("late_ppg", +1, plain("late_ppg")),
           ("tgt_share_cv", -1, plain("tgt_share_cv")),
           ("fp_over_xfp", -1, plain("fp_over_xfp")),
           ("sep_oe", +1, plain("sep_oe")),
           ("air_yd_pg", +1, plain("air_yd_pg"))],
    "RB": [("role_trend_touch", +1, plain("role_trend_touch")),
           ("late_ppg", +1, plain("late_ppg")),
           ("fp_over_xfp", -1, plain("fp_over_xfp")),
           ("gl_share", +1, plain("gl_share")),
           ("portable_share", +1, plain("portable_share")),
           ("light_box_pct", +1, plain("light_box_pct")),
           ("tc_x_portable", +1, tc_x_portable)],
    "QB": [("qb_designed_pg", +1, plain("qb_designed_pg")),
           ("qb_scramble_pg", -1, plain("qb_scramble_pg"))],
}

def loso_residuals(pos):
    X, y, seas, names, med = design(pos, FEATURES[pos])
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], y[~te], names, ALPHA_SHIPPED[pos])
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    return y - pred

print("=" * 96)
print("STEP 1 -- compound metrics vs out-of-sample residual (Pearson), Holm across 21")
print("=" * 96)
rows = []
for pos in ("WR", "RB", "TE", "QB"):
    resid = loso_residuals(pos)
    P = pairs(pos)
    for feat, sign, get in CANDIDATES[pos]:
        x = np.array([get(a, b) for a, b in P], float)
        ok = ~np.isnan(x)
        if ok.sum() < 60:
            rows.append([pos, feat, int(ok.sum()), np.nan, np.nan, sign]); continue
        r, p = stats.pearsonr(x[ok], resid[ok])
        rows.append([pos, feat, int(ok.sum()), r, p, sign])

live = [r for r in rows if not np.isnan(r[4])]
m = len(live)
running = 0.0
for rank, i in enumerate(sorted(range(m), key=lambda i: live[i][4])):
    running = min(1.0, max(running, live[i][4] * (m - rank)))
    live[i].append(running)

print(f"\n{'pos':<4}{'compound metric':<22}{'n':>6}{'r vs resid':>12}{'p raw':>9}{'p Holm':>9}")
for r in rows:
    if np.isnan(r[4]):
        print(f"{r[0]:<4}{r[1]:<22}{r[2]:>6}   (too few)"); continue
    mark = " *" if r[6] < 0.05 else (" ." if r[4] < 0.05 else "")
    print(f"{r[0]:<4}{r[1]:<22}{r[2]:>6}{r[3]:>+12.3f}{r[4]:>9.4f}{r[6]:>9.4f}{mark}")

surv = [r for r in live if r[6] < 0.05]
print(f"\n{len(surv)} of {m} survive Holm. ('.' = raw p<.05 that does not survive)")

if not surv:
    sys.exit(0)

print("\n" + "=" * 96)
print("STEP 2 -- survivors at the real bar: LOSO and the five-origin rolling audit")
print("=" * 96)

def rolling(pos, keep, origin, alpha):
    X, y, seas, names, med = design(pos, keep)
    tr, te = seas <= origin, seas > origin
    if te.sum() < 30:
        return None
    beta, mu, sd = fit_signed(X[tr], y[tr], names, alpha)
    pred = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    yt = y[te]
    return 1 - ((yt - pred) ** 2).sum() / ((yt - yt.mean()) ** 2).sum()

for pos, feat, n, r, p, sign, ph in surv:
    SIGN[feat] = sign
    getter = dict((f, g) for f, s, g in CANDIDATES[pos])[feat]
    _o = wide_model.enrich
    def wrapped(a, b, _g=getter, _f=feat, _orig=_o):
        out = _orig(a, b)
        v = _g(a, b)
        out[_f] = None if (isinstance(v, float) and np.isnan(v)) else float(v)
        return out
    wide_model.enrich = wrapped
    if feat not in CONTEXT[pos]:
        CONTEXT[pos] = CONTEXT[pos] + [feat]

    shipped = FEATURES[pos]
    base = max(loso_signed(pos, a, shipped) for a in ALPHAS)
    plus = max(loso_signed(pos, a, shipped + [feat]) for a in ALPHAS)
    print(f"\n{pos} / {feat}   (Holm p={ph:.4f}, r={r:+.3f}, n={n})")
    print(f"  LOSO  shipped {base:.4f} -> {plus:.4f}   gain {plus-base:+.4f}")
    alpha = ALPHA_SHIPPED[pos]
    gains = []
    for origin in (2018, 2019, 2020, 2021, 2022):
        a0 = rolling(pos, shipped, origin, alpha)
        a1 = rolling(pos, shipped + [feat], origin, alpha)
        if a0 is None or a1 is None:
            continue
        gains.append(a1 - a0)
        print(f"    rolling origin {origin}: {a0:.4f} -> {a1:.4f}   gain {a1-a0:+.4f}")
    if gains:
        print(f"  rolling mean {np.mean(gains):+.4f}   worst {min(gains):+.4f}   "
              f"positive at {sum(1 for g in gains if g > 0)}/{len(gains)} origins")
    wide_model.enrich = _o
    CONTEXT[pos] = [c for c in CONTEXT[pos] if c != feat]
