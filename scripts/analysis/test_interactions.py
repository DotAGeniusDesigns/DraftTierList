"""Do any inputs matter for a SUBGROUP even though they are worthless on average?

A real question -- QB fantasy scoring is two near-independent blocks (passing
and rushing correlate ~0.4; see test_qbsplit.py), so passing efficiency could
plausibly matter for pocket QBs and be drowned out for rushing QBs. Same logic
for "efficiency earns a committee back more work" or "route share tells you a
small-role receiver's job is growing."

It is also the easiest way to fool yourself in this entire project. Slicing
every metric by every subgroup is hundreds of tests, and at p<.05 dozens come
back "significant" from noise alone. The contract-year bucket analysis already
carried that caveat with ~16 comparisons. So this script is deliberately
constrained:

  1. The interaction list below is PRE-SPECIFIED with a stated mechanism for
     each, written before running anything. No adding slices after seeing
     results -- that is the garden of forking paths, and it is how a project
     talks itself into shipping noise.
  2. Screening is Pearson against the shipped model's OUT-OF-SAMPLE residuals,
     not Spearman (see test_rescreen.py for why the rank statistic misleads).
  3. p-values are Holm-corrected across the whole family.
  4. Anything surviving goes to the real LOSO fit as an interaction term, and
     must ALSO hold on a rolling origin before it can be called real.

Testing X inside subgroup S against residuals answers "would an X-by-S
interaction help", because the residual is what the current model cannot
already explain. The complement subgroup is reported alongside: a genuine
interaction shows a signal in one and not the other, whereas a similar number
in both is just a main effect the model is missing.
"""
import io, sys
import numpy as np
from scipy import stats

_buf = sys.stdout
sys.stdout = io.StringIO()
sys.path.insert(0, "/home/dotagenius/DraftList/scripts/analysis")
import wide_model
from wide_model import SECONDARY, SIGN, design, fit_signed
from metrics import pairs
from routes import attach_route_features
from ngsrecv import attach_ngs_recv_features
from rbrate import attach_rb_rate_features
from qbrate import attach_qb_rate_features
sys.stdout = _buf

attach_route_features()
attach_ngs_recv_features()
attach_rb_rate_features()
attach_qb_rate_features()

FEATURES = {
    "QB": ["ppg_half", "pass_yd_pg", "rush_att_pg", "int_pg",
           "pass_td_pg", "rush_yd_pg", "team_change", "durability"],
    "RB": ["ppg_half", "scrim_yd_pg", "age", "tgt_pg", "team_change", "ryoe_att"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "ypr", "target_share", "team_change",
           "avg_yac_above_expectation"],
}
ALPHAS = [1, 5, 15, 40, 100]
ALPHA_SHIPPED = {"QB": 15, "RB": 15, "WR": 40, "TE": 15}

# (position, feature, subgroup label, subgroup test on the year-N record, mechanism)
INTERACTIONS = [
    ("QB", "epa_per_db", "rush_att_pg < 4",
     lambda a: (a.get("rush_att_pg") or 0) < 4,
     "pocket QBs have only passing to score with, so passing efficiency should "
     "carry more weight; rushing QBs get a floor from their legs regardless"),
    ("QB", "pass_epa_pg", "rush_att_pg < 4",
     lambda a: (a.get("rush_att_pg") or 0) < 4, "same mechanism, per-game form"),
    ("QB", "cpoe", "rush_att_pg < 4",
     lambda a: (a.get("cpoe") is not None and (a.get("rush_att_pg") or 0) < 4),
     "same mechanism, accuracy form"),
    ("RB", "ryoe_att", "bottom-half volume",
     lambda a: (a.get("opportunity_pg") or 0) < 12,
     "a committee back who runs well may earn more work; a bell cow already has it"),
    ("RB", "brk_tkl_rate", "bottom-half volume",
     lambda a: (a.get("opportunity_pg") or 0) < 12, "same mechanism, tackle-breaking form"),
    ("RB", "route_share", "bottom-half volume",
     lambda a: (a.get("opportunity_pg") or 0) < 12,
     "for a low-volume back the passing-down role is the realistic path to value"),
    ("WR", "route_share", "bottom-third production",
     lambda a: (a.get("ppg_half") or 0) < 4.0,
     "for a small-role receiver, being on the field for dropbacks says the job is "
     "growing; for an established starter it is redundant with targets"),
    ("WR", "air_yards_share", "bottom-third production",
     lambda a: (a.get("ppg_half") or 0) < 4.0,
     "downfield role may signal a breakout before the catches arrive"),
    ("WR", "avg_separation", "bottom-third production",
     lambda a: (a.get("avg_separation") is not None and (a.get("ppg_half") or 0) < 4.0),
     "separation may matter for a player who has not yet earned volume"),
    ("TE", "route_share", "bottom-half production",
     lambda a: (a.get("ppg_half") or 0) < 3.0,
     "distinguishes the pass-catching TE from the blocker, which matters most "
     "before the production shows up"),
    ("TE", "avg_yac_above_expectation", "bottom-half production",
     lambda a: (a.get("ppg_half") or 0) < 3.0,
     "already shipped for TE overall; does it concentrate in the small-role group"),
]

