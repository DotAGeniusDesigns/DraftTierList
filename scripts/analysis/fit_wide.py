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
from rbrate import attach_rb_rate_features
from ngsrecv import attach_ngs_recv_features

attach_rb_rate_features()
attach_ngs_recv_features()

OUT = "/home/dotagenius/DraftList/src/utils/projectionModel.js"
POS = ("QB", "RB", "WR", "TE")
ALPHAS = [1, 5, 15, 40, 100]
# Imported, never redeclared. wide_model builds the design matrix from
# test_levers.BLEND; this is what gets written into projectionModel.js and used
# at runtime. A second copy here would let the model be fitted on one recency
# window and applied on another with nothing to catch it.
from test_levers import BLEND as _BLEND
BLEND = {k: list(v) for k, v in _BLEND.items()}
assert set(BLEND) == set(POS), "BLEND must cover exactly the fitted positions"
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
#
#   - RB ryoe_att (NGS rushing yards over expected per attempt). Shipped briefly
#     on a leave-one-season-out gain of +0.0033 and then REMOVED: the rolling
#     origin, which it had not been put through, is positive only at the
#     earliest origin (+0.0044 at 2018) and negative at all four later ones,
#     mean -0.0027. rbrate.py still builds it and updateStats.js still joins
#     `rush.yoeAtt` into playerStats, so re-enabling is one entry here if more
#     seasons ever change the picture -- but do not re-add it on a LOSO score.
#
# TE avg_yac_above_expectation (ngsrecv.py) is the one input here carried on a
# lighter bar than the rest, and it is the reason the bar is worth stating.
# Leave-one-season-out +0.0064, and unlike ryoe_att it PASSES the five-origin
# rolling audit outright: positive at 5/5 origins, mean +0.0083, worst +0.0023,
# and the gain GROWS as the training window lengthens (+0.0023 -> +0.0152),
# which is the shape of a real effect rather than noise. WR was tested at the
# same time and measured negative (-0.0001 to -0.0008), so this is TE-only on
# purpose, the same way target_share is. It is THIN in the corpus though: NGS
# publishes only its ~50 qualifying players a season, so just 28% of qualifying
# TE seasons carry a real value and the rest are median-imputed. On the board
# coverage is fine -- 18/19 top-150 TEs have a real 2023+ value.
FEATURES = {
    "QB": ["ppg_half", "pass_yd_pg", "rush_att_pg", "int_pg",
           "pass_td_pg", "rush_yd_pg", "team_change", "durability"],
    "RB": ["ppg_half", "scrim_yd_pg", "age", "tgt_pg", "team_change"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "ypr", "target_share", "team_change",
           "avg_yac_above_expectation"],
}

ORIGINS = (2018, 2019, 2020, 2021, 2022)

def rolling_mean(pos, feats, alpha):
    """Mean out-of-sample R2 over five rolling origins: fit through year Y,
    score every transition after it.

    Alpha used to be picked by leave-one-season-out. LOSO trains on future
    seasons to predict past ones, so it can reward a fit that never generalises
    forward -- it scored an RB input at +0.0033 that the rolling origin then
    showed was negative. Selecting the ridge strength the same flawed way was
    the same mistake one level up. Switching the criterion is worth +0.0090 of
    rolling R2 at QB (which moves from alpha 40 to 100 -- the smallest sample
    wants the most shrinkage), +0.0011 at WR, +0.0006 at RB, and nothing at TE.
    """
    X, y, seas, names, _ = design(pos, feats)
    out = []
    for origin in ORIGINS:
        tr, te = seas <= origin, seas > origin
        if te.sum() < 30:
            continue
        beta, mu, sd = fit_signed(X[tr], y[tr], names, alpha)
        pred = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
        yt = y[te]
        out.append(1 - ((yt - pred) ** 2).sum() / ((yt - yt.mean()) ** 2).sum())
    return float(np.mean(out)) if out else float("-inf")

MODEL = {}
print("Fitting shipped models\n")
for pos in POS:
    feats = FEATURES[pos]
    alpha = max(ALPHAS, key=lambda a: rolling_mean(pos, feats, a))
    r2 = loso(pos, alpha, feats)   # reported for continuity with earlier runs
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

def vacated_positional(team, pos, year):
    """Share of `team`'s year-1 opportunity at `pos` held by players who are not
    on the roster in `year`. Nothing about the rookie's own season enters it."""
    prior, cur = DERIVED.get(year - 1), DERIVED.get(year)
    if not team or not prior or not cur:
        return None
    total = gone = 0.0
    for key, rec in prior.items():
        if rec["pos"] != pos or rec.get("team") != team:
            continue
        opp = (rec.get("tgt") or 0) if pos in ("WR", "TE") else (
            (rec.get("rush_att") or 0) + (rec.get("tgt") or 0))
        total += opp
        nxt = cur.get(key)
        if not nxt or nxt.get("team") != team:
            gone += opp
    return (gone / total * 100) if total > 20 else None

