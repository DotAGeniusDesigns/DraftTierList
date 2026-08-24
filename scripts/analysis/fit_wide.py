"""Fits the shipped projection model and writes src/utils/projectionModel.js.

Supersedes the four-feature fit in fit_model.py. The card still shows four
drivers per position, but the model runs on every input listed here, with ridge
shrinking the tail and a sign constraint keeping each coefficient pointing the
way its research says it should. Run fit_model.py first if you only want to
re-derive the rookie and expected-touchdown pieces; this script reuses them.
"""
import json, math, csv
import numpy as np
from metrics import DERIVED, SEASONS, pairs
from corpus import norm
from wide_model import DRIVERS, SECONDARY, CONTEXT, SIGN, design, fit_signed, loso

OUT = "/home/dotagenius/DraftList/src/utils/projectionModel.js"
POS = ("QB", "RB", "WR", "TE")
ALPHAS = [1, 5, 15, 40, 100]
BLEND = {"WR": [0.7, 0.3], "TE": [0.7, 0.3], "RB": [0.6, 0.3, 0.1], "QB": [0.6, 0.3, 0.1]}
# Below this a coefficient is not shrunk, it is off: the sign bounds park
# collinear inputs at exactly zero. Carrying them would have the model claim to
# run on inputs that move nothing, and would let one onto the card.
LIVE = 0.01
CARD = 4
# Weight alone is not enough to earn a place on the card. `team_change` is binary
# and 85% of the top-150 board stayed put, so it renders as the same small nudge
# on six cards out of seven — real in the fit, useless as an explanation of why
# THIS player projects where he does. It stays in the model and shows up under
# the smaller factors. Judged on the training corpus it looks fine (its spread
# there is the widest of any input) because that corpus is full of fringe players
# who move constantly; the board is not.
NOT_ON_CARD = {"team_change"}

# The inputs each position actually runs on. These are a decided set, not a
# search result: every one survived a drop-one audit and a five-origin rolling
# validation (fit through year Y, score everything after it), which is a harder
# test than the leave-one-season-out score used to pick alpha below.
#
# What is deliberately absent, and why, so nobody re-adds it:
#   - games played, everywhere. It was doing shrinkage in disguise — prior PPG
#     measured over 8-11 games predicts next season at 0.67, over a full season
#     at 0.85, and a small positive weight on games played was the only way a
#     linear fit could express "trust this input less". Removing it costs
#     nothing and stops the card claiming availability drives scoring.
#   - target_share at WR and RB, and td_oe_pg at TE: each measurably HURT.
#   - career-best PPG and gap-below-peak at QB. They scored +0.032 on one
#     hold-out, then lost on the largest rolling origin and gained more as the
#     test set shrank, which is the shape of noise. n=281 does not support them.
#   - anything built from next season's stat line. Incoming-quarterback quality
#     looked like the find of the audit at +0.010 for WR; it was reading the
#     season being predicted, and collapses to +0.0015 once restricted to what
#     is knowable in August.
FEATURES = {
    "QB": ["ppg_half", "pass_yd_pg", "rush_att_pg", "int_pg",
           "pass_td_pg", "rush_yd_pg", "team_change", "durability"],
    "RB": ["ppg_half", "scrim_yd_pg", "age", "tgt_pg", "team_change"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "ypr", "target_share", "team_change"],
}

MODEL = {}
print("Fitting shipped models\n")
for pos in POS:
    feats = FEATURES[pos]
    alpha, r2 = max(((a, loso(pos, a, feats)) for a in ALPHAS), key=lambda t: t[1])
    X, y, seas, names, med = design(pos, feats)
    beta, mu, sd = fit_signed(X, y, names, alpha)
    resid = y - (np.c_[np.ones(len(X)), (X - mu) / sd] @ beta)
    for n, c in zip(names, beta[1:]):
        assert (c >= 0) == (SIGN[n] > 0) or abs(c) < 1e-9, f"{pos}/{n} broke its sign bound"
    # An input the fit parks at zero contributes nothing and must never reach a
    # card. The sets above leave none, so this is a tripwire for future refits
    # rather than a filter that does routine work.
    dead = [n for n, c in zip(names, beta[1:]) if abs(c) < LIVE]
    assert not dead, f"{pos}: {dead} fitted to zero — re-audit before shipping"
    # Ranked by fitted weight rather than a hand-kept list, which had drifted far
    # enough to put a zero-weight driver on the RB card.
    headline = [n for n, _ in sorted(
        ((n, c) for n, c in zip(names, beta[1:]) if n not in NOT_ON_CARD),
        key=lambda t: -abs(t[1]))[:CARD]]
    print(f"  {pos}: card shows {', '.join(headline)}")
    MODEL[pos] = {
        "features": names,
        "headline": headline,
        "blend": BLEND[pos],
        "alpha": alpha,
        "intercept": float(beta[0]),
        "coef": [float(c) for c in beta[1:]],
        "mean": [float(v) for v in mu],
        "sd": [float(v) for v in sd],
        "median": med,
        "r2": float(r2), "residSd": float(resid.std()), "n": int(len(y)),
    }
    live = sum(1 for c in beta[1:] if abs(c) > 0.01)
    print(f"  {pos}: {len(names)} inputs ({live} with real weight), alpha={alpha}, "
          f"R2={r2:.4f}, resid sd={resid.std():.2f}, n={len(y)}")
    for n, c in sorted(zip(names, beta[1:]), key=lambda t: -abs(t[1])):
        tag = " [shown]" if n in headline else ""
        print(f"      {n:<20}{c:+.4f}{tag}")
    print()