def loso_residuals(pos):
    """Out-of-sample residual per row, from the shipped feature set."""
    keep = FEATURES[pos]
    X, y, seas, names, med = design(pos, keep)
    alpha = ALPHA_SHIPPED[pos]
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], y[~te], names, alpha)
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    return y - pred

print(__doc__.split("Testing X inside")[0].strip()[:0] or "", end="")
print("=" * 100)
print("Pre-specified interaction screen: candidate vs OUT-OF-SAMPLE residual, within subgroup")
print("=" * 100)

results = []
resid_cache, pair_cache = {}, {}
for pos in ("QB", "RB", "WR", "TE"):
    resid_cache[pos] = loso_residuals(pos)
    pair_cache[pos] = [a for a, _ in pairs(pos)]

for pos, feat, label, test, mech in INTERACTIONS:
    resid = resid_cache[pos]
    A = pair_cache[pos]
    x = np.array([a.get(feat) if a.get(feat) is not None else np.nan for a in A], float)
    inside = np.array([bool(test(a)) for a in A])
    ok = ~np.isnan(x)
    n_in = int((inside & ok).sum())
    n_out = int((~inside & ok).sum())
    if n_in < 40 or n_out < 40:
        results.append((pos, feat, label, n_in, n_out, np.nan, np.nan, np.nan, mech))
        continue
    r_in, p_in = stats.pearsonr(x[inside & ok], resid[inside & ok])
    r_out, _ = stats.pearsonr(x[~inside & ok], resid[~inside & ok])
    results.append((pos, feat, label, n_in, n_out, r_in, p_in, r_out, mech))

# Holm correction across the whole pre-specified family
live = [r for r in results if not np.isnan(r[6])]
order = sorted(range(len(live)), key=lambda i: live[i][6])
m = len(live)
holm = {}
running = 0.0
for rank, i in enumerate(order):
    adj = min(1.0, max(running, live[i][6] * (m - rank)))
    running = adj
    holm[id(live[i])] = adj

print(f"\n{'pos':<4}{'feature':<26}{'subgroup':<24}{'n in':>6}{'n out':>7}"
      f"{'r inside':>10}{'r outside':>11}{'p raw':>9}{'p Holm':>9}")
for r in results:
    pos, feat, label, n_in, n_out, r_in, p_in, r_out, mech = r
    if np.isnan(r_in):
        print(f"{pos:<4}{feat:<26}{label:<24}{n_in:>6}{n_out:>7}    (subgroup too small)")
        continue
    ph = holm[id(r)]
    star = " *" if ph < 0.05 else ""
    print(f"{pos:<4}{feat:<26}{label:<24}{n_in:>6}{n_out:>7}"
          f"{r_in:>+10.3f}{r_out:>+11.3f}{p_in:>9.3f}{ph:>9.3f}{star}")

survivors = [r for r in results if not np.isnan(r[6]) and holm[id(r)] < 0.05]
print(f"\n{len(survivors)} of {m} pre-specified interactions survive Holm correction.")
if not survivors:
    print("Nothing to escalate to the real fit.")
for pos, feat, label, n_in, n_out, r_in, p_in, r_out, mech in survivors:
    print(f"  {pos} {feat} inside [{label}]: r={r_in:+.3f} vs {r_out:+.3f} outside")
    print(f"    mechanism claimed: {mech}")
