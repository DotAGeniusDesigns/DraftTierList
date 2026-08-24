"""Three fixes to the SHAPE of the fit rather than to what goes into it.

This project's real gains have come from measurement fixes, not new inputs --
anchoring the blend on the prior season, dropping `gp`. Three untouched
candidates of the same kind:

  A. The age term is one linear coefficient. Real age curves plateau and then
     fall off a cliff, and age is a top-four driver at three positions.
  B. BLEND is hardcoded (0.7/0.3 for WR and TE, 0.6/0.3/0.1 for RB and QB) and
     was never fitted.
  C. Ridge alpha is chosen by leave-one-season-out -- the exact procedure shown
     to reward a period-specific artifact that the rolling origin then killed.

Everything here is judged on the FIVE-ORIGIN ROLLING MEAN, not LOSO, for that
last reason. LOSO is reported alongside only to show where the two disagree.
"""
import io, sys
import numpy as np

_buf = sys.stdout
sys.stdout = io.StringIO()
sys.path.insert(0, "/home/dotagenius/DraftList/scripts/analysis")
import wide_model
from wide_model import SIGN, CONTEXT, design, fit_signed, loso as loso_signed
from ngsrecv import attach_ngs_recv_features
sys.stdout = _buf
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
ORIGINS = (2018, 2019, 2020, 2021, 2022)
POS = ("QB", "RB", "WR", "TE")

def rolling_mean(pos, keep, alpha):
    X, y, seas, names, med = design(pos, keep)
    out = []
    for origin in ORIGINS:
        tr, te = seas <= origin, seas > origin
        if te.sum() < 30:
            continue
        beta, mu, sd = fit_signed(X[tr], y[tr], names, alpha)
        pred = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
        yt = y[te]
        out.append(1 - ((yt - pred) ** 2).sum() / ((yt - yt.mean()) ** 2).sum())
    return float(np.mean(out)) if out else float("nan")

def best_by(pos, keep, criterion):
    if criterion == "loso":
        a = max(ALPHAS, key=lambda a: loso_signed(pos, a, keep))
    else:
        a = max(ALPHAS, key=lambda a: rolling_mean(pos, keep, a))
    return a, rolling_mean(pos, keep, a), loso_signed(pos, a, keep)

# ---------------------------------------------------------------- C: alpha ---
print("=" * 92)
print("C. Does choosing alpha by rolling origin beat choosing it by LOSO?")
print("=" * 92)
print(f"{'pos':<5}{'alpha by LOSO':>15}{'its rolling':>13}{'alpha by rolling':>18}{'its rolling':>13}{'gain':>9}")
BEST_ALPHA = {}
for pos in POS:
    keep = FEATURES[pos]
    a_l, roll_l, _ = best_by(pos, keep, "loso")
    a_r, roll_r, _ = best_by(pos, keep, "rolling")
    BEST_ALPHA[pos] = (a_l, a_r)
    print(f"{pos:<5}{a_l:>15}{roll_l:>13.4f}{a_r:>18}{roll_r:>13.4f}{roll_r-roll_l:>+9.4f}")

# ------------------------------------------------------------------ A: age ---
# A knot term: max(0, age - k). Added alongside the linear age already present,
# so the curve becomes gentle-then-steep rather than one slope. Delivered
# through enrich (a context feature) because blended() would otherwise average
# a player's age across three seasons, which is not what an age cliff means.
print("\n" + "=" * 92)
print("A. A piecewise age term -- does the curve have a cliff the line is missing?")
print("=" * 92)
_orig_enrich = wide_model.enrich
AGE_POS = ("RB", "WR", "TE", "QB")
best_knot = {}
for pos in AGE_POS:
    keep = FEATURES[pos]
    alpha = BEST_ALPHA[pos][1]
    base = rolling_mean(pos, keep, alpha)
    row = []
    for knot in (25, 26, 27, 28, 29, 30):
        def mk(k):
            def e(a, b, _k=k, _o=_orig_enrich):
                out = _o(a, b)
                age = a.get("age")
                out["age_cliff"] = max(0.0, age - _k) if age is not None else None
                return out
            return e
        wide_model.enrich = mk(knot)
        SIGN["age_cliff"] = -1
        if "age_cliff" not in CONTEXT[pos]:
            CONTEXT[pos] = CONTEXT[pos] + ["age_cliff"]
        try:
            r = rolling_mean(pos, keep + ["age_cliff"], alpha)
        except Exception:
            r = float("nan")
        row.append((knot, r))
        CONTEXT[pos] = [c for c in CONTEXT[pos] if c != "age_cliff"]
    wide_model.enrich = _orig_enrich
    good = [(k, r) for k, r in row if not np.isnan(r)]
    bk, br = max(good, key=lambda t: t[1]) if good else (None, float("nan"))
    best_knot[pos] = (bk, br - base)
    cells = "  ".join(f"{k}:{r - base:+.4f}" for k, r in row)
    print(f"  {pos:<4} base {base:.4f}   {cells}")
    print(f"       best knot {bk} at {br - base:+.4f}")

# ---------------------------------------------------------------- B: blend ---
print("\n" + "=" * 92)
print("B. Are the hardcoded blend weights the right ones?")
print("=" * 92)
GRIDS = {
    2: [[1.0], [0.85, 0.15], [0.7, 0.3], [0.6, 0.4], [0.5, 0.5]],
    3: [[1.0], [0.7, 0.3], [0.7, 0.2, 0.1], [0.6, 0.3, 0.1], [0.5, 0.3, 0.2],
        [0.45, 0.35, 0.2]],
}
best_blend = {}
for pos in POS:
    keep = FEATURES[pos]
    alpha = BEST_ALPHA[pos][1]
    shipped = wide_model.BLEND[pos]
    grid = GRIDS[3] if len(shipped) == 3 else GRIDS[2]
    base = rolling_mean(pos, keep, alpha)
    results = []
    for cand in grid:
        wide_model.BLEND[pos] = tuple(cand)
        try:
            results.append((cand, rolling_mean(pos, keep, alpha)))
        except Exception:
            pass
    wide_model.BLEND[pos] = shipped
    bc, br = max(results, key=lambda t: t[1])
    best_blend[pos] = (bc, br - base)
    print(f"  {pos:<4} shipped {list(shipped)} -> {base:.4f}")
    for cand, r in results:
        tag = "  <-- best" if cand == bc else ""
        print(f"        {str(cand):<22}{r:.4f}  {r - base:+.4f}{tag}")

print("\n" + "=" * 92)
print("SUMMARY (all gains are rolling-origin mean)")
print("=" * 92)
for pos in POS:
    a_l, a_r = BEST_ALPHA[pos]
    k, kg = best_knot.get(pos, (None, 0))
    bc, bg = best_blend[pos]
    print(f"  {pos:<4} alpha {a_l}->{a_r}   age knot {k} ({kg:+.4f})   "
          f"blend {list(wide_model.BLEND[pos])}->{bc} ({bg:+.4f})")