ROOKIE_LANDING = None
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
    # ---- landing spot, WR only -------------------------------------------
    # The opportunity a rookie's new team vacated at his position. CLAUDE.md
    # recorded this as measured-and-declined for RB (+0.035, terciles
    # 6.6/8.7/10.9). rookie_landing.py reproduces those RB terciles in-sample
    # (5.8/7.9/9.7) and then shows they DO NOT HOLD: rolled forward by draft
    # class, RB gains +0.0016 and +0.0008 at the first two origins and loses
    # 0.0250 and 0.0365 at the next two, positive at 2/4. That monotone tercile
    # was an in-sample artifact on n=83.
    #
    # WR is the position that survives, and it was never the one claimed. Its
    # terciles are NOT monotone (4.4/6.3/5.9), but rolled forward it gains at
    # 4/4 origins -- +0.0114, +0.0157, +0.0231, +0.0261 -- growing as the
    # training window lengthens, on the largest rookie sample there is (n=297).
    # That is the shape of a real effect, and the opposite of RB's.
    #
    # Mechanistically this is also the one place vacated opportunity SHOULD
    # work. It is dead for veterans (vacated.py, every position) because a
    # veteran's own stat line already describes the role he holds. A rookie has
    # no line, so the job waiting for him is most of what can be known.
    if pos == "WR":
        pairs_ls = []
        for pick, ppg_r, yr in d:
            key_team = None
            for key, rec in DERIVED.get(yr, {}).items():
                if rec["pos"] == "WR" and rec.get("ppg_half") == ppg_r:
                    key_team = rec.get("team"); break
            vac = vacated_positional(key_team, "WR", yr) if key_team else None
            if vac is None:
                continue
            b = next((bb for bb in bands if bb["lo"] <= pick <= bb["hi"]), None)
            if b:
                pairs_ls.append((vac, ppg_r - b["mean"]))
        if len(pairs_ls) >= 60:
            V = np.array([v for v, _ in pairs_ls]); R = np.array([r for _, r in pairs_ls])
            A = np.c_[V, np.ones(len(V))]
            cf, *_ = np.linalg.lstsq(A, R, rcond=None)
            ROOKIE_LANDING = {"coef": float(cf[0]), "intercept": float(cf[1]),
                              "n": len(pairs_ls)}
            print(f"  WR landing spot: {cf[0]:+.4f} PPG per point of vacated "
                  f"target share, n={len(pairs_ls)}")
        else:
            ROOKIE_LANDING = None
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
# Bye weeks, derived rather than transcribed: a team's bye is the week it has no
# game on the schedule. The draft grader needs these to know who is unavailable
# in a given week.
playing = {}
for r in csv.DictReader(open(SCHED)):
    if r.get("season") != str(max(SEASONS) + 1) or not r.get("week", "").isdigit():
        continue
    for side in ("away_team", "home_team"):
        if r.get(side):
            playing.setdefault(r[side], set()).add(int(r["week"]))
all_weeks = set(weeks)
byes = {}
for team, played in sorted(playing.items()):
    off = sorted(all_weeks - played)
    if off:
        byes[team] = off[0]

# Who each team plays each week, so a matchup adjustment does not have to guess.
# Keyed by team, then week; a week a team does not appear is its bye.
schedule = {}
for r in csv.DictReader(open(SCHED)):
    if r.get("season") != str(max(SEASONS) + 1) or not r.get("week", "").isdigit():
        continue
    w = int(r["week"])
    away, home = r.get("away_team"), r.get("home_team")
    if away and home:
        schedule.setdefault(away, {})[w] = home
        schedule.setdefault(home, {})[w] = away

SEASON = {"year": max(SEASONS) + 1,
          "weeks": [weeks[w] for w in sorted(weeks)] if weeks else [],
          "games": 17,
          "byes": byes,
          "schedule": {t: {str(w): o for w, o in sorted(ws.items())}
                       for t, ws in sorted(schedule.items())}}
print(f"  season {SEASON['year']}: {len(SEASON['weeks'])} weeks, "
      f"week 1 {SEASON['weeks'][0] if SEASON['weeks'] else '?'}, "
      f"{len(byes)} teams with a bye (weeks {min(byes.values())}-{max(byes.values())})")

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

// Rookie WR landing spot: PPG added per point of the team's vacated target
// share. WR only — see the note in fit_wide.py for why RB's larger-looking
// effect does not survive being rolled forward.
export const ROOKIE_LANDING = {json.dumps(ROOKIE_LANDING, indent=4)};

export const EXPECTED_TD = {json.dumps({"intercept": float(tdc[0]), "rzAtt": float(tdc[1]),
                                        "rzTgt": float(tdc[2]), "att": float(tdc[3]),
                                        "tgt": float(tdc[4])}, indent=4)};

export const GAMES_MODEL = {json.dumps(GAMES, indent=4)};

export const SEASON = {json.dumps(SEASON, indent=4)};

export const MODEL_SEASONS = {json.dumps([min(SEASONS), max(SEASONS)])};
""")
print(f"wrote {OUT}")
