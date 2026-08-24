"""Does a head-coaching change move a player's next season? And is draft capital
doing real work for players who already have NFL production?

Head coach comes from the schedule file (1999 onward). Coordinators are not in
any nflverse feed, so an OC change cannot be tested here — see the README.
"""
import csv, os
from collections import defaultdict
import numpy as np
from metrics import pairs, DERIVED, SEASONS
from test_levers import DRIVERS, BLEND, enrich, blended
from test_expanded import loso as loso_free

CACHE = "/home/dotagenius/DraftList/.cache/nflstats"
GAMES = [r for r in csv.DictReader(open(os.path.join(CACHE, "schedules.csv")))
         if r.get("game_type") == "REG"]

# Head coach of record for each team-season.
COACH = {}
for g in GAMES:
    s = int(g["season"])
    for side in ("home", "away"):
        c = g.get(f"{side}_coach")
        if c and c not in ("NA",):
            COACH[(s, g[f"{side}_team"])] = c

def coach_change(team, season):
    """1 when `team` has a different head coach in `season` than in `season-1`."""
    prev, cur = COACH.get((season - 1, team)), COACH.get((season, team))
    if not prev or not cur:
        return None
    return 0.0 if prev == cur else 1.0

print("How often does a coaching change coincide with a player's season?")
n_ch = sum(1 for (s, t) in COACH if coach_change(t, s) == 1.0)
print(f"  {n_ch} team-seasons with a new head coach, 1999-2026\n")

# ---- 1. raw effect: what happens to players whose team changes coach --------
print("Change in next-season PPG, players on teams that DID vs DID NOT change coach")
print(f"  {'pos':<5}{'new coach n':>13}{'median d':>11}{'same coach n':>15}{'median d':>11}")
for pos in ("WR", "RB", "TE", "QB"):
    ch, same = [], []
    for a, b in pairs(pos):
        t = b.get("team")
        if not t:
            continue
        cc = coach_change(t, b["season"])
        if cc is None:
            continue
        (ch if cc else same).append(b["ppg_half"] - a["ppg_half"])
    if len(ch) < 20:
        continue
    print(f"  {pos:<5}{len(ch):>13}{np.median(ch):>11.2f}{len(same):>15}{np.median(same):>11.2f}")

# ---- 2. does it add anything to the model? ----------------------------------
def loso_with(pos, extra):
    import numpy as np
    from test_expanded import design, fit
    pr = pairs(pos)
    A = [a for a, _ in pr]
    B = [b for _, b in pr]
    y = np.array([b["ppg_half"] for b in B], float)
    seas = np.array([a["season"] for a in A])
    cols = []
    for f in DRIVERS[pos]:
        v = np.array([blended(a, f, BLEND[pos]) for a in A], float)
        cols.append(np.where(np.isnan(v), np.nanmedian(v), v))
    for name, fn in extra:
        v = np.array([fn(a, b) for a, b in pr], float)
        v = np.where(np.isnan(v), np.nanmedian(v), v)
        cols.append(v)
    X = np.column_stack(cols)
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        pred[te] = fit(X[~te], y[~te], X[te], 1.0)
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

def cc_feat(a, b):
    t = b.get("team")
    v = coach_change(t, b["season"]) if t else None
    return v if v is not None else np.nan

print("\nValue added by a head-coaching change, on top of the four drivers")
for pos in ("WR", "RB", "TE", "QB"):
    base = loso_free(pos, DRIVERS[pos], [], 1.0)
    with_cc = loso_with(pos, [("coach_change", cc_feat)])
    print(f"  {pos}: {base:.4f} -> {with_cc:.4f}  ({with_cc-base:+.4f})")

# ---- 3. is draft capital only helping young players? ------------------------
print("\nDraft capital: where does its RB benefit actually come from?")
pr = pairs("RB")
for lo, hi, lab in [(1, 2, "1-2 seasons"), (3, 4, "3-4 seasons"), (5, 20, "5+ seasons")]:
    sub = [(a, b) for a, b in pr if lo <= a.get("career_seasons", 0) <= hi]
    if len(sub) < 40:
        continue
    x = np.array([a.get("draft_pick_log") if a.get("draft_pick_log") is not None else np.nan
                  for a, _ in sub], float)
    y = np.array([b["ppg_half"] for _, b in sub], float)
    ok = ~np.isnan(x)
    from scipy import stats
    rho = stats.spearmanr(x[ok], y[ok])[0]
    print(f"  {lab:<14} n={ok.sum():<4} correlation of draft slot with next-season PPG: {rho:+.3f}")
