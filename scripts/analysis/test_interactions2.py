"""Second pre-specified interaction family -- conditioning effects that are
ALREADY IN the model, rather than hunting new inputs.

The first family (test_interactions.py) asked "does a rejected input come alive
in a subgroup" and found nothing. This asks a different and, mechanically, a
better-motivated question: do the effects the model already trusts -- age,
touchdown luck, a team change, prior production itself -- apply UNIFORMLY, or
does the linear fit force one average slope onto populations that behave
differently?

That framing has a cleaner statistical signature. Because least squares makes
the residual roughly orthogonal to every feature in the model, a feature already
in the fit correlates ~0 with the residual OVERALL by construction. So a
non-zero correlation INSIDE a subgroup, with the opposite sign outside, is
unambiguous evidence the single slope is wrong for that group -- it cannot be a
main effect leaking through, the way it can for a new input.

STATISTICAL DEBT, stated plainly: this is the second pre-specified family run on
the same corpus. Holm correction below controls error within THIS family of ten.
It does not undo the fact that ~19 interactions have now been examined in total.
Anything that survives here is hypothesis-generating and would need a rolling
origin plus, ideally, seasons not yet in the corpus before it could ship.
"""
import io, sys
import numpy as np
from scipy import stats

_buf = sys.stdout
sys.stdout = io.StringIO()
sys.path.insert(0, "/home/dotagenius/DraftList/scripts/analysis")
from wide_model import design, fit_signed
from metrics import pairs, DERIVED, SEASONS
import incremental  # attaches td_oe_pg / xtd_pg to DERIVED
from routes import attach_route_features
from ngsrecv import attach_ngs_recv_features
from rbrate import attach_rb_rate_features
from qbrate import attach_qb_rate_features
sys.stdout = _buf

attach_route_features()
attach_ngs_recv_features()
attach_rb_rate_features()
attach_qb_rate_features()

# Career touches to date -- the "tread on the tires" quantity. Left-censored at
# 2015 (the corpus start), which understates mileage for players who debuted
# earlier; that pushes toward a null, it cannot manufacture a positive.
for s in SEASONS:
    for key, rec in DERIVED[s].items():
        hist = [DERIVED[y][key] for y in SEASONS if y <= s and key in DERIVED[y]]
        rec["career_touches"] = float(sum((h.get("rush_att") or 0) + (h.get("rec") or 0)
                                          for h in hist))

FEATURES = {
    "QB": ["ppg_half", "pass_yd_pg", "rush_att_pg", "int_pg",
           "pass_td_pg", "rush_yd_pg", "team_change", "durability"],
    "RB": ["ppg_half", "scrim_yd_pg", "age", "tgt_pg", "team_change", "ryoe_att"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "ypr", "target_share", "team_change",
           "avg_yac_above_expectation"],
}
ALPHA_SHIPPED = {"QB": 15, "RB": 15, "WR": 40, "TE": 15}

def val(a, b, feat):
    """Feature value for a row; team_change needs both halves of the pair."""
    if feat == "team_change":
        return 0.0 if (a.get("team") and b.get("team") == a.get("team")) else 1.0
    v = a.get(feat)
    return np.nan if v is None else float(v)

# (pos, feature already in model, subgroup label, subgroup test(a,b), mechanism)
INTERACTIONS = [
    ("RB", "age", "career touches >= 750", lambda a, b: a["career_touches"] >= 750,
     "the RB cliff is supposed to be accumulated wear, not birthdays -- a 28yo with "
     "1500 carries should decline faster than a 28yo with 400"),
    ("RB", "age", "pass-catching role (tgt_pg >= 3)", lambda a, b: (a.get("tgt_pg") or 0) >= 3,
     "receiving backs take less contact and are widely said to age better"),
    ("QB", "age", "rushing QB (rush_att_pg >= 5)", lambda a, b: (a.get("rush_att_pg") or 0) >= 5,
     "legs go before arms: a QB whose value is rushing should decline earlier"),
    ("RB", "td_oe_pg", "low red-zone volume (rz_att < 20)", lambda a, b: (a.get("rz_att") or 0) < 20,
     "TDs over expected is a rate; on few red-zone looks it is mostly noise and "
     "should regress harder than the single average slope assumes"),
    ("WR", "td_oe_pg", "low red-zone volume (rz_tgt < 12)", lambda a, b: (a.get("rz_tgt") or 0) < 12,
     "same small-sample logic on the receiving side"),
    ("WR", "team_change", "high target share (>= 22%)",
     lambda a, b: (a.get("target_share") or 0) >= 22,
     "an alpha receiver's role is built for him; moving costs more than it costs a "
     "rotational player who was interchangeable anyway"),
    ("WR", "ppg_half", "young (age <= 23)", lambda a, b: (a.get("age") or 99) <= 23,
     "a young player's line comes from a role still forming, so prior PPG should be "
     "a weaker guide than it is for an established veteran"),
    ("RB", "ppg_half", "young (age <= 23)", lambda a, b: (a.get("age") or 99) <= 23,
     "same reliability argument on the ground"),
    ("WR", "age", "bottom-third production", lambda a, b: (a.get("ppg_half") or 0) < 4.0,
     "an old fringe receiver is finished; a young one may still develop, so the age "
     "slope should be steeper among non-producers"),
    ("TE", "ppg_half", "low snap share (< 50%)",
     lambda a, b: (a.get("snap_pct") is not None and a["snap_pct"] < 50),
     "a part-time TE's production is a small, role-dependent sample"),
]

