"""The four-driver fit. Superseded by fit_wide.py, kept for its research output.

This no longer writes the shipped model. It used to target the same path as
fit_wide.py, and since the rookie model moved to recency-weighted draft bands the
two schemas are no longer compatible — running this would have silently replaced
`bands[].sd` with nothing and turned every rookie projection into NaN. It writes
a research artifact beside the scripts instead; fit_wide.py is the only thing
that regenerates src/utils/projectionModel.js.

Two things are decided here, both by out-of-sample score rather than taste:
  1. whether a weighted blend of recent seasons beats using last season alone
  2. which four drivers each position's model runs on

Four is a product constraint, not a statistical one: the draft card shows four
drivers per position, so the model uses exactly the four it displays. Nothing is
hidden from the card.
"""
import json, math, os, itertools
import numpy as np
from metrics import pairs, DERIVED, SEASONS
from incremental import fit_predict, add_td_oe  # add_td_oe already ran on import

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "projectionModel.four-driver.js")
POS = ("QB", "RB", "WR", "TE")

# ---------------------------------------------------------------- helpers
def loso(pos, feats, blend=None):
    pr = pairs(pos)
    A = [a for a, _ in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    seas = np.array([a["season"] for a in A])
    X = np.empty((len(A), len(feats)))
    med = {}
    for j, f in enumerate(feats):
        v = np.array([blended(a, f, blend) for a in A], float)
        med[f] = np.nanmedian(v)
        X[:, j] = np.where(np.isnan(v), med[f], v)
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        pred[te] = fit_predict(X[~te], y[~te], X[te])
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

def blended(rec, feat, blend):
    """Optionally average a feature over the player's recent seasons."""
    v = rec.get(feat)
    if blend is None or feat == "age":
        return v if v is not None else np.nan
    hist = PRIOR.get((rec["name"], rec["pos"], rec["season"]))
    if not hist:
        return v if v is not None else np.nan
    vals, wts = [], []
    for w, r in zip(blend, hist):
        x = r.get(feat)
        if x is not None:
            vals.append(x); wts.append(w)
    return float(np.average(vals, weights=wts)) if vals else np.nan

# index of a player's season N, N-1, N-2 records
PRIOR = {}
for s in SEASONS:
    for key, rec in DERIVED[s].items():
        hist = [rec]
        for back in (1, 2):
            if s - back in DERIVED:
                p = DERIVED[s - back].get(key)
                if p:
                    hist.append(p)
        PRIOR[(rec["name"], rec["pos"], s)] = hist

# ---------------------------------------------------------- 1. blend test
print("Does blending recent seasons beat last season alone?")
BLENDS = {"last season only": None, "0.7/0.3 two-year": (0.7, 0.3),
          "0.6/0.3/0.1 three-year": (0.6, 0.3, 0.1)}
probe = {"WR": ["ppg_half", "tgt_pg"], "RB": ["ppg_half", "opportunity_pg"],
         "TE": ["ppg_half", "tgt_pg"], "QB": ["ppg_half", "rush_att_pg"]}
best_blend = {}
for pos in POS:
    scores = {name: loso(pos, probe[pos] + ["age"], b) for name, b in BLENDS.items()}
    win = max(scores, key=scores.get)
    best_blend[pos] = BLENDS[win]
    print(f"  {pos}: " + "  ".join(f"{k} {v:.4f}" for k, v in scores.items()) + f"   -> {win}")

CANDIDATES = {
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "target_share", "wopr",
           "rz_tgt_pg", "td_oe_pg", "age", "snap_pct"],
    "TE": ["ppg_half", "rec_yd_pg", "tgt_pg", "target_share", "rz_tgt_pg",
           "td_oe_pg", "age", "rec_td_pg"],
    "RB": ["ppg_half", "scrim_yd_pg", "opportunity_pg", "touches_pg",
           "weighted_opp_pg", "rz_att_pg", "td_oe_pg", "age", "rush_share"],
    "QB": ["ppg_half", "pass_yd_pg", "pass_td_pg", "rush_att_pg", "rush_yd_pg",
           "int_pg", "pass_rz_att_pg", "age"],
}