# ---- rookie + expected-TD pieces --------------------------------------------
# Rookies are graded off the mean of their draft band and nothing else. The log
# curve that used to set this is gone: it governed every pick outside the very
# top (RB 8+, WR 15+), which meant the card quoted a band average as its evidence
# and then displayed a different number — Jonah Coleman read 4.88 under a line
# saying his comparables averaged 5.74.
#
# Band means are recency-weighted rather than pooled flat. Rookie pass-catchers
# really have got better: the year trend on all drafted players is +0.098 PPG/yr
# for WR (t=+1.91) and +0.100 for TE (t=+2.06), against a genuine null for RB
# (-0.019, t=-0.26). Pooling 2015 with 2025 put every top-12 WR on 7.72, an
# average held down by a five-player 2015-19 cohort containing Kevin White (never
# played) and John Ross (-0.60). A half-life keeps the old seasons in evidence
# while letting the recent ones lead, without an arbitrary cutoff year.
#
# Zeros stay in: a drafted player who never records a season counts 0.0. Dropping
# them would measure only the rookies who already worked out.
DP = "/home/dotagenius/DraftList/.cache/nflstats/draft_picks.csv"
HALFLIFE = 5.0
REF = max(SEASONS) + 1
BANDS = [(1, 12), (13, 32), (33, 64), (65, 120), (121, 300)]

rk = {p: [] for p in POS}
for p in csv.DictReader(open(DP)):
    if p.get("position") not in POS or not p["season"].isdigit():
        continue
    yr = int(p["season"])
    if yr < min(SEASONS) or yr > max(SEASONS):
        continue
    rec = DERIVED.get(yr, {}).get(f'{norm(p["pfr_player_name"])}|{p["position"]}')
    rk[p["position"]].append((int(p["pick"]), rec["ppg_half"] if rec else 0.0, yr))

def weighted(vals, wts):
    """Weighted mean and unbiased weighted sd, plus the effective sample size."""
    w = np.asarray(wts, float); v = np.asarray(vals, float)
    sw = w.sum()
    m = float((w * v).sum() / sw)
    neff = float(sw ** 2 / (w ** 2).sum())
    denom = sw - (w ** 2).sum() / sw
    sd = float(np.sqrt((w * (v - m) ** 2).sum() / denom)) if denom > 0 else 0.0
    return m, sd, neff

ROOKIE = {}
for pos in POS:
    d = rk[pos]
    y = np.array([b for _, b in [(a, b) for a, b, _ in d]])
    bands = []
    for lo, hi in BANDS:
        sub = [(b, yr) for a, b, yr in d if lo <= a <= hi]
        if not sub:
            bands.append({"lo": lo, "hi": hi, "n": 0, "mean": 0.0, "sd": 0.0, "neff": 0.0})
            continue
        wts = [0.5 ** ((REF - yr) / HALFLIFE) for _, yr in sub]
        m, sd, neff = weighted([b for b, _ in sub], wts)
        bands.append({"lo": lo, "hi": hi, "n": len(sub), "mean": m,
                      "sd": sd, "neff": neff})
    # A band of one has no spread of its own; fall back to the position's overall
    # scatter so the range never collapses to a point.
    fallback = float(y.std())
    for b in bands:
        if b["n"] < 2 or b["sd"] <= 0:
            b["sd"] = fallback
    # Later picks may never project above earlier ones. TE's top band rests on
    # three players and landed 0.08 under the band below it — noise, but it would
    # put a pick-20 tight end above a pick-5 one on the card. A running minimum
    # is the cheapest isotonic fix and only ever binds on an inversion this small.
    for i in range(1, len(bands)):
        bands[i]["mean"] = min(bands[i]["mean"], bands[i - 1]["mean"])
    ROOKIE[pos] = {"bands": bands, "best": float(y.max()), "n": len(d),
                   "halfLife": HALFLIFE, "refSeason": REF,
                   "hitRateTop12": float(np.mean([b > 8 for a, b, _ in d if a <= 12]))
                   if any(a <= 12 for a, _, _ in d) else 0.0}
    top = bands[0]
    print(f"  {pos} rookie bands (recency-weighted, half-life {HALFLIFE:.0f}y):")
    for b in bands:
        print(f"      {b['lo']:>3}-{b['hi']:<4} n={b['n']:<4} neff={b['neff']:>4.1f}"
              f"  mean={b['mean']:>6.2f}  sd={b['sd']:.2f}")