def loso_residuals(pos):
    keep = FEATURES[pos]
    X, y, seas, names, med = design(pos, keep)
    alpha = ALPHA_SHIPPED[pos]
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], y[~te], names, alpha)
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    return y - pred

print("=" * 104)
print("Family 2: are the model's OWN effects uniform, or wrong for a subgroup?")
print("(feature is already in the fit, so r~0 overall by construction; the test is "
       "inside vs outside)")
print("=" * 104)

resid_cache, pair_cache = {}, {}
for pos in ("QB", "RB", "WR", "TE"):
    resid_cache[pos] = loso_residuals(pos)
    pair_cache[pos] = pairs(pos)

results = []
for pos, feat, label, test, mech in INTERACTIONS:
    resid = resid_cache[pos]
    P = pair_cache[pos]
    x = np.array([val(a, b, feat) for a, b in P], float)
    inside = np.array([bool(test(a, b)) for a, b in P])
    ok = ~np.isnan(x)
    n_in, n_out = int((inside & ok).sum()), int((~inside & ok).sum())
    if n_in < 40 or n_out < 40:
        results.append([pos, feat, label, n_in, n_out, np.nan, np.nan, np.nan, mech])
        continue
    r_in, p_in = stats.pearsonr(x[inside & ok], resid[inside & ok])
    r_out, _ = stats.pearsonr(x[~inside & ok], resid[~inside & ok])
    results.append([pos, feat, label, n_in, n_out, r_in, p_in, r_out, mech])

live = [r for r in results if not np.isnan(r[6])]
m = len(live)
order = sorted(range(m), key=lambda i: live[i][6])
running = 0.0
for rank, i in enumerate(order):
    running = min(1.0, max(running, live[i][6] * (m - rank)))
    live[i].append(running)

print(f"\n{'pos':<4}{'model input':<13}{'subgroup':<34}{'n in':>6}{'n out':>7}"
      f"{'r inside':>10}{'r outside':>11}{'p raw':>8}{'p Holm':>8}")
for r in results:
    pos, feat, label, n_in, n_out, r_in, p_in, r_out, mech = r[:9]
    if np.isnan(r_in):
        print(f"{pos:<4}{feat:<13}{label:<34}{n_in:>6}{n_out:>7}   (subgroup too small)")
        continue
    ph = r[9]
    star = " *" if ph < 0.05 else (" ." if p_in < 0.05 else "")
    print(f"{pos:<4}{feat:<13}{label:<34}{n_in:>6}{n_out:>7}"
          f"{r_in:>+10.3f}{r_out:>+11.3f}{p_in:>8.3f}{ph:>8.3f}{star}")

surv = [r for r in live if r[9] < 0.05]
print(f"\n{len(surv)} of {m} survive Holm correction within this family.")
print("(' .' marks raw p<.05 that does NOT survive correction -- expected to appear "
      "by chance roughly half the time in a family this size)")
for r in surv:
    print(f"\n  SURVIVOR: {r[0]} {r[1]} inside [{r[2]}]")
    print(f"    r={r[5]:+.3f} (n={r[3]}) vs r={r[7]:+.3f} outside (n={r[4]}), Holm p={r[9]:.4f}")
    print(f"    mechanism: {r[8]}")
