"""How much should a matchup actually move a player, and should it move every
position by the same amount?

draftGrader.js applies ONE number, MATCHUP_SWING = 3, to every position, ranked
off the board's consensus team-defence ECR. The comment beside it already notes
the underlying signal differs enormously by position -- a defence's rating
correlates with its own next season at +0.08 for WR and +0.30 for RB -- but the
code does not act on that. A unit that is genuinely hard to run on is a fact you
can bet on; a unit that was hard to throw on last year is close to a coin flip.

This measures the swing directly, in points, rather than inferring it:

  1. Points allowed per game to each position, by defence, by season, from the
     weekly files. Half-PPR, matching the rest of the kit.
  2. Year-over-year persistence of that ranking -- can you know it in advance?
  3. The payoff: for every player-week, how far his actual output sat from his
     own season average, against the opponent's PRIOR-season rank versus his
     position. Prior season, because that is what is knowable when the schedule
     is set. The regression slope across the full rank range IS the swing, in
     points per game, measured rather than assumed.

Deliberately uses each player as his own control (deviation from his own season
mean), so a defence does not look good merely for having faced weak opponents.
"""
import csv, io, os, sys
from collections import defaultdict
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from routes import load_gz_text

SEASONS = list(range(2015, 2026))
POS = ("QB", "RB", "WR", "TE")

def weekly_rows(season):
    out = []
    for r in csv.DictReader(io.StringIO(load_gz_text(f"nflverse-week-{season}"))):
        if r.get("season_type") != "REG" or r.get("position") not in POS:
            continue
        if not str(r.get("week", "")).isdigit():
            continue
        def f(k):
            try:
                return float(r.get(k) or 0)
            except ValueError:
                return 0.0
        out.append({
            "week": int(r["week"]), "pos": r["position"], "team": r.get("team"),
            "opp": r.get("opponent_team"), "pid": r.get("player_id"),
            "half": f("fantasy_points") + 0.5 * f("receptions"),
        })
    return out

# points allowed per game, by (season, defence, position)
allowed, ranks = {}, {}
CACHE = {}
for s in SEASONS:
    CACHE[s] = weekly_rows(s)
    tot, games = defaultdict(float), defaultdict(set)
    for r in CACHE[s]:
        if not r["opp"]:
            continue
        tot[(r["opp"], r["pos"])] += r["half"]
        games[(r["opp"], r["pos"])].add(r["week"])
    for key, v in tot.items():
        n = len(games[key])
        if n:
            allowed[(s,) + key] = v / n
    for pos in POS:
        teams = [(t, allowed[(s, t, pos)]) for (ss, t, p) in allowed
                 if ss == s and p == pos for _ in (0,)][:0] or \
                [(t, allowed[(s, t, p)]) for (ss, t, p) in list(allowed)
                 if ss == s and p == pos]
        teams = sorted(set(teams), key=lambda kv: kv[1])   # fewest allowed = best
        for i, (t, _) in enumerate(teams):
            ranks[(s, t, pos)] = i / max(len(teams) - 1, 1)   # 0 = best defence

print("=" * 88)
print("1. Does a defence's rating versus a position persist into the next season?")
print("=" * 88)
print(f"{'pos':<6}{'n team-pairs':>14}{'year-over-year r':>20}")
for pos in POS:
    a, b = [], []
    for s in SEASONS[:-1]:
        for t in set(t for (ss, t, p) in allowed if ss == s and p == pos):
            if (s + 1, t, pos) in allowed:
                a.append(allowed[(s, t, pos)]); b.append(allowed[(s + 1, t, pos)])
    r, _ = stats.pearsonr(a, b)
    print(f"{pos:<6}{len(a):>14}{r:>+20.3f}")

print("\n" + "=" * 88)
print("2. Spread: points per game between the softest and stiffest defence")
print("=" * 88)
print(f"{'pos':<6}{'mean allowed':>15}{'best':>9}{'worst':>9}{'spread':>9}")
for pos in POS:
    vals = [v for (ss, t, p), v in allowed.items() if p == pos]
    print(f"{pos:<6}{np.mean(vals):>15.1f}{np.percentile(vals,5):>9.1f}"
          f"{np.percentile(vals,95):>9.1f}{np.percentile(vals,95)-np.percentile(vals,5):>9.1f}")

print("\n" + "=" * 88)
print("3. THE SWING: player's deviation from his own season mean, vs the")
print("   opponent's PRIOR-season rank against his position")
print("=" * 88)
print(f"{'pos':<6}{'n player-weeks':>16}{'slope (best->worst)':>21}{'p':>10}{'implied +/-':>13}")
recommend = {}
for pos in POS:
    xs, ys = [], []
    for s in SEASONS[1:]:
        rows = [r for r in CACHE[s] if r["pos"] == pos]
        by_player = defaultdict(list)
        for r in rows:
            by_player[r["pid"]].append(r)
        for pid, wks in by_player.items():
            if len(wks) < 8:          # need a real season to have a real mean
                continue
            tot = sum(w["half"] for w in wks)
            for w in wks:
                rk = ranks.get((s - 1, w["opp"], pos))
                if rk is None:
                    continue
                # leave-one-out mean, so the week being explained is not in it
                mean_other = (tot - w["half"]) / (len(wks) - 1)
                xs.append(rk); ys.append(w["half"] - mean_other)
    xs, ys = np.array(xs), np.array(ys)
    slope, intercept, r, p, se = stats.linregress(xs, ys)
    recommend[pos] = abs(slope) / 2
    print(f"{pos:<6}{len(xs):>16}{slope:>+21.2f}{p:>10.1e}{abs(slope)/2:>13.2f}")

print("\n" + "=" * 88)
print("RECOMMENDATION")
print("=" * 88)
print("  Shipped today: one flat MATCHUP_SWING = 3.00 for every position.")
print("  Measured, position by position (half the best-to-worst slope):")
for pos in POS:
    print(f"    {pos:<4} {recommend[pos]:.2f}")
print("\n  A positive slope means a player scores MORE against a defence ranked")
print("  worse, which is the expected direction. A slope at or below zero means")
print("  prior-year defensive rank carries no usable information for that")
print("  position and the honest swing is nothing.")