# ---- games played -----------------------------------------------------------
# Availability is close to unpredictable: prior games played correlates 0.10-0.23
# with next season's, and a fit on prior games + durability + age explains 1.7%
# of the variance at RB and 10% at QB, with a residual of about three games
# everywhere. So the shipped model is deliberately thin — a positional baseline
# nudged by career durability, and nothing else. The real information about who
# misses time comes from the current injury feed at runtime, not from history.
GAMES = {}
for pos in POS:
    pr = pairs(pos)
    y = np.array([b["gp"] for _, b in pr], float)
    dur = np.array([a.get("durability") if a.get("durability") is not None else np.nan
                    for a, _ in pr], float)
    ok = np.isfinite(dur)
    A = np.c_[np.ones(ok.sum()), dur[ok]]
    beta, *_ = np.linalg.lstsq(A, y[ok], rcond=None)
    resid = y[ok] - A @ beta
    r2 = 1 - (resid ** 2).sum() / ((y[ok] - y[ok].mean()) ** 2).sum()
    GAMES[pos] = {"intercept": float(beta[0]), "durability": float(beta[1]),
                  "mean": float(y.mean()), "residSd": float(resid.std()),
                  # What durability regresses toward for a player with little
                  # history — the positional average, not 1.0.
                  "priorDurability": float(np.mean(dur[ok])),
                  "r2": float(r2), "n": int(ok.sum())}
    print(f"  {pos} games: {beta[0]:+.2f} {beta[1]:+.2f}*durability  "
          f"mean {y.mean():.2f}  R2 {r2:.3f}  resid sd {resid.std():.2f}")

# Week 1 of the season being projected, so a return date can be turned into
# games missed without the app guessing at the calendar.
SCHED = "/home/dotagenius/DraftList/.cache/nflstats/schedules.csv"
weeks = {}
for r in csv.DictReader(open(SCHED)):
    if r.get("season") == str(max(SEASONS) + 1) and r.get("week", "").isdigit():
        w = int(r["week"])
        d = r.get("gameday")
        if d and (w not in weeks or d < weeks[w]):
            weeks[w] = d
SEASON = {"year": max(SEASONS) + 1,
          "weeks": [weeks[w] for w in sorted(weeks)] if weeks else [],
          "games": 17}
print(f"  season {SEASON['year']}: {len(SEASON['weeks'])} weeks, "
      f"week 1 {SEASON['weeks'][0] if SEASON['weeks'] else '?'}")

rows = [r for s in SEASONS for r in DERIVED[s].values() if r["pos"] in ("RB", "WR", "TE")]
Xt = np.array([[r["rz_att"], r["rz_tgt"], max(r["rush_att"] - r["rz_att"], 0),
                max(r["tgt"] - r["rz_tgt"], 0)] for r in rows], float)
yt = np.array([r["rush_td"] + r["rec_td"] for r in rows], float)
tdc, *_ = np.linalg.lstsq(np.c_[np.ones(len(Xt)), Xt], yt, rcond=None)

with open(OUT, "w") as fh:
    fh.write(f"""// Auto-generated by scripts/analysis/fit_wide.py — do not edit by hand.
// Fitted on {sum(m['n'] for m in MODEL.values())} year-over-year transitions from
// {min(SEASONS)}-{max(SEASONS)}, validated leave-one-season-out.
//
// Each position runs on every input in `features`; `headline` names the four the
// draft card shows, ranked by fitted weight, and the remainder are rolled up as
// "other factors" so the contributions still sum to the projection. Inputs the
// sign-constrained fit zeroed out are dropped and the model refitted without
// them, so `features` lists what actually moves the number — the opportunity
// metrics correlate 0.95-0.99 with each other and with prior PPG, and only the
// first of them survives. Ridge (`alpha`) shrinks the tail,
// and every coefficient is fitted under a sign constraint from the research, so
// volume can only help and age / touchdown luck / a team change can only hurt.
// Inputs are standardised with `mean`/`sd`; a missing one falls back to `median`.

export const PROJECTION_MODEL = {json.dumps(MODEL, indent=4)};

export const ROOKIE_MODEL = {json.dumps(ROOKIE, indent=4)};

export const EXPECTED_TD = {json.dumps({"intercept": float(tdc[0]), "rzAtt": float(tdc[1]),
                                        "rzTgt": float(tdc[2]), "att": float(tdc[3]),
                                        "tgt": float(tdc[4])}, indent=4)};

export const GAMES_MODEL = {json.dumps(GAMES, indent=4)};

export const SEASON = {json.dumps(SEASON, indent=4)};

export const MODEL_SEASONS = {json.dumps([min(SEASONS), max(SEASONS)])};
""")
print(f"wrote {OUT}")