# ------------------------------------------------ 2. the four drivers
# Search maximises out-of-sample R2 SUBJECT TO every driver keeping the sign its
# research says it should, and pulling real weight. An unconstrained search scores
# marginally higher but returns collinearity artifacts that cannot be shown to a
# user - it wants snap share as a negative driver and touchdowns-over-expected as
# a positive one, inverting the finding that touchdown overperformance regresses.
# A driver that fits near zero (prior PPG already absorbs RB opportunity, since a
# back's points essentially are his touches) is rejected the same way.
EXPECTED_SIGN = {
    "ppg_half": +1, "rec_yd_pg": +1, "tgt_pg": +1, "target_share": +1, "wopr": +1,
    "rz_tgt_pg": +1, "scrim_yd_pg": +1, "opportunity_pg": +1, "touches_pg": +1,
    "weighted_opp_pg": +1, "rz_att_pg": +1, "rush_share": +1, "snap_pct": +1,
    "pass_yd_pg": +1, "pass_td_pg": +1, "rush_att_pg": +1, "rush_yd_pg": +1,
    "pass_rz_att_pg": +1, "age": -1, "td_oe_pg": -1, "int_pg": -1,
}
MIN_WEIGHT = 0.05   # standardised; below this a driver is decoration

def signs_ok(pos, feats, blend):
    """Fit on everything and report whether each driver behaves as advertised."""
    pr = pairs(pos)
    A = [a for a, _ in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    X = np.empty((len(A), len(feats)))
    for j, f in enumerate(feats):
        v = np.array([blended(a, f, blend) for a in A], float)
        X[:, j] = np.where(np.isnan(v), np.nanmedian(v), v)
    mu, sd = X.mean(0), X.std(0); sd[sd == 0] = 1
    Z = np.c_[np.ones(len(X)), (X - mu) / sd]
    P = np.eye(Z.shape[1]); P[0, 0] = 0
    beta = np.linalg.solve(Z.T @ Z + P, Z.T @ y)
    for f, c in zip(feats, beta[1:]):
        if (c > 0) != (EXPECTED_SIGN[f] > 0) or abs(c) < MIN_WEIGHT:
            return False
    return True

CANDIDATES = {
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "target_share", "wopr",
           "rz_tgt_pg", "td_oe_pg", "age", "snap_pct"],
    "TE": ["ppg_half", "rec_yd_pg", "tgt_pg", "target_share", "rz_tgt_pg",
           "td_oe_pg", "age"],
    "RB": ["ppg_half", "scrim_yd_pg", "opportunity_pg", "touches_pg", "tgt_pg",
           "weighted_opp_pg", "rz_att_pg", "td_oe_pg", "age", "rush_share"],
    "QB": ["ppg_half", "pass_yd_pg", "pass_td_pg", "rush_att_pg", "rush_yd_pg",
           "int_pg", "pass_rz_att_pg", "age"],
}
FINAL = {}
print("\nFour drivers per position (best sign-valid set)")
for pos in POS:
    b = best_blend[pos]
    best, best_r2, free_r2 = None, -9, -9
    for combo in itertools.combinations(CANDIDATES[pos], 4):
        r2 = loso(pos, list(combo), b)
        free_r2 = max(free_r2, r2)
        if r2 > best_r2 and signs_ok(pos, list(combo), b):
            best, best_r2 = list(combo), r2
    assert best, f"no sign-valid four-driver set for {pos}"
    FINAL[pos] = {"feats": best, "r2": best_r2, "blend": b}
    print(f"  {pos}: {best}")
    print(f"       R2={best_r2:.4f}   (best unconstrained {free_r2:.4f}, "
          f"interpretability cost {free_r2-best_r2:.4f})")

# ------------------------------------------------ 3. fit shipped coefficients
print("\nShipped coefficients (standardised inputs)")
MODEL = {}
for pos in POS:
    feats, blend = FINAL[pos]["feats"], FINAL[pos]["blend"]
    pr = pairs(pos)
    A = [a for a, _ in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    X = np.empty((len(A), len(feats)))
    med = {}
    for j, f in enumerate(feats):
        v = np.array([blended(a, f, blend) for a in A], float)
        med[f] = float(np.nanmedian(v))
        X[:, j] = np.where(np.isnan(v), med[f], v)
    mu, sd = X.mean(0), X.std(0)
    sd[sd == 0] = 1
    Z = np.c_[np.ones(len(X)), (X - mu) / sd]
    P = np.eye(Z.shape[1]); P[0, 0] = 0
    beta = np.linalg.solve(Z.T @ Z + P, Z.T @ y)
    resid = y - Z @ beta
    MODEL[pos] = {
        "features": feats, "blend": list(blend) if blend else None,
        "intercept": float(beta[0]),
        "coef": [float(c) for c in beta[1:]],
        "mean": [float(m) for m in mu], "sd": [float(s) for s in sd],
        "median": [med[f] for f in feats],
        "r2": float(FINAL[pos]["r2"]), "residSd": float(resid.std()), "n": len(A),
    }
    print(f"  {pos} (n={len(A)}, R2={FINAL[pos]['r2']:.3f}, resid sd={resid.std():.2f})")
    for f, c in zip(feats, beta[1:]):
        want = EXPECTED_SIGN[f]
        ok = "" if (c > 0) == (want > 0) else "   <-- SIGN FLIPPED, do not ship"
        print(f"      {f:<18}{c:+.4f}{ok}")
        assert (c > 0) == (want > 0), f"{pos}/{f} fitted against its expected sign"

# ------------------------------------------------ 4. rookie model
import csv
from corpus import norm
DP = "/home/dotagenius/DraftList/.cache/nflstats/draft_picks.csv"
ROOKIE = {}
print("\nRookie model  PPG = a + b*ln(pick)")
rk = {p: [] for p in POS}
for p in csv.DictReader(open(DP)):
    if p.get("position") not in POS or not p["season"].isdigit():
        continue
    yr = int(p["season"])
    if yr < 2015 or yr > max(SEASONS):
        continue
    rec = DERIVED.get(yr, {}).get(f'{norm(p["pfr_player_name"])}|{p["position"]}')
    rk[p["position"]].append((int(p["pick"]), rec["ppg_half"] if rec else 0.0))
for pos in POS:
    d = rk[pos]
    x = np.array([math.log(a) for a, _ in d]); y = np.array([b for _, b in d])
    A = np.c_[np.ones(len(x)), x]
    (a, b), *_ = np.linalg.lstsq(A, y, rcond=None)
    resid = y - (a + b * x)
    # Cap at the MEAN rookie season of the position's top-12 picks, not the best
    # one ever. Only a handful of backs go inside the top five in a decade, so the
    # log curve extrapolates hard there off almost no data — left uncapped it made
    # a pick-3 rookie the highest-projected RB in football, ahead of every proven
    # starter. A point projection is an expected value, and the best expected value
    # available for elite draft capital is what comparable picks actually averaged.
    top12 = [v for k, v in d if k <= 12]
    cap = float(np.mean(top12)) if top12 else float(y.max())
    ROOKIE[pos] = {"intercept": float(a), "logPick": float(b),
                   "residSd": float(resid.std()), "cap": cap, "n": len(d),
                   "capBasis": len(top12), "best": float(y.max()),
                   "hitRateTop12": float(np.mean([v > 8 for v in top12])) if top12 else 0.0}
    print(f"  {pos}: a={a:+.3f} b={b:+.3f}  cap={cap:.1f} (mean of {len(top12)} top-12 picks, "
          f"best ever {y.max():.1f})  resid sd={resid.std():.2f}")

# ------------------------------------------------ 5. expected-TD coefficients
rows = [r for s in SEASONS for r in DERIVED[s].values() if r["pos"] in ("RB", "WR", "TE")]
Xt = np.array([[r["rz_att"], r["rz_tgt"], max(r["rush_att"] - r["rz_att"], 0),
                max(r["tgt"] - r["rz_tgt"], 0)] for r in rows], float)
yt = np.array([r["rush_td"] + r["rec_td"] for r in rows], float)
tdc, *_ = np.linalg.lstsq(np.c_[np.ones(len(Xt)), Xt], yt, rcond=None)

payload = {
    "model": MODEL, "rookie": ROOKIE,
    "expectedTd": {"intercept": float(tdc[0]), "rzAtt": float(tdc[1]),
                   "rzTgt": float(tdc[2]), "att": float(tdc[3]), "tgt": float(tdc[4])},
    "seasons": [min(SEASONS), max(SEASONS)],
}
print(f"\nwriting {OUT}")
with open(OUT, "w") as fh:
    fh.write(f"""// Auto-generated by scripts/analysis/fit_model.py — do not edit by hand.
// Fitted on {sum(m['n'] for m in MODEL.values())} year-over-year transitions from
// {min(SEASONS)}-{max(SEASONS)}, validated leave-one-season-out. See scripts/analysis/README.md.
//
// Each position's model runs on exactly the four drivers its draft card displays.
// Inputs are standardised with `mean`/`sd`; a missing input falls back to `median`
// before standardising. `residSd` is the 1-sigma error on a projection and is what
// the card's confidence range is drawn from.

export const PROJECTION_MODEL = {json.dumps(payload['model'], indent=4)};

export const ROOKIE_MODEL = {json.dumps(payload['rookie'], indent=4)};

export const EXPECTED_TD = {json.dumps(payload['expectedTd'], indent=4)};

export const MODEL_SEASONS = {json.dumps(payload['seasons'])};
""")
print("done")
